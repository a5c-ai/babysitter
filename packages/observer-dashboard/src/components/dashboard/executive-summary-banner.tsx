"use client";
import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RunStatus } from "@/types";

export interface ExecutiveSummaryMetrics {
  totalProjects: number;
  activeRuns: number;
  failedRuns: number;
  completedRuns: number;
  staleRuns: number;
  pendingBreakpoints: number;
}

type SeverityLevel = "healthy" | "amber" | "red";

interface SummaryIssue {
  text: string;
  filter: RunStatus | "stale" | null;
}

interface SummaryResult {
  severity: SeverityLevel;
  issues: SummaryIssue[];
  icon: React.ReactNode;
}

function deriveSummary(m: ExecutiveSummaryMetrics): SummaryResult {
  const issues: SummaryIssue[] = [];
  let severity: SeverityLevel = "healthy";

  // Red-level issues
  if (m.failedRuns > 0) {
    issues.push({
      text: `${m.failedRuns} run${m.failedRuns !== 1 ? "s" : ""} failing`,
      filter: "failed",
    });
    severity = "red";
  }

  // Amber-level issues
  if (m.pendingBreakpoints > 0) {
    issues.push({
      text: `${m.pendingBreakpoints} approval${m.pendingBreakpoints !== 1 ? "s" : ""} need${m.pendingBreakpoints === 1 ? "s" : ""} your attention`,
      filter: "waiting",
    });
    if (severity !== "red") severity = "amber";
  }

  if (m.staleRuns > 0) {
    issues.push({
      text: `${m.staleRuns} stale run${m.staleRuns !== 1 ? "s" : ""}`,
      filter: "stale",
    });
    if (severity !== "red") severity = "amber";
  }

  // Healthy
  if (issues.length === 0) {
    const projectLabel = m.totalProjects === 1 ? "project" : "projects";
    const text =
      m.activeRuns > 0
        ? `All ${m.totalProjects} ${projectLabel} healthy \u2014 ${m.activeRuns} run${m.activeRuns !== 1 ? "s" : ""} in progress`
        : `All ${m.totalProjects} ${projectLabel} healthy`;
    return {
      severity: "healthy",
      issues: [{ text, filter: null }],
      icon: <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />,
    };
  }

  const icon =
    severity === "red" ? (
      <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
    ) : (
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
    );

  return { severity, issues, icon };
}

const severityStyles: Record<
  SeverityLevel,
  { container: string; text: string; iconColor: string }
> = {
  healthy: {
    container:
      "border-success/25 bg-success-muted shadow-neon-glow-success-sm",
    text: "text-success",
    iconColor: "text-success",
  },
  amber: {
    container:
      "border-warning/25 bg-warning-muted shadow-neon-glow-warning-sm",
    text: "text-warning",
    iconColor: "text-warning",
  },
  red: {
    container: "border-error/25 bg-error-muted shadow-neon-glow-error-sm",
    text: "text-error",
    iconColor: "text-error",
  },
};

interface ExecutiveSummaryBannerProps {
  metrics: ExecutiveSummaryMetrics;
  onFilterChange?: (filter: RunStatus | "stale") => void;
  dismissed?: boolean;
  onDismiss?: () => void;
}

export function ExecutiveSummaryBanner({
  metrics,
  onFilterChange,
  dismissed,
  onDismiss,
}: ExecutiveSummaryBannerProps) {
  const summary = useMemo(() => deriveSummary(metrics), [metrics]);
  const styles = severityStyles[summary.severity];

  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="executive-summary-banner"
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-4 py-2.5 mb-6",
        "backdrop-blur-sm transition-all duration-300",
        styles.container
      )}
    >
      <span className={styles.iconColor}>{summary.icon}</span>
      <p
        className={cn(
          "text-sm font-medium leading-snug flex-1",
          styles.text
        )}
      >
        {summary.issues.map((issue, i) => (
          <span key={i}>
            {i > 0 && ", "}
            {issue.filter && onFilterChange ? (
              <button
                onClick={() => onFilterChange(issue.filter!)}
                className="underline decoration-dotted underline-offset-2 hover:decoration-solid transition-all"
              >
                {issue.text}
              </button>
            ) : (
              issue.text
            )}
          </span>
        ))}
      </p>
      {summary.severity !== "healthy" && onDismiss && (
        <button
          data-testid="executive-summary-dismiss"
          onClick={onDismiss}
          className={cn(
            "rounded-md p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors",
            styles.iconColor,
            "opacity-60 hover:opacity-100"
          )}
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
