import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket, OkPacket } from "mysql2";

/**
 * POST /api/admin/trigger-demo
 *
 * Demonstrates the AFTER INSERT trigger live:
 *  1. Records the property's status BEFORE the deal insert.
 *  2. Inserts a real deal row (which fires the trigger).
 *  3. Records the property's status AFTER the insert.
 *  4. Cleans up: deletes the demo deal and restores the property status.
 *  5. Returns before/after snapshot so the frontend can animate the change.
 *
 * Body: { property_id, deal_type: "sale" | "rental", enquiry_id, client_id, broker_id }
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  let body: {
    property_id?: number;
    deal_type?: string;
    enquiry_id?: number;
    client_id?: number;
    broker_id?: number;
  };

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { property_id, deal_type, enquiry_id, client_id, broker_id } = body;

  if (!property_id || !deal_type || !enquiry_id || !client_id || !broker_id) {
    return badRequest("Missing required fields");
  }
  if (!["sale", "rental"].includes(deal_type)) {
    return badRequest("deal_type must be 'sale' or 'rental'");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Snapshot property status BEFORE
    const [[propBefore]] = await conn.query<RowDataPacket[]>(
      `SELECT status FROM Properties WHERE property_id = ?`,
      [property_id]
    );
    if (!propBefore) {
      await conn.rollback();
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    const statusBefore = propBefore.status as string;

    // 2. Insert the demo deal — this fires the trigger
    const dealValue = deal_type === "sale" ? 5000000 : 25000;
    const rentalStart = deal_type === "rental" ? new Date().toISOString().split("T")[0] : null;
    const rentalEnd =
      deal_type === "rental"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : null;

    const [insertResult] = await conn.query<OkPacket>(
      `INSERT INTO Deals
         (enquiry_id, property_id, broker_id, client_id,
          deal_type, deal_date, deal_value,
          rental_start_date, rental_end_date, deal_status,
          company_earning, broker_earning)
       VALUES (?, ?, ?, ?, ?, CURRENT_DATE, ?, ?, ?, 'completed', 0, 0)`,
      [enquiry_id, property_id, broker_id, client_id, deal_type, dealValue, rentalStart, rentalEnd]
    );
    const demoDealId = insertResult.insertId;

    // 3. Snapshot property status AFTER (trigger should have changed it)
    const [[propAfter]] = await conn.query<RowDataPacket[]>(
      `SELECT status FROM Properties WHERE property_id = ?`,
      [property_id]
    );
    const statusAfter = propAfter.status as string;

    // 4. Cleanup — roll back the demo deal and restore property status
    await conn.query(`DELETE FROM Deals WHERE deal_id = ?`, [demoDealId]);
    await conn.query(
      `UPDATE Properties SET status = ? WHERE property_id = ?`,
      [statusBefore, property_id]
    );

    // Also re-open the enquiry if it was closed by some constraint
    await conn.commit();

    return NextResponse.json({
      property_id,
      deal_type,
      status_before: statusBefore,
      status_after: statusAfter,
      trigger_fired: statusBefore !== statusAfter,
      demo_deal_id: demoDealId,
      cleanup: "deal deleted, property status restored",
    });
  } catch (error) {
    await conn.rollback();
    console.error("Trigger demo error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    conn.release();
  }
}

/**
 * GET /api/admin/trigger-demo
 * Returns available properties + a valid (enquiry_id, client_id, broker_id)
 * triple for each — so the frontend can populate its demo selector.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         e.enquiry_id,
         e.client_id,
         e.broker_id,
         e.property_id,
         p.location,
         p.status AS property_status,
         c.name   AS client_name,
         b.name   AS broker_name
       FROM Enquiries e
       JOIN Properties p ON e.property_id = p.property_id
       JOIN Clients    c ON e.client_id   = c.client_id
       JOIN Brokers    b ON e.broker_id   = b.broker_id
       WHERE e.status IN ('open', 'in_progress')
         AND p.status = 'available'
       LIMIT 10`
    );
    return NextResponse.json({ candidates: rows });
  } catch (error) {
    console.error("Trigger demo candidates error:", error);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}
