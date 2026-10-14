import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// POST /api/admin/refresh-rentals — executes sp_refresh_expired_rentals() (admin only)
export async function POST() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  try {
    // Count expired-but-still-ongoing rentals before refresh (for reporting)
    const [[before]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS expired FROM Deals
       WHERE deal_status = 'ongoing' AND rental_end_date < CURRENT_DATE`
    );

    await pool.query("CALL sp_refresh_expired_rentals()");

    return NextResponse.json({
      refreshed: (before.expired as number) ?? 0,
      message: `${before.expired ?? 0} expired rental(s) refreshed to available`,
    });
  } catch (error) {
    console.error("Refresh rentals error:", error);
    return NextResponse.json(
      { error: "Failed to refresh rentals" },
      { status: 500 }
    );
  }
}
