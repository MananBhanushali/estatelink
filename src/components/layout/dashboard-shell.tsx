"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { SidebarContent } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/hooks/use-auth";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r md:block">
        {user ? (
          <SidebarContent role={user.role} />
        ) : (
          <div className="flex h-full flex-col gap-3 p-4">
            <span className="px-2 py-1 text-lg font-bold tracking-tight">
              Estate<span className="brand-gradient-text">Link</span>
            </span>
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
