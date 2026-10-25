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
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/hooks/use-auth";
import { Building2, PlusCircle } from "lucide-react";

interface PropertyRow {
  property_id: number;
  owner_name: string;
  location: string;
  square_feet: number | null;
  bedrooms: number | null;
  value: string;
  status: string;
  broker_id: number;
  commission_id: number;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  sold: "destructive",
  ongoing_rental: "secondary",
};

export default function BrokerPropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProperties() {
      try {
        const res = await fetch("/api/properties", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load properties");
        const data = await res.json();
        // Filter to this broker's properties
        const brokerProps = (data.properties ?? []).filter(
          (p: PropertyRow) => p.broker_id === user?.refId
        );
        if (!cancelled) {
          setProperties(brokerProps);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load properties");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProperties();
    return () => {
      cancelled = true;
    };
  }, [user?.refId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Properties" />
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
        <PageHeader title="My Properties" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Properties"
        description="Manage properties listed by you."
        action={
          <Link href="/broker/properties/new">
            <Button>
              <PlusCircle className="size-4 mr-2" />
              List Property
            </Button>
          </Link>
        }
      />

      {properties.length === 0 ? (
        <EmptyState
          title="No properties listed yet"
          description="Start by listing your first property. Clients can then submit enquiries on your listings."
          icon={<Building2 className="size-6" />}
          action={
            <Link href="/broker/properties/new">
              <Button>List a Property</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Property</TableHead>
                <TableHead className="w-[20%]">Location</TableHead>
                <TableHead className="w-[15%]">Value</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[10%]">Bedrooms</TableHead>
                <TableHead className="w-[18%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
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
                  <TableCell>
                    <Badge
                      variant={
                        STATUS_VARIANT[p.status] ?? "secondary"
                      }
                    >
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1).replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.bedrooms ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link
                        href={`/broker/properties/${p.property_id}`}
                        className="px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
                      >
                        View
                      </Link>
                      {p.status === "available" && (
                        <Link
                          href={`/api/properties/${p.property_id}`}
                          className="px-3 py-1.5 text-xs border rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            // Placeholder for edit
                          }}
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
