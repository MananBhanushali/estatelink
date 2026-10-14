import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Properties" };

export default function PropertiesStubPage() {
  return (
    <>
      <PageHeader
        title="Properties"
        description="Browse available properties for sale and rent."
      />
      <EmptyState
        title="Property listings are coming soon"
        description="The full browsing, filtering, and enquiry experience arrives in Phase 3."
        icon={<Building2 className="size-6" />}
      />
    </>
  );
}
