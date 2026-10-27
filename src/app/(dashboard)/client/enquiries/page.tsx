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
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

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
  is_rental?: boolean | number;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline" | "ghost"> = {
  open: "outline",
  in_progress: "default",
  closed: "default",
  rejected: "destructive",
};

export default function ClientEnquiriesPage() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchEnquiries() {
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
    fetchEnquiries();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="My Enquiries"
          description="Track the status of properties you've enquired about."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
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
        <PageHeader
          title="My Enquiries"
          description="Track the status of properties you've enquired about."
        />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Enquiries"
        description={
          <>
            Track the status of properties you&rsquo;ve enquired about.{" "}
            {user?.role !== "client" && (
              <span className="text-xs text-muted-foreground ml-2">
                (Switch to client role to see your enquiries)
              </span>
            )}
          </>
        }
      />
      {enquiries.length === 0 ? (
        <EmptyState
          title="No enquiries yet"
          description={
            <>
              You haven&rsquo;t submitted any property enquiries yet. Browse
              listings and submit an enquiry from a property detail page.
            </>
          }
          icon={<ClipboardList className="size-6" />}
          action={
            <Link href="/properties">
              <Button>Browse Properties</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Property</TableHead>
                <TableHead className="w-[20%]">Broker</TableHead>
                <TableHead className="w-[20%]">Date</TableHead>
                <TableHead className="w-[15%]">Status</TableHead>
                <TableHead className="w-[25%]">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((e) => (
                <TableRow key={e.enquiry_id}>
                  <TableCell>
                    <Link href={`/properties/${e.property_id}`} className="font-medium hover:underline">
                      {e.property_location}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      ₹{Number(e.property_value).toLocaleString()}
                      {Boolean(e.is_rental) ? "/month" : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{e.broker_name}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{new Date(e.enquiry_date).toLocaleDateString()}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[e.status] ?? "secondary"}>
                      {e.status.charAt(0).toUpperCase() + e.status.slice(1).replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {e.notes || "—"}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
