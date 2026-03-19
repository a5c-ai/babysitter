"use client";
import { useState, useMemo, useCallback, useRef } from "react";
import { useProjects } from "./use-projects";
import { useBatchedUpdates, type CatchUpState } from "./use-batched-updates";
import { usePersistedState } from "./use-persisted-state";
import type { RunStatus, ProjectSummary, BreakpointRunInfo } from "@/types";
import type { ExecutiveSummaryMetrics } from "@/components/dashboard/executive-summary-banner";

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
export type DashboardStatusFilter = RunStatus | "all" | "stale";

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
  filteredProjects: ProjectSummary[];
  activeProjects: ProjectSummary[];
  historyProjects: ProjectSummary[];

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

  // Aggregate metrics across all projects
  const metrics = useMemo<DashboardMetrics>(() => {
    const totalRuns = projects.reduce((s, p) => s + p.totalRuns, 0);
    const activeRuns = projects.reduce((s, p) => s + p.activeRuns, 0);
    const completedRuns = projects.reduce((s, p) => s + p.completedRuns, 0);
    const failedRuns = projects.reduce((s, p) => s + p.failedRuns, 0);
    const staleRuns = projects.reduce((s, p) => s + p.staleRuns, 0);
    const totalTasks = projects.reduce((s, p) => s + p.totalTasks, 0);
    const completedTasks = projects.reduce((s, p) => s + p.completedTasksAggregate, 0);
    return { totalRuns, activeRuns, completedRuns, failedRuns, staleRuns, totalTasks, completedTasks };
  }, [projects]);

  // Collect all breakpoint runs across all projects
  const allBreakpointRuns = useMemo<BreakpointRunInfo[]>(() => {
    return projects.flatMap((p) => p.breakpointRuns ?? []);
  }, [projects]);

  // Executive summary metrics for the banner
  const summaryMetrics = useMemo<ExecutiveSummaryMetrics>(() => ({
    totalProjects: projects.length,
    activeRuns: metrics.activeRuns,
    failedRuns: metrics.failedRuns,
    completedRuns: metrics.completedRuns,
    staleRuns: metrics.staleRuns,
    pendingBreakpoints: projects.reduce((s, p) => s + p.pendingBreakpoints, 0),
  }), [projects, metrics]);

  // Fingerprint for banner dismiss
  const bannerFingerprint = `${summaryMetrics.failedRuns}-${summaryMetrics.staleRuns}-${summaryMetrics.pendingBreakpoints}`;
  const bannerDismissed = dismissedFingerprint === bannerFingerprint;

  const filterCounts = useMemo(() => {
    return {
      all: metrics.totalRuns,
      waiting: metrics.activeRuns,
      stale: metrics.staleRuns,
      completed: metrics.completedRuns,
      failed: metrics.failedRuns,
      pending: 0,
    } as Record<DashboardStatusFilter, number>;
  }, [metrics]);

  // Filter projects by status counts
  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return projects;
    if (statusFilter === "stale") return projects.filter((p) => p.staleRuns > 0);
    return projects.filter((project) => {
      if (statusFilter === "waiting") return project.activeRuns > 0;
      if (statusFilter === "completed") return project.completedRuns > 0;
      if (statusFilter === "failed") return project.failedRuns > 0;
      return false;
    });
  }, [projects, statusFilter]);

  // Determine the status filter to pass to ProjectHealthCard
  const cardStatusFilter: RunStatus | "all" = statusFilter === "stale" ? "all" : statusFilter;

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
    filteredProjects,
    activeProjects,
    historyProjects,
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
