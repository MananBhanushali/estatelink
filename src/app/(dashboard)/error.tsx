"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      title="Something went wrong"
      description={error.message || "An unexpected error occurred while loading this page."}
      icon={<TriangleAlert className="size-6" />}
      action={
        <Button onClick={reset}>Try again</Button>
      }
    />
  );
}
