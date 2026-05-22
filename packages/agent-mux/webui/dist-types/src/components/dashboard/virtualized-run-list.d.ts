import type { Run } from "@/types";
interface VirtualizedRunListProps {
    /** Runs to display — must be pre-sorted by caller */
    runs: Run[];
    /** Optional className applied to the scroll container */
    className?: string;
    /** Maximum height for the scroll container. Defaults to 600px. */
    maxHeight?: number;
    /** Optional render wrapper per-item (e.g. to add time overlays in activity mode) */
    renderItem?: (run: Run, index: number) => React.ReactNode;
    /** Optional stop action for active dispatches */
    onStopRun?: (run: Run) => void;
    /** Run ids currently processing a stop request */
    stoppingRunIds?: Set<string>;
}
/**
 * Virtualized run card list using @tanstack/react-virtual.
 *
 * - Only renders visible cards plus a small overscan buffer.
 * - Uses stable sort keys (run.runId) to prevent reordering flash.
 * - Preserves scroll position when new runs are prepended by adjusting
 *   the scroll offset.
 * - Falls back to a simple flat list when the item count is below the
 *   VIRTUALIZATION_THRESHOLD to avoid unnecessary overhead.
 */
export declare function VirtualizedRunList({ runs, className, maxHeight, renderItem, onStopRun, stoppingRunIds, }: VirtualizedRunListProps): import("react/jsx-runtime").JSX.Element;
export {};
