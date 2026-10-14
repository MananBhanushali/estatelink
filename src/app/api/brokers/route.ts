import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/brokers — list all brokers (admin only)
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT broker_id, name, email, phone, join_date FROM Brokers ORDER BY broker_id`
    );
    return NextResponse.json({ brokers: rows });
  } catch (error) {
    console.error("List brokers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brokers" },
      { status: 500 }
    );
  }
}
