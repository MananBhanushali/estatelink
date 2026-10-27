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
import { useCallback, useEffect, useMemo, useState } from "react";
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

  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [minBudget, setMinBudget] = useState(searchParams.get("min_budget") ?? "");
  const [maxBudget, setMaxBudget] = useState(searchParams.get("max_budget") ?? "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") ?? "");
  const [tenantType, setTenantType] = useState(searchParams.get("tenant_type") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") || "available");
  const [type, setType] = useState(searchParams.get("type") ?? "");

  // Sync state with search params on route navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocation(searchParams.get("location") ?? "");
    setMinBudget(searchParams.get("min_budget") ?? "");
    setMaxBudget(searchParams.get("max_budget") ?? "");
    setBedrooms(searchParams.get("bedrooms") ?? "");
    setTenantType(searchParams.get("tenant_type") ?? "");
    setStatus(searchParams.get("status") || "available");
    setType(searchParams.get("type") ?? "");
    onFiltersChange?.(searchParams);
  }, [searchParams, onFiltersChange]);

  const applyFilters = useCallback(
    (overrides: Record<string, string> = {}) => {
      const values = {
        location,
        min_budget: minBudget,
        max_budget: maxBudget,
        type,
        bedrooms,
        tenant_type: tenantType,
        status,
        ...overrides,
      };

      const params = new URLSearchParams();
      if (values.location.trim()) params.set("location", values.location.trim());
      if (values.min_budget.trim()) params.set("min_budget", values.min_budget.trim());
      if (values.max_budget.trim()) params.set("max_budget", values.max_budget.trim());
      if (values.type) params.set("type", values.type);
      if (values.bedrooms) params.set("bedrooms", values.bedrooms);
      if (values.tenant_type) params.set("tenant_type", values.tenant_type);
      if (values.status && values.status !== "available") {
        params.set("status", values.status);
      }

      const qs = params.toString();
      router.push(qs ? `/properties?${qs}` : "/properties");
      onFiltersChange?.(params);
    },
    [location, minBudget, maxBudget, type, bedrooms, tenantType, status, router, onFiltersChange]
  );

  const handleSelectChange = useCallback(
    (key: string, value: string) => {
      if (key === "type") setType(value);
      if (key === "bedrooms") setBedrooms(value);
      if (key === "tenant_type") setTenantType(value);
      if (key === "status") setStatus(value);
      applyFilters({ [key]: value });
    },
    [applyFilters]
  );

  const handleReset = useCallback(() => {
    setLocation("");
    setMinBudget("");
    setMaxBudget("");
    setType("");
    setBedrooms("");
    setTenantType("");
    setStatus("available");
    router.push("/properties");
    onFiltersChange?.(new URLSearchParams());
  }, [router, onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    const statusParam = searchParams.get("status");
    const hasStatusFilter = statusParam && statusParam !== "available";
    return [
      searchParams.get("location"),
      searchParams.get("min_budget"),
      searchParams.get("max_budget"),
      searchParams.get("type"),
      searchParams.get("bedrooms"),
      searchParams.get("tenant_type"),
      hasStatusFilter ? statusParam : null,
    ].filter(Boolean).length;
  }, [searchParams]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters();
      }}
      className={cn("flex flex-col gap-3", className)}
    >
      {/* Location Search Bar Above */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Location search"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="pl-9 h-10 w-full"
        />
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Budget */}
          <div className="flex items-center gap-2">
            <FilterLabel>Budget (₹)</FilterLabel>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                placeholder="Min"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-24 sm:w-28 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-muted-foreground text-xs select-none">–</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-24 sm:w-28 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Type (Rental / Sale) */}
          <div className="flex items-center gap-2">
            <FilterLabel>Type</FilterLabel>
            <Select
              value={type || undefined}
              onValueChange={(v) => handleSelectChange("type", v ?? "")}
            >
              <SelectTrigger className="w-24 text-xs">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="rental">Rental</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bedrooms */}
          <div className="flex items-center gap-2">
            <FilterLabel>Bedrooms</FilterLabel>
            <Select
              value={bedrooms || undefined}
              onValueChange={(v) => handleSelectChange("bedrooms", v ?? "")}
            >
              <SelectTrigger className="w-24 text-xs">
                <SelectValue placeholder="Any" />
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

          {/* Tenant Type */}
          <div className="flex items-center gap-2">
            <FilterLabel>Tenant type</FilterLabel>
            <Select
              value={tenantType || undefined}
              onValueChange={(v) => handleSelectChange("tenant_type", v ?? "")}
            >
              <SelectTrigger className="w-28 text-xs">
                <SelectValue placeholder="Any" />
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

          {/* Status */}
          <div className="flex items-center gap-2">
            <FilterLabel>Status</FilterLabel>
            <Select
              value={status}
              onValueChange={(v) => handleSelectChange("status", v ?? "available")}
            >
              <SelectTrigger className="w-32 text-xs">
                <SelectValue placeholder="Available" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="ongoing_rental">Ongoing Rental</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Buttons (Clear & Apply) */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-1 shrink-0"
            >
              <X className="size-3" /> Clear filters
            </Button>
          )}
          <Button type="submit" size="sm" className="shrink-0">
            <Filter className="size-3.5 mr-1.5" /> Apply
          </Button>
        </div>
      </div>
    </form>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
      {children}
    </span>
  );
}
