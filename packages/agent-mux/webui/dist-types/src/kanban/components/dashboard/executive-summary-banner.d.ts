import type { RunStatus } from "@/types";
export interface ExecutiveSummaryMetrics {
    totalProjects: number;
    activeRuns: number;
    failedRuns: number;
    completedRuns: number;
    staleRuns: number;
    pendingBreakpoints: number;
}
interface ExecutiveSummaryBannerProps {
    metrics: ExecutiveSummaryMetrics;
    onFilterChange?: (filter: RunStatus | "stale") => void;
    dismissed?: boolean;
    onDismiss?: () => void;
}
export declare function ExecutiveSummaryBanner({ metrics, onFilterChange, dismissed, onDismiss, }: ExecutiveSummaryBannerProps): import("react/jsx-runtime").JSX.Element | null;
export {};
