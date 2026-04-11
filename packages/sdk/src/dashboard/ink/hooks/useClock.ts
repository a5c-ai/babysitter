/**
 * useClock — convenience hook that returns the current clock value.
 *
 * Re-renders the subscribing component on each clock tick.
 * Must be called from within a ClockProvider subtree.
 */

import { useClockContext } from "../contexts/ClockContext.js";

export interface UseClockResult {
  /** Current wall-clock time in milliseconds. */
  now: number;
  /** Monotonically-increasing tick counter (starts at 0). */
  tick: number;
}

export function useClock(): UseClockResult {
  return useClockContext();
}
