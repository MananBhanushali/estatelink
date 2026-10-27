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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/shared/star-rating";

interface BrokerLeaderboardRow {
  broker_id: number;
  broker_name: string;
  broker_email: string;
  broker_phone: string;
  join_date: string;
  total_deals_closed: number;
  sales_closed: number;
  rentals_closed: number;
  total_deal_volume: string | number;
  total_broker_earnings: string | number;
  total_company_contribution: string | number;
  average_rating: number | null;
  total_reviews: number;
}

interface BrokerRow {
  broker_id: number;
  name: string;
  email: string;
  phone: string;
  join_date: string;
}

export default function AdminBrokersPage() {
  const [leaderboard, setLeaderboard] = useState<BrokerLeaderboardRow[]>([]);
  const [allBrokers, setAllBrokers] = useState<BrokerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [lbRes, brokersRes] = await Promise.all([
          fetch("/api/admin/brokers/leaderboard", { cache: "no-store" }),
          fetch("/api/brokers", { cache: "no-store" }),
        ]);

        if (lbRes.ok) {
          const lbData = await lbRes.json();
          if (!cancelled) setLeaderboard(lbData.leaderboard ?? []);
        }
        if (brokersRes.ok) {
          const bData = await brokersRes.json();
          if (!cancelled) setAllBrokers(bData.brokers ?? []);
        }
        if (!cancelled) {
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load broker data");
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLeaderboard = leaderboard.filter((b) =>
    b.broker_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Broker Leaderboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <PageHeader title="Broker Leaderboard" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Broker Leaderboard"
        description="Rank brokers by deals closed, earnings, and client ratings."
      />

      {/* Search */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search brokers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Top Brokers by Earnings</CardTitle>
          <CardDescription>
            Based on {leaderboard.length} broker{leaderboard.length !== 1 ? "s" : ""} on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeaderboard.length === 0 ? (
            <EmptyState title="No brokers found" />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[10%]">Rank</TableHead>
                    <TableHead className="w-[20%]">Broker</TableHead>
                    <TableHead className="w-[10%]">Deals</TableHead>
                    <TableHead className="w-[10%]">Sales</TableHead>
                    <TableHead className="w-[10%]">Rentals</TableHead>
                    <TableHead className="w-[15%]">Deal Volume</TableHead>
                    <TableHead className="w-[15%]">Broker Earnings</TableHead>
                    <TableHead className="w-[10%]">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaderboard.map((b, i) => (
                    <TableRow key={b.broker_id}>
                      <TableCell className="text-sm font-medium">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/brokers/${b.broker_id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {b.broker_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {b.broker_email}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {b.total_deals_closed}
                      </TableCell>
                      <TableCell className="text-sm">{b.sales_closed}</TableCell>
                      <TableCell className="text-sm">{b.rentals_closed}</TableCell>
                      <TableCell className="text-sm">
                        ₹{Number(b.total_deal_volume).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        ₹{Number(b.total_broker_earnings).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {b.average_rating !== null ? (
                          <StarRating rating={b.average_rating} size="sm" showText />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

        {/* All Brokers Table */}
        <Card className="mt-6 lg:mt-0">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-sm font-semibold">All Brokers</CardTitle>
          </CardHeader>
          <CardContent>
            {allBrokers.length === 0 ? (
              <EmptyState title="No brokers" />
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[25%]">Name</TableHead>
                      <TableHead className="w-[30%]">Email</TableHead>
                      <TableHead className="w-[20%]">Phone</TableHead>
                      <TableHead className="w-[15%]">Joined</TableHead>
                      <TableHead className="w-[10%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBrokers.map((b) => (
                      <TableRow key={b.broker_id}>
                        <TableCell className="text-sm font-medium">
                          {b.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.phone || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(b.join_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/brokers/${b.broker_id}`}
                            className="px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
                          >
                            Profile
                          </Link>
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
