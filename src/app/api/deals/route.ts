import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/deals — broker sees own, admin sees all. Filters: broker_id, deal_type, deal_status
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "broker" && user.role !== "admin") return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get("broker_id");
    const dealType = searchParams.get("deal_type");
    const dealStatus = searchParams.get("deal_status");

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (user.role === "broker") {
      conditions.push("d.broker_id = ?");
      params.push(user.refId!);
    } else if (brokerId) {
      conditions.push("d.broker_id = ?");
      params.push(Number(brokerId));
    }

    if (dealType) {
      if (!["sale", "rental"].includes(dealType)) {
        return badRequest("Invalid deal_type filter");
      }
      conditions.push("d.deal_type = ?");
      params.push(dealType);
    }
    if (dealStatus) {
      if (!["completed", "ongoing", "ended"].includes(dealStatus)) {
        return badRequest("Invalid deal_status filter");
      }
      conditions.push("d.deal_status = ?");
      params.push(dealStatus);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT d.deal_id, d.enquiry_id, d.property_id, d.broker_id, d.client_id,
              d.deal_type, d.deal_date, d.deal_value,
              d.rental_start_date, d.rental_end_date, d.deal_status,
              d.company_earning, d.broker_earning,
              b.name AS broker_name, c.name AS client_name,
              p.location AS property_location
       FROM Deals d
       JOIN Brokers b ON d.broker_id = b.broker_id
       JOIN Clients c ON d.client_id = c.client_id
       JOIN Properties p ON d.property_id = p.property_id
       ${where}
       ORDER BY d.deal_id DESC`,
      params
    );

    return NextResponse.json({ deals: rows });
  } catch (error) {
    console.error("List deals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}
