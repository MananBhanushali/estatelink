import Link from "next/link";
import { Building2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { NavLinks } from "@/components/layout/nav-links";
import type { Role } from "@/lib/hooks/use-auth";

export function SidebarContent({ role }: { role: Role }) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link href="/" className="flex items-center gap-2 px-2 py-1">
        <span className="flex size-8 items-center justify-center rounded-lg brand-gradient-bg text-white">
          <Building2 className="size-5" />
        </span>
        <span className="text-lg font-bold tracking-tight">
          Estate<span className="brand-gradient-text">Link</span>
        </span>
      </Link>
      <Separator />
      <NavLinks role={role} />
      <div className="mt-auto rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
        Brokerage, simplified — sales & rentals managed in one place.
      </div>
    </div>
  );
}
