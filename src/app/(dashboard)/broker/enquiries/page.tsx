"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Building2,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

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
  property_sqft?: number | null;
  property_bedrooms?: number | null;
  property_owner_name?: string | null;
  broker_name: string;
  is_rental?: boolean | number;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  in_progress: "default",
  closed: "default",
  rejected: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Closed",
  rejected: "Rejected",
};

interface TabItem {
  value: string;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { value: "all", label: "All", icon: ClipboardList },
  { value: "open", label: "Open", icon: Clock },
  { value: "in_progress", label: "In Progress", icon: Clock },
  { value: "closed", label: "Closed", icon: CheckCircle },
  { value: "rejected", label: "Rejected", icon: XCircle },
];

export default function BrokerEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadEnquiries() {
      try {
        const res = await fetch("/api/enquiries", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load enquiries");
        const data = await res.json();
        if (!cancelled) {
          setEnquiries(data.enquiries ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load enquiries");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadEnquiries();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMoveToInProgress = async (enquiryId: number) => {
    setUpdatingId(enquiryId);
    try {
      const res = await fetch(`/api/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update enquiry status");
      }

      setEnquiries((prev) =>
        prev.map((e) =>
          e.enquiry_id === enquiryId ? { ...e, status: "in_progress" } : e
        )
      );
      if (selectedEnquiry && selectedEnquiry.enquiry_id === enquiryId) {
        setSelectedEnquiry((prev) =>
          prev ? { ...prev, status: "in_progress" } : null
        );
      }
      toast.success("Enquiry moved to In Progress");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update enquiry status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Enquiries" />
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
        <PageHeader title="My Enquiries" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const counts = TABS.reduce<Record<string, number>>(
    (acc, tab) => {
      acc[tab.value] =
        tab.value === "all"
          ? enquiries.length
          : enquiries.filter((e) => e.status === tab.value).length;
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Enquiries"
        description="Manage your enquiries pipeline by status."
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="rounded-xl border border-border p-4 overflow-x-auto">
          <TabsList className="h-9 p-1 gap-1 w-fit">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="min-w-[130px] justify-between gap-3 px-3 shrink-0"
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="size-4" />
                  <span>{tab.label}</span>
                </div>
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[0.65rem] font-semibold">
                  {counts[tab.value]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-6">
          {TABS.map((tab) => {
            const tabEnquiries =
              tab.value === "all"
                ? enquiries
                : enquiries.filter((e) => e.status === tab.value);

            return (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="space-y-3"
              >
                {tabEnquiries.length === 0 ? (
                  <EmptyState
                    title={`No ${tab.label} enquiries`}
                    description={`You don't have any ${tab.label.toLowerCase()} enquiries.`}
                    icon={<ClipboardList className="size-6" />}
                  />
                ) : (
                  <div className="rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[20%]">Client</TableHead>
                          <TableHead className="w-[25%]">Property</TableHead>
                          <TableHead className="w-[15%]">Value</TableHead>
                          <TableHead className="w-[12%]">Date</TableHead>
                          <TableHead className="w-[10%]">Status</TableHead>
                          <TableHead className="w-[18%] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tabEnquiries.map((e) => (
                          <TableRow key={e.enquiry_id}>
                            <TableCell className="text-sm font-medium">
                              <div>{e.client_name}</div>
                              <div className="text-xs text-muted-foreground">{e.client_email}</div>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/properties/${e.property_id}`}
                                className="text-sm hover:underline"
                              >
                                {e.property_location}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm">
                              ₹{Number(e.property_value).toLocaleString()}
                              {Boolean(e.is_rental) ? "/month" : ""}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(e.enquiry_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  STATUS_VARIANT[e.status] ?? "secondary"
                                }
                              >
                                {STATUS_LABELS[e.status] ?? e.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {e.status === "open" && (
                                  <button
                                    type="button"
                                    disabled={updatingId === e.enquiry_id}
                                    onClick={() => handleMoveToInProgress(e.enquiry_id)}
                                    className="px-3 py-1.5 text-xs border rounded hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                                    title="Move to In Progress"
                                  >
                                    {updatingId === e.enquiry_id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : null}
                                    Move to In Progress
                                  </button>
                                )}
                                {e.status === "in_progress" && (
                                  <Link
                                    href={`/broker/enquiries/${e.enquiry_id}/convert`}
                                    className="px-3 py-1.5 text-xs border rounded hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
                                  >
                                    Convert
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedEnquiry(e)}
                                  className="px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
                                >
                                  View
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </div>
      </Tabs>

      {/* Enquiry Details Dialog */}
      <Dialog
        open={Boolean(selectedEnquiry)}
        onOpenChange={(open) => {
          if (!open) setSelectedEnquiry(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enquiry Details</DialogTitle>
            <DialogDescription>
              {selectedEnquiry ? (
                <>
                  Client enquiry for{" "}
                  <Link
                    href={`/properties/${selectedEnquiry.property_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
                  >
                    <span>{selectedEnquiry.property_location}</span>
                    <ExternalLink className="size-3 opacity-70" />
                  </Link>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {selectedEnquiry && (
            <div className="space-y-4 py-2">
              {/* Linked Property Card */}
              <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2.5 transition-colors hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Building2 className="size-3.5 text-primary" />
                    <span>Linked Property</span>
                  </div>
                  <StatusBadge
                    status={selectedEnquiry.property_status}
                    className="text-[0.65rem] px-2 py-0.5"
                  />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <Link
                      href={`/properties/${selectedEnquiry.property_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-sm text-foreground hover:text-primary transition-colors hover:underline inline-flex items-center gap-1.5 group max-w-full"
                    >
                      <span className="truncate">{selectedEnquiry.property_location}</span>
                      <ExternalLink className="size-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        ₹{Number(selectedEnquiry.property_value).toLocaleString()}
                        {Boolean(selectedEnquiry.is_rental) ? "/month" : ""}
                      </span>
                      {selectedEnquiry.property_bedrooms != null && (
                        <>
                          <span>•</span>
                          <span>{selectedEnquiry.property_bedrooms} BHK</span>
                        </>
                      )}
                      {selectedEnquiry.property_sqft != null && (
                        <>
                          <span>•</span>
                          <span>{selectedEnquiry.property_sqft} sqft</span>
                        </>
                      )}
                      {selectedEnquiry.property_owner_name && (
                        <>
                          <span>•</span>
                          <span className="truncate">Owner: {selectedEnquiry.property_owner_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/properties/${selectedEnquiry.property_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 px-2.5 text-xs shrink-0 gap-1.5 hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    <span>View Property</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>

              {/* Client & Enquiry Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">Client</span>
                  <span className="font-medium">{selectedEnquiry.client_name}</span>
                  <span className="text-xs text-muted-foreground block">{selectedEnquiry.client_email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Date</span>
                  <span>{new Date(selectedEnquiry.enquiry_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">
                    {Boolean(selectedEnquiry.is_rental) ? "Monthly Rent" : "Property Value"}
                  </span>
                  <span className="font-semibold">
                    ₹{Number(selectedEnquiry.property_value).toLocaleString()}
                    {Boolean(selectedEnquiry.is_rental) ? "/month" : ""}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Status</span>
                  <Badge variant={STATUS_VARIANT[selectedEnquiry.status] ?? "secondary"}>
                    {STATUS_LABELS[selectedEnquiry.status] ?? selectedEnquiry.status}
                  </Badge>
                </div>
              </div>

              {selectedEnquiry.notes && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Notes:</span>
                  <p className="whitespace-pre-wrap">{selectedEnquiry.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-2 sm:justify-end">
            {selectedEnquiry?.status === "open" && (
              <Button
                variant="outline"
                size="sm"
                disabled={updatingId === selectedEnquiry.enquiry_id}
                onClick={() => handleMoveToInProgress(selectedEnquiry.enquiry_id)}
              >
                {updatingId === selectedEnquiry.enquiry_id ? (
                  <Loader2 className="size-3 animate-spin mr-1.5" />
                ) : null}
                Move to In Progress
              </Button>
            )}
            {selectedEnquiry?.status === "in_progress" && (
              <Link
                href={`/broker/enquiries/${selectedEnquiry.enquiry_id}/convert`}
                className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors inline-flex items-center"
              >
                Convert to Deal
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEnquiry(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
