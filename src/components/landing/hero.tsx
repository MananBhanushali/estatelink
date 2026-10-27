"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-animation";

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
      {/* Background radial gradient tint */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/25 dark:via-background dark:to-background pointer-events-none" />

      {/* Subtle modern dot mesh pattern with radial fade */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.14)_1.5px,transparent_1.5px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,#000_50%,transparent_100%)] pointer-events-none" />

      {/* Ambient glowing gradient orbs centered right behind "Brokerage, Simplified" */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[680px] h-[400px] max-w-full pointer-events-none">
        <div
          className="absolute -top-10 left-4 w-80 h-80 rounded-full bg-blue-500/25 dark:bg-blue-600/30 blur-[100px] animate-float"
        />
        <div
          className="absolute top-10 right-4 w-80 h-80 rounded-full bg-emerald-400/20 dark:bg-emerald-500/30 blur-[100px] animate-float"
          style={{ animationDelay: "-3s" }}
        />
        <div className="absolute -bottom-10 left-1/3 w-72 h-72 rounded-full bg-cyan-400/20 dark:bg-cyan-500/20 blur-[90px]" />
      </div>

      <ScrollReveal className="relative z-10 mx-auto max-w-4xl transition-delay-100 flex flex-col items-center">
        {/* Hero Heading with Glowing Background Effect */}
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl leading-[1.1]">
          Brokerage,{" "}
          <span className="brand-gradient-text drop-shadow-[0_10px_25px_rgba(59,130,246,0.25)]">
            Simplified.
          </span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto sm:text-xl leading-relaxed">
          Manage listings, enquiries, deals, commissions, and rental lifecycles
          — all in one brokerage management platform built for modern
          brokerages.
        </p>

        {/* CTA Buttons with Increased Padding & Premium Styling */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5 w-full sm:w-auto">
          <Button
            size="lg"
            className="w-full sm:w-auto h-12 px-8 rounded-full brand-gradient-bg text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            <span>Sign Up</span>
            <ArrowRight className="size-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto h-12 px-8 rounded-full border-border/80 bg-background/80 hover:bg-muted text-foreground font-semibold text-base shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 backdrop-blur-sm"
            nativeButton={false}
            render={<Link href="/properties" />}
          >
            Browse Properties
          </Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
