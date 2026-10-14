import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { AuthUser, Role } from "@/lib/hooks/use-auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "miniproject"
);

/** Server-side session read for SSR hydration (verified with jose). */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    if (role !== "admin" && role !== "broker" && role !== "client") {
      return null;
    }
    return {
      id: payload.userId as number,
      email: payload.email as string,
      role: role as Role,
      refId: (payload.refId as number | null) ?? null,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}
