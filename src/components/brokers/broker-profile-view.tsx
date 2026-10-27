"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Star,
  CheckCircle2,
  Handshake,
  TrendingUp,
  Wallet,
  MessageSquareQuote,
  Share2,
  ExternalLink,
  MapPin,
  Maximize2,
  BedDouble,
  Tag,
  Copy,
  Check,
  Award,
  CircleDot,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StarRating } from "@/components/shared/star-rating";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

export interface BrokerProfileData {
  broker_id: number;
  name: string;
  email: string;
  phone: string | null;
  join_date: string;
}

export interface BrokerStatsData {
  total_deals: number;
  total_volume: number;
  total_earnings: number;
  total_properties: number;
  average_rating: number;
  total_reviews: number;
}

export interface BrokerReviewData {
  review_id: number;
  rating: number;
  comments: string | null;
  review_date: string;
  client_name: string;
}

export interface BrokerPropertyData {
  property_id: number;
  owner_name: string;
  owner_contact?: string | null;
  location: string;
  square_feet: number | null;
  bedrooms: number | null;
  value: string | number;
  status: string;
  enquiry_count: number;
  is_rental: boolean;
  tenant_types?: string[];
}

export interface BrokerDealData {
  deal_id: number;
  deal_type: string;
  deal_value: string | number;
  deal_status: string;
  deal_date: string;
  broker_earning: string | number;
  company_earning: string | number;
  client_name: string;
  property_location: string;
  property_id: number;
}

interface BrokerProfileViewProps {
  broker: BrokerProfileData;
  stats: BrokerStatsData;
  reviews: BrokerReviewData[];
  properties: BrokerPropertyData[];
  deals: BrokerDealData[];
}

