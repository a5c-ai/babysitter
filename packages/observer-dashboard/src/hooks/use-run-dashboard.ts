"use client";
import { useState, useMemo, useCallback, useRef } from "react";
import { useProjects } from "./use-projects";
import { useAllRuns } from "./use-all-runs";
import { useBatchedUpdates, type CatchUpState } from "./use-batched-updates";
import { usePersistedState } from "./use-persisted-state";
import type { RunStatus, ProjectSummary, BreakpointRunInfo } from "@/types";
import type { ExecutiveSummaryMetrics } from "@/components/dashboard/executive-summary-banner";
import {
  computeReconciledCounts,
  metricsFromReconciled,
  type ReconciledCounts,
} from "@/lib/counting/run-classification";

/** Aggregated KPI metrics across all projects. */
export interface DashboardMetrics {
  totalRuns: number;
  activeRuns: number;
  completedRuns: number;
  failedRuns: number;
  staleRuns: number;
  totalTasks: number;
  completedTasks: number;
}

export type DashboardSortMode = "status" | "activity";
export type DashboardStatusFilter = RunStatus | "all" | "stale" | "needsyou" | "orphaned";

export interface UseRunDashboardReturn {
  // Data
  projects: ProjectSummary[];
  loading: boolean;
  error: string | null | undefined;
  metrics: DashboardMetrics;
  allBreakpointRuns: BreakpointRunInfo[];
  summaryMetrics: ExecutiveSummaryMetrics;
  bannerFingerprint: string;
  bannerDismissed: boolean;
  filterCounts: Record<DashboardStatusFilter, number>;
  /**
   * §15.4 reconciled per-status breakdown (pill === column + underNeedsYou +
   * fromHidden + hiddenCollapsed). Lets the pills/tiles disclose the deltas so
   * a bare number never contradicts a column.
   */
  reconciledCounts: ReconciledCounts;
  filteredProjects: ProjectSummary[];
  activeProjects: ProjectSummary[];
  historyProjects: ProjectSummary[];
  /** Number of registry-hidden projects (grid-hidden, still on the alarm surface). */
  hiddenProjectCount: number;

  // State
  statusFilter: DashboardStatusFilter;
  sortMode: DashboardSortMode;
  historyCollapsed: boolean;
  cardStatusFilter: RunStatus | "all";
  hasStaleRuns: boolean;

  // Catch-up mode
  catchUp: CatchUpState;

  // Actions
  setStatusFilter: (value: DashboardStatusFilter) => void;
  setSortMode: (value: DashboardSortMode | ((prev: DashboardSortMode) => DashboardSortMode)) => void;
  setHistoryCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  setDismissedFingerprint: (value: string | null | ((prev: string | null) => string | null)) => void;
  toggleMetricFilter: (filter: DashboardStatusFilter) => void;
  handleHideProject: (projectName: string) => void;
}

