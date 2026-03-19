"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { subscribe, StreamEvent } from "./use-event-stream";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Window (ms) for counting rapid SSE events to detect burst mode. */
const BURST_WINDOW_MS = 5000;

/** Number of SSE events within the burst window that triggers catch-up mode. */
const BURST_THRESHOLD = 10;

/** How long (ms) to hold catch-up mode after the burst subsides. */
const CATCHUP_HOLD_MS = 3000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Monitors SSE event rate and activates "catch-up mode" when a burst of
 * events is detected (e.g. opening dashboard after overnight runs).
 *
 * In catch-up mode, the caller should suppress real-time UI updates and
 * instead show a summary notification ("12 runs updated"). When the burst
 * subsides or the user clicks "refresh now", catch-up mode ends and the
 * caller should do a single full refresh.
 */
export function useBatchedUpdates(
  options: UseBatchedUpdatesOptions = {}
): CatchUpState {
  const { sseFilter, onFlush, enabled = true } = options;
  const [active, setActive] = useState(false);
  const [bufferedCount, setBufferedCount] = useState(0);

  // Track SSE event timestamps within the burst window
  const eventTimestampsRef = useRef<number[]>([]);
  const catchUpActiveRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseFilterRef = useRef(sseFilter);
  sseFilterRef.current = sseFilter;
  const onFlushRef = useRef(onFlush);
  onFlushRef.current = onFlush;

  const exitCatchUp = useCallback(() => {
    catchUpActiveRef.current = false;
    setActive(false);
    setBufferedCount(0);
    eventTimestampsRef.current = [];
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    onFlushRef.current?.();
  }, []);

  const flush = useCallback(() => {
    if (catchUpActiveRef.current) {
      exitCatchUp();
    }
  }, [exitCatchUp]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribe((event: StreamEvent) => {
      // Ignore non-data events
      if (
        event.type === "connected" ||
        event.type === "disconnect" ||
        event.type === "error"
      ) {
        return;
      }

      // Apply optional filter
      if (sseFilterRef.current && !sseFilterRef.current(event)) return;

      const now = Date.now();

      // Record timestamp and prune old entries
      eventTimestampsRef.current.push(now);
      eventTimestampsRef.current = eventTimestampsRef.current.filter(
        (t) => now - t < BURST_WINDOW_MS
      );

      if (catchUpActiveRef.current) {
        // Already in catch-up mode — increment buffered count
        setBufferedCount((c) => c + 1);

        // Reset the hold timer since events are still arriving
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
        }
        holdTimerRef.current = setTimeout(() => {
          exitCatchUp();
        }, CATCHUP_HOLD_MS);
      } else {
        // Check if we should enter catch-up mode
        if (eventTimestampsRef.current.length >= BURST_THRESHOLD) {
          catchUpActiveRef.current = true;
          setActive(true);
          setBufferedCount(eventTimestampsRef.current.length);

          // Set initial hold timer
          holdTimerRef.current = setTimeout(() => {
            exitCatchUp();
          }, CATCHUP_HOLD_MS);
        }
      }
    });

    return () => {
      unsubscribe();
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, [enabled, exitCatchUp]);

  return { active, bufferedCount, flush };
}

// Export constants for testing
export { BURST_WINDOW_MS, BURST_THRESHOLD, CATCHUP_HOLD_MS };
