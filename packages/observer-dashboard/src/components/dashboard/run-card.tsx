"use client";
import { memo } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SessionPill } from "@/components/shared/session-pill";
import { TruncatedId } from "@/components/shared/truncated-id";
import { ProgressBar } from "@/components/shared/progress-bar";
import { formatDuration, friendlyProcessName, formatRelativeTime } from "@/lib/utils";
import type { Run } from "@/types";
import { Clock, Layers, Hand, AlertCircle, Tag, ExternalLink } from "lucide-react";

interface RunCardProps {
  run: Run;
  selected?: boolean;
}

/** Map run status to progress bar variant */
function progressVariant(status: Run["status"]): "default" | "success" | "error" | "warning" {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "waiting":
      return "warning";
    default:
      return "default";
  }
}

/** Compute display progress: completed runs always show 100% */
function displayProgress(run: Run): number {
  if (run.status === "completed") return 100;
  if (run.totalTasks > 0) return Math.round((run.completedTasks / run.totalTasks) * 100);
  return 0;
}

/** Format stale time: "Stale (2h ago)", "Stale (1d ago)" */
function formatStaleTime(updatedAt: string): string {
  const relative = formatRelativeTime(updatedAt);
  return relative ? `Stale (${relative})` : "Stale";
}

/**
 * Shallow comparison of Run props to prevent unnecessary re-renders.
 * Checks key fields that affect visual output rather than deep-comparing
 * the entire run object (which includes tasks[] and events[]).
 */
function runCardPropsAreEqual(prev: RunCardProps, next: RunCardProps): boolean {
  if (prev.selected !== next.selected) return false;
  const a = prev.run;
  const b = next.run;
  return (
    a.runId === b.runId &&
    a.status === b.status &&
    a.updatedAt === b.updatedAt &&
    a.completedTasks === b.completedTasks &&
    a.totalTasks === b.totalTasks &&
    a.duration === b.duration &&
    a.isStale === b.isStale &&
    a.waitingKind === b.waitingKind &&
    a.breakpointQuestion === b.breakpointQuestion &&
    a.failedStep === b.failedStep &&
    a.failureMessage === b.failureMessage
  );
}

