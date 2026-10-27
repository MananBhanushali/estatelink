import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET /api/enquiries — brokers see assigned, clients see own, admin sees all
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (user.role === "broker") {
      conditions.push("e.broker_id = ?");
      params.push(user.refId!);
    } else if (user.role === "client") {
      conditions.push("e.client_id = ?");
      params.push(user.refId!);
    }
    // admin: no scope filter

    if (status) {
      if (!["open", "in_progress", "closed", "rejected"].includes(status)) {
        return badRequest("Invalid status filter");
      }
      conditions.push("e.status = ?");
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Heal any completed (sale) deals whose property status was not correctly
    // set to 'sold' at deal creation time (e.g. legacy records).
    await pool.query(
      `UPDATE Properties
       SET status = 'sold'
       WHERE status = 'available'
         AND property_id IN (
           SELECT property_id FROM Deals
           WHERE deal_type = 'sale'
             AND deal_status = 'completed'
         )`
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.enquiry_id, e.client_id, e.property_id, e.broker_id,
              e.enquiry_date, e.status, e.notes,
              c.name AS client_name, c.email AS client_email,
              p.location AS property_location, p.value AS property_value, p.status AS property_status,
              p.square_feet AS property_sqft, p.bedrooms AS property_bedrooms, p.owner_name AS property_owner_name,
              b.name AS broker_name,
              comm.owner_brokerage_percent, comm.client_brokerage_percent,
              (EXISTS (SELECT 1 FROM Leases l WHERE l.property_id = p.property_id) OR p.status = 'ongoing_rental') AS is_rental
       FROM Enquiries e
       JOIN Clients c ON e.client_id = c.client_id
       JOIN Properties p ON e.property_id = p.property_id
       JOIN Brokers b ON e.broker_id = b.broker_id
       LEFT JOIN Commission comm ON p.commission_id = comm.commission_id
       LEFT JOIN Leases l ON p.property_id = l.property_id
       ${where}
       ORDER BY e.enquiry_id DESC`,
      params
    );

    return NextResponse.json({ enquiries: rows });
  } catch (error) {
    console.error("List enquiries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enquiries" },
      { status: 500 }
    );
  }
}

// POST /api/enquiries — client submits enquiry (broker auto-assigned from property)
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "client") return forbidden();
  if (!user.refId) return badRequest("Client profile not linked");

  try {
    const body = await request.json();
    const { property_id, notes } = body;

    if (!property_id) return badRequest("property_id is required");

    const [props] = await pool.query<RowDataPacket[]>(
      "SELECT property_id, broker_id, status FROM Properties WHERE property_id = ?",
      [property_id]
    );
    if (props.length === 0) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    if (props[0].status !== "available") {
      return badRequest(
        `Property is currently ${props[0].status} and not accepting enquiries`
      );
    }

    const brokerId = props[0].broker_id as number;

    // Check for an existing enquiry from this client for this property
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT enquiry_id FROM Enquiries WHERE client_id = ? AND property_id = ?",
      [user.refId, property_id]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted an enquiry for this property" },
        { status: 409 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Enquiries (client_id, property_id, broker_id, notes)
       VALUES (?, ?, ?, ?)`,
      [user.refId, property_id, brokerId, notes || null]
    );

    return NextResponse.json(
      {
        enquiry_id: result.insertId,
        broker_id: brokerId,
        message: "Enquiry submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create enquiry error:", error);
    return NextResponse.json(
      { error: "Failed to submit enquiry" },
      { status: 500 }
    );
  }
}
