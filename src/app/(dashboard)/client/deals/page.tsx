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
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { Star } from "lucide-react";

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

interface ReviewRow {
  deal_id: number;
  client_id: number;
  broker_id: number;
  rating: number;
  comments: string | null;
  review_date: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  ongoing: "secondary",
  ended: "secondary",
};

// Only non-ongoing deals can be reviewed.
const REVIEWABLE_STATUS = new Set(["completed", "ended"]);

export default function ClientDealsPage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [reviewsByDeal, setReviewsByDeal] = useState<Map<number, ReviewRow>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [dealsRes, reviewsRes] = await Promise.all([
          fetch("/api/deals", { cache: "no-store" }),
          fetch("/api/reviews", { cache: "no-store" }),
        ]);
        if (!dealsRes.ok) throw new Error("Failed to load deals");
        if (!reviewsRes.ok) throw new Error("Failed to load reviews");
        const dealsData = await dealsRes.json();
        const reviewsData = await reviewsRes.json();
        if (!cancelled) {
          setDeals(dealsData.deals ?? []);
          const map = new Map<number, ReviewRow>();
          for (const r of (reviewsData.reviews ?? [])) {
            map.set(r.deal_id, r);
          }
          setReviewsByDeal(map);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const myDeals = deals.filter(
    (d) => d.client_id === (user?.refId ?? -1)
  );

  const reviewableCount = myDeals.filter(
    (d) => REVIEWABLE_STATUS.has(d.deal_status) && !reviewsByDeal.has(d.deal_id)
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Deals" />
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
        <PageHeader title="My Deals" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Deals"
        description={
          <>
            {myDeals.length} deal{myDeals.length !== 1 ? "s" : ""} closed{" "}
            through EstateLink. Leave a review for completed deals.
            {reviewableCount > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                ({reviewableCount} ready for review)
              </span>
            )}
          </>
        }
      />

      {myDeals.length === 0 ? (
        <EmptyState
          title="No deals yet"
          description={
            <>
              You haven&rsquo;t completed any deals yet. Browse properties and
              submit an enquiry to get started.
            </>
          }
          action={
            <Link href="/properties">
              <Button>Browse Properties</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[10%]">Deal ID</TableHead>
                <TableHead className="w-[20%]">Property</TableHead>
                <TableHead className="w-[15%]">Broker</TableHead>
                <TableHead className="w-[15%]">Type</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[12%]">Deal Value</TableHead>
                <TableHead className="w-[16%]">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myDeals.map((d) => {
                const review = reviewsByDeal.get(d.deal_id);
                const canReview =
                  REVIEWABLE_STATUS.has(d.deal_status) && !review;
                return (
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
                      {d.broker_name}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {d.deal_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          STATUS_VARIANT[d.deal_status] ?? "secondary"
                        }
                      >
                        {d.deal_status.charAt(0).toUpperCase() +
                          d.deal_status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      ₹{Number(d.deal_value).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {review ? (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Reviewed</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`size-3 ${
                                  star <= review.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-yellow-300/50"
                                }`}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground">
                              {review.rating}
                            </span>
                          </div>
                        </div>
                      ) : canReview ? (
                        <Link
                          href={`/client/reviews/new?deal_id=${d.deal_id}`}
                          className="underline underline-offset-4 hover:text-primary"
                        >
                          Leave a review
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Review after deal completes
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
