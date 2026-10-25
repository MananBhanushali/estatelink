"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/hooks/use-auth";
import { Users, Building2 } from "lucide-react";

interface ClientRow {
  client_id: number;
  name: string;
  email: string;
  phone: string;
  client_type: string;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadClients() {
      try {
        const res = await fetch("/api/clients", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load clients");
        const data = await res.json();
        if (!cancelled) {
          setClients(data.clients ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load clients");
          setLoading(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadClients();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manage Clients" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manage Clients" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const clientTypes = [...new Set(clients.map((c) => c.client_type))];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage Clients"
        description="View and manage all clients on the platform."
      />

      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {clientTypes.map((t) => (
            <Button
              key={t}
              variant="outline"
              size="sm"
              onClick={() => setSearch(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">All Clients</CardTitle>
          <CardDescription>
            {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""} found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <EmptyState title="No clients found" />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Name</TableHead>
                    <TableHead className="w-[30%]">Email</TableHead>
                    <TableHead className="w-[20%]">Phone</TableHead>
                    <TableHead className="w-[15%]">Client Type</TableHead>
                    <TableHead className="w-[10%]">ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((c) => (
                    <TableRow key={c.client_id}>
                      <TableCell className="text-sm font-medium">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.phone || "—"}
                      </TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">
                        {c.client_type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        #{c.client_id}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
