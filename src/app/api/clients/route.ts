import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/clients — list all clients (admin only)
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT client_id, name, email, phone, client_type FROM Clients ORDER BY client_id`
    );
    return NextResponse.json({ clients: rows });
  } catch (error) {
    console.error("List clients error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
