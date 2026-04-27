"use client";
import { cn } from "@/lib/cn";

interface ProjectSectionHeaderProps {
  projectName: string;
  activeRuns: number;
  completedRuns: number;
  failedRuns: number;
  totalRuns: number;
  latestUpdate?: string;
  className?: string;
}

function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    if (diffMs < 0) return "just now";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

export function ProjectSectionHeader({
  projectName,
  activeRuns,
  completedRuns,
  failedRuns,
  totalRuns,
  latestUpdate,
  className,
}: ProjectSectionHeaderProps) {
  return (
    <div className={cn("flex flex-1 items-center gap-3 min-w-0", className)}>
      <span className="font-semibold text-sm text-foreground truncate border-l-2 border-primary pl-2 transition-all hover:neon-text-subtle">
        {projectName}
      </span>

      <div className="flex items-center gap-1.5 shrink-0">
        {activeRuns > 0 && (
          <span className="inline-flex items-center rounded-full bg-warning-muted px-2 py-0.5 text-[11px] font-medium text-warning shadow-neon-glow-warning-xs">
            {activeRuns} active
          </span>
        )}
        {completedRuns > 0 && (
          <span className="inline-flex items-center rounded-full bg-success-muted px-2 py-0.5 text-[11px] font-medium text-success">
            {completedRuns} completed
          </span>
        )}
        {failedRuns > 0 && (
          <span className="inline-flex items-center rounded-full bg-error-muted px-2 py-0.5 text-[11px] font-medium text-error shadow-neon-glow-error-xs">
            {failedRuns} failed
          </span>
        )}
      </div>

      <span className="ml-auto text-xs leading-tight text-foreground-muted shrink-0 tabular-nums">
        {totalRuns} run{totalRuns !== 1 ? "s" : ""}
        {latestUpdate && ` \u00b7 ${formatRelativeTime(latestUpdate)}`}
      </span>
    </div>
  );
}
