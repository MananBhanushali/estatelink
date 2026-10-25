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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { toast } from "sonner";

export interface EnquiryDialogProps {
  propertyId: number;
  propertyLocation: string;
  disabled?: boolean;
}

export function EnquiryDialog({
  propertyId,
  propertyLocation,
  disabled = false,
}: EnquiryDialogProps) {
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit enquiry");
    } finally {
      setSubmitting(false);
    }
  }

  const isClient = user?.role === "client";
  const triggerLabel = disabled
    ? "Coming soon"
    : !user
      ? "Sign in to enquire"
      : !isClient
        ? "Enquiries are for clients only"
        : "Submit Enquiry";

  return (
    <Dialog>
      <DialogTrigger>
        <Button
          disabled={disabled || !isClient}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Enquiry</DialogTitle>
          <DialogDescription>
            Interested in <strong>{propertyLocation}</strong>? Leave your details and the broker will get in touch.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-4">
          {!user && (
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              You need to be signed in as a client to submit an enquiry.
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="e.g. Looking for a 2BHK with parking, available from next month"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={!user || disabled}
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !user || disabled}
            className="w-full"
          >
            {submitting ? "Submitting…" : "Send Enquiry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
