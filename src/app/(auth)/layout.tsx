"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/hooks/use-auth";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
