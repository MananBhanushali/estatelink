import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";

const STATUS_CONFIG: Record<string, BadgeVariant> = {
  available: "default",
  sold: "destructive",
  ongoing_rental: "secondary",
  open: "outline",
  in_progress: "default",
  closed: "default",
  rejected: "destructive",
  completed: "default",
  ongoing: "default",
  ended: "secondary",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = STATUS_CONFIG[status] ?? "secondary";
  const label =
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
