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
 * Subtle notification shown when the dashboard detects a burst of SSE updates
 * (catch-up mode). Displays the number of buffered updates, an optional
 * summary of what happened, and a "refresh now" button to immediately apply
 * all pending changes.
 */
export declare function CatchUpBanner({ catchUp, summary }: CatchUpBannerProps): import("react/jsx-runtime").JSX.Element | null;
