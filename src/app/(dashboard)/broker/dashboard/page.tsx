import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Broker Dashboard" };

export default function BrokerDashboardStubPage() {
  return (
    <>
      <PageHeader
        title="Broker Dashboard"
        description="Your enquiries pipeline, listings, and earnings at a glance."
      />
      <EmptyState
        title="Broker dashboard is coming soon"
        description="Enquiry management, property listing, deal conversion, and earnings arrive in Phase 4."
        icon={<LayoutDashboard className="size-6" />}
      />
    </>
  );
}
