import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/deals — broker sees own, admin sees all. Filters: broker_id, deal_type, deal_status
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get("broker_id");
    const dealType = searchParams.get("deal_type");
    const dealStatus = searchParams.get("deal_status");

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (user.role === "client") {
      if (!user.refId) return badRequest("Client profile not linked");
      conditions.push("d.client_id = ?");
      params.push(user.refId);
    } else if (user.role === "broker") {
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

    // Keep deal statuses current: finalize rental deals whose tenure has expired
    // (ongoing -> ended) and reactivate their properties. Mirrors
    // sp_refresh_expired_rentals() so the broker earnings page and other
    // dashboards always reflect a closed deal as "ended" rather than stale
    // "ongoing", without requiring a manual admin refresh.
    await pool.query(
      `UPDATE Properties
       SET status = 'available'
       WHERE property_id IN (
         SELECT property_id FROM Deals
         WHERE deal_status = 'ongoing'
           AND rental_end_date IS NOT NULL
           AND rental_end_date < CURRENT_DATE
       )`
    );
    await pool.query(
      `UPDATE Deals
       SET deal_status = 'ended'
       WHERE deal_status = 'ongoing'
         AND rental_end_date IS NOT NULL
         AND rental_end_date < CURRENT_DATE`
    );

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
