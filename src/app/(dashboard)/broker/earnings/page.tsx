"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/hooks/use-auth";
import { Wallet, DollarSign } from "lucide-react";

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

export default function BrokerEarningsPage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadDeals() {
      try {
        const res = await fetch("/api/deals", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load deals");
        const data = await res.json();
        // Filter to this broker's deals
        const brokerDeals = (data.deals ?? []).filter(
          (d: DealRow) => d.broker_id === user?.refId
        );
        if (!cancelled) {
          setDeals(brokerDeals);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load deals");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDeals();
    return () => {
      cancelled = true;
    };
  }, [user?.refId]);

  const totalEarnings = deals.reduce(
    (acc, d) => acc + Number(d.broker_earning || 0),
    0
  );
  const totalCompanyEarnings = deals.reduce(
    (acc, d) => acc + Number(d.company_earning || 0),
    0
  );
  const completedDeals = deals.filter((d) => d.deal_status === "completed");
  const ongoingDeals = deals.filter((d) => d.deal_status === "ongoing");

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Earnings" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Earnings" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Earnings" description="Your commission earnings from closed deals." />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="-mt-2 flex flex-col space-y-1">
              <span className="text-3xl font-bold">
                ₹{totalEarnings.toLocaleString()}
              </span>
              <p className="text-xs text-muted-foreground">
                Broker earnings from {deals.length} deal{deals.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Earnings</CardTitle>
            <Wallet className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="-mt-2 flex flex-col space-y-1">
              <span className="text-3xl font-bold text-muted-foreground">
                ₹{totalCompanyEarnings.toLocaleString()}
              </span>
              <p className="text-xs text-muted-foreground">
                Company share from your deals
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Deals</CardTitle>
            <DollarSign className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="-mt-2 flex flex-col space-y-1">
              <span className="text-3xl font-bold">{completedDeals.length}</span>
              <p className="text-xs text-muted-foreground">
                {ongoingDeals.length} ongoing rental
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[12%]">Deal ID</TableHead>
              <TableHead className="w-[22%]">Property</TableHead>
              <TableHead className="w-[18%]">Client</TableHead>
              <TableHead className="w-[12%]">Type</TableHead>
              <TableHead className="w-[14%]">Status</TableHead>
              <TableHead className="w-[14%]">Deal Value</TableHead>
              <TableHead className="w-[16%]">Your Earning</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    title="No deals yet"
                    description="Convert an enquiry to a deal to start earning commission."
                    icon={<DollarSign className="size-6" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              deals.map((d) => (
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
                  <TableCell className="text-sm">{d.client_name}</TableCell>
                  <TableCell className="text-sm capitalize">{d.deal_type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        d.deal_status === "completed"
                          ? "default"
                          : d.deal_status === "ongoing"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {d.deal_status.charAt(0).toUpperCase() + d.deal_status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    ₹{Number(d.deal_value).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    ₹{Number(d.broker_earning || 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

