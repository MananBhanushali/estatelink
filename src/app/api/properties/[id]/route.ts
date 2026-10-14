import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET /api/properties/[id] — full detail (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const propertyId = Number(id);
    if (!Number.isInteger(propertyId)) return badRequest("Invalid property id");

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.property_id, p.owner_name, p.owner_contact, p.location,
              p.square_feet, p.bedrooms, p.value, p.status,
              p.broker_id, p.commission_id,
              b.name AS broker_name, b.email AS broker_email, b.phone AS broker_phone,
              c.owner_brokerage_percent, c.client_brokerage_percent,
              l.lease_id, l.lease_type, l.security_deposit, l.duration_months,
              (SELECT COUNT(*) FROM Enquiries e WHERE e.property_id = p.property_id) AS enquiry_count
       FROM Properties p
       JOIN Brokers b ON p.broker_id = b.broker_id
       JOIN Commission c ON p.commission_id = c.commission_id
       LEFT JOIN Leases l ON p.property_id = l.property_id
       WHERE p.property_id = ?`,
      [propertyId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const [tt] = await pool.query<RowDataPacket[]>(
      `SELECT tenant_type FROM Property_Tenant_Type WHERE property_id = ?`,
      [propertyId]
    );

    return NextResponse.json({
      property: {
        ...rows[0],
        tenant_types: tt.map((t) => t.tenant_type),
      },
    });
  } catch (error) {
    console.error("Property detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PATCH /api/properties/[id] — update (broker owner or admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "broker" && user.role !== "admin") return forbidden();

  try {
    const { id } = await params;
    const propertyId = Number(id);
    if (!Number.isInteger(propertyId)) return badRequest("Invalid property id");

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT broker_id FROM Properties WHERE property_id = ?",
      [propertyId]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    if (
      user.role === "broker" &&
      (existing[0].broker_id as number) !== user.refId
    ) {
      return forbidden();
    }

    const body = await request.json();
    const allowed = [
      "owner_name",
      "owner_contact",
      "location",
      "square_feet",
      "bedrooms",
      "value",
      "status",
    ] as const;

    const sets: string[] = [];
    const values: (string | number | null)[] = [];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (
          key === "status" &&
          !["available", "sold", "ongoing_rental"].includes(body[key])
        ) {
          return badRequest("Invalid status value");
        }
        if (key === "value" && Number(body[key]) <= 0) {
          return badRequest("value must be greater than 0");
        }
        sets.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (sets.length === 0) {
      return badRequest("No valid fields to update");
    }

    await pool.query(`UPDATE Properties SET ${sets.join(", ")} WHERE property_id = ?`, [
      ...values,
      propertyId,
    ]);

    return NextResponse.json({ message: "Property updated successfully" });
  } catch (error) {
    console.error("Update property error:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}
