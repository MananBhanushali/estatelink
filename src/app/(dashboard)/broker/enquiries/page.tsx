"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
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

  const filteredEnquiries = activeTab === "all"
    ? enquiries
    : enquiries.filter((e) => e.status === activeTab);

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

      <div className="rounded-xl border border-border p-4">
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="min-w-[100px] justify-between">
                <div className="flex items-center gap-2">
                  <tab.icon className="size-4" />
                  {tab.label}
                </div>
                <Badge variant="secondary" className="h-5 w-5 px-1.5 text-[0.6rem]">
                  {counts[tab.value]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-6">
        <TabsContent value="all" className="space-y-3">
          {filteredEnquiries.length === 0 ? (
            <EmptyState
              title={`No ${activeTab} enquiries`}
              description={
                activeTab === "all"
                  ? "You don't have any enquiries yet."
                  : `You don't have any ${STATUS_LABELS[activeTab]?.toLowerCase() || activeTab} enquiries.`
              }
              icon={<ClipboardList className="size-6" />}
            />
          ) : (
            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Client</TableHead>
                    <TableHead className="w-[25%]">Property</TableHead>
                    <TableHead className="w-[15%]">Value</TableHead>
                    <TableHead className="w-[15%]">Date</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
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
                      <TableCell className="text-sm">
                        ₹{Number(e.property_value).toLocaleString()}
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
                      <TableCell>
                        <div className="flex gap-2">
                          {e.status === "open" || e.status === "in_progress" ? (
                            <Link
                              href={`/broker/enquiries/${e.enquiry_id}/convert`}
                              className="px-3 py-1.5 text-xs border rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              Convert
                            </Link>
                          ) : null}
                          <Link
                            href={`/broker/enquiries/${e.enquiry_id}`}
                            className="px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </div>

      {TABS.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="space-y-3 hidden"
        >
          {filteredEnquiries.length === 0 ? (
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
                    <TableHead className="w-[25%]">Client</TableHead>
                    <TableHead className="w-[25%]">Property</TableHead>
                    <TableHead className="w-[15%]">Value</TableHead>
                    <TableHead className="w-[15%]">Date</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
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
                      <TableCell className="text-sm">
                        ₹{Number(e.property_value).toLocaleString()}
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
                      <TableCell>
                        <div className="flex gap-2">
                          {e.status === "open" || e.status === "in_progress" ? (
                            <Link
                              href={`/broker/enquiries/${e.enquiry_id}/convert`}
                              className="px-3 py-1.5 text-xs border rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              Convert
                            </Link>
                          ) : null}
                          <Link
                            href={`/broker/enquiries/${e.enquiry_id}`}
                            className="px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      ))}
    </div>
  );
}
