"use client";
import { Search, FolderOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RunStatus } from "@/types";

const filters: { label: string; value: RunStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "waiting" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: RunStatus | "all";
  onStatusFilterChange: (value: RunStatus | "all") => void;
  searchRef?: React.RefObject<HTMLInputElement>;
  groupByProject?: boolean;
  onGroupByProjectChange?: (value: boolean) => void;
}

export function SearchFilter({ search, onSearchChange, statusFilter, onStatusFilterChange, searchRef, groupByProject = false, onGroupByProjectChange }: SearchFilterProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search runs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full rounded-md border border-border bg-background-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 focus:shadow-neon-glow-primary-focus transition-all"
        />
      </div>
      <div className="flex items-center gap-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onStatusFilterChange(f.value)}
            className={cn(
              "rounded-md px-3 py-1.5 min-h-[44px] text-xs font-medium transition-all",
              statusFilter === f.value
                ? "bg-primary/15 text-primary shadow-neon-glow-primary-ring"
                : "text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {onGroupByProjectChange && (
        <button
          onClick={() => onGroupByProjectChange(!groupByProject)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 min-h-[44px] text-xs font-medium transition-all",
            groupByProject
              ? "bg-primary/15 text-primary shadow-neon-glow-primary-ring"
              : "text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary"
          )}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Group
        </button>
      )}
    </div>
  );
}
