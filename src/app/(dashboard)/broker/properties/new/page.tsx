"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/page-header";
import { Calendar, Home, Users } from "lucide-react";

interface FormData {
  owner_name: string;
  owner_contact: string;
  location: string;
  square_feet: string;
  bedrooms: string;
  value: string;
  owner_brokerage_percent: string;
  client_brokerage_percent: string;
  tenant_types: string[];
  is_rental: boolean;
  lease_type: string;
  security_deposit: string;
  duration_months: string;
}

const TENANT_TYPES = [
  { value: "student", label: "Student" },
  { value: "bachelor", label: "Bachelor" },
  { value: "family", label: "Family" },
];

export default function ListPropertyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    owner_name: "",
    owner_contact: "",
    location: "",
    square_feet: "",
    bedrooms: "",
    value: "",
    owner_brokerage_percent: "2.00",
    client_brokerage_percent: "2.00",
    tenant_types: [],
    is_rental: false,
    lease_type: "long-term",
    security_deposit: "",
    duration_months: "",
  });

  const updateField = (
    key: keyof FormData,
    value: string | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTenantType = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tenant_types: prev.tenant_types.includes(value)
        ? prev.tenant_types.filter((t) => t !== value)
        : [...prev.tenant_types, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        owner_name: formData.owner_name,
        owner_contact: formData.owner_contact || undefined,
        location: formData.location,
        square_feet: formData.square_feet
          ? Number(formData.square_feet)
          : undefined,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        value: Number(formData.value),
        owner_brokerage_percent: Number(formData.owner_brokerage_percent),
        client_brokerage_percent: Number(formData.client_brokerage_percent),
        tenant_types: formData.tenant_types,
        ...(formData.is_rental && {
          lease: {
            lease_type: formData.lease_type || undefined,
            security_deposit: formData.security_deposit
              ? Number(formData.security_deposit)
              : undefined,
            duration_months: formData.duration_months
              ? Number(formData.duration_months)
              : undefined,
          },
        }),
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to list property");
      }

      await res.json();
      toast.success("Property listed successfully!");
      router.push(`/broker/properties`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to list property"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isRental = formData.is_rental;
  const canProceed =
    formData.owner_name &&
    formData.location &&
    formData.value &&
    formData.owner_brokerage_percent &&
    formData.client_brokerage_percent &&
    (isRental
      ? formData.tenant_types.length > 0 &&
        formData.lease_type &&
        formData.security_deposit &&
        formData.duration_months
      : formData.tenant_types.length > 0);

  const steps = [
    { id: 1, title: "Property Details", icon: Home },
    { id: 2, title: "Commission & Tenants", icon: Users },
    ...(isRental ? [{ id: 3, title: "Lease Terms", icon: Calendar }] : []),
  ];

  const currentStep = steps.find((s) => s.id === activeStep) || steps[0];

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <PageHeader
        title="List New Property"
        description="Add a new property listing with commission and lease details."
      />

      {/* Progress steps */}
      <div className="flex items-center gap-4 mb-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-2"
          >
            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              activeStep >= step.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}>
              {activeStep >= step.id ? (
                <step.icon className="size-3.5" />
              ) : (
                step.id
              )}
            </div>
            {step.id < steps.length && (
              <div className="h-px w-4 bg-muted" />
            )}
            <span className={`text-sm font-medium ${
              activeStep === step.id
                ? "text-primary"
                : "text-muted-foreground"
            }`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentStep.title}</CardTitle>
          <CardDescription>
            Step {activeStep} of {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Property Details */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Owner Name</label>
                  <Input
                    placeholder="e.g. Harish Mehta"
                    value={formData.owner_name}
                    onChange={(e) => updateField("owner_name", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Owner Contact</label>
                  <Input
                    type="tel"
                    placeholder="+91 98111 00000"
                    value={formData.owner_contact}
                    onChange={(e) => updateField("owner_contact", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g. Bandra West, Mumbai - 400050"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Square Feet</label>
                  <Input
                    type="number"
                    placeholder="1450"
                    value={formData.square_feet}
                    onChange={(e) => updateField("square_feet", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Bedrooms</label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={formData.bedrooms}
                    onChange={(e) => updateField("bedrooms", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Value (₹)</label>
                  <Input
                    type="number"
                    placeholder="38500000"
                    value={formData.value}
                    onChange={(e) => updateField("value", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_rental}
                  onCheckedChange={(checked) =>
                    updateField("is_rental", checked)
                  }
                />
                <label className="text-sm font-medium cursor-pointer">
                  This is a rental property (monthly rent)
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Commission & Tenants */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Owner Brokerage %</label>
                  <Input
                    type="number"
                    placeholder="2.00"
                    value={formData.owner_brokerage_percent}
                    onChange={(e) =>
                      updateField("owner_brokerage_percent", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    % company collects from the owner
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Client Brokerage %</label>
                  <Input
                    type="number"
                    placeholder="2.00"
                    value={formData.client_brokerage_percent}
                    onChange={(e) =>
                      updateField("client_brokerage_percent", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    % broker collects from the client
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Eligible Tenant Types</label>
                <div className="flex flex-wrap gap-2">
                  {TENANT_TYPES.map((t) => (
                    <label
                      key={t.value}
                      className={`cursor-pointer flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        formData.tenant_types.includes(t.value)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-input hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={formData.tenant_types.includes(t.value)}
                        onCheckedChange={() => toggleTenantType(t.value)}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Lease Terms (rental only) */}
          {activeStep === 3 && isRental && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Lease Type</label>
                  <Select
                    value={formData.lease_type}
                    onValueChange={(v) => updateField("lease_type", v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short-term">Short-term</SelectItem>
                      <SelectItem value="long-term">Long-term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Security Deposit (₹)</label>
                  <Input
                    type="number"
                    placeholder="130000"
                    value={formData.security_deposit}
                    onChange={(e) => updateField("security_deposit", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Duration (Months)</label>
                  <Input
                    type="number"
                    placeholder="11"
                    value={formData.duration_months}
                    onChange={(e) => updateField("duration_months", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
          {activeStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
            >
              Back
            </Button>
          )}
          {activeStep < steps.length ? (
            <Button
              type="button"
              onClick={() => setActiveStep((p) => p + 1)}
              disabled={!canProceed}
            >
              Next
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => router.push("/broker/properties")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !canProceed}
                className="bg-primary text-primary-foreground hover:bg-primary/80"
              >
                {submitting ? "Listing…" : "List Property"}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      {!canProceed && (
        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Please complete all required fields to proceed.
        </div>
      )}
    </div>
  );
}
