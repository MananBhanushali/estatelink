import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/hooks/use-auth";
import { getSessionUser } from "@/lib/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";

// Dashboard routes are personalized (session cookie) — allow dynamic rendering.
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const initialUser = await getSessionUser();

  return (
    <AuthProvider initialUser={initialUser}>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