export function formatIndianCurrency(
  val: number,
  options?: { compact?: boolean; isRental?: boolean }
): string {
  if (isNaN(val)) return "₹0";
  if (options?.isRental) {
    return `₹${val.toLocaleString("en-IN")}/mo`;
  }
  if (options?.compact) {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2).replace(/\.00$/, "")} L`;
    }
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

export function BrokerProfileView({
  broker,
  stats,
  reviews,
  properties,
  deals,
}: BrokerProfileViewProps) {
  const [copied, setCopied] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState<string>("all");

  const initials = broker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Profile link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    if (propertyFilter === "all") return true;
    return p.status === propertyFilter;
  });

  // Calculate review rating distribution
  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const rounded = Math.round(r.rating);
    if (rounded >= 1 && rounded <= 5) {
      ratingCounts[rounded] = (ratingCounts[rounded] || 0) + 1;
    }
  });

  const memberSince = new Date(broker.join_date).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 pb-12 animate-fade-in">
      {/* Top Nav & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/brokers">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 px-3 rounded-lg hover:bg-muted font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Brokers</span>
            </Button>
          </Link>
          <span className="hidden sm:inline-block text-border">/</span>
          <span className="hidden sm:inline-block text-foreground font-medium truncate max-w-[200px]">
            {broker.name}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 h-9 text-xs rounded-lg flex-1 sm:flex-none cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Share2 className="size-3.5" />
                <span>Share Profile</span>
              </>
            )}
          </Button>

          {broker.email && (
            <a
              href={`mailto:${broker.email}`}
              className={
                buttonVariants({ variant: "outline", size: "sm" }) +
                " gap-1.5 h-9 text-xs rounded-lg flex-1 sm:flex-none cursor-pointer"
              }
            >
              <Mail className="size-3.5" />
              <span>Email</span>
            </a>
          )}

          {broker.phone && (
            <a
              href={`tel:${broker.phone}`}
              className={
                buttonVariants({ variant: "default", size: "sm" }) +
                " gap-1.5 h-9 text-xs rounded-lg flex-1 sm:flex-none brand-gradient-bg text-white hover:opacity-95 shadow-sm cursor-pointer"
              }
            >
              <Phone className="size-3.5" />
              <span>Call Broker</span>
            </a>
          )}
        </div>
      </div>

      {/* Hero Profile Banner */}
      <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-card via-card to-blue-500/5 shadow-sm rounded-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 brand-gradient-subtle rounded-full blur-3xl pointer-events-none opacity-60" />

        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar with Initials & Active Status */}
            <div className="relative group shrink-0">
              <div className="size-20 md:size-24 rounded-2xl brand-gradient-bg flex items-center justify-center text-white font-bold text-2xl md:text-3xl shadow-md ring-4 ring-background">
                {initials}
              </div>
              <span
                className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center text-white shadow-xs"
                title="Active Broker"
              >
                <Check className="size-3 stroke-[3]" />
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {broker.name}
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium gap-1 text-xs py-0.5">
                  <ShieldCheck className="size-3.5" /> Verified Broker
                </Badge>
                <Badge variant="outline" className="text-xs text-muted-foreground py-0.5">
                  ID #{String(broker.broker_id).padStart(4, "0")}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Award className="size-4 text-blue-500 shrink-0" />
                <span>EstateLink Licensed Real Estate Specialist</span>
              </p>

              {/* Contact & Meta Row */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1 text-xs text-muted-foreground">
                <a
                  href={`mailto:${broker.email}`}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Mail className="size-3.5 text-blue-500" />
                  <span>{broker.email}</span>
                </a>

                {broker.phone && (
                  <a
                    href={`tel:${broker.phone}`}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Phone className="size-3.5 text-emerald-500" />
                    <span>{broker.phone}</span>
                  </a>
                )}

                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>Partner since {memberSince}</span>
                </div>
              </div>
            </div>

            {/* Quick Hero Rating Pill */}
            <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border/60 shrink-0 gap-2">
              <div className="bg-muted/60 dark:bg-muted/40 border border-border rounded-xl px-4 py-2.5 flex items-center md:items-end gap-3 md:flex-col md:text-right">
                <div className="flex items-center gap-1.5">
                  <Star className="size-5 text-amber-500 fill-amber-500" />
                  <span className="text-lg font-bold">
                    {stats.average_rating > 0
                      ? stats.average_rating.toFixed(1)
                      : "New"}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {stats.total_reviews}{" "}
                  {stats.total_reviews === 1 ? "review" : "client reviews"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Deals */}
        <Card className="rounded-xl border-border/80 hover:border-primary/40 hover:shadow-sm transition-all p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Total Deals
            </span>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Handshake className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold tracking-tight">
              {stats.total_deals}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Closed contracts
            </p>
          </div>
        </Card>

        {/* Total Volume */}
        <Card className="rounded-xl border-border/80 hover:border-primary/40 hover:shadow-sm transition-all p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Total Volume
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div>
            <div
              className="text-xl md:text-2xl font-bold tracking-tight truncate"
              title={`₹${stats.total_volume.toLocaleString("en-IN")}`}
            >
              {formatIndianCurrency(stats.total_volume, { compact: true })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Deal transacted
            </p>
          </div>
        </Card>

        {/* Broker Earnings */}
        <Card className="rounded-xl border-border/80 hover:border-primary/40 hover:shadow-sm transition-all p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Earnings
            </span>
            <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="size-4" />
            </div>
          </div>
          <div>
            <div
              className="text-xl md:text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 truncate"
              title={`₹${stats.total_earnings.toLocaleString("en-IN")}`}
            >
              {formatIndianCurrency(stats.total_earnings, { compact: true })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Net commission
            </p>
          </div>
        </Card>

        {/* Active Properties */}
        <Card className="rounded-xl border-border/80 hover:border-primary/40 hover:shadow-sm transition-all p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Properties
            </span>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Building2 className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold tracking-tight">
              {stats.total_properties}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Managed listings
            </p>
          </div>
        </Card>

        {/* Client Rating */}
        <Card className="rounded-xl border-border/80 hover:border-primary/40 hover:shadow-sm transition-all p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Avg Rating
            </span>
            <div className="size-8 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
              <Star className="size-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xl md:text-2xl font-bold tracking-tight">
              <span>
                {stats.average_rating > 0
                  ? stats.average_rating.toFixed(1)
                  : "—"}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                / 5
              </span>
            </div>
            <div className="mt-0.5">
              <StarRating rating={stats.average_rating} size="sm" />
            </div>
          </div>
        </Card>

        {/* Total Reviews */}
        <Card className="rounded-xl border-border/80 hover:border-primary/40 hover:shadow-sm transition-all p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Reviews
            </span>
            <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <MessageSquareQuote className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold tracking-tight">
              {stats.total_reviews}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Verified testimonials
            </p>
          </div>
        </Card>
      </div>

      {/* Main Tabs: Properties, Reviews, Deals, Details */}
      <Tabs defaultValue="properties" className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <TabsList className="h-10 p-1 bg-muted/70 rounded-xl gap-1">
            <TabsTrigger
              value="properties"
              className="rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium gap-2 data-active:bg-background data-active:shadow-xs cursor-pointer"
            >
              <Building2 className="size-4" />
              <span>Properties</span>
              <Badge
                variant="secondary"
                className="ml-1 text-[10px] px-1.5 py-0 h-4 rounded-full"
              >
                {properties.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="reviews"
              className="rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium gap-2 data-active:bg-background data-active:shadow-xs cursor-pointer"
            >
              <Star className="size-4" />
              <span>Reviews</span>
              <Badge
                variant="secondary"
                className="ml-1 text-[10px] px-1.5 py-0 h-4 rounded-full"
              >
                {reviews.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="deals"
              className="rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium gap-2 data-active:bg-background data-active:shadow-xs cursor-pointer"
            >
              <Handshake className="size-4" />
              <span>Deals Track Record</span>
              <Badge
                variant="secondary"
                className="ml-1 text-[10px] px-1.5 py-0 h-4 rounded-full"
              >
                {deals.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: PROPERTIES */}
        <TabsContent value="properties" className="space-y-4 focus-visible:outline-none">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold">
              Listed Properties
              <span className="text-xs font-normal text-muted-foreground ml-2">
                Showing {filteredProperties.length} of {properties.length}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs">
              <button
                onClick={() => setPropertyFilter("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  propertyFilter === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({properties.length})
              </button>
              <button
                onClick={() => setPropertyFilter("available")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  propertyFilter === "available"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Available ({properties.filter((p) => p.status === "available").length})
              </button>
              <button
                onClick={() => setPropertyFilter("sold")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  propertyFilter === "sold"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sold ({properties.filter((p) => p.status === "sold").length})
              </button>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="py-12">
                <EmptyState
                  title="No properties found"
                  description={
                    propertyFilter === "all"
                      ? "This broker does not have any active properties assigned yet."
                      : `No properties matching filter '${propertyFilter}'.`
                  }
                  icon={<Building2 className="size-8 text-muted-foreground" />}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties.map((p) => {
                const price = Number(p.value);
                const isRental = p.is_rental;
                const formattedPrice = formatIndianCurrency(price, {
                  compact: !isRental,
                  isRental,
                });

                return (
                  <Card
                    key={p.property_id}
                    className="overflow-hidden rounded-2xl border-border/70 hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col group"
                  >
                    {/* Header preview box */}
                    <div className="relative h-44 bg-gradient-to-br from-blue-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4 overflow-hidden">
                      <div className="absolute inset-0 bg-grid-white/[0.04] bg-[size:16px_16px]" />
                      <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:scale-110 group-hover:text-white transition-all duration-300">
                        <Building2 className="size-8" />
                      </div>

                      <div className="absolute top-3 left-3 z-10">
                        <StatusBadge status={p.status} />
                      </div>

                      <div className="absolute top-3 right-3 z-10">
                        <Badge
                          variant="secondary"
                          className="bg-background/80 backdrop-blur-xs text-[11px] font-semibold border border-border/40"
                        >
                          {isRental ? "Rental" : "For Sale"}
                        </Badge>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white drop-shadow-sm">
                        <span className="text-xl font-bold tracking-tight">
                          {formattedPrice}
                        </span>
                        {p.enquiry_count > 0 && (
                          <span className="text-xs bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/10">
                            {p.enquiry_count}{" "}
                            {p.enquiry_count === 1 ? "enquiry" : "enquiries"}
                          </span>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <Link
                          href={`/properties/${p.property_id}`}
                          className="font-semibold text-base hover:text-blue-500 hover:underline line-clamp-1 flex items-center gap-1.5"
                        >
                          <MapPin className="size-4 text-primary shrink-0" />
                          <span>{p.location}</span>
                        </Link>

                        <p className="text-xs text-muted-foreground">
                          Owner: <span className="font-medium text-foreground">{p.owner_name}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground border-t border-border/50">
                          {p.bedrooms !== null && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <BedDouble className="size-3.5 text-blue-500" />
                              {p.bedrooms} BHK
                            </span>
                          )}
                          {p.square_feet && (
                            <span className="flex items-center gap-1">
                              <Maximize2 className="size-3.5 text-muted-foreground" />
                              {p.square_feet.toLocaleString("en-IN")} sqft
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link href={`/properties/${p.property_id}`} className="w-full block">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1.5 rounded-lg text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                          >
                            <span>View Property Details</span>
                            <ExternalLink className="size-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: REVIEWS */}
        <TabsContent value="reviews" className="space-y-6 focus-visible:outline-none">
          {/* Reviews Summary Header Card */}
          <Card className="rounded-2xl border-border/80 bg-gradient-to-br from-card to-amber-500/5">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Score */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Client Satisfaction Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                      {stats.average_rating > 0
                        ? stats.average_rating.toFixed(1)
                        : "0.0"}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      / 5.0
                    </span>
                  </div>
                  <StarRating
                    rating={stats.average_rating}
                    size="lg"
                    showText={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    Based on {reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"} from verified clients
                  </p>
                </div>

                {/* Rating Distribution Bars */}
                <div className="md:col-span-2 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Rating Breakdown
                  </span>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingCounts[star] || 0;
                    const percent =
                      reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div
                        key={star}
                        className="flex items-center gap-3 text-xs"
                      >
                        <div className="flex items-center gap-1 w-12 font-medium">
                          <span>{star}</span>
                          <Star className="size-3 text-amber-500 fill-amber-500" />
                        </div>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-muted-foreground font-mono">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review List */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Client Feedback ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="py-12">
                  <EmptyState
                    title="No reviews yet"
                    description="Verified reviews will appear here after clients close deals with this broker."
                    icon={<Star className="size-8 text-muted-foreground" />}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reviews.map((r) => {
                  const clientInitials = r.client_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const reviewDate = new Date(r.review_date).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  );

                  return (
                    <Card
                      key={r.review_id}
                      className="rounded-2xl border-border/80 hover:border-primary/30 transition-all p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="size-11 rounded-full brand-gradient-bg text-white font-semibold flex items-center justify-center text-sm shrink-0 shadow-xs">
                            {clientInitials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">
                                {r.client_name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 text-muted-foreground font-normal border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              >
                                Verified Client
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Reviewed on {reviewDate}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <StarRating rating={r.rating} size="sm" showText />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40">
                        <p className="text-sm text-foreground/90 italic leading-relaxed">
                          &ldquo;{r.comments || "Great broker to work with. Recommended!"}&rdquo;
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: DEALS TRACK RECORD */}
        <TabsContent value="deals" className="space-y-4 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Transaction History ({deals.length})
            </h2>
          </div>

          {deals.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="py-12">
                <EmptyState
                  title="No deals closed yet"
                  description="Closed property sales and completed rental transactions will show up in this record."
                  icon={<Handshake className="size-8 text-muted-foreground" />}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[10%]">Deal ID</TableHead>
                      <TableHead className="w-[15%]">Type</TableHead>
                      <TableHead className="w-[30%]">Property</TableHead>
                      <TableHead className="w-[20%]">Client</TableHead>
                      <TableHead className="w-[15%] text-right">Value</TableHead>
                      <TableHead className="w-[10%] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((d) => {
                      const dealValue = Number(d.deal_value);
                      return (
                        <TableRow key={d.deal_id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-xs font-medium">
                            #{String(d.deal_id).padStart(4, "0")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                d.deal_type === "sale"
                                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium"
                                  : "border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium"
                              }
                            >
                              {d.deal_type === "sale" ? "Sale Deal" : "Rental Lease"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/properties/${d.property_id}`}
                              className="text-sm font-medium hover:text-blue-500 hover:underline flex items-center gap-1.5"
                            >
                              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[280px]">
                                {d.property_location}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            {d.client_name}
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold font-mono">
                            ₹{dealValue.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                d.deal_status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              }
                            >
                              {d.deal_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
