import { type CatchUpState } from "./use-batched-updates";
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
    statusFilter: DashboardStatusFilter;
    sortMode: DashboardSortMode;
    historyCollapsed: boolean;
    cardStatusFilter: RunStatus | "all";
    hasStaleRuns: boolean;
    catchUp: CatchUpState;
    setStatusFilter: (value: DashboardStatusFilter) => void;
    setSortMode: (value: DashboardSortMode | ((prev: DashboardSortMode) => DashboardSortMode)) => void;
    setHistoryCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
    setDismissedFingerprint: (value: string | null | ((prev: string | null) => string | null)) => void;
    toggleMetricFilter: (filter: DashboardStatusFilter) => void;
    handleHideProject: (projectName: string) => void;
}
export declare function useRunDashboard(): UseRunDashboardReturn;
