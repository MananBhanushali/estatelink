import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "miniproject"
);

type Role = "admin" | "broker" | "client";

const ROLE_PREFIX: Record<string, Role> = {
  "/admin": "admin",
  "/broker": "broker",
  "/client": "client",
};

function roleHome(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "broker":
      return "/broker/dashboard";
    case "client":
      return "/properties";
  }
}

async function getRole(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    if (role === "admin" || role === "broker" || role === "client") {
      return role;
    }
    return null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Role-gated sections
  for (const [prefix, required] of Object.entries(ROLE_PREFIX)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const role = await getRole(request);
      if (!role) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      if (role !== required) {
        const url = request.nextUrl.clone();
        url.pathname = roleHome(role);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
  }

  // Authenticated users shouldn't see auth pages
  if (pathname === "/login" || pathname === "/register") {
    const role = await getRole(request);
    if (role) {
      const next = request.nextUrl.searchParams.get("next");
      const url = request.nextUrl.clone();
      url.pathname = next && next.startsWith("/") ? next : roleHome(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/broker/:path*", "/client/:path*", "/login", "/register"],
};
