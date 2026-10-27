"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  ExternalLink,
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
  owner_brokerage_percent?: number | string;
  client_brokerage_percent?: number | string;
  is_rental?: boolean | number;
  lease_duration_months?: number | null;
}

export default function AdminConvertEnquiryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const enquiryId = Number(id);

  const [enquiry, setEnquiry] = useState<EnquiryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [dealType, setDealType] = useState<"sale" | "rental">("sale");
  const [dealValue, setDealValue] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState("");
  const [rentalEndDate, setRentalEndDate] = useState("");

  const commissionPreview = useMemo(() => {
    if (!enquiry || !dealValue) return null;
    const value = Number(dealValue);
    if (!value || value <= 0) return null;

    const ownerPct = Number(enquiry.owner_brokerage_percent ?? 0);
    const clientPct = Number(enquiry.client_brokerage_percent ?? 0);

    return {
      company_earning: Math.round(((value * ownerPct) / 100) * 100) / 100,
      broker_earning: Math.round(((value * clientPct) / 100) * 100) / 100,
      owner_pct: ownerPct,
      client_pct: clientPct,
    };
  }, [enquiry, dealValue]);

  useEffect(() => {
    if (!enquiryId || isNaN(enquiryId)) return;
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
          const enq: EnquiryRow | null = data.enquiry ?? null;
          setEnquiry(enq);
          setDealValue(enq?.property_value || "");

          const isRentalProperty = Boolean(
            enq?.is_rental === 1 ||
            enq?.is_rental === true ||
            enq?.property_status === "ongoing_rental"
          );

          if (isRentalProperty) {
            setDealType("rental");
            const today = new Date();
            const startDateStr = today.toISOString().split("T")[0];
            setRentalStartDate(startDateStr);

            const durationMonths = Number(enq?.lease_duration_months) || 12;
            const endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + durationMonths);
            setRentalEndDate(endDate.toISOString().split("T")[0]);
          } else {
            setDealType("sale");
          }

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
  }, [enquiryId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!enquiryId || isNaN(enquiryId)) return;

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
        `Enquiry converted to deal successfully! Commission: Rs.${data.company_earning} (company) / Rs.${data.broker_earning} (broker)`
      );
      router.push("/admin/enquiries");
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
          <Link href="/admin/enquiries">
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
              Broker
            </label>
            <p className="text-sm">{enquiry.broker_name}</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Property
            </label>
            <Link
              href={`/properties/${enquiry.property_id}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium hover:underline inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <span>{enquiry.property_location}</span>
              <ExternalLink className="size-3 opacity-70" />
            </Link>
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
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  {isRental ? "Deal Value (Monthly Rent Rs.)" : "Deal Value (Rs.)"}
                </label>
                <Input
                  type="number"
                  placeholder={isRental ? "25000" : "0"}
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
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
                  Company Earning (Owner Brokerage{enquiry.owner_brokerage_percent ? ` · ${enquiry.owner_brokerage_percent}%` : ""})
                </span>
                <span className="text-sm font-medium">
                  {commissionPreview ? `Rs.${commissionPreview.company_earning.toLocaleString("en-IN")}` : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  Broker Earning (Client Brokerage{enquiry.client_brokerage_percent ? ` · ${enquiry.client_brokerage_percent}%` : ""})
                </span>
                <span className="text-sm font-medium">
                  {commissionPreview ? `Rs.${commissionPreview.broker_earning.toLocaleString("en-IN")}` : "---"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Commission is calculated automatically based on the property&apos;s
                commission rates when you submit the deal.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            type="button"
            onClick={() => router.push("/admin/enquiries")}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Converting...
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
