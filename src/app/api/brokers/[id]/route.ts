import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { badRequest } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/brokers/[id] — public broker profile with stats and reviews
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brokerId = Number(id);
    if (!Number.isInteger(brokerId)) return badRequest("Invalid broker id");

    const [brokers] = await pool.query<RowDataPacket[]>(
      "SELECT broker_id, name, email, phone, join_date FROM Brokers WHERE broker_id = ?",
      [brokerId]
    );
    if (brokers.length === 0) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 });
    }

    const [[stats]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT d.deal_id) AS total_deals,
              COALESCE(SUM(d.deal_value), 0) AS total_volume,
              COALESCE(SUM(d.broker_earning), 0) AS total_earnings,
              (SELECT COUNT(*) FROM Properties p WHERE p.broker_id = ?) AS total_properties,
              (SELECT ROUND(AVG(rating), 2) FROM Reviews WHERE broker_id = ?) AS average_rating,
              (SELECT COUNT(*) FROM Reviews WHERE broker_id = ?) AS total_reviews
       FROM Deals d WHERE d.broker_id = ?`,
      [brokerId, brokerId, brokerId, brokerId]
    );

    const [reviews] = await pool.query<RowDataPacket[]>(
      `SELECT r.review_id, r.rating, r.comments, r.review_date, c.name AS client_name
       FROM Reviews r
       JOIN Clients c ON r.client_id = c.client_id
       WHERE r.broker_id = ?
       ORDER BY r.review_id DESC`,
      [brokerId]
    );

    return NextResponse.json({
      broker: brokers[0],
      stats,
      reviews,
    });
  } catch (error) {
    console.error("Broker profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch broker profile" },
      { status: 500 }
    );
  }
}
