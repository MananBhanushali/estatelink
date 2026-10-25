"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  PlusCircle,
} from "lucide-react";

interface EnquiryRow {
  enquiry_id: number;
  client_id: number;
  property_id: number;
  broker_id: number;
  enquiry_date: string;
  status: string;
  notes: string | null;
  client_name: string;
  client_email: string;
  property_location: string;
  property_value: string;
  property_status: string;
  broker_name: string;
}

interface ConvertPageProps {
  params: Promise<{ id: string }>;
}

export default function ConvertEnquiryPage({
  params,
}: ConvertPageProps) {
  const router = useRouter();
  const [enquiryId, setEnquiryId] = useState<number | null>(null);

  useEffect(() => {
    params.then(({ id }) => setEnquiryId(Number(id)));
  }, [params]);

  const [enquiry, setEnquiry] = useState<EnquiryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [dealType, setDealType] = useState<"sale" | "rental">("sale");
  const [dealValue, setDealValue] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState("");
  const [rentalEndDate, setRentalEndDate] = useState("");
  const [commissionPreview, setCommissionPreview] = useState<{
    company_earning: number;
    broker_earning: number;
  } | null>(null);

  const calculateCommission = useCallback(() => {
    if (!enquiry || !dealValue) {
      setCommissionPreview(null);
      return;
    }
    const value = Number(dealValue);
    if (!value || value <= 0) {
      setCommissionPreview(null);
      return;
    }
    // The API calculates commission based on property's commission rates
    // For preview, we show estimated values - actual computed by server
    // We don't have commission % here from the enquiry API, so just show deal value
    setCommissionPreview({
      company_earning: 0,
      broker_earning: 0,
    });
  }, [enquiry, dealValue]);

  useEffect(() => {
    if (!enquiryId) return;
    let cancelled = false;
    async function loadEnquiry() {
      try {
        const res = await fetch(`/api/enquiries/${enquiryId}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          setError("Enquiry not found");
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load enquiry");
        const data = await res.json();
        if (!cancelled) {
          setEnquiry(data.enquiry ?? null);
          setDealValue(data.enquiry?.property_value || "");
          calculateCommission();
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load enquiry");
          setLoading(false);
        }
      }
    }
    loadEnquiry();
    return () => {
      cancelled = true;
    };
  }, [enquiryId, calculateCommission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryId) return;

    const deal_type = dealType;
    const value = Number(dealValue);

    if (!value || value <= 0) {
      toast.error("Please enter a valid deal value");
      return;
    }

    if (deal_type === "rental" && !rentalStartDate) {
      toast.error("Rental start date is required for rental deals");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/enquiries/${enquiryId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_type,
          deal_value: value,
          rental_start_date: rentalStartDate || undefined,
          rental_end_date: rentalEndDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to convert enquiry");
      }

      const data = await res.json();
      toast.success(
        `Enquiry converted to deal successfully! Commission: ₹${data.company_earning} (company) / ₹${data.broker_earning} (broker)`
      );
      router.push("/broker/enquiries");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to convert enquiry"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <PageHeader title="Convert Enquiry to Deal" />
        <div className="flex items-center justify-center py-20">
          <Skeleton className="h-10 w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !enquiry) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <PageHeader title="Convert Enquiry to Deal" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            {error || "Enquiry not found."}
          </p>
          <Link href="/broker/enquiries">
            <Button variant="outline">Back to Enquiries</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isRental = dealType === "rental";

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <PageHeader
        title="Convert Enquiry to Deal"
        description={`Turn enquiry #${enquiry.enquiry_id} into a closed deal and compute commission.`}
      />

      {/* Enquiry summary card */}
      <Card>
        <CardHeader>
          <CardTitle>Enquiry Summary</CardTitle>
          <CardDescription>
            Converting enquiry for <strong>{enquiry.property_location}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Client
            </label>
            <p className="text-sm">{enquiry.client_name}</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Property
            </label>
            <p className="text-sm">{enquiry.property_location}</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Status
            </label>
            <span className="text-sm font-medium">{enquiry.status}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Enquiry Date
            </label>
            <p className="text-sm">
              {new Date(enquiry.enquiry_date).toLocaleDateString()}
            </p>
          </div>
          {enquiry.notes && (
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Notes
              </label>
              <p className="text-sm">{enquiry.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion form */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Details</CardTitle>
          <CardDescription>
            Set the deal type, value, and rental terms (if applicable).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Deal Type</label>
                <Select
                  value={dealType}
                  onValueChange={(v) => {
                    setDealType(v as "sale" | "rental");
                    calculateCommission();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Deal Value (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={dealValue}
                  onChange={(e) => {
                    setDealValue(e.target.value);
                    calculateCommission();
                  }}
                />
              </div>
            </div>

            {isRental && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Rental Start Date</label>
                  <Input
                    type="date"
                    value={rentalStartDate}
                    onChange={(e) => setRentalStartDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Rental End Date</label>
                  <Input
                    type="date"
                    value={rentalEndDate}
                    onChange={(e) => setRentalEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Separator />

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  Company Earning (Owner Brokerage)
                </span>
                <span className="text-sm font-medium">
                  {commissionPreview ? `₹${commissionPreview.company_earning.toLocaleString()}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  Broker Earning (Client Brokerage)
                </span>
                <span className="text-sm font-medium">
                  {commissionPreview ? `₹${commissionPreview.broker_earning.toLocaleString()}` : "—"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Commission is calculated automatically based on the property&apos;s
                commission rates when you submit the deal.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="button" onClick={() => router.push("/broker/enquiries")} variant="outline">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Converting&hellip;
              </>
            ) : (
              <>
                <PlusCircle className="size-4 mr-2" />
                Convert to Deal
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
