import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

const VALID_STATUSES = ["open", "in_progress", "closed", "rejected"] as const;

// GET /api/enquiries/[id] — fetch a single enquiry (broker must own it; client must be requester; admin allowed)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const enquiryId = Number(id);
    if (!Number.isInteger(enquiryId)) return badRequest("Invalid enquiry id");

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.enquiry_id, e.client_id, e.property_id, e.broker_id,
              e.enquiry_date, e.status, e.notes,
              c.name AS client_name, c.email AS client_email,
              p.location AS property_location, p.value AS property_value, p.status AS property_status,
              p.square_feet AS property_sqft, p.bedrooms AS property_bedrooms, p.owner_name AS property_owner_name,
              b.name AS broker_name,
              comm.owner_brokerage_percent, comm.client_brokerage_percent,
              (EXISTS (SELECT 1 FROM Leases l WHERE l.property_id = p.property_id) OR p.status = 'ongoing_rental') AS is_rental,
              l.duration_months AS lease_duration_months
       FROM Enquiries e
       JOIN Clients c ON e.client_id = c.client_id
       JOIN Properties p ON e.property_id = p.property_id
       JOIN Brokers b ON e.broker_id = b.broker_id
       LEFT JOIN Commission comm ON p.commission_id = comm.commission_id
       LEFT JOIN Leases l ON p.property_id = l.property_id
       WHERE e.enquiry_id = ?`,
      [enquiryId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const enquiry = rows[0];

    // Scope check
    if (user.role === "broker" && (enquiry.broker_id as number) !== user.refId) {
      return forbidden();
    }
    if (user.role === "client" && (enquiry.client_id as number) !== user.refId) {
      return forbidden();
    }

    return NextResponse.json({ enquiry });
  } catch (error) {
    console.error("Get enquiry error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enquiry" },
      { status: 500 }
    );
  }
}

// PATCH /api/enquiries/[id] — broker updates status (must own enquiry; admin allowed)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "broker" && user.role !== "admin") return forbidden();

  try {
    const { id } = await params;
    const enquiryId = Number(id);
    if (!Number.isInteger(enquiryId)) return badRequest("Invalid enquiry id");

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return badRequest(
        "status must be one of: open, in_progress, closed, rejected"
      );
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT enquiry_id, broker_id, status FROM Enquiries WHERE enquiry_id = ?",
      [enquiryId]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Enquiry not found" },
        { status: 404 }
      );
    }
    if (
      user.role === "broker" &&
      (existing[0].broker_id as number) !== user.refId
    ) {
      return forbidden();
    }

    await pool.query("UPDATE Enquiries SET status = ? WHERE enquiry_id = ?", [
      status,
      enquiryId,
    ]);

    return NextResponse.json({ message: "Enquiry status updated" });
  } catch (error) {
    console.error("Update enquiry error:", error);
    return NextResponse.json(
      { error: "Failed to update enquiry" },
      { status: 500 }
    );
  }
}
