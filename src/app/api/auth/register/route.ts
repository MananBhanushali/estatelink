import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword, signToken, badRequest } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role, clientType } = body;

    if (!email || !password || !name || !role) {
      return badRequest("Email, password, name, and role are required");
    }

    if (!["broker", "client"].includes(role)) {
      return badRequest("Role must be 'broker' or 'client'");
    }

    if (role === "client" && !clientType) {
      return badRequest("Client type is required for client registration");
    }

    // Check if email already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT user_id FROM Users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return badRequest("Email already registered");
    }

    const passwordHash = await hashPassword(password);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let refId: number;

      if (role === "broker") {
        const [result] = await connection.query<ResultSetHeader>(
          "INSERT INTO Brokers (name, email, phone) VALUES (?, ?, ?)",
          [name, email, phone || null]
        );
        refId = result.insertId;
      } else {
        const [result] = await connection.query<ResultSetHeader>(
          "INSERT INTO Clients (name, email, phone, client_type) VALUES (?, ?, ?, ?)",
          [name, email, phone || null, clientType]
        );
        refId = result.insertId;
      }

      const [userResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO Users (email, password_hash, role, ref_id) VALUES (?, ?, ?, ?)",
        [email, passwordHash, role, refId]
      );

      await connection.commit();

      const token = await signToken({
        userId: userResult.insertId,
        email,
        role,
        refId,
        name,
      });

      const response = NextResponse.json(
        {
          user: { id: userResult.insertId, email, role, name, refId },
          message: "Registration successful",
        },
        { status: 201 }
      );

      response.cookies.set("token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
      });

      return response;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}
