import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Temporary landing — replaced by the full animated landing page in Phase 6.
export default function Home() {
  return (
    <div className="brand-gradient-subtle flex min-h-svh flex-col">
      <header className="flex items-center justify-between p-4 md:px-8">
        <span className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg brand-gradient-bg text-white">
            <Building2 className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Estate<span className="brand-gradient-text">Link</span>
          </span>
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button nativeButton={false} render={<Link href="/register" />}>Get started</Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
          Brokerage, <span className="brand-gradient-text">Simplified.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          EstateLink helps brokerages manage listings, enquiries, deals,
          commissions, and rentals — all in one place.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/properties" />}>
            Browse Properties
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
        </div>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground">
        EstateLink · DBMS course project
      </footer>
    </div>
  );
}
