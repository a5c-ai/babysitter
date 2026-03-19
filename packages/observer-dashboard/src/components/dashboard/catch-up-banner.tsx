"use client";
import { RefreshCw, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CatchUpState } from "@/hooks/use-batched-updates";

/** Lightweight snapshot of dashboard KPIs shown inside the catch-up banner. */
export interface CatchUpSummary {
  failedRuns: number;
  completedRuns: number;
  pendingBreakpoints: number;
}

export interface CatchUpBannerProps {
  catchUp: CatchUpState;
  /** Optional summary metrics to give the user quick context about what happened. */
  summary?: CatchUpSummary;
}

/**
 * Builds a concise, human-readable summary string from dashboard metrics.
 * Returns null when there is nothing noteworthy to report.
 */
function buildSummaryText(summary: CatchUpSummary | undefined): string | null {
  if (!summary) return null;
  const parts: string[] = [];
  if (summary.failedRuns > 0) {
    parts.push(`${summary.failedRuns} failed`);
  }
  if (summary.pendingBreakpoints > 0) {
    parts.push(`${summary.pendingBreakpoints} awaiting input`);
  }
  if (summary.completedRuns > 0) {
    parts.push(`${summary.completedRuns} completed`);
  }
  if (parts.length === 0) return null;
  return parts.join(", ");
}

/**
 * Subtle notification shown when the dashboard detects a burst of SSE updates
 * (catch-up mode). Displays the number of buffered updates, an optional
 * summary of what happened, and a "refresh now" button to immediately apply
 * all pending changes.
 */
export function CatchUpBanner({ catchUp, summary }: CatchUpBannerProps) {
  if (!catchUp.active) return null;

  const summaryText = buildSummaryText(summary);

  return (
    <div
      data-testid="catch-up-banner"
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 mb-4 rounded-lg",
        "bg-info-muted border border-info/20",
        "animate-in fade-in slide-in-from-top-2 duration-300"
      )}
    >
      <div className="rounded-md p-1.5 bg-info/10">
        <Inbox className="h-4 w-4 text-info" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-semibold tabular-nums">{catchUp.bufferedCount}</span>
          {" "}runs updated while you were away
        </p>
        {summaryText && (
          <p data-testid="catch-up-summary" className="text-xs text-foreground-muted mt-0.5 truncate">
            {summaryText}
          </p>
        )}
      </div>
      <button
        onClick={catchUp.flush}
        data-testid="catch-up-refresh-btn"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
          "bg-info/10 border border-info/20 text-info",
          "hover:bg-info/20 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/50"
        )}
      >
        <RefreshCw className="h-3 w-3" />
        Refresh now
      </button>
    </div>
  );
}
