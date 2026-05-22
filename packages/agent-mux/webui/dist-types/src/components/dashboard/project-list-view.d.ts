import type { ProjectSummary, Run, RunStatus } from "@/types";
import type { DashboardSortMode, DashboardStatusFilter } from "@/hooks/use-run-dashboard";
export interface ProjectListViewProps {
    loading: boolean;
    error: string | null | undefined;
    filteredProjects: ProjectSummary[];
    activeProjects: ProjectSummary[];
    historyProjects: ProjectSummary[];
    statusFilter: DashboardStatusFilter;
    sortMode: DashboardSortMode;
    cardStatusFilter: RunStatus | "all";
    historyCollapsed: boolean;
    onHistoryCollapsedChange: (value: boolean | ((prev: boolean) => boolean)) => void;
    onHideProject?: (projectName: string) => void;
    onStopRun?: (run: Run) => void;
    stoppingRunIds?: Set<string>;
}
export declare function ProjectListView({ loading, error, filteredProjects, activeProjects, historyProjects, statusFilter, sortMode, cardStatusFilter, historyCollapsed, onHistoryCollapsedChange, onHideProject, onStopRun, stoppingRunIds, }: ProjectListViewProps): import("react/jsx-runtime").JSX.Element;
