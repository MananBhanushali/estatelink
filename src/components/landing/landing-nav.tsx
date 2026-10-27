"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth, roleHome } from "@/lib/hooks/use-auth";

export function LandingNav() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* EstateLink Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-9 items-center justify-center rounded-xl brand-gradient-bg text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <Building2 className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Estate<span className="brand-gradient-text">Link</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            How It Works
          </a>
          <Link
            href="/properties"
            className="hover:text-foreground transition-colors"
          >
            Browse Properties
          </Link>
          <a
            href="#testimonials"
            className="hover:text-foreground transition-colors"
          >
            Testimonials
          </a>
        </nav>

        {/* Right CTA & Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Button
              nativeButton={false}
              render={<Link href={roleHome(user.role)} />}
              className="h-10 px-5 rounded-full brand-gradient-bg text-white font-medium text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
            >
              <span>Dashboard</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Button
                nativeButton={false}
                render={<Link href="/register" />}
                className="h-10 px-5 rounded-full brand-gradient-bg text-white font-medium text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
              >
                <span>Sign Up</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
