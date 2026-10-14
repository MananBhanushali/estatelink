import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// POST /api/enquiries/[id]/convert — broker converts enquiry to deal (transaction)
// Body: { deal_type: 'sale'|'rental', deal_value?, rental_start_date?, rental_end_date? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "broker" && user.role !== "admin") return forbidden();

  try {
    const { id } = await params;
    const enquiryId = Number(id);
    if (!Number.isInteger(enquiryId)) return badRequest("Invalid enquiry id");

    const body = await request.json();
    const { deal_type, deal_value, rental_start_date, rental_end_date } = body;

    if (!["sale", "rental"].includes(deal_type)) {
      return badRequest("deal_type must be 'sale' or 'rental'");
    }
    if (deal_type === "rental" && !rental_start_date) {
      return badRequest("rental_start_date is required for rental deals");
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Load enquiry (locked) + validate ownership and state
      const [enqRows] = await connection.query<RowDataPacket[]>(
        "SELECT enquiry_id, client_id, property_id, broker_id, status FROM Enquiries WHERE enquiry_id = ? FOR UPDATE",
        [enquiryId]
      );
      if (enqRows.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: "Enquiry not found" },
          { status: 404 }
        );
      }
      const enquiry = enqRows[0];

      if (
        user.role === "broker" &&
        (enquiry.broker_id as number) !== user.refId
      ) {
        await connection.rollback();
        return forbidden();
      }
      if (!["open", "in_progress"].includes(enquiry.status as string)) {
        await connection.rollback();
        return badRequest(
          `Enquiry is already ${enquiry.status} and cannot be converted`
        );
      }

      // 2. Guard: one deal per enquiry (1:1)
      const [dup] = await connection.query<RowDataPacket[]>(
        "SELECT deal_id FROM Deals WHERE enquiry_id = ?",
        [enquiryId]
      );
      if (dup.length > 0) {
        await connection.rollback();
        return badRequest("A deal already exists for this enquiry");
      }

      // 3. Load property + commission (join per PRD §4.1)
      const [propRows] = await connection.query<RowDataPacket[]>(
        `SELECT p.property_id, p.value, p.status,
                c.owner_brokerage_percent, c.client_brokerage_percent
         FROM Properties p
         JOIN Commission c ON p.commission_id = c.commission_id
         WHERE p.property_id = ? FOR UPDATE`,
        [enquiry.property_id]
      );
      if (propRows.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: "Linked property not found" },
          { status: 404 }
        );
      }
      const prop = propRows[0];
      if ((prop.status as string) !== "available") {
        await connection.rollback();
        return badRequest(
          `Property is ${prop.status} and cannot be sold/rented again`
        );
      }

      // 4. Compute earnings: deal_value × percent / 100
      const value = Number(deal_value ?? prop.value);
      if (!(value > 0)) {
        await connection.rollback();
        return badRequest("deal_value must be greater than 0");
      }
      const ownerPct = Number(prop.owner_brokerage_percent);
      const clientPct = Number(prop.client_brokerage_percent);
      const companyEarning = Math.round(((value * ownerPct) / 100) * 100) / 100;
      const brokerEarning = Math.round(((value * clientPct) / 100) * 100) / 100;

      const dealStatus = deal_type === "sale" ? "completed" : "ongoing";
      const newPropertyStatus =
        deal_type === "sale" ? "sold" : "ongoing_rental";

      // 5. Create Deals row
      const [dealResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO Deals (enquiry_id, property_id, broker_id, client_id,
                            deal_type, deal_value, rental_start_date, rental_end_date,
                            deal_status, company_earning, broker_earning)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          enquiryId,
          enquiry.property_id,
          enquiry.broker_id,
          enquiry.client_id,
          deal_type,
          value,
          rental_start_date || null,
          rental_end_date || null,
          dealStatus,
          companyEarning,
          brokerEarning,
        ]
      );

      // 6. Close enquiry + move property
      await connection.query(
        "UPDATE Enquiries SET status = 'closed' WHERE enquiry_id = ?",
        [enquiryId]
      );
      await connection.query(
        "UPDATE Properties SET status = ? WHERE property_id = ?",
        [newPropertyStatus, enquiry.property_id]
      );

      await connection.commit();

      return NextResponse.json(
        {
          deal_id: dealResult.insertId,
          deal_type,
          deal_value: value,
          deal_status: dealStatus,
          company_earning: companyEarning,
          broker_earning: brokerEarning,
          message: "Enquiry converted to deal successfully",
        },
        { status: 201 }
      );
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Convert enquiry error:", error);
    return NextResponse.json(
      { error: "Failed to convert enquiry to deal" },
      { status: 500 }
    );
  }
}
