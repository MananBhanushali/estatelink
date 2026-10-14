"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleHome, useAuth } from "@/lib/hooks/use-auth";

const CLIENT_TYPES = [
  { value: "student", label: "Student" },
  { value: "bachelor", label: "Bachelor" },
  { value: "married_couple", label: "Married Couple" },
  { value: "family", label: "Family" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"broker" | "client">("client");
  const [clientType, setClientType] = useState<string>("bachelor");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPending(true);
    try {
      const user = await register({
        name,
        email,
        phone: phone || undefined,
        password,
        role,
        clientType: role === "client" ? clientType : undefined,
      });
      toast.success(`Account created — welcome, ${user.name}`);
      router.replace(roleHome(user.role));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="brand-gradient-subtle flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl brand-gradient-bg text-white"
          >
            <Building2 className="size-6" />
          </Link>
          <CardTitle className="text-2xl">
            Join <span className="brand-gradient-text">EstateLink</span>
          </CardTitle>
          <CardDescription>
            Create your account as a broker or client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Aarav Kapoor"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 90000 00000"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={pending}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">I am a</Label>
                <Select
                  value={role}
                  onValueChange={(v) => {
                    if (v === "broker" || v === "client") setRole(v);
                  }}
                  disabled={pending}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === "client" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="clientType">Client type</Label>
                  <Select
                    value={clientType}
                    onValueChange={(v) => {
                      if (v) setClientType(v);
                    }}
                    disabled={pending}
                  >
                    <SelectTrigger id="clientType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="animate-spin" />}
              Create account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
