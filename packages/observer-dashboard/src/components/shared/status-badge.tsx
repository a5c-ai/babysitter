import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import type { RunStatus, TaskStatus } from "@/types";
import { CheckCircle2, XCircle, Clock, Loader2, Circle, Hand } from "lucide-react";

const iconSize = "h-3.5 w-3.5";

const statusConfig: Record<string, { variant: "success" | "error" | "warning" | "info" | "pending"; icon: React.ReactNode; label: string; extraClass?: string }> = {
  completed: {
    variant: "success",
    icon: <CheckCircle2 className={cn(iconSize, "drop-shadow-[var(--drop-glow-success)]")} />,
    label: "Completed",
    extraClass: "ring-success/30 shadow-neon-glow-success-sm",
  },
  resolved: {
    variant: "success",
    icon: <CheckCircle2 className={cn(iconSize, "drop-shadow-[var(--drop-glow-success)]")} />,
    label: "Done",
    extraClass: "ring-success/30 shadow-neon-glow-success-sm",
  },
  ok: {
    variant: "success",
    icon: <CheckCircle2 className={cn(iconSize, "drop-shadow-[var(--drop-glow-success)]")} />,
    label: "OK",
    extraClass: "ring-success/30 shadow-neon-glow-success-sm",
  },
  failed: {
    variant: "error",
    icon: <XCircle className={cn(iconSize, "drop-shadow-[var(--drop-glow-error)]")} />,
    label: "Failed",
    extraClass: "ring-error/30 shadow-neon-glow-error-sm",
  },
  error: {
    variant: "error",
    icon: <XCircle className={cn(iconSize, "drop-shadow-[var(--drop-glow-error)]")} />,
    label: "Error",
    extraClass: "ring-error/30 shadow-neon-glow-error-sm",
  },
  waiting: {
    variant: "warning",
    icon: <Clock className={cn(iconSize, "drop-shadow-[var(--drop-glow-warning)]")} />,
    label: "Waiting",
    extraClass: "ring-warning/30 shadow-neon-glow-warning-sm",
  },
  waiting_breakpoint: {
    variant: "warning",
    icon: <Hand className={cn(iconSize, "animate-pulse drop-shadow-[var(--drop-glow-warning)]")} />,
    label: "Approval Needed",
    extraClass: "ring-warning/40 animate-breakpoint-glow",
  },
  waiting_task: {
    variant: "info",
    icon: <Loader2 className={cn(iconSize, "animate-spin drop-shadow-[var(--drop-glow-cyan)]")} />,
    label: "Working",
    extraClass: "ring-info/30 shadow-neon-glow-cyan-sm",
  },
  breakpoint_awaiting: {
    variant: "warning",
    icon: <Hand className={cn(iconSize, "animate-pulse drop-shadow-[var(--drop-glow-warning)]")} />,
    label: "Needs Approval",
    extraClass: "ring-warning/40 animate-breakpoint-glow",
  },
  requested: {
    variant: "info",
    icon: <Loader2 className={cn(iconSize, "animate-spin drop-shadow-[var(--drop-glow-cyan)]")} />,
    label: "Running",
    extraClass: "ring-info/30 shadow-neon-glow-cyan-sm",
  },
  pending: {
    variant: "pending",
    icon: <Circle className={iconSize} />,
    label: "Pending",
  },
};

interface StatusBadgeProps {
  status: RunStatus | TaskStatus | string;
  className?: string;
  waitingKind?: 'breakpoint' | 'task';
  isStale?: boolean;
}

export function StatusBadge({ status, className, waitingKind, isStale }: StatusBadgeProps) {
  // Resolve config: if status is "waiting" and a waitingKind is provided, use the sub-variant
  let config = statusConfig[status] || statusConfig.pending;
  if (status === "waiting" && waitingKind) {
    const subKey = `waiting_${waitingKind}`;
    config = statusConfig[subKey] || config;
  }

  // Detect orphaned/interrupted runs: stale with no pending work remaining
  const isInterrupted = isStale && (status === "pending" || (status === "waiting" && !waitingKind));

  return (
    <Badge
      data-testid={`status-badge-${status}`}
      variant={isStale ? "default" : config.variant}
      className={cn(
        "gap-1",
        isStale
          ? "opacity-60 text-zinc-500 ring-zinc-500/20 bg-zinc-500/10 shadow-none"
          : config.extraClass,
        className
      )}
    >
      {config.icon}
      {isInterrupted ? "Interrupted" : config.label}
    </Badge>
  );
}
