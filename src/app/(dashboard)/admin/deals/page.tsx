"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface DealRow {
  deal_id: number;
  property_id: number;
  broker_id: number;
  client_id: number;
  deal_type: string;
  deal_date: string;
  deal_value: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  deal_status: string;
  company_earning: string | number;
  broker_earning: string | number;
  broker_name: string;
  client_name: string;
  property_location: string;
}

interface TriggerMeta {
  TRIGGER_NAME: string;
  event: string;
  table_name: string;
  timing: string;
  created_at: string | null;
}

interface DemoCandidate {
  enquiry_id: number;
  client_id: number;
  broker_id: number;
  property_id: number;
  location: string;
  property_status: string;
  client_name: string;
  broker_name: string;
}

interface DemoResult {
  property_id: number;
  deal_type: string;
  status_before: string;
  status_after: string;
  trigger_fired: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  ongoing: "secondary",
  ended: "secondary",
};

function StatusPill({ status }: { status: string }) {
  const color: Record<string, string> = {
    available: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    sold: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    ongoing_rental: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        color[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status.replace("_", " ")}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Trigger info
  const [triggerInfo, setTriggerInfo] = useState<{
    exists: boolean;
    trigger: TriggerMeta | null;
  } | null>(null);

  // Live demo state
  const [candidates, setCandidates] = useState<DemoCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<DemoCandidate | null>(null);
  const [demoType, setDemoType] = useState<"sale" | "rental">("sale");
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  // animation phase: idle | inserting | triggering | updating | done
  const [demoPhase, setDemoPhase] = useState<"idle" | "inserting" | "triggering" | "updating" | "done">("idle");

  /* ── Data loading ────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [dealsRes, triggerRes, candidatesRes] = await Promise.all([
          fetch("/api/deals", { cache: "no-store" }),
          fetch("/api/admin/trigger-info", { cache: "no-store" }),
          fetch("/api/admin/trigger-demo", { cache: "no-store" }),
        ]);

        const dealsData = dealsRes.ok ? await dealsRes.json() : { deals: [] };
        const triggerData = triggerRes.ok ? await triggerRes.json() : null;
        const candidatesData = candidatesRes.ok ? await candidatesRes.json() : { candidates: [] };

        if (!cancelled) {
          setDeals(dealsData.deals ?? []);
          setTriggerInfo(triggerData);
          const cands: DemoCandidate[] = candidatesData.candidates ?? [];
          setCandidates(cands);
          if (cands.length > 0) setSelectedCandidate(cands[0]);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  /* ── Live demo ───────────────────────────────────────────────────────── */
  const runDemo = useCallback(async () => {
    if (!selectedCandidate) return;
    setDemoRunning(true);
    setDemoResult(null);
    setDemoError(null);
    setDemoPhase("inserting");

    await new Promise((r) => setTimeout(r, 700));
    setDemoPhase("triggering");
    await new Promise((r) => setTimeout(r, 700));
    setDemoPhase("updating");

    try {
      const res = await fetch("/api/admin/trigger-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: selectedCandidate.property_id,
          deal_type: demoType,
          enquiry_id: selectedCandidate.enquiry_id,
          client_id: selectedCandidate.client_id,
          broker_id: selectedCandidate.broker_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Demo failed");
      await new Promise((r) => setTimeout(r, 400));
      setDemoPhase("done");
      setDemoResult(data as DemoResult);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : "Demo failed");
      setDemoPhase("idle");
    } finally {
      setDemoRunning(false);
    }
  }, [selectedCandidate, demoType]);

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const filteredDeals = deals.filter(
    (d) =>
      d.property_location.toLowerCase().includes(search.toLowerCase()) ||
      d.broker_name.toLowerCase().includes(search.toLowerCase()) ||
      d.client_name.toLowerCase().includes(search.toLowerCase())
  );
  const totalCompanyEarnings = filteredDeals.reduce((acc, d) => acc + Number(d.company_earning || 0), 0);
  const totalBrokerEarnings = filteredDeals.reduce((acc, d) => acc + Number(d.broker_earning || 0), 0);

  /* ── Loading / Error ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manage Deals" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manage Deals" />
        <p className="text-muted-foreground text-center py-20">{error}</p>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Manage Deals" description="View all deals closed on the platform." />

      {/* Earnings summary */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: "Company Earnings", value: `₹${totalCompanyEarnings.toLocaleString()}` },
          { label: "Broker Earnings",  value: `₹${totalBrokerEarnings.toLocaleString()}` },
          { label: "Total Deals",      value: filteredDeals.length.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border p-4 flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className="text-2xl font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TRIGGER PANEL
      ══════════════════════════════════════════════════════════════════ */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/15 text-amber-500 shrink-0">
              {/* lightning bolt */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold">
                Database Trigger — Live Demo
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                <code className="font-mono text-amber-600 dark:text-amber-400">
                  trg_auto_set_property_status_on_deal
                </code>
                {" · "}AFTER INSERT ON Deals
              </CardDescription>
            </div>
            {triggerInfo !== null && (
              <Badge
                className={
                  triggerInfo.exists
                    ? "shrink-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15"
                    : "shrink-0"
                }
                variant={triggerInfo.exists ? "outline" : "destructive"}
              >
                {triggerInfo.exists ? "● Live in DB" : "⚠ Not installed"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* ── How it works (static flow) ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {[
              { step: "1", icon: "📋", title: "Deal Inserted",    desc: "INSERT INTO Deals fires from app layer", color: "" },
              { step: "2", icon: "⚡", title: "Trigger Fires",    desc: "MySQL intercepts and runs trigger body AFTER the row lands", color: "" },
              { step: "3", icon: "🔀", title: "Branch on Type",   desc: "sale → sold  |  rental → ongoing_rental", color: "border-amber-500/30 bg-amber-500/5" },
              { step: "4", icon: "🏠", title: "Property Updated", desc: "Properties.status changed atomically in the same transaction", color: "border-emerald-500/30 bg-emerald-500/5" },
            ].map(({ step, icon, title, desc, color }, i, arr) => (
              <div key={step} className="relative flex flex-col gap-1.5 rounded-xl border border-border bg-background p-3">
                {color && <div className={`absolute inset-0 rounded-xl ${color}`} />}
                <span className="relative text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Step {step}</span>
                <div className="relative flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <span className="text-xs font-semibold">{title}</span>
                </div>
                <p className="relative text-xs text-muted-foreground">{desc}</p>
                {i < arr.length - 1 && (
                  <span className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground">→</span>
                )}
              </div>
            ))}
          </div>

          {/* ── Live Interactive Demo ────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
              <span className="size-2 rounded-full bg-rose-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-mono text-muted-foreground">trigger_demo.sql — live execution sandbox</span>
            </div>

            <div className="p-4 space-y-4">
              {candidates.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No available properties with open enquiries to demo with.
                </p>
              ) : (
                <>
                  {/* Controls */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                      <label className="text-xs font-medium text-muted-foreground">Property (available)</label>
                      <Select
                        value={selectedCandidate?.enquiry_id.toString()}
                        onValueChange={(v) => {
                          const c = candidates.find((c) => c.enquiry_id.toString() === v);
                          if (c) { setSelectedCandidate(c); setDemoResult(null); setDemoPhase("idle"); }
                        }}
                        disabled={demoRunning}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Pick property…" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidates.map((c) => (
                            <SelectItem key={c.enquiry_id} value={c.enquiry_id.toString()} className="text-xs">
                              #{c.property_id} · {c.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Deal type</label>
                      <Select
                        value={demoType}
                        onValueChange={(v) => { setDemoType(v as "sale" | "rental"); setDemoResult(null); setDemoPhase("idle"); }}
                        disabled={demoRunning}
                      >
                        <SelectTrigger className="h-8 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale" className="text-xs">sale → sold</SelectItem>
                          <SelectItem value="rental" className="text-xs">rental → ongoing_rental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={runDemo}
                      disabled={demoRunning || !selectedCandidate || !triggerInfo?.exists}
                    >
                      {demoRunning ? (
                        <>
                          <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Running…
                        </>
                      ) : (
                        <>⚡ Fire Trigger</>
                      )}
                    </Button>
                  </div>

                  {/* SQL preview */}
                  {selectedCandidate && (
                    <pre className="rounded-lg bg-muted text-[11px] font-mono text-muted-foreground p-3 overflow-x-auto leading-relaxed">
{`-- Step 1: your app inserts the deal row
INSERT INTO Deals (enquiry_id, property_id, broker_id, client_id, deal_type, …)
VALUES (${selectedCandidate.enquiry_id}, ${selectedCandidate.property_id}, ${selectedCandidate.broker_id}, ${selectedCandidate.client_id}, '${demoType}', …);

-- Step 2+3+4: MySQL fires this automatically (no app code)
-- TRIGGER: trg_auto_set_property_status_on_deal  [AFTER INSERT]
--   NEW.property_id = ${selectedCandidate.property_id}
--   NEW.deal_type   = '${demoType}'
--   → UPDATE Properties SET status = '${demoType === "sale" ? "sold" : "ongoing_rental"}'
--     WHERE property_id = ${selectedCandidate.property_id};`}
                    </pre>
                  )}

                  {/* Animation pipeline */}
                  {demoPhase !== "idle" && (
                    <div className="flex items-center gap-2 text-xs font-mono overflow-x-auto pb-1">
                      {[
                        { phase: "inserting",  label: "INSERT Deals",       icon: "📋" },
                        { phase: "triggering", label: "Trigger fires ⚡",    icon: "⚡" },
                        { phase: "updating",   label: "UPDATE Properties",  icon: "🏠" },
                        { phase: "done",       label: "Committed ✓",        icon: "✅" },
                      ].map(({ phase, label, icon }, i, arr) => {
                        const phases = ["inserting", "triggering", "updating", "done"];
                        const phaseIdx = phases.indexOf(demoPhase);
                        const thisIdx  = phases.indexOf(phase);
                        const done    = thisIdx < phaseIdx;
                        const active  = thisIdx === phaseIdx;
                        return (
                          <span key={phase} className="flex items-center gap-2 shrink-0">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all duration-300
                              ${active  ? "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400 scale-105" : ""}
                              ${done    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}
                              ${!active && !done ? "border-border text-muted-foreground opacity-40" : ""}
                            `}>
                              {icon} {label}
                            </span>
                            {i < arr.length - 1 && (
                              <span className={`text-muted-foreground transition-opacity duration-300 ${done || active ? "opacity-100" : "opacity-30"}`}>→</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Result */}
                  {demoResult && demoPhase === "done" && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                          ✅ Trigger fired successfully
                        </span>
                        {demoResult.trigger_fired
                          ? <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">Status changed</Badge>
                          : <Badge variant="outline" className="text-[10px]">No status change (already correct)</Badge>
                        }
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Property #{demoResult.property_id} — BEFORE insert</span>
                          <StatusPill status={demoResult.status_before} />
                        </div>
                        <span className="text-2xl text-muted-foreground mt-4">→</span>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">AFTER trigger ran</span>
                          <StatusPill status={demoResult.status_after} />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        The demo deal was inserted (firing the trigger), the status change was captured,
                        then <strong>the deal was deleted and the property restored</strong> — so your data is unchanged.
                        In a real deal flow the status would stay as{" "}
                        <code className="font-mono bg-muted px-1 rounded">{demoResult.status_after}</code>.
                      </p>
                    </div>
                  )}

                  {demoError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                      ⚠ {demoError}
                    </div>
                  )}

                  {!triggerInfo?.exists && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
                      ⚠ Trigger is not installed in the database yet. Run{" "}
                      <code className="font-mono bg-muted px-1 rounded">schema/install_trigger.sql</code>{" "}
                      to activate it, then refresh this page.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Why AFTER INSERT ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground text-xs">
                💡 Why <code className="font-mono">AFTER INSERT</code>?
              </p>
              <p>
                The trigger fires <em>only after</em> the deal row successfully commits.
                A <code className="font-mono bg-muted px-1 rounded">BEFORE INSERT</code> trigger
                would update the property even if the deal later failed a constraint — leaving
                an orphaned status change for a deal that never existed.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground text-xs">
                🚀 Why not do this in app code?
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li><strong>Atomic</strong> — trigger is part of the same transaction.</li>
                <li><strong>Universal</strong> — fires even from SQL shell / migration scripts.</li>
                <li><strong>No stale data</strong> — old API ran heal queries on every GET; trigger prevents the inconsistency from ever occurring.</li>
              </ul>
            </div>
          </div>

          {/* ── Live INFORMATION_SCHEMA metadata ────────────────────────── */}
          {triggerInfo?.exists && triggerInfo.trigger && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <p className="font-semibold text-foreground text-xs">
                🗄️ Live metadata —{" "}
                <code className="font-mono text-xs">INFORMATION_SCHEMA.TRIGGERS</code>
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono">
                {[
                  ["TRIGGER_NAME",       triggerInfo.trigger.TRIGGER_NAME],
                  ["EVENT_MANIPULATION", triggerInfo.trigger.event],
                  ["EVENT_OBJECT_TABLE", triggerInfo.trigger.table_name],
                  ["ACTION_TIMING",      triggerInfo.trigger.timing],
                  ...(triggerInfo.trigger.created_at
                    ? [["CREATED", new Date(triggerInfo.trigger.created_at).toLocaleString()]]
                    : []),
                ].map(([k, v]) => (
                  <>
                    <span key={k + "k"} className="text-muted-foreground">{k}</span>
                    <span key={k + "v"} className="text-foreground">{v}</span>
                  </>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* ══ end trigger panel ══ */}

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">All Deals</CardTitle>
          <CardDescription>
            {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""} found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, broker, or client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredDeals.length === 0 ? (
            <EmptyState title="No deals found" />
          ) : (
            <div className="mt-4 rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[8%]">Deal ID</TableHead>
                    <TableHead className="w-[20%]">Property</TableHead>
                    <TableHead className="w-[14%]">Client</TableHead>
                    <TableHead className="w-[14%]">Broker</TableHead>
                    <TableHead className="w-[8%]">Type</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[12%]">Deal Value</TableHead>
                    <TableHead className="w-[12%]">Co. Earn</TableHead>
                    <TableHead className="w-[12%]">Broker Earn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((d) => (
                    <TableRow key={d.deal_id}>
                      <TableCell className="text-sm font-medium">#{d.deal_id}</TableCell>
                      <TableCell>
                        <Link href={`/properties/${d.property_id}`} className="text-sm hover:underline">
                          {d.property_location}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.client_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.broker_name}</TableCell>
                      <TableCell className="text-sm capitalize">{d.deal_type}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[d.deal_status] ?? "secondary"}>
                          {d.deal_status.charAt(0).toUpperCase() + d.deal_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">₹{Number(d.deal_value).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">₹{Number(d.company_earning || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm font-medium">₹{Number(d.broker_earning || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
