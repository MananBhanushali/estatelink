import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { EnquiryDialog } from "@/components/enquiries/enquiry-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Phone, MapPin, Home, Calendar, Wallet } from "lucide-react";
import { getAuthUser } from "@/lib/auth";

export interface PropertyDetailRow extends RowDataPacket {
  property_id: number;
  owner_name: string;
  owner_contact: string | null;
  location: string;
  square_feet: number | null;
  bedrooms: number | null;
  value: string;
  status: string;
  broker_id: number;
  broker_name: string | null;
  broker_email: string | null;
  broker_phone: string | null;
  commission_id: number;
  owner_brokerage_percent: string;
  client_brokerage_percent: string;
  lease_id: number | null;
  lease_type: string | null;
  security_deposit: string | null;
  duration_months: number | null;
  enquiry_count: number;
  tenant_types: string[];
}

export async function PropertyDetail({ id }: { id: number }) {
  const [rows] = await pool.query<PropertyDetailRow[]>(
    `SELECT p.property_id, p.owner_name, p.owner_contact, p.location,
            p.square_feet, p.bedrooms, p.value, p.status,
            p.broker_id, p.commission_id,
            b.name AS broker_name, b.email AS broker_email, b.phone AS broker_phone,
            c.owner_brokerage_percent, c.client_brokerage_percent,
            l.lease_id, l.lease_type, l.security_deposit, l.duration_months,
            (SELECT COUNT(*) FROM Enquiries e WHERE e.property_id = p.property_id) AS enquiry_count
     FROM Properties p
     JOIN Brokers b ON p.broker_id = b.broker_id
     JOIN Commission c ON p.commission_id = c.commission_id
     LEFT JOIN Leases l ON p.property_id = l.property_id
     WHERE p.property_id = ?`,
    [id]
  );

  if (rows.length === 0) {
    notFound();
  }

  const p = rows[0];

  const [ttRows] = await pool.query<RowDataPacket[]>(
    `SELECT tenant_type FROM Property_Tenant_Type WHERE property_id = ?`,
    [id]
  );
  const tenantTypes = ttRows.map((t) => t.tenant_type as string);

  // Check if the current client has already enquired for this property
  const authUser = await getAuthUser();
  let alreadyEnquired = false;
  if (authUser?.role === "client" && authUser.refId) {
    const [existingEnquiry] = await pool.query<RowDataPacket[]>(
      "SELECT enquiry_id FROM Enquiries WHERE client_id = ? AND property_id = ?",
      [authUser.refId, id]
    );
    alreadyEnquired = existingEnquiry.length > 0;
  }

  const price = Number(p.value);
  const isRental = p.lease_id !== null;

  return (
    <>
      <PageHeader
        title="Property Details"
        description={p.location}
        action={
          <EnquiryDialog
            propertyId={p.property_id}
            propertyLocation={p.location}
            alreadyEnquired={alreadyEnquired}
          />
        }
      />

      {/* Hero / image placeholder */}
      <Card className="border-border">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Home className="size-5" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {isRental ? "For Rent" : "For Sale"}
            </span>
            <StatusBadge status={p.status} className="ml-auto" />
          </div>
          <CardTitle className="text-2xl">{p.location}</CardTitle>
          <p className="text-muted-foreground">{p.owner_name}</p>
        </CardHeader>
        <div className="relative h-64 overflow-hidden bg-muted">
          <div className="h-full w-full bg-gradient-to-br from-blue-900/50 to-emerald-900/50 flex items-center justify-center">
            <svg
              className="w-24 h-24 text-muted-foreground/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
        </div>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="col-span-1 sm:col-span-2">
            <p className="text-3xl font-bold">
              {isRental ? `₹${price.toLocaleString()}` : `₹${(price / 1e7).toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr`}
              <span className="text-lg font-normal text-muted-foreground">
                {isRental ? "/month" : ""}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {isRental ? "Monthly rent" : "Sale price"}
            </p>
          </div>
          <div className="flex items-end justify-end gap-2">
            <Badge variant="outline" className="hidden sm:flex">
              {tenantTypes.map((t) => (
                <span key={t} className="mr-2 text-xs">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              ))}
            </Badge>
          </div>
        </CardContent>
        <Separator />
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <MapPin className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium">{p.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Home className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Size</p>
              <p className="text-sm font-medium">
                {p.square_feet ? `${p.square_feet} sqft` : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-5 text-muted-foreground">
              {Array.from({ length: (p.bedrooms ?? 0) }, () => "★").join("") || "—"}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bedrooms</p>
              <p className="text-sm font-medium">{p.bedrooms ?? "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium capitalize">
                {p.status.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broker card */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <User className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{p.broker_name}</p>
              <p className="text-xs text-muted-foreground">Listing broker</p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">
              {isRental ? `₹${price.toLocaleString()}/mo` : `₹${(price / 1e7).toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr`}
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="flex items-center gap-3">
            <Phone className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Contact</p>
              <p className="text-sm font-medium">{p.broker_phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-5 text-muted-foreground">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{p.broker_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wallet className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Company brokerage</p>
              <p className="text-sm font-medium">{p.owner_brokerage_percent}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wallet className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Broker brokerage</p>
              <p className="text-sm font-medium">{p.client_brokerage_percent}%</p>
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2">
            Lease terms
          </p>
          {p.lease_id ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="size-5 text-muted-foreground">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lease type</p>
                  <p className="text-sm font-medium capitalize">{p.lease_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-5 text-muted-foreground">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deposit</p>
                  <p className="text-sm font-medium">
                    {p.security_deposit ? `₹${Number(p.security_deposit).toLocaleString()}` : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-5 text-muted-foreground">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">
                    {p.duration_months ? `${p.duration_months} months` : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No lease terms — this property is listed for sale.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tenant types */}
      {tenantTypes.length > 0 && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">
              Eligible tenant types
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {tenantTypes.length} type{tenantTypes.length > 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {tenantTypes.map((t) => (
                <Badge key={t} variant="secondary">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export function PropertyDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Property Details"
        description="Loading…"
        action={<div className="h-9 w-36 animate-pulse rounded-md bg-muted" />}
      />
      <div className="flex flex-col gap-4">
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
        <Card className="border-border">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-8 w-1/3 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="h-4 w-1/3 animate-pulse rounded-md bg-muted" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
