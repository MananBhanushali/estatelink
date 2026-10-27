"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";

interface PropertyRow {
  property_id: number;
  owner_name: string;
  location: string;
  square_feet: number | null;
  bedrooms: number | null;
  value: string;
  status: string;
  broker_id: number;
  broker_name: string;
  enquiry_count: number;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  sold: "destructive",
  ongoing_rental: "secondary",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "ongoing_rental", label: "Ongoing Rental" },
] as const;

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    async function loadProperties() {
      try {
        const res = await fetch("/api/properties?limit=500", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load properties");
        const data = await res.json();
        if (!cancelled) {
          setProperties(data.properties ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load properties");
          setLoading(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProperties();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      p.broker_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manage Properties" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manage Properties" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const statusCounts = properties.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage Properties"
        description="View and manage all properties on the platform."
        action={
          <Link href="/admin/properties/new">
            <Button>
              <PlusCircle className="size-4 mr-2" />
              List Property
            </Button>
          </Link>
        }
      />

      {/* Status summary */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((item) => {
          const isSelected = statusFilter === item.value;
          const count =
            item.value === "all"
              ? properties.length
              : statusCounts[item.value] || 0;

          return (
            <Button
              key={item.value}
              variant="outline"
              size="sm"
              onClick={() =>
                setStatusFilter((curr) =>
                  curr === item.value && item.value !== "all" ? "all" : item.value
                )
              }
              className={cn(
                "h-8 gap-2 rounded-lg px-2.5 text-xs transition-all",
                isSelected
                  ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Badge
                variant={
                  item.value === "all"
                    ? "outline"
                    : STATUS_VARIANT[item.value] ?? "secondary"
                }
              >
                {item.label}
              </Badge>
              <span className="font-semibold text-foreground">{count}</span>
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">All Properties</CardTitle>
          <CardDescription>
            {filteredProperties.length}{" "}
            {filteredProperties.length === 1 ? "property" : "properties"} found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by location, owner, or broker…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredProperties.length === 0 ? (
            <EmptyState title="No properties found" />
          ) : (
            <div className="mt-4 rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Property</TableHead>
                    <TableHead className="w-[25%]">Location</TableHead>
                    <TableHead className="w-[15%]">Value</TableHead>
                    <TableHead className="w-[15%]">Broker</TableHead>
                    <TableHead className="w-[12%]">Status</TableHead>
                    <TableHead className="w-[10%]">Enquiries</TableHead>
                    <TableHead className="w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((p) => (
                    <TableRow key={p.property_id}>
                      <TableCell className="text-sm font-medium">
                        {p.owner_name}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Link
                          href={`/properties/${p.property_id}`}
                          className="hover:underline"
                        >
                          {p.location}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        ₹{Number(p.value).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.broker_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANT[p.status] ?? "secondary"
                          }
                        >
                          {p.status
                            .charAt(0)
                            .toUpperCase() +
                          p.status.slice(1).replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.enquiry_count}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link
                            href={`/properties/${p.property_id}`}
                            className="px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
