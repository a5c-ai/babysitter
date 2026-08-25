"use client";
import {
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import type { DashboardMetrics, DashboardStatusFilter } from "@/hooks/use-run-dashboard";

// ---------------------------------------------------------------------------
// MetricTile (internal)
// ---------------------------------------------------------------------------

interface MetricTileProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "error" | "muted";
  pulse?: boolean;
  testId?: string;
  active?: boolean;
  onClick?: () => void;
}

const colorMap: Record<MetricTileProps["color"], { text: string; bg: string; glow: string; borderL: string; ring: string }> = {
  primary: { text: "text-primary", bg: "bg-primary/10", glow: "", borderL: "", ring: "ring-primary/50" },
  success: { text: "text-success", bg: "bg-success/10", glow: "", borderL: "border-l-success/60", ring: "ring-success/50" },
  warning: { text: "text-warning", bg: "bg-warning/10", glow: "shadow-[0_0_8px_var(--warning)]", borderL: "border-l-warning/60", ring: "ring-warning/50" },
  error: { text: "text-error", bg: "bg-error/10", glow: "", borderL: "border-l-error/60", ring: "ring-error/50" },
  muted: { text: "text-zinc-500", bg: "bg-zinc-500/10", glow: "", borderL: "border-l-zinc-500/60", ring: "ring-zinc-500/50" },
};

function MetricTile({ label, value, icon, color, pulse, testId, active, onClick }: MetricTileProps) {
  const c = colorMap[color];
  const isClickable = !!onClick;
  // Animate the number so jumps like 48->91 feel smooth instead of jarring
  const displayValue = useAnimatedNumber(value);
  return (
    <div
      data-testid={testId}
      role={isClickable ? "button" : undefined}
      aria-pressed={isClickable ? !!active : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      className={cn(
        "rounded-lg border border-border bg-card/80 backdrop-blur-sm p-3 flex items-center gap-3 transition-all",
        value > 0 && color !== "primary" && "border-l-2",
        value > 0 && color !== "primary" && c.borderL,
        isClickable && "cursor-pointer hover:bg-background-secondary/50",
        active && "ring-2",
        active && c.ring,
      )}
    >
      <div className={cn("rounded-md p-2", c.bg)}>
        <span className={cn(c.text, pulse && "animate-pulse-dot")}>{icon}</span>
      </div>
      <div>
        <p className={cn("text-lg font-bold tabular-nums leading-none mb-0.5", c.text)}>
          {displayValue}
        </p>
        <p className="text-xs leading-tight text-foreground-muted uppercase tracking-wider font-medium">
          {label}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KpiGrid (public)
// ---------------------------------------------------------------------------

export interface KpiGridProps {
  metrics: DashboardMetrics;
  statusFilter: DashboardStatusFilter;
  hasStaleRuns: boolean;
  onToggleFilter: (filter: DashboardStatusFilter) => void;
}

export function KpiGrid({ metrics, statusFilter, hasStaleRuns, onToggleFilter }: KpiGridProps) {
  const kpiCols = hasStaleRuns ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4";

  return (
    <div data-testid="kpi-grid" aria-live="polite" aria-label="Key metrics" className={cn("grid gap-3 mb-6", kpiCols)}>
      <MetricTile
        label="Total Runs"
        value={metrics.totalRuns}
        icon={<Layers className="h-4 w-4" />}
        color="primary"
        testId="metric-tile-total-runs"
        onClick={() => onToggleFilter("all")}
        active={statusFilter === "all"}
      />
      <MetricTile
        label="In Progress"
        value={metrics.activeRuns}
        icon={<Activity className="h-4 w-4" />}
        color="warning"
        pulse={metrics.activeRuns > 0}
        testId="metric-tile-active"
        onClick={() => onToggleFilter("waiting")}
        active={statusFilter === "waiting"}
      />
      {hasStaleRuns && (
        <MetricTile
          label="Stale"
          value={metrics.staleRuns}
          icon={<Pause className="h-4 w-4" />}
          color="muted"
          testId="metric-tile-stale"
          onClick={() => onToggleFilter("stale")}
          active={statusFilter === "stale"}
        />
      )}
      <MetricTile
        label="Completed"
        value={metrics.completedRuns}
        icon={<CheckCircle2 className="h-4 w-4" />}
        color="success"
        testId="metric-tile-completed"
        onClick={() => onToggleFilter("completed")}
        active={statusFilter === "completed"}
      />
      <MetricTile
        label="Failed"
        value={metrics.failedRuns}
        icon={<AlertCircle className="h-4 w-4" />}
        color="error"
        testId="metric-tile-failed"
        onClick={() => onToggleFilter("failed")}
        active={statusFilter === "failed"}
      />
    </div>
  );
}
