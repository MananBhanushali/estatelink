import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

// Dashboard routes are personalized (session cookie) — allow dynamic rendering.
export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
