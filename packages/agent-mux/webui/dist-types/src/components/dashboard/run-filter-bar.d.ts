import type { DashboardSortMode, DashboardStatusFilter } from "@/hooks/use-run-dashboard";
export interface RunFilterBarProps {
    statusFilter: DashboardStatusFilter;
    onStatusFilterChange: (value: DashboardStatusFilter) => void;
    filterCounts: Record<DashboardStatusFilter, number>;
    sortMode: DashboardSortMode;
    onSortModeToggle: () => void;
    filteredProjectCount: number;
}
export declare function RunFilterBar({ statusFilter, onStatusFilterChange, filterCounts, sortMode, onSortModeToggle, filteredProjectCount, }: RunFilterBarProps): import("react/jsx-runtime").JSX.Element;
