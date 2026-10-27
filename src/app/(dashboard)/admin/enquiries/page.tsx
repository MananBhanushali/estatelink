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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
      toast.success("Enquiry moved to In Progress");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update enquiry status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

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
          setLoading(false);
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

  const filteredEnquiries = enquiries.filter((e) => {
    const matchesSearch =
      e.property_location.toLowerCase().includes(search.toLowerCase()) ||
      e.client_name.toLowerCase().includes(search.toLowerCase()) ||
      e.broker_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manage Enquiries" />
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
        <PageHeader title="Manage Enquiries" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage Enquiries"
        description="View all enquiries across brokers. Filter by status or search."
      />

      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by property, client, or broker…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["", "open", "in_progress", "closed", "rejected"].map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter(s)}
              className={`${
                statusFilter === s ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              {s
                ? STATUS_LABELS[s] || s
                : (
                  <>
                    <Clock className="size-4 mr-1" /> All
                  </>
                )}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">All Enquiries</CardTitle>
          <CardDescription>
            {filteredEnquiries.length} enquir{
              filteredEnquiries.length !== 1 ? "ies" : "y"
            } found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEnquiries.length === 0 ? (
            <EmptyState title="No enquiries found" />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[18%]">Client</TableHead>
                    <TableHead className="w-[20%]">Property</TableHead>
                    <TableHead className="w-[15%]">Broker</TableHead>
                    <TableHead className="w-[12%]">Date</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[15%]">Notes</TableHead>
                    <TableHead className="w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnquiries.map((e) => (
                    <TableRow key={e.enquiry_id}>
                      <TableCell className="text-sm font-medium">
                        {e.client_name}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/properties/${e.property_id}`}
                          className="text-sm hover:underline"
                        >
                          {e.property_location}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.broker_name}
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
                      <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                        {e.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {e.status === "open" && (
                            <button
                              type="button"
                              disabled={updatingId === e.enquiry_id}
                              onClick={() => handleMoveToInProgress(e.enquiry_id)}
                              className="px-2.5 py-1 text-xs border rounded hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center gap-1 disabled:opacity-50"
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
                              className="px-2.5 py-1 text-xs border rounded hover:bg-primary hover:text-primary-foreground transition-colors font-medium inline-flex items-center"
                              title="Convert to deal"
                            >
                              Convert
                            </Link>
                          )}
                        </div>
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
