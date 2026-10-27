import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET /api/properties — list with filters + pagination (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const minBudget = searchParams.get("min_budget");
    const maxBudget = searchParams.get("max_budget");
    const bedrooms = searchParams.get("bedrooms");
    const tenantType = searchParams.get("tenant_type");
    const status = searchParams.get("status");
    const brokerId = searchParams.get("broker_id");
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12"))
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (location) {
      conditions.push("p.location LIKE ?");
      params.push(`%${location}%`);
    }
    if (minBudget) {
      conditions.push("p.value >= ?");
      params.push(Number(minBudget));
    }
    if (maxBudget) {
      conditions.push("p.value <= ?");
      params.push(Number(maxBudget));
    }
    if (bedrooms) {
      conditions.push("p.bedrooms = ?");
      params.push(Number(bedrooms));
    }
    if (status && status !== "all") {
      if (!["available", "sold", "ongoing_rental"].includes(status)) {
        return badRequest("Invalid status filter");
      }
      conditions.push("p.status = ?");
      params.push(status);
    }
    if (type) {
      if (type === "rental") {
        conditions.push(
          "(EXISTS (SELECT 1 FROM Leases l WHERE l.property_id = p.property_id) OR p.status = 'ongoing_rental')"
        );
      } else if (type === "sale") {
        conditions.push(
          "(NOT EXISTS (SELECT 1 FROM Leases l WHERE l.property_id = p.property_id) AND p.status != 'ongoing_rental')"
        );
      } else {
        return badRequest("Invalid type filter (must be 'rental' or 'sale')");
      }
    }
    if (brokerId) {
      conditions.push("p.broker_id = ?");
      params.push(Number(brokerId));
    }
    if (tenantType) {
      if (!["student", "bachelor", "family"].includes(tenantType)) {
        return badRequest("Invalid tenant_type filter");
      }
      conditions.push(
        "EXISTS (SELECT 1 FROM Property_Tenant_Type ptt WHERE ptt.property_id = p.property_id AND ptt.tenant_type = ?)"
      );
      params.push(tenantType);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM Properties p ${where}`,
      params
    );
    const total = (countRows[0].total as number) ?? 0;

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
       ${where}
       ORDER BY p.property_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Attach tenant types per property
    const ids = rows.map((r) => r.property_id);
    const tenantMap: Record<number, string[]> = {};
    if (ids.length > 0) {
      const [tt] = await pool.query<RowDataPacket[]>(
        `SELECT property_id, tenant_type FROM Property_Tenant_Type WHERE property_id IN (${ids.map(() => "?").join(",")})`,
        ids
      );
      for (const t of tt) {
        const pid = t.property_id as number;
        if (!tenantMap[pid]) tenantMap[pid] = [];
        tenantMap[pid].push(t.tenant_type as string);
      }
    }

    const properties = rows.map((r) => ({
      ...r,
      tenant_types: tenantMap[r.property_id as number] ?? [],
    }));

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List properties error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST /api/properties — create listing (broker or admin, transaction)
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "broker" && user.role !== "admin") return forbidden();
  if (user.role === "broker" && !user.refId) return badRequest("Broker profile not linked");

  try {
    const body = await request.json();
    const {
      owner_name,
      owner_contact,
      location,
      square_feet,
      bedrooms,
      value,
      owner_brokerage_percent,
      client_brokerage_percent,
      tenant_types,
      lease,
      broker_id: bodyBrokerId,
    } = body;

    // Admin must supply a broker_id; broker uses their own refId
    const effectiveBrokerId: number =
      user.role === "admin" ? Number(bodyBrokerId) : (user.refId as number);

    if (user.role === "admin" && (!bodyBrokerId || isNaN(effectiveBrokerId))) {
      return badRequest("broker_id is required when listing as admin");
    }

    if (!owner_name || !location || !value) {
      return badRequest("owner_name, location, and value are required");
    }
    if (Number(value) <= 0) {
      return badRequest("value must be greater than 0");
    }
    if (
      owner_brokerage_percent === undefined ||
      client_brokerage_percent === undefined
    ) {
      return badRequest(
        "owner_brokerage_percent and client_brokerage_percent are required"
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [commResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO Commission (owner_brokerage_percent, client_brokerage_percent, broker_id)
         VALUES (?, ?, ?)`,
        [owner_brokerage_percent, client_brokerage_percent, effectiveBrokerId]
      );
      const commissionId = commResult.insertId;

      const [propResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO Properties (owner_name, owner_contact, location, square_feet, bedrooms, value, status, broker_id, commission_id)
         VALUES (?, ?, ?, ?, ?, ?, 'available', ?, ?)`,
        [
          owner_name,
          owner_contact || null,
          location,
          square_feet ?? null,
          bedrooms ?? null,
          value,
          effectiveBrokerId,
          commissionId,
        ]
      );
      const propertyId = propResult.insertId;

      if (Array.isArray(tenant_types) && tenant_types.length > 0) {
        for (const tt of tenant_types) {
          if (!["student", "bachelor", "family"].includes(tt)) {
            throw new Error(`Invalid tenant_type: ${tt}`);
          }
          await connection.query(
            `INSERT INTO Property_Tenant_Type (property_id, tenant_type) VALUES (?, ?)`,
            [propertyId, tt]
          );
        }
      }

      if (lease) {
        const { lease_type, security_deposit, duration_months } = lease;
        await connection.query(
          `INSERT INTO Leases (lease_type, security_deposit, duration_months, property_id)
           VALUES (?, ?, ?, ?)`,
          [
            lease_type || null,
            security_deposit ?? null,
            duration_months ?? null,
            propertyId,
          ]
        );
      }

      await connection.commit();
      return NextResponse.json(
        { property_id: propertyId, message: "Property listed successfully" },
        { status: 201 }
      );
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Create property error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create property";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
