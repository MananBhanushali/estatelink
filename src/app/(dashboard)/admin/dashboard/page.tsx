import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboardStubPage() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Company-wide stats, leaderboard, and system management."
      />
      <EmptyState
        title="Admin dashboard is coming soon"
        description="Aggregate stats, the broker leaderboard, and rental refresh arrive in Phase 5."
        icon={<LayoutDashboard className="size-6" />}
      />
    </>
  );
}
