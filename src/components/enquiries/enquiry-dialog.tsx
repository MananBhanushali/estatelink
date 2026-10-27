"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface EnquiryDialogProps {
  propertyId: number;
  propertyLocation: string;
  disabled?: boolean;
  alreadyEnquired?: boolean;
  className?: string;
}

export function EnquiryDialog({
  propertyId,
  propertyLocation,
  disabled = false,
  alreadyEnquired = false,
  className,
}: EnquiryDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit an enquiry");
      return;
    }
    if (!propertyId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit enquiry");
      }

      await res.json();
      toast.success("Enquiry submitted successfully");
      setNotes("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit enquiry");
    } finally {
      setSubmitting(false);
    }
  }

  const isClient = user?.role === "client";
  const isDisabled = disabled || alreadyEnquired || !isClient;
  const triggerLabel = alreadyEnquired
    ? "Already Enquired"
    : disabled
      ? "Coming soon"
      : !user
        ? "Sign in to enquire"
        : !isClient
          ? "Enquiries are for clients only"
          : "Submit Enquiry";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            disabled={isDisabled}
            className={cn(
              alreadyEnquired
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/80",
              className
            )}
          >
            {alreadyEnquired && (
              <svg
                className="size-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent>
        {/* form wraps header + body + footer so the submit button is inside the form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle>Submit Enquiry</DialogTitle>
            <DialogDescription>
              Interested in <strong>{propertyLocation}</strong>? Leave your details and the broker will get in touch.
            </DialogDescription>
          </DialogHeader>
          {!user && (
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              You need to be signed in as a client to submit an enquiry.
            </div>
          )}
          <div className="flex flex-col gap-1 pt-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="e.g. Looking for a 2BHK with parking, available from next month"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={!user || disabled}
            />
          </div>
          <DialogFooter className="mt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              }
            />
            <Button
              type="submit"
              disabled={submitting || !user || disabled}
              className="w-full sm:w-auto"
            >
              {submitting ? "Submitting…" : "Send Enquiry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
