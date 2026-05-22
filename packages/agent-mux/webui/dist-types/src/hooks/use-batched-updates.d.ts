import { StreamEvent } from "./use-event-stream";
/** Window (ms) for counting rapid SSE events to detect burst mode. */
declare const BURST_WINDOW_MS = 5000;
/** Number of SSE events within the burst window that triggers catch-up mode. */
declare const BURST_THRESHOLD = 10;
/** How long (ms) to hold catch-up mode after the burst subsides. */
declare const CATCHUP_HOLD_MS = 3000;
export interface CatchUpState {
    /** Whether we are in catch-up mode (burst of events detected). */
    active: boolean;
    /** Number of batched/buffered updates while in catch-up mode. */
    bufferedCount: number;
    /** Dismiss catch-up mode and apply buffered updates immediately. */
    flush: () => void;
}
export interface UseBatchedUpdatesOptions {
    /** SSE filter: only count events matching this predicate for burst detection. */
    sseFilter?: (event: StreamEvent) => boolean;
    /** Callback invoked when catch-up mode ends (either by timeout or flush). */
    onFlush?: () => void;
    /** Whether the hook is enabled (default true). */
    enabled?: boolean;
}
/**
 * Monitors SSE event rate and activates "catch-up mode" when a burst of
 * events is detected (e.g. opening dashboard after overnight runs).
 *
 * In catch-up mode, the caller should suppress real-time UI updates and
 * instead show a summary notification ("12 runs updated"). When the burst
 * subsides or the user clicks "refresh now", catch-up mode ends and the
 * caller should do a single full refresh.
 */
export declare function useBatchedUpdates(options?: UseBatchedUpdatesOptions): CatchUpState;
export { BURST_WINDOW_MS, BURST_THRESHOLD, CATCHUP_HOLD_MS };
