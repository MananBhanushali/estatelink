import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET /api/reviews — public, filterable by broker_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get("broker_id");

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (brokerId) {
      conditions.push("r.broker_id = ?");
      params.push(Number(brokerId));
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.review_id, r.client_id, r.broker_id, r.deal_id,
              r.rating, r.comments, r.review_date,
              c.name AS client_name, b.name AS broker_name
       FROM Reviews r
       JOIN Clients c ON r.client_id = c.client_id
       JOIN Brokers b ON r.broker_id = b.broker_id
       ${where}
       ORDER BY r.review_id DESC`,
      params
    );

    return NextResponse.json({ reviews: rows });
  } catch (error) {
    console.error("List reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews — client submits review for a completed deal
// Validates: deal exists, client matches deal, deal is completed/ended, no duplicate review
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "client") return forbidden();
  if (!user.refId) return badRequest("Client profile not linked");

  try {
    const body = await request.json();
    const { deal_id, rating, comments } = body;

    if (!deal_id) return badRequest("deal_id is required");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return badRequest("rating must be an integer between 1 and 5");
    }

    const [deals] = await pool.query<RowDataPacket[]>(
      "SELECT deal_id, client_id, broker_id, deal_status, deal_type FROM Deals WHERE deal_id = ?",
      [deal_id]
    );
    if (deals.length === 0) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    const deal = deals[0];
    if ((deal.client_id as number) !== user.refId) {
      return forbidden();
    }
    // Sales must be completed; rentals must be completed or ended (not ongoing)
    if ((deal.deal_status as string) === "ongoing") {
      return badRequest("Reviews can only be left after a deal is completed");
    }

    const [dup] = await pool.query<RowDataPacket[]>(
      "SELECT review_id FROM Reviews WHERE deal_id = ?",
      [deal_id]
    );
    if (dup.length > 0) {
      return badRequest("A review already exists for this deal");
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Reviews (client_id, broker_id, deal_id, rating, comments)
       VALUES (?, ?, ?, ?, ?)`,
      [user.refId, deal.broker_id, deal_id, rating, comments || null]
    );

    return NextResponse.json(
      { review_id: result.insertId, message: "Review submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
