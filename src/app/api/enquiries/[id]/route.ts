import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

const VALID_STATUSES = ["open", "in_progress", "closed", "rejected"] as const;

// PATCH /api/enquiries/[id] — broker updates status (must own enquiry; admin allowed)
export async function PATCH(
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
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return badRequest(
        "status must be one of: open, in_progress, closed, rejected"
      );
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT enquiry_id, broker_id, status FROM Enquiries WHERE enquiry_id = ?",
      [enquiryId]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Enquiry not found" },
        { status: 404 }
      );
    }
    if (
      user.role === "broker" &&
      (existing[0].broker_id as number) !== user.refId
    ) {
      return forbidden();
    }

    await pool.query("UPDATE Enquiries SET status = ? WHERE enquiry_id = ?", [
      status,
      enquiryId,
    ]);

    return NextResponse.json({ message: "Enquiry status updated" });
  } catch (error) {
    console.error("Update enquiry error:", error);
    return NextResponse.json(
      { error: "Failed to update enquiry" },
      { status: 500 }
    );
  }
}
