import type { Metadata } from "next";

import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { StatsBar } from "@/components/landing/stats-bar";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { CTAFooter } from "@/components/landing/cta-footer";

export const metadata: Metadata = {
  title: "EstateLink — Brokerage, Simplified",
  description:
    "EstateLink is a property brokerage management platform for sales and rentals — listings, enquiries, deals, commissions, and broker leaderboards.",
};

export default function Home() {
  return (
    <div className="min-h-svh bg-background text-foreground relative flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTAFooter />
      </main>
    </div>
  );
}
