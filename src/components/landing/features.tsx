"use client";

import Link from "next/link";
import {
  Search,
  LayoutDashboard,
  RefreshCw,
  Star,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-animation";

interface Feature {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    icon: Search,
    title: "Smart Filtering",
    desc: "Filter properties by location, budget, bedrooms, and tenant eligibility with instant results.",
    color: "text-blue-400",
  },
  {
    icon: DollarSign,
    title: "Automated Commission",
    desc: "Company and broker earnings are computed automatically on every deal — no manual spreadsheets.",
    color: "text-emerald-400",
  },
  {
    icon: RefreshCw,
    title: "Rental Lifecycle",
    desc: "Expired leases are automatically flagged and properties returned to available status.",
    color: "text-blue-400",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    desc: "Clients leave ratings only after deals close, building trust and transparency.",
    color: "text-emerald-400",
  },
  {
    icon: LayoutDashboard,
    title: "Broker Leaderboard",
    desc: "Admins rank brokers by deals closed, volume, and average client rating.",
    color: "text-blue-400",
  },
  {
    icon: Calendar,
    title: "Lease Management",
    desc: "Track rental start/end dates, security deposits, and lease terms per property.",
    color: "text-emerald-400",
  },
];

export function Features() {
  return (
    <section className="py-20 px-4">
      <ScrollReveal className="mb-12 transition-delay-100">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for <span className="brand-gradient-text">Brokerages</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto">
            Everything a modern brokerage needs — from listing properties to
            closing deals and tracking commissions.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {FEATURES.map((feature, i) => {
          const FeatureIcon = feature.icon;
          return (
            <ScrollReveal
              key={feature.title}
              className={`
                p-6 rounded-xl border border-white/10 bg-white/5
                hover:border-white/20 hover:bg-white/10 transition-all
                group
                opacity-0 translate-y-6 animate-fade-in
                transition-all duration-700 ease-out
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="size-10 rounded-lg flex items-center justify-center mb-4 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <FeatureIcon className={`size-5 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {feature.desc}
              </p>
            </ScrollReveal>
          )}
        )}
      </div>

      <ScrollReveal className="mt-16 flex justify-center transition-delay-500">
        <Button
          size="lg"
          className="brand-gradient-bg text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          nativeButton={false}
          render={<Link href="/register" />}
        >
          Start Managing Your Brokerage
        </Button>
      </ScrollReveal>
    </section>
  );
}
