"use client";

import Link from "next/link";
import { Search, MessageCircle, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-animation";

interface StepItemProps {
  Icon: React.ElementType;
  title: string;
  desc: string;
  index: number;
  style?: React.CSSProperties;
}

function StepItem({ Icon, title, desc, index, style }: StepItemProps) {
  const isEven = index % 2 === 0;
  return (
    <ScrollReveal
      className={`
        relative z-10 mb-12 px-4 md:mb-0 md:flex md:items-center
        md:justify-between md:pr-12 last:mb-0
        opacity-0 translate-y-6 animate-fade-in
        transition-all duration-700 ease-out
      `}
      style={style}
    >
      <div className="flex items-center justify-center size-10 rounded-full border border-border bg-card mb-6 md:mb-0 md:absolute md:left-1/2 md:-translate-x-1/2">
        <span className="text-sm font-bold text-foreground">{index + 1}</span>
      </div>
      <div
        className={`
          md:w-full md:max-w-md p-6 rounded-xl border border-border bg-card
          ${isEven ? "md:ml-auto md:text-left" : "md:mr-auto md:text-right"}
        `}
      >
        <div
          className={`flex items-center justify-center gap-2 mb-4 ${isEven ? "md:justify-start" : "md:justify-end"}`}
        >
          <Icon className="size-5 text-blue-400 dark:text-blue-300" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </ScrollReveal>
  );
}

const STEPS: Array<{
  Icon: React.ElementType;
  title: string;
  desc: string;
}> = [
  {
    Icon: Search,
    title: "Browse Properties",
    desc: "Search listings by location, budget, bedrooms, and tenant type.",
  },
  {
    Icon: MessageCircle,
    title: "Submit Enquiry",
    desc: "Send an enquiry on any property — the broker is notified instantly.",
  },
  {
    Icon: Handshake,
    title: "Close the Deal",
    desc: "Convert the enquiry into a deal with automatic commission calculation.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4">
      <ScrollReveal className="mb-12 transition-delay-100">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How <span className="brand-gradient-text">It Works</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            From browsing to closing in three simple steps.
          </p>
        </div>
      </ScrollReveal>

      <div className="relative mx-auto max-w-2xl">
        <div className="absolute left-1/2 top-12 bottom-12 w-[2px] bg-border" />
        {STEPS.map((step, i) => (
          <StepItem
            key={step.title}
            {...step}
            index={i}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      <ScrollReveal className="mt-16 flex justify-center transition-delay-500">
        <Button
          size="lg"
          className="brand-gradient-bg text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          nativeButton={false}
          render={<Link href="/register" />}
        >
          Get Started Today
        </Button>
      </ScrollReveal>
    </section>
  );
}
