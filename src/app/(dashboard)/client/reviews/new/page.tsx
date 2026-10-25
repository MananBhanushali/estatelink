"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Textarea,
} from "@/components/ui/textarea";
import { StarRatingInput } from "@/components/shared/star-rating-input";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/lib/hooks/use-auth";

interface DealRow {
  deal_id: number;
  property_id: number;
  broker_id: number;
  client_id: number;
  deal_type: string;
  deal_value: string;
  deal_status: string;
  broker_name: string;
  property_location: string;
}

interface ReviewPageProps {
  searchParams: Promise<{ deal_id?: string }>;
}

export default function NewReviewPage({
  searchParams,
}: ReviewPageProps) {
  const router = useRouter();
  const params = searchParams;
  const { user } = useAuth();
  const [deal, setDeal] = useState<DealRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadDeal() {
      const dealId = (await params).deal_id;
      if (!dealId) {
        router.push("/client/enquiries");
        return;
      }
      try {
        const res = await fetch(`/api/deals/${dealId}`, { cache: "no-store" });
        if (res.status === 404) {
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load deal");
        const data = await res.json();
        if (!cancelled) {
          setDeal(data.deal ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    loadDeal();
    return () => {
      cancelled = true;
    };
  }, [router, params]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Leave a Review" />
        <div className="flex items-center justify-center py-20">
          <Skeleton className="h-10 w-1/3" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Leave a Review" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">Deal not found.</p>
          <Link href="/client/enquiries">
            <Button variant="outline">Back to enquiries</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Guard: only the client who owns the deal can review it
  const canReview =
    user?.role === "client" &&
    user.refId !== null &&
    deal.client_id === user.refId &&
    deal.deal_status !== "ongoing";

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto">
      <PageHeader title="Leave a Review" />
      <Card>
        <CardHeader>
          <CardTitle>Rate your experience</CardTitle>
          <CardDescription>
            How was your experience with <strong>{deal.broker_name}</strong> for
            the{" "}
            <Link
              href={`/properties/${deal.property_id}`}
              className="font-medium hover:underline"
            >
              {deal.property_location}
            </Link>
            ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canReview && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              You can only leave a review for a deal you completed.
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Your rating</label>
            <StarRatingInput
              value={rating}
              onChange={setRating}
              disabled={!canReview}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Comments</label>
            <Textarea
              placeholder="Share your experience…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              disabled={!canReview}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={() => router.push("/client/enquiries")}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canReview || submitting || rating < 1}
            onClick={async () => {
              if (!deal.deal_id || rating < 1) return;
              setSubmitting(true);
              try {
                const res = await fetch("/api/reviews", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    deal_id: deal.deal_id,
                    rating,
                    comments: comments || undefined,
                  }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error || "Failed to submit review");
                }
                toast.success("Review submitted successfully");
                router.push("/client/enquiries");
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Failed to submit review"
                );
              } finally {
                setSubmitting(false);
              }
            }}
            className="w-full"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
