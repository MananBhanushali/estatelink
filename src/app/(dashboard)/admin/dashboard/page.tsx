"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  Building2,
  DollarSign,
  RefreshCw,
  Shield,
  Wallet,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  properties: {
    total: number;
    available: number;
    sold: number;
    ongoing_rental: number;
  };
  deals: {
    total: number;
    sales: number;
    rentals: number;
    completed: number;
    ongoing: number;
    ended: number;
    total_company_earnings: string | number;
    total_broker_earnings: string | number;
    total_deal_volume: string | number;
  };
  counts: {
    brokers: number;
    clients: number;
    enquiries: number;
    open_enquiries: number;
  };
  recent_deals: Array<{
    deal_id: number;
    deal_type: string;
    deal_value: string;
    deal_status: string;
    deal_date: string;
    broker_name: string;
    client_name: string;
    property_location: string;
  }>;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  sold: "destructive",
  ongoing_rental: "secondary",
  open: "outline",
  in_progress: "default",
  closed: "default",
  rejected: "destructive",
  completed: "default",
  ongoing: "secondary",
  ended: "secondary",
};

function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  description?: string | React.ReactNode;
}) {
  const changeColors: Record<string, string> = {
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-destructive dark:text-destructive/400",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className="rounded-2xl border-border p-5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="-mt-2 flex flex-col space-y-1">
          <span className="text-2xl font-bold">{value}</span>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {change !== undefined && (
          <p className={`text-xs font-medium ${changeColors[changeType]}`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ refreshed: number; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load dashboard stats");
        const data = await res.json();
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard stats");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/refresh-rentals", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to refresh rentals");
      const data = await res.json();
      setRefreshResult(data);
      // Reload stats after refresh
      const statsRes = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh rentals");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Admin Dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Admin Dashboard" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error || "Failed to load data"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin Dashboard"
        description="Company-wide stats, leaderboard, and system management."
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Properties"
          value={stats.properties.total}
          icon={Building2}
          description={
            <>
              {stats.properties.available} available &middot;
              {stats.properties.sold} sold &middot;
              {stats.properties.ongoing_rental} ongoing rental
            </>
          }
        />
        <StatCard
          title="Total Deals"
          value={stats.deals.total}
          icon={Wallet}
          description={
            <>
              {stats.deals.sales} sales &middot;
              {stats.deals.rentals} rentals
            </>
          }
        />
        <StatCard
          title="Company Earnings"
          value={`₹${Number(stats.deals.total_company_earnings).toLocaleString()}`}
          icon={DollarSign}
          description="From all closed deals"
        />
        <StatCard
          title="Broker Earnings"
          value={`₹${Number(stats.deals.total_broker_earnings).toLocaleString()}`}
          icon={Shield}
          description="Paid out to brokers"
        />
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Deals + Refresh Rentals */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-semibold">Recent Deals</CardTitle>
              <Link href="/admin/deals">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats.recent_deals.length === 0 ? (
                <EmptyState title="No deals yet" />
              ) : (
                <div className="space-y-3">
                  {stats.recent_deals.map((d) => (
                    <div
                      key={d.deal_id}
                      className="flex flex-row items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/properties/${d.deal_id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {d.property_location}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {d.broker_name} &middot; {d.client_name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-medium">
                          ₹{Number(d.deal_value).toLocaleString()}
                        </span>
                        <Badge
                          variant={
                            STATUS_VARIANT[d.deal_status] ?? "secondary"
                          }
                        >
                          {d.deal_status.charAt(0).toUpperCase() + d.deal_status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Rental Lifecycle</CardTitle>
              <CardDescription>
                Automatically expire rentals whose lease tenure has completed
                and reactivate those properties as available.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ongoing rentals with end dates in the past will be marked as
                  &ldquo;ended,&rdquo; and their properties will return to
                  &ldquo;available&rdquo; status.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Dialog>
                    <DialogTrigger
                      render={
                        <Button
                          disabled={refreshing}
                          className="w-full flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                        >
                          <RefreshCw className="size-4" />
                          {refreshing ? "Refreshing…" : "Refresh Expired Rentals"}
                        </Button>
                      }
                    >
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Refresh Expired Rentals</DialogTitle>
                        <DialogDescription>
                          This will expire all ongoing rentals whose lease end
                          date has passed and reactivate their properties as
                          available. This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => {}}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleRefresh}
                          disabled={refreshing}
                          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive"
                        >
                          {refreshing ? "Refreshing…" : "Confirm Refresh"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {refreshResult && (
                    <div className="rounded-lg border border-emerald/50 bg-emerald/50 p-3 text-sm text-emerald-700">
                      {refreshResult.message}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Platform Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Brokers</span>
                  <span className="font-medium">{stats.counts.brokers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clients</span>
                  <span className="font-medium">{stats.counts.clients}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Enquiries</span>
                  <span className="font-medium">{stats.counts.enquiries}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Open Enquiries</span>
                  <span className="font-medium text-destructive">{stats.counts.open_enquiries}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Deal Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed Sales</span>
                <span className="font-medium">{stats.deals.completed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ongoing Rentals</span>
                <span className="font-medium">{stats.deals.ongoing}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ended Rentals</span>
                <span className="font-medium">{stats.deals.ended}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold pt-2 border-t">
                <span>Total Deal Volume</span>
                <span>₹{Number(stats.deals.total_deal_volume).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
