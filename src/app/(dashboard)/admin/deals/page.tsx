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
import { Wallet } from "lucide-react";

interface DealRow {
  deal_id: number;
  property_id: number;
  broker_id: number;
  client_id: number;
  deal_type: string;
  deal_date: string;
  deal_value: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  deal_status: string;
  company_earning: string | number;
  broker_earning: string | number;
  broker_name: string;
  client_name: string;
  property_location: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  ongoing: "secondary",
  ended: "secondary",
};

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadDeals() {
      try {
        const res = await fetch("/api/deals", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load deals");
        const data = await res.json();
        if (!cancelled) {
          setDeals(data.deals ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load deals");
          setLoading(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDeals();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDeals = deals.filter(
    (d) =>
      d.property_location.toLowerCase().includes(search.toLowerCase()) ||
      d.broker_name.toLowerCase().includes(search.toLowerCase()) ||
      d.client_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalCompanyEarnings = filteredDeals.reduce(
    (acc, d) => acc + Number(d.company_earning || 0),
    0
  );
  const totalBrokerEarnings = filteredDeals.reduce(
    (acc, d) => acc + Number(d.broker_earning || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manage Deals" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manage Deals" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage Deals"
        description="View all deals closed on the platform."
      />

      {/* Earnings summary */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-xl border border-border p-4 flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Company Earnings
          </span>
          <span className="text-2xl font-bold">
            ₹{totalCompanyEarnings.toLocaleString()}
          </span>
        </div>
        <div className="rounded-xl border border-border p-4 flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Broker Earnings
          </span>
          <span className="text-2xl font-bold">
            ₹{totalBrokerEarnings.toLocaleString()}
          </span>
        </div>
        <div className="rounded-xl border border-border p-4 flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Deals
          </span>
          <span className="text-2xl font-bold">{filteredDeals.length}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">All Deals</CardTitle>
          <CardDescription>
            {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""} found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, broker, or client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredDeals.length === 0 ? (
            <EmptyState title="No deals found" />
          ) : (
            <div className="mt-4 rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[10%]">Deal ID</TableHead>
                    <TableHead className="w-[20%]">Property</TableHead>
                    <TableHead className="w-[15%]">Client</TableHead>
                    <TableHead className="w-[15%]">Broker</TableHead>
                    <TableHead className="w-[10%]">Type</TableHead>
                    <TableHead className="w-[12%]">Status</TableHead>
                    <TableHead className="w-[12%]">Deal Value</TableHead>
                    <TableHead className="w-[14%]">Company Earn</TableHead>
                    <TableHead className="w-[14%]">Broker Earn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((d) => (
                    <TableRow key={d.deal_id}>
                      <TableCell className="text-sm font-medium">#{d.deal_id}</TableCell>
                      <TableCell>
                        <Link
                          href={`/properties/${d.property_id}`}
                          className="text-sm hover:underline"
                        >
                          {d.property_location}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.client_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.broker_name}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{d.deal_type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANT[d.deal_status] ?? "secondary"
                          }
                        >
                          {d.deal_status.charAt(0).toUpperCase() + d.deal_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        ₹{Number(d.deal_value).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        ₹{Number(d.company_earning || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        ₹{Number(d.broker_earning || 0).toLocaleString()}
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
