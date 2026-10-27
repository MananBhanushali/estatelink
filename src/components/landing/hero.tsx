"use client";

import Link from "next/link";
import {
  Building2,
  DollarSign,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-animation";

interface StatItemProps {
  Icon: React.ElementType;
  color: string;
  label: string;
  desc: string;
  style?: React.CSSProperties;
}

function StatItem({ Icon, color, label, desc, style }: StatItemProps) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card opacity-0 translate-y-6 animate-fade-in transition-all duration-700 ease-out" style={style}>
      <div className="flex items-center gap-2 mb-3">
        <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Icon className={`size-5 ${color}`} />
        </div>
        <span className="text-sm font-medium text-primary uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

const ICONS: Array<{
  Icon: React.ElementType;
  color: string;
  label: string;
  desc: string;
}> = [
  {
    Icon: Building2,
    color: "text-blue-400",
    label: "Listings",
    desc: "Publish properties for sale and rent with full broker and commission details.",
  },
  {
    Icon: DollarSign,
    color: "text-emerald-400",
    label: "Commission",
    desc: "Automatic company and broker commission calculation on every deal.",
  },
  {
    Icon: Shield,
    color: "text-blue-400",
    label: "Compliance",
    desc: "Rental expiry tracking keeps your inventory accurate.",
  },
];

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-12 text-center">
      <div className="absolute inset-0 -z-10 dark:bg-gradient-to-br dark:from-blue-900/20 dark:via-slate-900 dark:to-emerald-900/20 from-blue-50/30 via-white to-emerald-50/30" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 dark:bg-blue-600/30 bg-blue-100/50 rounded-full blur-[100px] animate-float" />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 dark:bg-emerald-500/30 bg-emerald-100/50 rounded-full blur-[100px] animate-float"
        style={{ animationDelay: "-2s" }}
      />

      <ScrollReveal className="relative z-10 mx-auto max-w-4xl transition-delay-100">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-primary">
          <Building2 className="size-4" />
          Property Brokerage Platform
        </div>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Brokerage,{" "}
          <span className="brand-gradient-text">Simplified.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto sm:text-xl">
          Manage listings, enquiries, deals, commissions, and rental lifecycles
          — all in one brokerage management platform built for modern
          brokerages.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="brand-gradient-bg text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Get Started &mdash; It&rsquo;s Free
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/properties" />}
          >
            Browse Properties
          </Button>
        </div>
      </ScrollReveal>

      <ScrollReveal className="relative z-10 mt-16 transition-delay-300">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
          {ICONS.map((item, i) => (
            <StatItem key={item.label} {...item} style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
