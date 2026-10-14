import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/admin/dashboard — aggregate stats (admin only)
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  try {
    const [[propStats]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(status = 'available') AS available,
              SUM(status = 'sold') AS sold,
              SUM(status = 'ongoing_rental') AS ongoing_rental
       FROM Properties`
    );

    const [[dealStats]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(deal_type = 'sale') AS sales,
              SUM(deal_type = 'rental') AS rentals,
              SUM(deal_status = 'completed') AS completed,
              SUM(deal_status = 'ongoing') AS ongoing,
              SUM(deal_status = 'ended') AS ended,
              COALESCE(SUM(company_earning), 0) AS total_company_earnings,
              COALESCE(SUM(broker_earning), 0) AS total_broker_earnings,
              COALESCE(SUM(deal_value), 0) AS total_deal_volume
       FROM Deals`
    );

    const [[counts]] = await pool.query<RowDataPacket[]>(
      `SELECT (SELECT COUNT(*) FROM Brokers) AS brokers,
              (SELECT COUNT(*) FROM Clients) AS clients,
              (SELECT COUNT(*) FROM Enquiries) AS enquiries,
              (SELECT COUNT(*) FROM Enquiries WHERE status = 'open') AS open_enquiries`
    );

    const [recentDeals] = await pool.query<RowDataPacket[]>(
      `SELECT d.deal_id, d.deal_type, d.deal_value, d.deal_status, d.deal_date,
              b.name AS broker_name, c.name AS client_name,
              p.location AS property_location
       FROM Deals d
       JOIN Brokers b ON d.broker_id = b.broker_id
       JOIN Clients c ON d.client_id = c.client_id
       JOIN Properties p ON d.property_id = p.property_id
       ORDER BY d.deal_id DESC
       LIMIT 5`
    );

    return NextResponse.json({
      properties: propStats,
      deals: dealStats,
      counts,
      recent_deals: recentDeals,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
