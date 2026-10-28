import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/admin/trigger-info — returns live metadata for the deal status trigger (admin only)
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         TRIGGER_NAME,
         EVENT_MANIPULATION  AS event,
         EVENT_OBJECT_TABLE  AS table_name,
         ACTION_TIMING       AS timing,
         ACTION_STATEMENT    AS body,
         CREATED             AS created_at
       FROM information_schema.TRIGGERS
       WHERE TRIGGER_SCHEMA = DATABASE()
         AND TRIGGER_NAME = 'trg_auto_set_property_status_on_deal'`
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { exists: false, trigger: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ exists: true, trigger: rows[0] });
  } catch (error) {
    console.error("Trigger info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trigger info" },
      { status: 500 }
    );
  }
}
