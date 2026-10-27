import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PropertyDetail, PropertyDetailSkeleton } from "@/components/properties/property-detail";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// This route fetches live (uncached) database data via a connection, which
// cannot be cached with `"use cache"` and `dynamic` is disabled by
// `nextConfig.cacheComponents`. Wrapping the data access in <Suspense> with a
// skeleton fallback lets Next.js prerender/stream the route instead of
// blocking, fixing "uncached data during prerendering or a navigation."

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Property ${id}`,
  };
}

export default async function PropertyDetailPage({
  params,
}: DetailPageProps) {
  const { id } = await params;
  const propertyId = Number(id);
  if (!Number.isInteger(propertyId)) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<PropertyDetailSkeleton />}>
        <PropertyDetail id={propertyId} />
      </Suspense>
      <div className="mt-4 flex gap-3">
        <Link href="/properties" className="flex-1">
          <Button variant="outline">← Back to listings</Button>
        </Link>
      </div>
    </div>
  );
}
