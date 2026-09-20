"use client";
import { useState } from "react";
import Link from "next/link";
import { Wifi, AlertTriangle, AlarmClock, Terminal, Copy, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { friendlyProcessName, formatRelativeTime, formatWakeRelative } from "@/lib/utils";
import { useSmartPolling } from "@/hooks/use-smart-polling";
import { EmptyState } from "@/components/shared/empty-state";
import { TruncatedId } from "@/components/shared/truncated-id";
import type { DashboardStatusFilter } from "@/hooks/use-run-dashboard";
import type { LightRun, RunsListResponse } from "@/lib/services/run-query-service";

const PAGE_SIZE = 50;

/**
 * Whether a run is still in progress. Liveness ("live"/"orphaned") and the
 * resume/answer action hint are only meaningful for these runs — a terminal
 * run (completed/failed) has no attached orchestrator by definition.
 */
function isNonTerminal(run: LightRun): boolean {
  return run.status === "waiting" || run.status === "pending";
}

/** Whether a run is paused at a breakpoint waiting for a human decision. */
function isBreakpoint(run: LightRun): boolean {
  return isNonTerminal(run) && run.waitingKind === "breakpoint";
}

/** Whether a run has no live orchestrator attached. */
function isOrphaned(run: LightRun): boolean {
  return run.driver === "orphaned" || run.driver === "none";
}

/**
 * action-hint-gated-to-breakpoints: which rows get the ActionHint (resume/answer
 * guidance + copy-id). Breakpoint rows always do. Orphaned non-terminal rows do
 * too — an orphaned waiting run has no live driver, so it needs a "resume"
 * affordance even when it is not paused at a breakpoint. Terminal runs never do.
 */
function showsActionHint(run: LightRun): boolean {
  return isBreakpoint(run) || (isNonTerminal(run) && isOrphaned(run));
}

/**
 * Client-side ordering (spec): needs-you → orphaned → waiting → stale → rest.
 * The server already sorts by status priority; this refines the head of the
 * list to the spec order for the flat filtered view.
 */
function rank(run: LightRun): number {
  if (isBreakpoint(run)) return 0;
  // DC-3: the orphaned tier uses the same canonical predicate as the filter and
  // badge — a NON-terminal run with no live driver (driver "orphaned" OR "none",
  // via isOrphaned). The non-terminal guard keeps terminal driverless runs (most
  // completed runs report driver "none") out of the orphaned tier.
  if (isNonTerminal(run) && isOrphaned(run)) return 1;
  // sort-stale-tier-unreachable: test isStale BEFORE the waiting/pending branch.
  // Stale runs are themselves waiting/pending, so checking waiting first would
  // always score them as tier 2 and the 'stale' tier would be unreachable.
  if (run.isStale) return 3;
  if (run.status === "waiting" || run.status === "pending") return 2;
  return 4;
}

/** Inline driver-liveness chip derived from run.driver.
 * Exported for reuse by the kanban board card (SPEC-vibekanban §5 — same chip,
 * same sr-only expansions, not a reimplementation). */
export function LivenessChip({ run }: { run: LightRun }) {
  if (!run.driver) return null;
  if (run.driver === "scheduled") {
    // §15.1 (AC-84/85): a sleeping forever-run between ticks. This row-1 chip is
    // the compact STATUS GLANCE (one word, like the "orphaned" chip) — calm
    // "scheduled" for a future wake, DISTINCT amber "overdue" once the wake has
    // passed (never the dead-orphaned chip). The DETAILED "next run <rel>" /
    // "wake overdue <rel> — resume" affordance + copyable command live on the
    // card body (kanban-scheduled-badge), so the phrase renders exactly once.
    const wake = formatWakeRelative(run.sleepWakeAt);
    const overdue = wake.overdue && !!run.sleepWakeAt;
    return (
      <span
        data-status-badge
        data-scheduled-overdue={overdue ? "true" : undefined}
        className={cn(
          "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
          overdue
            ? "bg-status-attention-muted text-status-attention"
            : "bg-status-aged-muted text-status-aged"
        )}
        title={
          overdue
            ? "Scheduled forever-run: wake time passed; resume to continue (babysitter run:iterate)"
            : "Scheduled forever-run: sleeping between ticks; wakes on its own"
        }
      >
        <AlarmClock className="h-3 w-3" aria-hidden="true" focusable="false" />
        {overdue ? "overdue" : "scheduled"}
        <span className="sr-only">
          {overdue
            ? ": scheduled forever-run, wake time passed. Resume to continue"
            : ": scheduled forever-run, sleeping between ticks. Wakes on its own"}
        </span>
      </span>
    );
  }
  if (run.driver === "live") {
    return (
      // a11y-status-chip-title-only: expose the tooltip meaning to AT via sr-only
      // text (icon is decorative → a11y-icons-not-hidden).
      <span
        data-status-badge
        // UX-R3 wave 3: "live" now means real in-progress evidence — a live
        // run.lock OR recent journal activity within the freshness window (see
        // deriveLivenessFromActivity). Copy states the honest signal, not a lock.
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-status-alive-muted text-status-alive"
        title="In progress: recent activity means this run is actively being worked"
      >
        <Wifi className="h-3 w-3" aria-hidden="true" focusable="false" /> live
        <span className="sr-only">: in progress, recent activity means this run is actively being worked</span>
      </span>
    );
  }
  return (
    // a11y-status-chip-title-only / a11y-icons-not-hidden
    <span
      data-status-badge
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-status-stalled-muted text-status-stalled"
      title="No live orchestrator is attached. Resume the run to continue it"
    >
      <AlertTriangle className="h-3 w-3" aria-hidden="true" focusable="false" /> orphaned
      <span className="sr-only">: no live orchestrator is attached. Resume the run to continue it</span>
    </span>
  );
}

/**
 * Neutral status indicator for terminal runs (completed/failed). Liveness is
 * not meaningful here, so we never show the "orphaned" chip — just a subtle,
 * status-appropriate dot with the plain status label.
 * Exported for reuse by the kanban board card (SPEC-vibekanban §5).
 */
export function StatusDot({ run }: { run: LightRun }) {
  const failed = run.status === "failed";
  return (
    <span
      data-status-badge
      className={cn(
        "flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold",
        // UX-R2 §13.3: terminal failure red (--status-failed, full strength);
        // completed de-emphasizes with --status-aged text + a --status-ok dot.
        failed ? "bg-status-failed-muted text-status-failed" : "bg-status-aged-muted text-status-aged"
      )}
      title={`Run ${run.status}`}
    >
      <span className={cn("h-2 w-2 rounded-full", failed ? "bg-status-failed" : "bg-status-ok")} aria-hidden="true" />
      {/* a11y-status-chip-title-only: prefix the status word for AT context. */}
      <span className="sr-only">Run status: </span>
      {run.status}
    </span>
  );
}

/** Read-only action hint mirroring the breakpoint banner copy.
 * Exported for reuse by the kanban board card (SPEC-vibekanban §5 — the
 * Orphaned-column card shows the same resume-guidance + copy-id cluster). */
export function ActionHint({ run }: { run: LightRun }) {
  const [copied, setCopied] = useState(false);
  const orphaned = isOrphaned(run);

  const copyRunId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      navigator.clipboard?.writeText(run.runId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable (non-secure context) — non-fatal
    }
  };

  return (
    // relative z-10 keeps this interactive cluster clickable above the row's
    // stretched overlay link (see RunRow / a11y-nested-interactive-copy-btn).
    <div className="relative z-10 shrink-0 flex items-center gap-2" data-testid="run-action-hint">
      {orphaned ? (
        // a11y-status-chip-title-only / a11y-icons-not-hidden
        <span
          data-status-badge
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-status-stalled-muted text-status-stalled border border-status-stalled/30"
          // §13.4: the orphaned-semantics line replaces the old "an answer
          // won't be applied" wording — answers ARE recorded now, they apply
          // when the run is resumed.
          title="No live orchestrator is attached. Recorded now → applied when the run is resumed (babysitter run:iterate)."
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" focusable="false" /> No live driver. Resume to answer
          <span className="sr-only">: recorded now → applied when the run is resumed (babysitter run:iterate)</span>
        </span>
      ) : (
        // a11y-status-chip-title-only / a11y-icons-not-hidden
        <span
          data-status-badge
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-status-attention-muted text-status-attention border border-status-attention/30"
          title="Recorded to disk. The attached run picks it up on its next step."
        >
          <Terminal className="h-3.5 w-3.5" aria-hidden="true" focusable="false" /> Answer in terminal
          <span className="sr-only">: recorded to disk. The attached run picks it up on its next step.</span>
        </span>
      )}
      <button
        onClick={copyRunId}
        className="flex items-center gap-1 text-[10px] text-foreground-muted hover:text-foreground transition-colors"
        aria-label="Copy run id (resolve it with: babysitter run:iterate <run>)"
        title="Copy run id (resolve it with: babysitter run:iterate <run>)"
      >
        <Copy className="h-3 w-3" aria-hidden="true" focusable="false" /> {copied ? "copied" : "copy run id"}
      </button>
      {/* a11y-copy-no-live-announcement: confirm copy success to screen readers. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Run id copied" : ""}
      </span>
    </div>
  );
}

/** A single flat run row. */
function RunRow({ run }: { run: LightRun }) {
  // Liveness only applies to in-progress runs; terminal runs get a neutral dot.
  const nonTerminal = isNonTerminal(run);
  return (
    // a11y-no-list-semantics: each row is a listitem.
    // a11y-nested-interactive-copy-btn: the row is a non-anchor container with a
    // single stretched overlay link; interactive controls (copy button) render as
    // siblings outside the anchor, so there is no interactive-in-anchor nesting.
    <div
      role="listitem"
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2 rounded-md",
        "border border-border bg-card hover:bg-background-secondary transition-colors"
      )}
    >
      <Link
        href={`/runs/${run.runId}`}
        data-testid="run-row"
        aria-label={`Open run ${friendlyProcessName(run.processId)} (${run.runId.slice(0, 8)})`}
        className="absolute inset-0 z-0 rounded-md"
      />
      {nonTerminal ? <LivenessChip run={run} /> : <StatusDot run={run} />}
      <span className="text-sm font-medium text-foreground truncate">
        {friendlyProcessName(run.processId)}
      </span>
      {run.projectName && (
        <span className="flex items-center gap-1 text-xs text-foreground-muted truncate">
          <Tag className="h-3 w-3 shrink-0" aria-hidden="true" focusable="false" />
          {run.projectName}
        </span>
      )}
      {/* Copy-full-run-id affordance: hover shows the full id, click copies it
          (inline TruncatedId renders at z-10 above the overlay link). */}
      <TruncatedId
        id={run.runId}
        display={run.runId.slice(0, 8)}
        variant="inline"
        className="text-xs text-info"
      />
      <span className="text-xs text-foreground-muted tabular-nums">
        {formatRelativeTime(run.updatedAt)}
      </span>
      <div className="relative z-10 ml-auto flex items-center gap-2">
        {showsActionHint(run) && <ActionHint run={run} />}
      </div>
    </div>
  );
}

export interface RunListProps {
  status: DashboardStatusFilter;
}

/**
 * Flat, self-fetching run list for a single status filter.
 * Fetches `/api/runs` (default mode → RunQueryService.listAllRuns) with a
 * growing-window pagination (limit grows with page, offset stays 0) so the
 * polling URL stays stable/keyed per page.
 */
export function RunList({ status }: RunListProps) {
  const [page, setPage] = useState(0);

  const params = new URLSearchParams({
    status,
    sort: "status",
    limit: String(PAGE_SIZE * (page + 1)),
    offset: "0",
    search: "",
  });
  const url = `/api/runs?${params.toString()}`;

  const sseFilter = (event: { type: string }) =>
    event.type === "update" || event.type === "new-run";
  const { data, loading, error } = useSmartPolling<RunsListResponse>(url, { sseFilter });

  if (loading && !data) {
    return (
      // a11y-loading-not-announced: expose the fetching state to AT.
      <div className="flex flex-col gap-2" data-testid="run-list-loading" aria-busy="true">
        <span role="status" className="sr-only">
          Loading runs
        </span>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-11 rounded-md border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="run-list-error"
        className="rounded-lg border border-error/20 bg-error-muted p-4 text-sm text-error"
      >
        Failed to load runs: {error}
      </div>
    );
  }

  const runs = data?.runs ?? [];
  const totalCount = data?.totalCount ?? 0;

  if (runs.length === 0) {
    return <EmptyState />;
  }

  const sorted = [...runs].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });

  const hasMore = runs.length < totalCount;

  return (
    // a11y-no-list-semantics: give the flat list list/listitem semantics.
    <div className="flex flex-col gap-2" data-testid="run-list" role="list">
      {sorted.map((run) => (
        <RunRow key={run.runId} run={run} />
      ))}
      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="mt-2 px-4 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors rounded-md"
        >
          Load more ({totalCount - runs.length} remaining)
        </button>
      )}
    </div>
  );
}
