"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, Building2 } from "lucide-react";
import { ScrollReveal } from "@/components/shared/scroll-animation";

interface StatItemProps {
  Icon: React.ElementType;
  color: string;
  value: string;
  label: string;
  style?: React.CSSProperties;
}

function StatItem({ Icon, color, value, label, style }: StatItemProps) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card flex flex-col items-center gap-3" style={style}>
      <div className="size-10 rounded-lg flex items-center justify-center dark:bg-blue-600/20 bg-blue-500/10">
        <Icon className={`size-5 ${color}`} />
      </div>
      <div className="text-center">
        <span className="text-3xl font-bold text-foreground tracking-tight">
          {value}
        </span>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );
}

const STATS: Array<{
  Icon: React.ElementType;
  color: string;
  value: string;
  label: string;
}> = [
  {
    Icon: Building2,
    color: "text-blue-400",
    value: "500+",
    label: "Properties Listed",
  },
  {
    Icon: Users,
    color: "text-emerald-400",
    value: "50+",
    label: "Active Brokers",
  },
  {
    Icon: DollarSign,
    color: "text-blue-400",
    value: "₹100Cr+",
    label: "Deals Closed",
  },
];

export function StatsBar() {
  const [animatedValues, setAnimatedValues] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedValues((prev) => {
        if (prev.length === STATS.length) return prev;
        return [...prev, STATS[prev.length].value];
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="border-y border-border bg-background/80 backdrop-blur">
      <ScrollReveal className="relative z-10 transition-delay-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 py-10">
          {STATS.map((stat, i) => (
            <StatItem
              key={stat.label}
              {...stat}
              value={animatedValues[i] ?? ""}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
