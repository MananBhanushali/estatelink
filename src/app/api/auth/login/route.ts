import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { comparePassword, signToken, badRequest } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  user_id: number;
  email: string;
  password_hash: string;
  role: "admin" | "broker" | "client";
  ref_id: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return badRequest("Email and password are required");
    }

    const [rows] = await pool.query<UserRow[]>(
      "SELECT user_id, email, password_hash, role, ref_id FROM Users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Resolve display name from role table
    let name = user.email;
    if (user.role === "broker" && user.ref_id) {
      const [b] = await pool.query<RowDataPacket[]>(
        "SELECT name FROM Brokers WHERE broker_id = ?",
        [user.ref_id]
      );
      if (b.length > 0) name = b[0].name as string;
    } else if (user.role === "client" && user.ref_id) {
      const [c] = await pool.query<RowDataPacket[]>(
        "SELECT name FROM Clients WHERE client_id = ?",
        [user.ref_id]
      );
      if (c.length > 0) name = c[0].name as string;
    } else if (user.role === "admin") {
      name = "Admin";
    }

    const token = await signToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      refId: user.ref_id,
      name,
    });

    const res = NextResponse.json({
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        refId: user.ref_id,
        name,
      },
      message: "Login successful",
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
