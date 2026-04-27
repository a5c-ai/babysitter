"use client";
import { memo } from "react";
import { cn } from "@/lib/cn";
import { GitBranch } from "lucide-react";
import type { ReactNode } from "react";

interface ParallelGroupProps {
  children: ReactNode;
  count: number;
  className?: string;
}

/**
 * Visual wrapper that groups tasks detected as running in parallel.
 * Shows a dashed border container with a "parallel" label and renders
 * the grouped StepCards inside.
 */
export const ParallelGroup = memo(function ParallelGroup({ children, count, className }: ParallelGroupProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-dashed border-secondary/20 bg-secondary/[0.03] p-3 pt-7",
        className
      )}
    >
      {/* Label */}
      <div className="absolute top-1.5 left-2.5 flex items-center gap-1 text-xs leading-tight font-medium text-info uppercase tracking-wider select-none">
        <GitBranch className="h-3 w-3 text-info" />
        <span>parallel</span>
        <span className="text-foreground-muted">&middot; {count} tasks</span>
      </div>

      {/* Grouped task cards */}
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
});
