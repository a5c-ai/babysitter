/**
 * useRunDetail — custom hook that polls for detailed run information.
 *
 * Mirrors the useRunScanner pattern: calls getRunDetail on mount and
 * auto-refreshes every 5 seconds using the ClockContext tick.
 *
 * Accepts a runDir path (resolved from runsDir + runId by the consumer).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useClock } from "./useClock.js";
import { getRunDetail, type RunDetail } from "../data/runScanner.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseRunDetailResult {
  readonly detail: RunDetail | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Refresh every 50 ticks (5 seconds at 100ms clock interval). */
const REFRESH_INTERVAL_TICKS = 50;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRunDetail(runDir: string | null): UseRunDetailResult {
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const lastRefreshTick = useRef<number>(0);
  const { tick } = useClock();

  const doFetch = useCallback(async () => {
    if (!runDir) {
      setDetail(null);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      const result = await getRunDetail(runDir);
      setDetail(result);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [runDir]);

  // Initial fetch on mount or when runDir changes
  useEffect(() => {
    void doFetch();
  }, [doFetch]);

  // Auto-refresh every REFRESH_INTERVAL_TICKS ticks
  useEffect(() => {
    if (tick - lastRefreshTick.current >= REFRESH_INTERVAL_TICKS) {
      lastRefreshTick.current = tick;
      void doFetch();
    }
  }, [tick, doFetch]);

  const refresh = useCallback(() => {
    lastRefreshTick.current = tick;
    void doFetch();
  }, [tick, doFetch]);

  return { detail, loading, error, refresh };
}
