"use client";
import { ArrowUpDown, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DashboardSortMode, DashboardStatusFilter } from "@/hooks/use-run-dashboard";

const filters: { label: string; value: DashboardStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "waiting" },
  { label: "Stale", value: "stale" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

export interface RunFilterBarProps {
  statusFilter: DashboardStatusFilter;
  onStatusFilterChange: (value: DashboardStatusFilter) => void;
  filterCounts: Record<DashboardStatusFilter, number>;
  sortMode: DashboardSortMode;
  onSortModeToggle: () => void;
  filteredProjectCount: number;
}

export function RunFilterBar({
  statusFilter,
  onStatusFilterChange,
  filterCounts,
  sortMode,
  onSortModeToggle,
  filteredProjectCount,
}: RunFilterBarProps) {
  return (
    <div className="mb-5">
      <div data-testid="filter-bar" className="flex items-center gap-1">
        {filters.map((f) => {
          const count = filterCounts[f.value] ?? 0;
          // Hide Stale filter pill when there are no stale runs
          if (f.value === "stale" && count === 0) return null;
          return (
            <button
              key={f.value}
              data-testid={`filter-pill-${f.value}`}
              aria-pressed={statusFilter === f.value}
              onClick={() => onStatusFilterChange(f.value)}
              className={cn(
                "rounded-md px-3 py-1.5 min-h-[44px] text-xs font-medium transition-all inline-flex items-center gap-1.5",
                statusFilter === f.value
                  ? f.value === "stale"
                    ? "bg-zinc-500/10 text-zinc-500"
                    : "bg-primary/10 text-primary shadow-neon-glow-primary-xs"
                  : "text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary"
              )}
            >
              {f.label}
              {count > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-px text-xs leading-tight font-semibold tabular-nums",
                  statusFilter === f.value
                    ? f.value === "stale"
                      ? "bg-zinc-500/20 text-zinc-500"
                      : "bg-primary/20 text-primary"
                    : "bg-background-secondary text-foreground-muted"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
        {/* Sort toggle + Project count */}
        <div className="ml-auto flex items-center gap-2">
          <button
            data-testid="sort-toggle"
            onClick={onSortModeToggle}
            className={cn(
              "rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium inline-flex items-center gap-1.5",
              "transition-all duration-200 ease-in-out",
              sortMode === "status"
                ? "bg-warning/10 border border-warning/30 text-warning hover:bg-warning/15 hover:border-warning/40 shadow-sm"
                : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 hover:border-primary/40 shadow-sm"
            )}
            title={sortMode === "status"
              ? "Currently sorting by status priority (active first, then failed, then completed). Click to switch to chronological activity view."
              : "Currently sorting by most recent activity (newest updates first). Click to switch to status-grouped view."
            }
          >
            {sortMode === "status" ? (
              <ArrowUpDown className="h-3 w-3 transition-transform duration-200" />
            ) : (
              <Clock className="h-3 w-3 transition-transform duration-200" />
            )}
            {sortMode === "status" ? "By Status" : "By Activity"}
          </button>
          <span data-testid="project-count" className="text-xs text-foreground-muted tabular-nums">
            {filteredProjectCount} project{filteredProjectCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
