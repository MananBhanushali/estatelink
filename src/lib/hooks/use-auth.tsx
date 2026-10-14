"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type Role = "admin" | "broker" | "client";

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  refId: number | null;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: "broker" | "client";
  clientType?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function roleHome(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "broker":
      return "/broker/dashboard";
    case "client":
      return "/properties";
  }
}

async function readUser(res: Response): Promise<AuthUser> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Authentication failed");
  }
  return data.user as AuthUser;
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  // Server layout hydrates auth state from the session cookie, so the
  // client starts settled — no loading flash, no blocking fetch.
  const [loading, setLoading] = useState(initialUser === undefined);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user as AuthUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Revalidate only when the server couldn't hydrate (e.g. cookie set
    // client-side after SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialUser === undefined) refresh();
  }, [refresh, initialUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const authed = await readUser(res);
    setUser(authed);
    return authed;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const authed = await readUser(res);
    setUser(authed);
    return authed;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Client-side gate: redirects to /login (or role home) when requirements aren't met. */
export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(roleHome(user.role));
    }
  }, [user, loading, roles, router]);

  if (loading || !user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return <>{children}</>;
}
