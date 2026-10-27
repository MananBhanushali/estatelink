"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

export interface PropertyCardProps {
  property_id: number;
  owner_name: string;
  location: string;
  square_feet?: number | null;
  bedrooms?: number | null;
  value: string | number;
  status: string;
  broker_name?: string | null;
  tenant_types?: string[];
  enquiry_count?: number;
  is_rental?: boolean;
}

export function PropertyCard({
  property_id,
  owner_name,
  location,
  square_feet,
  bedrooms,
  value,
  status,
  broker_name,
  tenant_types = [],
  enquiry_count = 0,
  is_rental,
}: PropertyCardProps) {
  const price = Number(value);
  const isRental = is_rental !== undefined ? is_rental : price < 1000000;
  const priceLabel = isRental
    ? `₹${price.toLocaleString()}/mo`
    : `₹${(price / 1e7).toLocaleString(undefined, { maximumFractionDigits: 2 })}Cr`;

  return (
    <Card className="hover:shadow-md transition-shadow border-border overflow-hidden flex flex-col h-full">
      <div className="relative h-48 overflow-hidden bg-muted">
        <div className="h-full w-full bg-gradient-to-br from-blue-900/50 to-emerald-900/50 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-muted-foreground/40"
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
        <StatusBadge status={status} className="absolute top-3 left-3 z-10" />
        <span className="absolute top-3 right-3 z-10 rounded-full bg-background/85 px-2 py-0.5 text-[0.65rem] font-semibold backdrop-blur-xs text-foreground shadow-xs border border-border/50">
          {isRental ? "Rental" : "Sale"}
        </span>
      </div>
      <CardContent className="p-3 flex-1 flex flex-col">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Link
              href={`/properties/${property_id}`}
              className="text-lg font-semibold leading-tight hover:underline"
            >
              {location}
            </Link>
            <span className="text-sm font-medium">
              {priceLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {owner_name}
          </p>
          {broker_name && (
            <p className="text-xs text-muted-foreground truncate">
              Listed by {broker_name}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {square_feet && (
              <span className="flex items-center gap-1">
                {square_feet} sqft
              </span>
            )}
            {bedrooms !== null && bedrooms !== undefined && (
              <span className="flex items-center gap-1">
                {bedrooms} BHK
              </span>
            )}
            <span className="flex items-center gap-1">
              {enquiry_count} enquiries
            </span>
          </div>
          {tenant_types.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tenant_types.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="text-[0.65rem] px-1.5 py-0.5"
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 mt-auto">
        <Link
          href={`/properties/${property_id}`}
          className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <span>View details</span>
          <ChevronRight className="size-4 shrink-0" />
        </Link>
      </CardFooter>
    </Card>
  );
}
