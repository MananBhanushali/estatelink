"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-animation";

export function CTAFooter() {
  return (
    <section className="py-20 px-4 border-y border-border dark:bg-blue-900/10 bg-blue-50/40">
      <ScrollReveal className="relative z-10 mx-auto max-w-3xl text-center transition-delay-100">
        <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 p-8 md:p-12">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to modernize your brokerage?
          </h2>
          <p className="mt-4 text-white/90 max-w-lg mx-auto">
            Join 50+ brokers already using EstateLink to manage listings,
            enquiries, deals, and commissions.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-8 rounded-full bg-white text-blue-900 font-semibold text-base shadow-lg shadow-black/20 hover:shadow-black/30 hover:bg-white/95 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              nativeButton={false}
              render={<Link href="/register" />}
            >
              Sign Up — It&rsquo;s Free
            </Button>
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-8 rounded-full border-2 border-white/60 !bg-transparent !text-white font-semibold text-base hover:!bg-white/20 hover:!text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              nativeButton={false}
              render={<Link href="/properties" />}
            >
              Browse Properties
            </Button>
          </div>
        </div>
      </ScrollReveal>

      <footer className="mt-16 px-4">
        <ScrollReveal className="relative z-10 transition-delay-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-6 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg brand-gradient-bg">
                <Building2 className="size-4" />
              </div>
              <span className="text-sm font-bold text-foreground tracking-tight">
                Estate<span className="brand-gradient-text">Link</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              EstateLink · DBMS Course Project · Built with Next.js 15 & MySQL
            </p>
            <div className="flex items-center gap-6">
              <a
                href="/login"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </a>
              <a
                href="/register"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Register
              </a>
              <Link
                href="/properties"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Properties
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </footer>
    </section>
  );
}
