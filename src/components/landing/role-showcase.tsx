"use client";

import Link from "next/link";
import {
  Users,
  Shield,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-animation";

interface Role {
  icon: React.ElementType;
  title: string;
  desc: string;
  features: string[];
  color: string;
  href: string;
}

const ROLES: Role[] = [
  {
    icon: Users,
    title: "Client",
    desc: "Browse, enquire, and review properties with ease.",
    features: [
      "Browse & filter listings",
      "Submit property enquiries",
      "Track enquiry status",
      "Leave reviews on deals",
    ],
    color: "text-blue-400",
    href: "/register?role=client",
  },
  {
    icon: Shield,
    title: "Broker",
    desc: "Manage listings, enquiries, and earn commissions.",
    features: [
      "List new properties",
      "Manage enquiry pipeline",
      "Convert to deals with auto-commission",
      "View earnings & reviews",
    ],
    color: "text-emerald-400",
    href: "/register?role=broker",
  },
  {
    icon: Building2,
    title: "Admin",
    desc: "Oversee the entire brokerage from one dashboard.",
    features: [
      "Company-wide stats & earnings",
      "Broker leaderboard",
      "Manage all properties & deals",
      "Refresh expired rentals",
    ],
    color: "text-blue-400",
    href: "/register?role=admin",
  },
];

export function RoleShowcase() {
  return (
    <section className="py-20 px-4 border-y border-white/10">
      <ScrollReveal className="mb-12 transition-delay-100">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Roles for <span className="brand-gradient-text">Everyone</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto">
            Whether you&rsquo;re a client, broker, or admin — EstateLink has a
            portal built just for you.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {ROLES.map((role, i) => {
          const RoleIcon = role.icon;
          return (
            <ScrollReveal
              key={role.title}
              className={`
                p-6 rounded-xl border border-white/10 bg-white/5
                hover:border-white/20 transition-all group
                opacity-0 translate-y-6 animate-fade-in
                transition-all duration-700 ease-out
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="size-12 rounded-xl flex items-center justify-center mb-6 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <RoleIcon className={`size-6 ${role.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {role.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {role.desc}
              </p>
              <ul className="space-y-2 mb-8">
                {role.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="size-3 rounded-full bg-white/5"></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={role.href} />}
              >
                Become a {role.title}
              </Button>
            </ScrollReveal>
          )}
        )}
      </div>
    </section>
  );
}
