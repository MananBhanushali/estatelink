import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "My Enquiries" };

export default function ClientEnquiriesStubPage() {
  return (
    <>
      <PageHeader
        title="My Enquiries"
        description="Track the status of properties you've enquired about."
      />
      <EmptyState
        title="Enquiry tracking is coming soon"
        description="Your submitted enquiries and their statuses will appear here in Phase 3."
        icon={<ClipboardList className="size-6" />}
      />
    </>
  );
}
