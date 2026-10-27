"use client";

import Link from "next/link";
import { Search, MessageSquare, Handshake, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-animation";

const STEPS = [
  {
    step: "01",
    Icon: Search,
    title: "Browse Properties",
    desc: "Search verified listings by location, budget, bedrooms, and tenant eligibility with instant filters.",
    badge: "Instant Search",
  },
  {
    step: "02",
    Icon: MessageSquare,
    title: "Submit Enquiry",
    desc: "Send an enquiry directly to the property's assigned broker — notifications are dispatched instantly.",
    badge: "Direct Contact",
  },
  {
    step: "03",
    Icon: Handshake,
    title: "Close the Deal",
    desc: "Convert qualified enquiries into finalized deals with automated brokerage and company commission splits.",
    badge: "Auto Commission",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[350px] bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-transparent blur-[120px] pointer-events-none" />

      <ScrollReveal className="mb-16 transition-delay-100">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3.5 py-1 text-xs font-medium text-muted-foreground mb-4">
            Simple 3-Step Workflow
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How <span className="brand-gradient-text">It Works</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-base">
            From discovering the perfect property to closing and commission disbursement.
          </p>
        </div>
      </ScrollReveal>

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => {
            const StepIcon = step.Icon;
            return (
              <ScrollReveal
                key={step.title}
                className="relative rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm p-8 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div>
                  {/* Top Bar with Icon and Step Number Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="size-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                      <StepIcon className="size-6" />
                    </div>
                    <span className="flex items-center justify-center size-9 rounded-full brand-gradient-bg text-white font-bold text-sm shadow-md shadow-blue-500/20">
                      {step.step}
                    </span>
                  </div>

                  <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    {step.badge}
                  </span>

                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Step {i + 1} of 3</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      <ScrollReveal className="mt-16 flex justify-center transition-delay-500">
        <Button
          size="lg"
          className="h-12 px-9 rounded-full brand-gradient-bg text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
          nativeButton={false}
          render={<Link href="/register" />}
        >
          <span>Get Started Today</span>
          <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </ScrollReveal>
    </section>
  );
}
