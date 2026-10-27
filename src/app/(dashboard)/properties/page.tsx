import type { Metadata } from "next";
import { Suspense } from "react";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { PropertyFilters } from "@/components/properties/property-filters";
import { PropertyCard } from "@/components/properties/property-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface PropertyRow extends RowDataPacket {
  property_id: number;
  owner_name: string;
  owner_contact: string | null;
  location: string;
  square_feet: number | null;
  bedrooms: number | null;
  value: string;
  status: string;
  broker_id: number;
  broker_name: string | null;
  enquiry_count: number;
  is_rental?: number | boolean;
  tenant_types: string[];
}

interface ListingPageProps {
  searchParams: Promise<{
    location?: string;
    min_budget?: string;
    max_budget?: string;
    bedrooms?: string;
    tenant_type?: string;
    status?: string;
    type?: string;
    page?: string;
    limit?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Properties",
  description: "Browse available properties for sale and rent.",
};

export default function PropertiesPage({ searchParams }: ListingPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Properties"
        description="Browse available properties for sale and rent."
      />
      <Suspense fallback={<PropertyFiltersSkeleton />}>
        <PropertyFilters />
      </Suspense>
      <Suspense fallback={<PropertyListSkeleton />}>
        <PropertyList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function PropertyFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

function PropertyListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border border-border rounded-xl overflow-hidden bg-card shadow-xs flex flex-col"
        >
          <Skeleton className="h-48 w-full rounded-none" />
          <div className="p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-5 w-44" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function PropertyList({
  searchParams,
}: {
  searchParams: ListingPageProps["searchParams"];
}) {
  const params = await searchParams;
  const location = params.location || "";
  const minBudget = params.min_budget || "";
  const maxBudget = params.max_budget || "";
  const bedrooms = params.bedrooms || "";
  const tenantType = params.tenant_type || "";
  const rawStatus = (params.status || "available").toLowerCase();
  const status = ["available", "sold", "ongoing_rental", "all"].includes(rawStatus)
    ? rawStatus
    : "available";
  const type = params.type || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(params.limit || "12", 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (location) {
    conditions.push("p.location LIKE ?");
    values.push(`%${location}%`);
  }
  if (minBudget) {
    conditions.push("p.value >= ?");
    values.push(Number(minBudget));
  }
  if (maxBudget) {
    conditions.push("p.value <= ?");
    values.push(Number(maxBudget));
  }
  if (bedrooms) {
    conditions.push("p.bedrooms = ?");
    values.push(Number(bedrooms));
  }
  if (status !== "all") {
    conditions.push("p.status = ?");
    values.push(status);
  }
  if (tenantType) {
    conditions.push(
      "EXISTS (SELECT 1 FROM Property_Tenant_Type ptt WHERE ptt.property_id = p.property_id AND ptt.tenant_type = ?)"
    );
    values.push(tenantType);
  }
  if (type) {
    if (type === "rental") {
      conditions.push(
        "(EXISTS (SELECT 1 FROM Leases l WHERE l.property_id = p.property_id) OR p.status = 'ongoing_rental')"
      );
    } else if (type === "sale") {
      conditions.push(
        "(NOT EXISTS (SELECT 1 FROM Leases l WHERE l.property_id = p.property_id) AND p.status != 'ongoing_rental')"
      );
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM Properties p ${where}`,
    values
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);

  const [rows] = await pool.query<PropertyRow[]>(
    `SELECT p.property_id, p.owner_name, p.location, p.square_feet, p.bedrooms,
            p.value, p.status, p.broker_id,
            b.name AS broker_name,
            (SELECT COUNT(*) FROM Enquiries e WHERE e.property_id = p.property_id) AS enquiry_count,
            (EXISTS (SELECT 1 FROM Leases l WHERE l.property_id = p.property_id) OR p.status = 'ongoing_rental') AS is_rental
     FROM Properties p
     JOIN Brokers b ON p.broker_id = b.broker_id
     ${where}
     ORDER BY p.property_id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  // Attach tenant types
  const ids = rows.map((r) => r.property_id);
  const tenantMap: Record<number, string[]> = {};
  if (ids.length > 0) {
    const [tt] = await pool.query<RowDataPacket[]>(
      `SELECT property_id, tenant_type FROM Property_Tenant_Type WHERE property_id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    for (const t of tt) {
      const pid = t.property_id as number;
      if (!tenantMap[pid]) tenantMap[pid] = [];
      tenantMap[pid].push(t.tenant_type as string);
    }
  }

  const properties = rows.map((r) => ({
    ...r,
    tenant_types: tenantMap[r.property_id] ?? [],
  }));

  const totalPages = Math.ceil(total / limit);

  // Build base search params for pagination / clear-filters links
  const baseParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) {
      baseParams[key] = value;
    }
  }

  const buildUrl = (overrides: Record<string, string>) => {
    const merged = { ...baseParams, ...overrides };
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) sp.set(key, value);
    }
    return `/properties?${sp.toString()}`;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.length > 0 ? (
          properties.map((p) => (
            <PropertyCard
              key={p.property_id}
              property_id={p.property_id}
              owner_name={p.owner_name}
              location={p.location}
              square_feet={p.square_feet}
              bedrooms={p.bedrooms}
              value={p.value}
              status={p.status}
              broker_name={p.broker_name}
              tenant_types={p.tenant_types}
              enquiry_count={p.enquiry_count}
              is_rental={Boolean(p.is_rental)}
            />
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              title="No properties found"
              description={
                <div className="flex flex-col gap-2">
                  Try adjusting your filters or browse all available listings.
                </div>
              }
              action={
                <Link
                  href="/properties"
                  className="text-sm font-medium underline underline-offset-4 hover:text-primary"
                >
                  Clear filters
                </Link>
              }
            />
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + properties.length, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                ← Prev
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
