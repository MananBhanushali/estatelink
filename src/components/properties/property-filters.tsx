"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface PropertyFiltersProps {
  onFiltersChange?: (filters: URLSearchParams) => void;
  className?: string;
}

const TENANT_TYPES = ["student", "bachelor", "family"] as const;

export function PropertyFilters({
  onFiltersChange,
  className,
}: PropertyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const location = searchParams.get("location") ?? "";
  const minBudget = searchParams.get("min_budget") ?? "";
  const maxBudget = searchParams.get("max_budget") ?? "";
  const bedrooms = searchParams.get("bedrooms") ?? "";
  const tenantType = searchParams.get("tenant_type") ?? "";
  const status = searchParams.get("status") ?? "";

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
      onFiltersChange?.(params);
    },
    [router, searchParams, onFiltersChange]
  );

  const handleReset = useCallback(() => {
    router.push("/properties");
    onFiltersChange?.(new URLSearchParams());
  }, [router, onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    return [
      location,
      minBudget,
      maxBudget,
      bedrooms,
      tenantType,
      status,
    ].filter(Boolean).length;
  }, [location, minBudget, maxBudget, bedrooms, tenantType, status]);

  useEffect(() => {
    onFiltersChange?.(searchParams);
  }, [searchParams, onFiltersChange]);

  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end", className)}>
      <div className="flex flex-col gap-2 md:flex-1 md:flex-row md:items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Location search"
              value={location}
              onChange={(e) =>
                handleFilterChange("location", e.target.value)
              }
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-full md:w-24 gap-2 md:px-2">
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="Min"
              value={minBudget}
              onChange={(e) => handleFilterChange("min_budget", e.target.value)}
              className="text-xs px-2 py-2"
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxBudget}
              onChange={(e) => handleFilterChange("max_budget", e.target.value)}
              className="text-xs px-2 py-2"
            />
          </div>
          <p className="text-[0.65rem] text-muted-foreground">₹ budget</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 md:flex-1 md:flex-row md:items-end">
        <div className="flex items-center gap-2">
          <FilterLabel>Bedrooms</FilterLabel>
          <Select
            value={bedrooms || undefined}
            onValueChange={(v) => handleFilterChange("bedrooms", v ?? "")}
          >
            <SelectTrigger className="w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              {[1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} BHK
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <FilterLabel>Tenant type</FilterLabel>
          <Select
            value={tenantType || undefined}
            onValueChange={(v) => handleFilterChange("tenant_type", v ?? "")}
          >
            <SelectTrigger className="w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              {TENANT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <FilterLabel>Status</FilterLabel>
          <Select
            value={status || undefined}
            onValueChange={(v) => handleFilterChange("status", v ?? "")}
          >
            <SelectTrigger className="w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="ongoing_rental">Ongoing Rental</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-end gap-2">
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-1"
          >
            <X className="size-3" /> Clear filters
          </Button>
        )}
        <Button size="sm" className="w-full">
          <Filter className="size-3.5 mr-1.5" /> Apply
        </Button>
      </div>
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}