export function useRunDashboard(): UseRunDashboardReturn {
  // Use a ref to bridge the circular dependency between useBatchedUpdates.onFlush
  // and the refresh function returned by useProjects.
  const refreshRef = useRef<() => void>(() => {});

  // Monitor SSE event rate and activate catch-up mode during bursts.
  // When catch-up is active, useProjects suppresses SSE-triggered refetches
  // so the UI stays calm until the user clicks "refresh now" or the burst subsides.
  const sseFilter = useCallback(
    (event: { type: string }) => event.type === "update" || event.type === "new-run",
    []
  );
  const catchUp = useBatchedUpdates({
    sseFilter,
    onFlush: () => refreshRef.current(),
  });

  const { projects, recentCompletionWindowMs, loading, error, refresh } = useProjects(
    5000,
    catchUp.active
  );
  refreshRef.current = refresh;

  // §15.4 SINGLE counting source: the tiles/banner/pills reconcile against the
  // SAME full runs the board sees (not the digest), so no surface can diverge.
  const { runs: allRuns } = useAllRuns(catchUp.active);

  const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>("all");
  const [sortMode, setSortMode] = usePersistedState<DashboardSortMode>("observer:sort-mode", "status");
  const [dismissedFingerprint, setDismissedFingerprint] = usePersistedState<string | null>("banner-dismissed-fingerprint", null);

  // Toggle filter from metric tile: clicking active filter clears it
  const toggleMetricFilter = useCallback((filter: DashboardStatusFilter) => {
    setStatusFilter((prev) => (prev === filter ? "all" : filter));
  }, []);

  const handleHideProject = useCallback((_projectName: string) => {
    refresh();
  }, [refresh]);

  // QA F4: /api/runs?mode=projects now returns hidden projects annotated with
  // hidden:true instead of dropping them. Hiding affects the project GRID only;
  // the alarm surface (needs-you banner + needs-you counts) must still see
  // hidden projects, or a hidden project with a pending breakpoint silently
  // disappears from "needs you" while search still finds its runs.
  const visibleProjects = useMemo(
    () => projects.filter((p) => !p.hidden),
    [projects]
  );
  const hiddenProjectCount = projects.length - visibleProjects.length;

  // §6.3: registry-hidden project NAMES — the single scope declaration the
  // counting source uses so tiles/pills/banner apply hiding exactly like the
  // board (no more three-different-scopes divergence, §15.1).
  const hiddenProjectNames = useMemo(
    () => new Set(projects.filter((p) => p.hidden).map((p) => p.projectName)),
    [projects]
  );

  // §15.4 THE single counting source: classify the full runs ONCE and let every
  // surface read the reconciled result. Guarantees pill === column + disclosed
  // deltas (AC-70..AC-77).
  const reconciledCounts = useMemo<ReconciledCounts>(
    () => computeReconciledCounts(allRuns, { hiddenProjects: hiddenProjectNames }),
    [allRuns, hiddenProjectNames]
  );

  // Task-level aggregates stay digest-sourced (they are not a per-run bucket
  // count and never appear on the board columns). Run counts come from the
  // single source above.
  const metrics = useMemo<DashboardMetrics>(() => {
    const m = metricsFromReconciled(reconciledCounts);
    const totalTasks = visibleProjects.reduce((s, p) => s + p.totalTasks, 0);
    const completedTasks = visibleProjects.reduce((s, p) => s + p.completedTasksAggregate, 0);
    return {
      totalRuns: m.totalRuns,
      activeRuns: m.activeRuns,
      completedRuns: m.completedRuns,
      failedRuns: m.failedRuns,
      staleRuns: m.staleRuns,
      totalTasks,
      completedTasks,
    };
  }, [reconciledCounts, visibleProjects]);

  // Collect all breakpoint runs across ALL projects — including hidden ones.
  // The needs-you banner is an alarm surface, not a grid view (QA F4).
  const allBreakpointRuns = useMemo<BreakpointRunInfo[]>(() => {
    return projects.flatMap((p) => p.breakpointRuns ?? []);
  }, [projects]);

  // Executive summary metrics for the banner — same reconciled source as the
  // tiles/pills. pendingBreakpoints is the full-run needs-you count (incl.
  // recordedAwaitingResume + hidden approvals), so the banner === the needs-you
  // pill === the needs-you column (§15.3 GAP-1 closed, AC-70).
  const summaryMetrics = useMemo<ExecutiveSummaryMetrics>(() => ({
    totalProjects: visibleProjects.length,
    activeRuns: metrics.activeRuns,
    failedRuns: metrics.failedRuns,
    completedRuns: metrics.completedRuns,
    staleRuns: metrics.staleRuns,
    pendingBreakpoints: reconciledCounts.needsyou.pill,
  }), [reconciledCounts, visibleProjects, metrics]);

  // Fingerprint for banner dismiss
  const bannerFingerprint = `${summaryMetrics.failedRuns}-${summaryMetrics.staleRuns}-${summaryMetrics.pendingBreakpoints}`;
  const bannerDismissed = dismissedFingerprint === bannerFingerprint;

  // Pills read the SAME reconciled source — pill(S) === board column(S) + the
  // disclosed hidden/absorbed deltas (AC-70..AC-77).
  const filterCounts = useMemo(() => {
    return {
      all: reconciledCounts.all.pill,
      waiting: reconciledCounts.waiting.pill,
      stale: reconciledCounts.stale.pill,
      completed: reconciledCounts.completed.pill,
      failed: reconciledCounts.failed.pill,
      pending: 0,
      needsyou: reconciledCounts.needsyou.pill,
      orphaned: reconciledCounts.orphaned.pill,
    } as Record<DashboardStatusFilter, number>;
  }, [reconciledCounts]);

  // Filter projects by status counts. The grid excludes hidden projects,
  // EXCEPT under the "needsyou" alarm filter where a hidden project with a
  // pending breakpoint must still surface (count === grid === flat list).
  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return visibleProjects;
    if (statusFilter === "stale") return visibleProjects.filter((p) => p.staleRuns > 0);
    if (statusFilter === "needsyou") return projects.filter((p) => (p.pendingBreakpoints ?? 0) > 0);
    if (statusFilter === "orphaned")
      return visibleProjects.filter((p) => (p.orphanedRuns ?? 0) > 0);
    return visibleProjects.filter((project) => {
      if (statusFilter === "waiting") return project.activeRuns > 0;
      if (statusFilter === "completed") return project.completedRuns > 0;
      if (statusFilter === "failed") return project.failedRuns > 0;
      return false;
    });
  }, [projects, visibleProjects, statusFilter]);

  // Determine the status filter to pass to ProjectHealthCard.
  // "stale"/"needsyou"/"orphaned" are cross-status views → show all runs in the matching projects.
  const cardStatusFilter: RunStatus | "all" =
    statusFilter === "stale" || statusFilter === "needsyou" || statusFilter === "orphaned"
      ? "all"
      : statusFilter;

  // Split filtered projects into sections based on sort mode
  const { activeProjects, historyProjects } = useMemo(() => {
    const now = Date.now();
    if (sortMode === "activity") {
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const recent = filteredProjects.filter((p) =>
        now - new Date(p.latestUpdate).getTime() < twentyFourHours
      );
      const earlier = filteredProjects.filter((p) =>
        now - new Date(p.latestUpdate).getTime() >= twentyFourHours
      );
      return { activeProjects: recent, historyProjects: earlier };
    }
    const active = filteredProjects.filter((p) =>
      p.activeRuns > 0 || p.staleRuns > 0 ||
      (now - new Date(p.latestUpdate).getTime() < recentCompletionWindowMs)
    );
    const history = filteredProjects.filter((p) =>
      p.activeRuns === 0 && p.staleRuns === 0 &&
      (now - new Date(p.latestUpdate).getTime() >= recentCompletionWindowMs)
    );
    return { activeProjects: active, historyProjects: history };
  }, [filteredProjects, recentCompletionWindowMs, sortMode]);

  const [historyCollapsed, setHistoryCollapsed] = usePersistedState(
    "observer:history-collapsed",
    historyProjects.length > 5
  );

  const hasStaleRuns = metrics.staleRuns > 0;

  return {
    projects,
    loading,
    error,
    metrics,
    allBreakpointRuns,
    summaryMetrics,
    bannerFingerprint,
    bannerDismissed,
    filterCounts,
    reconciledCounts,
    filteredProjects,
    activeProjects,
    historyProjects,
    hiddenProjectCount,
    statusFilter,
    sortMode,
    historyCollapsed,
    cardStatusFilter,
    hasStaleRuns,
    catchUp,
    setStatusFilter,
    setSortMode,
    setHistoryCollapsed,
    setDismissedFingerprint,
    toggleMetricFilter,
    handleHideProject,
  };
}
