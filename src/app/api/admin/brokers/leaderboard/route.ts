import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/admin/brokers/leaderboard — from Broker_Leaderboard_View (admin only)
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM Broker_Leaderboard_View ORDER BY total_broker_earnings DESC`
    );
    return NextResponse.json({ leaderboard: rows });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
