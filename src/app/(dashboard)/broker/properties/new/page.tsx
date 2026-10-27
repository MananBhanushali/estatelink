"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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

const INITIAL_FORM_DATA: FormData = {
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
};

const TENANT_TYPES = [
  { value: "student", label: "Student" },
  { value: "bachelor", label: "Bachelor" },
  { value: "family", label: "Family" },
];

export default function ListPropertyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA });

  const resetForm = () => {
    setActiveStep(1);
    setFormData({ ...INITIAL_FORM_DATA, tenant_types: [] });
  };

  // Reset to Step 1 with empty fields whenever navigating to this page
  useEffect(() => {
    resetForm();
  }, [pathname]);

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

  const isRental = formData.is_rental;

  const steps = [
    { id: 1, title: "Property Details", icon: Home },
    { id: 2, title: "Commission & Tenants", icon: Users },
    ...(isRental ? [{ id: 3, title: "Lease Terms", icon: Calendar }] : []),
  ];

  // If user disables rental on step 1 while previously at step 3, keep step within bounds
  useEffect(() => {
    if (activeStep > steps.length) {
      setActiveStep(steps.length);
    }
  }, [activeStep, steps.length]);

  const isStep1Valid = Boolean(
    formData.owner_name.trim() &&
    formData.location.trim() &&
    formData.value &&
    Number(formData.value) > 0
  );

  const isStep2Valid = Boolean(
    formData.owner_brokerage_percent.trim() !== "" &&
    !isNaN(Number(formData.owner_brokerage_percent)) &&
    Number(formData.owner_brokerage_percent) >= 0 &&
    formData.client_brokerage_percent.trim() !== "" &&
    !isNaN(Number(formData.client_brokerage_percent)) &&
    Number(formData.client_brokerage_percent) >= 0 &&
    (isRental ? formData.tenant_types.length > 0 : true)
  );

  const isStep3Valid = Boolean(
    !isRental ||
    (formData.lease_type &&
      formData.security_deposit.trim() !== "" &&
      !isNaN(Number(formData.security_deposit)) &&
      Number(formData.security_deposit) >= 0 &&
      formData.duration_months.trim() !== "" &&
      !isNaN(Number(formData.duration_months)) &&
      Number(formData.duration_months) > 0)
  );

  const getMissingFields = (step: number) => {
    const missing: string[] = [];
    if (step === 1) {
      if (!formData.owner_name.trim()) missing.push("Owner Name");
      if (!formData.location.trim()) missing.push("Location");
      if (!formData.value || Number(formData.value) <= 0) missing.push(isRental ? "Monthly Rent (must be > 0)" : "Value (must be > 0)");
    } else if (step === 2) {
      if (
        formData.owner_brokerage_percent.trim() === "" ||
        isNaN(Number(formData.owner_brokerage_percent)) ||
        Number(formData.owner_brokerage_percent) < 0
      ) {
        missing.push("Owner Brokerage %");
      }
      if (
        formData.client_brokerage_percent.trim() === "" ||
        isNaN(Number(formData.client_brokerage_percent)) ||
        Number(formData.client_brokerage_percent) < 0
      ) {
        missing.push("Client Brokerage %");
      }
      if (isRental && formData.tenant_types.length === 0) {
        missing.push("At least one Eligible Tenant Type");
      }
    } else if (step === 3 && isRental) {
      if (!formData.lease_type) missing.push("Lease Type");
      if (
        formData.security_deposit.trim() === "" ||
        isNaN(Number(formData.security_deposit)) ||
        Number(formData.security_deposit) < 0
      ) {
        missing.push("Security Deposit");
      }
      if (
        formData.duration_months.trim() === "" ||
        isNaN(Number(formData.duration_months)) ||
        Number(formData.duration_months) <= 0
      ) {
        missing.push("Duration (Months)");
      }
    }
    return missing;
  };

  const isCurrentStepValid =
    activeStep === 1 ? isStep1Valid :
    activeStep === 2 ? isStep2Valid :
    isStep3Valid;

  const canSubmit = isStep1Valid && isStep2Valid && isStep3Valid;
  const currentStepMissing = getMissingFields(activeStep);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeStep < steps.length) {
      if (isCurrentStepValid) {
        setActiveStep((p) => p + 1);
      }
      return;
    }

    if (!canSubmit) {
      toast.error("Please complete all required fields before listing.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        owner_name: formData.owner_name.trim(),
        owner_contact: formData.owner_contact.trim() || undefined,
        location: formData.location.trim(),
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
      resetForm();
      router.push(`/broker/properties`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to list property"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const currentStep = steps.find((s) => s.id === activeStep) || steps[0];

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <PageHeader
        title="List New Property"
        description="Add a new property listing with commission and lease details."
      />

      {/* Progress steps */}
      <div className="flex items-center gap-4 mb-4">
        {steps.map((step) => {
          const isPassedOrCurrent = activeStep >= step.id;
          const isClickable = step.id < activeStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                if (isClickable) setActiveStep(step.id);
              }}
              disabled={!isClickable}
              className={`flex items-center gap-2 text-left bg-transparent border-none p-0 ${
                isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
              }`}
            >
              <div
                className={`size-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isPassedOrCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {activeStep > step.id ? (
                  <step.icon className="size-3.5" />
                ) : (
                  step.id
                )}
              </div>
              {step.id < steps.length && (
                <div className="h-px w-4 bg-muted" />
              )}
              <span
                className={`text-sm font-medium ${
                  activeStep === step.id
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <form onSubmit={handleSubmit} autoComplete="off">
          <CardHeader>
            <CardTitle>{currentStep.title}</CardTitle>
            <CardDescription>
              Step {activeStep} of {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Property Details */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Owner Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Harish Mehta"
                      value={formData.owner_name}
                      onChange={(e) => updateField("owner_name", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Owner Contact{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (Optional)
                      </span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="+91 98111 00000"
                      value={formData.owner_contact}
                      onChange={(e) => updateField("owner_contact", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    Location <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Bandra West, Mumbai - 400050"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Square Feet{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (Optional)
                      </span>
                    </label>
                    <Input
                      type="number"
                      placeholder="1450"
                      value={formData.square_feet}
                      onChange={(e) => updateField("square_feet", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Bedrooms{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (Optional)
                      </span>
                    </label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={formData.bedrooms}
                      onChange={(e) => updateField("bedrooms", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      {isRental ? "Monthly Rent (₹)" : "Value (₹)"}{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder={isRental ? "25000" : "38500000"}
                      value={formData.value}
                      onChange={(e) => updateField("value", e.target.value)}
                    />
                    {isRental && (
                      <p className="text-xs text-muted-foreground">Rent the tenant pays per month</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="is_rental_checkbox"
                    checked={formData.is_rental}
                    onCheckedChange={(checked) =>
                      updateField("is_rental", Boolean(checked))
                    }
                  />
                  <label
                    htmlFor="is_rental_checkbox"
                    className="text-sm font-medium cursor-pointer"
                  >
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
                    <label className="text-sm font-medium">
                      Owner Brokerage % <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
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
                    <label className="text-sm font-medium">
                      Client Brokerage % <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Eligible Tenant Types{" "}
                      {isRental && <span className="text-destructive">*</span>}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {isRental ? "Select at least one" : "Optional"}
                    </span>
                  </div>
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
                    <label className="text-sm font-medium">
                      Lease Type <span className="text-destructive">*</span>
                    </label>
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
                    <label className="text-sm font-medium">
                      Security Deposit (₹){" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="130000"
                      value={formData.security_deposit}
                      onChange={(e) =>
                        updateField("security_deposit", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Duration (Months) <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="11"
                      value={formData.duration_months}
                      onChange={(e) =>
                        updateField("duration_months", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
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
                disabled={!isCurrentStepValid}
              >
                Next
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    router.push("/broker/properties");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="bg-primary text-primary-foreground hover:bg-primary/80"
                >
                  {submitting ? "Listing…" : "List Property"}
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Card>

      {!isCurrentStepValid && currentStepMissing.length > 0 && (
        <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          Please complete all required fields on this step to proceed:{" "}
          <span className="font-medium text-foreground">
            {currentStepMissing.join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
