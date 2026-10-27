"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { SidebarContent } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/hooks/use-auth";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r md:block">
        {loading ? (
          <div className="flex h-full flex-col gap-4 p-4 animate-pulse">
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="size-8 rounded-lg bg-muted" />
              <div className="h-5 w-24 rounded bg-muted" />
            </div>
            <div className="h-px bg-border" />
            <div className="flex flex-col gap-2">
              <div className="h-9 rounded-md bg-muted/60" />
              <div className="h-9 rounded-md bg-muted/60" />
            </div>
          </div>
        ) : user ? (
          <SidebarContent role={user.role} />
        ) : (
          <div className="flex h-full flex-col gap-3 p-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-2 py-1 group hover:opacity-85 transition-opacity cursor-pointer"
            >
              <span className="flex size-8 items-center justify-center rounded-lg brand-gradient-bg text-white group-hover:scale-105 transition-transform">
                <Building2 className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">
                Estate<span className="brand-gradient-text">Link</span>
              </span>
            </Link>
            <p className="px-2 text-sm text-muted-foreground">
              Sign in to browse properties, enquire, and track deals.
            </p>
            <Button nativeButton={false} render={<Link href="/login" />}>
              <LogIn />
              Sign in
            </Button>
          </div>
        )}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
