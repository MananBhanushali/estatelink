"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StarRating } from "@/components/shared/star-rating";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/hooks/use-auth";

interface ReviewRow {
  review_id: number;
  client_id: number;
  broker_id: number;
  deal_id: number;
  rating: number;
  comments: string | null;
  review_date: string;
  client_name: string;
  deal_type: string;
  deal_value: string;
  property_location: string;
}

export default function BrokerReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      try {
        const res = await fetch(`/api/reviews?broker_id=${user?.refId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load reviews");
        const data = await res.json();
        if (!cancelled) {
          setReviews(data.reviews ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load reviews");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [user?.refId]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Reviews" />
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
        <PageHeader title="My Reviews" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Reviews" description="Client reviews left about you after deals close." />

      {/* Average rating card */}
      <div className="rounded-xl border border-border p-6">
        <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start md:justify-between gap-6">
          <div className="flex flex-col items-center gap-2">
            <StarRating rating={averageRating} size="lg" showText />
            <p className="text-muted-foreground text-sm">
              Average rating from {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold">{reviews.length}</span>
              <span className="text-xs text-muted-foreground">Total Reviews</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold">
                {reviews.filter((r) => r.rating >= 4).length}
              </span>
              <span className="text-xs text-muted-foreground">4★ &amp; Above</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[22%]">Client</TableHead>
              <TableHead className="w-[20%]">Property</TableHead>
              <TableHead className="w-[10%]">Rating</TableHead>
              <TableHead className="w-[10%]">Date</TableHead>
              <TableHead className="w-[38%]">Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    title="No reviews yet"
                    description="Leave great service and clients will leave reviews after deals close."
                    icon={<StarRating rating={5} size="md" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((r) => (
                <TableRow key={r.review_id}>
                  <TableCell className="text-sm font-medium">
                    {r.client_name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.property_location}
                  </TableCell>
                  <TableCell className="text-sm">
                    <StarRating rating={r.rating} size="sm" showText />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.review_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.comments || "—"}
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
