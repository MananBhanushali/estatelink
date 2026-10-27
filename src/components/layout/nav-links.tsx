"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  PlusCircle,
  Star,
  Trophy,
  Users,
  Wallet,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/hooks/use-auth";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function navLinksFor(role: Role): NavLink[] {
  switch (role) {
    case "client":
      return [
        { href: "/properties", label: "Browse Properties", icon: Building2 },
        { href: "/client/deals", label: "My Deals", icon: CheckCircle2 },
        { href: "/client/enquiries", label: "My Enquiries", icon: ClipboardList },
      ];
    case "broker":
      return [
        { href: "/broker/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/broker/enquiries", label: "Enquiries", icon: ClipboardList },
        { href: "/broker/properties", label: "My Properties", icon: Building2 },
        { href: "/broker/properties/new", label: "List Property", icon: PlusCircle },
        { href: "/broker/earnings", label: "Earnings", icon: Wallet },
        { href: "/broker/reviews", label: "Reviews", icon: Star },
      ];
    case "admin":
      return [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/brokers", label: "Brokers", icon: Trophy },
        { href: "/admin/clients", label: "Clients", icon: Users },
        { href: "/admin/properties", label: "Properties", icon: Building2 },
        { href: "/admin/enquiries", label: "Enquiries", icon: ClipboardList },
        { href: "/admin/deals", label: "Deals", icon: Shield },
      ];
  }
}

export function NavLinks({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const links = navLinksFor(role);

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
