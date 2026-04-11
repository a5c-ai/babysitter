/**
 * useRunScanner — custom hook that polls for run summaries.
 *
 * Calls scanRuns on mount and auto-refreshes every 5 seconds using the
 * ClockContext tick (50 ticks at 100ms interval = 5s).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useClock } from "./useClock.js";
import { scanRuns, type RunSummary } from "../data/runScanner.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseRunScannerResult {
  readonly runs: readonly RunSummary[];
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

export function useRunScanner(runsDir: string): UseRunScannerResult {
  const [runs, setRuns] = useState<readonly RunSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const lastRefreshTick = useRef<number>(0);
  const { tick } = useClock();

  const doScan = useCallback(async () => {
    try {
      setLoading(true);
      const results = await scanRuns(runsDir);
      setRuns(results);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [runsDir]);

  // Initial scan on mount
  useEffect(() => {
    void doScan();
  }, [doScan]);

  // Auto-refresh every REFRESH_INTERVAL_TICKS ticks
  useEffect(() => {
    if (tick - lastRefreshTick.current >= REFRESH_INTERVAL_TICKS) {
      lastRefreshTick.current = tick;
      void doScan();
    }
  }, [tick, doScan]);

  const refresh = useCallback(() => {
    lastRefreshTick.current = tick;
    void doScan();
  }, [tick, doScan]);

  return { runs, loading, error, refresh };
}
