import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/deals/[id] — broker (owner), admin, or the client who owns the deal
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (
    user.role !== "broker" &&
    user.role !== "admin" &&
    user.role !== "client"
  ) {
    return forbidden();
  }

  try {
    const { id } = await params;
    const dealId = Number(id);
    if (!Number.isInteger(dealId)) return badRequest("Invalid deal id");

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT d.deal_id, d.enquiry_id, d.property_id, d.broker_id, d.client_id,
              d.deal_type, d.deal_date, d.deal_value,
              d.rental_start_date, d.rental_end_date, d.deal_status,
              d.company_earning, d.broker_earning,
              b.name AS broker_name, b.email AS broker_email,
              c.name AS client_name, c.email AS client_email,
              p.location AS property_location, p.square_feet, p.bedrooms,
              comm.owner_brokerage_percent, comm.client_brokerage_percent,
              ROUND((d.deal_value * comm.owner_brokerage_percent / 100), 2) AS calculated_company_earning,
              ROUND((d.deal_value * comm.client_brokerage_percent / 100), 2) AS calculated_broker_earning
       FROM Deals d
       JOIN Brokers b ON d.broker_id = b.broker_id
       JOIN Clients c ON d.client_id = c.client_id
       JOIN Properties p ON d.property_id = p.property_id
       JOIN Commission comm ON p.commission_id = comm.commission_id
       WHERE d.deal_id = ?`,
      [dealId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    const deal = rows[0];
    if (user.role === "client") {
      if (!user.refId || (deal.client_id as number) !== user.refId) {
        return forbidden();
      }
    } else if (
      user.role === "broker" &&
      (deal.broker_id as number) !== user.refId
    ) {
      return forbidden();
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Deal detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal" },
      { status: 500 }
    );
  }
}