export const RunCard = memo(function RunCard({ run, selected }: RunCardProps) {
  const progress = displayProgress(run);
  const isActive = run.status === "waiting" || run.status === "pending";
  const isStale = run.isStale === true;

  // Find the first breakpoint task that is waiting for approval
  const pendingBreakpoint = run.tasks.find(
    (t) => t.kind === "breakpoint" && t.status === "requested"
  );
  // Prefer run-level breakpointQuestion, fall back to task-level
  const breakpointQuestion = run.breakpointQuestion ?? pendingBreakpoint?.breakpointQuestion;

  // A breakpoint is active if: there's a pending breakpoint task OR the run is waiting on a breakpoint
  const hasActiveBreakpoint = !isStale && (
    !!pendingBreakpoint ||
    (run.status === "waiting" && run.waitingKind === "breakpoint")
  );

  // Failure point text: prefer run-level failedStep, then construct from failureMessage
  const failedStep = run.status === "failed"
    ? run.failedStep || (run.failureMessage ? `${run.failureMessage}` : undefined)
    : undefined;

  return (
    <Link href={`/runs/${run.runId}`}>
      <Card className={cn(
        "cursor-pointer p-4 transition-all card-hover-lift",
        "hover:shadow-glow-primary/30",
        selected && "ring-1 ring-primary shadow-glow-primary",
        isActive && !isStale && !hasActiveBreakpoint && "border-[var(--border-hover)]",
        hasActiveBreakpoint && "border-warning/40 shadow-glow-warning ring-1 ring-warning/20 animate-breakpoint-glow",
        isStale && "opacity-50"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Row 1: Title on its own row for readability */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn(
                "h-2 w-2 rounded-full shrink-0",
                isStale
                  ? "bg-zinc-500"
                  : hasActiveBreakpoint ? "bg-warning shadow-[0_0_8px_var(--warning)] animate-pulse-dot" :
                    run.status === "completed" ? "bg-success shadow-[0_0_6px_var(--success)]" :
                    run.status === "failed" ? "bg-error shadow-[0_0_6px_var(--error)]" :
                    run.status === "waiting" ? "bg-warning shadow-[0_0_6px_var(--warning)] animate-pulse-dot" :
                    "bg-pending"
              )} />
              <span className="text-base font-medium text-foreground truncate">
                {friendlyProcessName(run.processId)}
              </span>
              {hasActiveBreakpoint && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 border border-warning/30 px-2 py-0.5 text-xs leading-tight font-bold text-warning uppercase tracking-wider shrink-0 animate-pulse-dot">
                  <Hand className="h-2.5 w-2.5" />
                  Approval Required
                </span>
              )}
            </div>
            {/* Row 2: Status badges and tags */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge
                status={run.status}
                waitingKind={run.waitingKind}
                isStale={isStale}
              />
              {isStale && (
                <span className="inline-flex items-center rounded-full bg-zinc-500/10 border border-zinc-500/20 px-2 py-0.5 text-xs leading-tight font-medium text-zinc-500 shrink-0">
                  {formatStaleTime(run.updatedAt)}
                </span>
              )}
              <TruncatedId id={run.runId} chars={4} className="text-foreground-secondary" />
              {run.projectName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-background-secondary px-2 py-0.5 text-xs leading-tight font-medium text-foreground-muted shrink-0">
                  <Tag className="h-2.5 w-2.5" />
                  {run.projectName}
                </span>
              )}
            </div>
            {/* Inline failure point for failed runs */}
            {failedStep && (
              <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md bg-error-muted border border-error/20 border-l-2 border-l-error shadow-glow-error">
                <AlertCircle className="h-3.5 w-3.5 text-error shrink-0" />
                <span className="text-xs text-error truncate">
                  Failed at: {failedStep.length > 80 ? failedStep.slice(0, 80) + "..." : failedStep}
                </span>
              </div>
            )}
            {/* Breakpoint question panel — prominent display */}
            {hasActiveBreakpoint && breakpointQuestion && (
              <div className="mt-2 px-3 py-2 rounded-md bg-warning-muted border border-warning/25 border-l-2 border-l-warning shadow-breakpoint-glow">
                <div className="flex items-start gap-2">
                  <Hand className="h-4 w-4 text-warning shrink-0 mt-0.5 animate-pulse-dot" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-warning uppercase tracking-wider block mb-0.5">
                      Awaiting approval
                    </span>
                    <span className="text-sm text-foreground leading-snug block">
                      {breakpointQuestion}
                    </span>
                  </div>
                  <span className={cn(
                    "shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md",
                    "bg-warning/10 border border-warning/20",
                    "text-xs font-semibold text-warning",
                    "hover:bg-warning/20 transition-colors"
                  )}>
                    Review & Approve
                    <ExternalLink className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>
            )}
            {/* Breakpoint without question text — still show indicator */}
            {hasActiveBreakpoint && !breakpointQuestion && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-md bg-warning-muted border border-warning/25 border-l-2 border-l-warning shadow-breakpoint-glow">
                <Hand className="h-4 w-4 text-warning shrink-0 animate-pulse-dot" />
                <span className="text-xs font-semibold text-warning">
                  Approval needed
                </span>
                <span className={cn(
                  "ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md",
                  "bg-warning/10 border border-warning/20",
                  "text-xs font-semibold text-warning"
                )}>
                  Review & Approve
                  <ExternalLink className="h-2.5 w-2.5" />
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-foreground-muted">
              <SessionPill sessionId={run.sessionId} active={isActive && !isStale} />
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {run.completedTasks}/{run.totalTasks} tasks
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(run.duration)}
              </span>
            </div>
          </div>
        </div>
        {/* Task 1.8 — Show progress bar for ALL runs, not just active */}
        {run.totalTasks > 0 && (
          <ProgressBar value={progress} variant={progressVariant(run.status)} glow={isActive && !isStale} className="mt-4" />
        )}
      </Card>
    </Link>
  );
}, runCardPropsAreEqual);
