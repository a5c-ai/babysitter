import type { DashboardMetrics, DashboardStatusFilter } from "@/hooks/use-run-dashboard";
export interface KpiGridProps {
    metrics: DashboardMetrics;
    statusFilter: DashboardStatusFilter;
    hasStaleRuns: boolean;
    onToggleFilter: (filter: DashboardStatusFilter) => void;
}
export declare function KpiGrid({ metrics, statusFilter, hasStaleRuns, onToggleFilter }: KpiGridProps): import("react/jsx-runtime").JSX.Element;
