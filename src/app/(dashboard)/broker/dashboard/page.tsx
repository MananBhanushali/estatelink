"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  DollarSign,
  PlusCircle,
  User,
  Wallet,
  CheckCircle,
  Clock,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  description?: string;
}

function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  description,
}: StatCardProps) {
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

interface EnquiryRow {
  enquiry_id: number;
  client_id: number;
  property_id: number;
  broker_id: number;
  client_name: string;
  client_email: string;
  property_location: string;
  property_value: string;
  property_status: string;
  broker_name: string;
  enquiry_date: string;
  status: string;
  notes: string | null;
}

export default function BrokerDashboardPage() {
  const [stats, setStats] = useState<{
    total_enquiries: number;
    open: number;
    in_progress: number;
    closed: number;
    rejected: number;
    total_deals: number;
    total_earnings: number;
  } | null>(null);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [enqRes, dealsRes] = await Promise.all([
          fetch("/api/enquiries", { cache: "no-store" }),
          fetch("/api/deals", { cache: "no-store" }),
        ]);

        let rows: EnquiryRow[] = [];
        if (enqRes.ok) {
          const enqData = await enqRes.json();
          rows = (enqData.enquiries ?? []) as EnquiryRow[];
          setEnquiries(rows);
        }

        if (dealsRes.ok) {
          const dealsData = await dealsRes.json();
          const deals = (dealsData.deals ?? []) as Array<{
            deal_id: number;
            broker_earning: string | number;
          }>;
          const totalEarnings = deals.reduce(
            (acc, d) => acc + Number(d.broker_earning || 0),
            0
          );
          const openCount = rows.filter((r) => r.status === "open").length;
          const inProgressCount = rows.filter(
            (r) => r.status === "in_progress"
          ).length;
          const closedCount = rows.filter((r) => r.status === "closed").length;
          const rejectedCount = rows.filter(
            (r) => r.status === "rejected"
          ).length;

          setStats({
            total_enquiries: rows.length,
            open: openCount,
            in_progress: inProgressCount,
            closed: closedCount,
            rejected: rejectedCount,
            total_deals: deals.length,
            total_earnings: totalEarnings,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Broker Dashboard" />
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
        <PageHeader title="Broker Dashboard" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error || "Failed to load data"}</p>
        </div>
      </div>
    );
  }

  const recentEnquiries = enquiries.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Broker Dashboard"
        description="Your enquiries pipeline, listings, and earnings at a glance."
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enquiries"
          value={stats.total_enquiries}
          icon={ClipboardList}
          description="Enquiries assigned to you"
        />
        <StatCard
          title="Open"
          value={stats.open}
          change="+5 this week"
          changeType="positive"
          icon={Clock}
          description="Needs your attention"
        />
        <StatCard
          title="In Progress"
          value={stats.in_progress}
          icon={User}
          description="Active conversations"
        />
        <StatCard
          title="Total Earnings"
          value={`₹${Number(stats.total_earnings).toLocaleString()}`}
          icon={DollarSign}
          description="From completed deals"
        />
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent enquiries */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-sm font-semibold">Recent Enquiries</CardTitle>
            <Link href="/broker/enquiries">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentEnquiries.length === 0 ? (
              <EmptyState
                title="No enquiries yet"
                description="You don't have any enquiries assigned. List a property to start receiving enquiries."
                icon={<ClipboardList className="size-6" />}
                action={
                  <Link href="/broker/properties/new">
                    <Button>List a Property</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {recentEnquiries.map((e) => (
                  <div
                    key={e.enquiry_id}
                    className="flex flex-col gap-2 border-b pb-3 last:border-0"
                  >
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/properties/${e.property_id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {e.property_location}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {e.client_name}
                        </p>
                      </div>
                      <Badge
                        variant={
                          e.status === "open"
                            ? "outline"
                            : e.status === "rejected"
                              ? "destructive"
                              : "default"
                        }
                      >
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.enquiry_date).toLocaleDateString()} · ₹{Number(
                        e.property_value
                      ).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/broker/properties/new">
              <Button
                className="w-full flex items-center gap-2"
                variant="default"
              >
                <PlusCircle className="size-4" /> List New Property
              </Button>
            </Link>
            <Link href="/broker/enquiries">
              <Button
                className="w-full flex items-center gap-2"
                variant="outline"
              >
                <ClipboardList className="size-4" /> Manage Enquiries
              </Button>
            </Link>
            <Link href="/broker/earnings">
              <Button
                className="w-full flex items-center gap-2"
                variant="outline"
              >
                <Wallet className="size-4" /> View Earnings
              </Button>
            </Link>
            <Link href="/broker/reviews">
              <Button
                className="w-full flex items-center gap-2"
                variant="outline"
              >
                <CheckCircle className="size-4" /> View Reviews
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
