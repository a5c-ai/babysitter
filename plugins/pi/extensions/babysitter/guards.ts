/**
 * Iteration guards and runaway-loop detection.
 *
 * Before every orchestration iteration the guard module is consulted.
 * If any limit is breached the run is halted gracefully rather than
 * allowed to spiral into the void -- which, admittedly, is where
 * everything ends up eventually.
 *
 * @module guards
 */

import type { RunState } from './session-binder.js';

// ---------------------------------------------------------------------------
// Guard configuration constants
// ---------------------------------------------------------------------------

/** Default maximum orchestration iterations per run. */
export const MAX_ITERATIONS_DEFAULT = 256;

/** Maximum wall-clock time (ms) for a single run -- 2 hours. */
export const MAX_RUN_DURATION_MS = 7_200_000;

/** Consecutive errors before the guard trips. */
export const MAX_CONSECUTIVE_ERRORS = 3;

/** Number of suspiciously fast iterations that signal a doom loop. */
export const DOOM_LOOP_THRESHOLD = 3;

/** Minimum duration (ms) for an iteration to be considered "real work". */
export const DOOM_LOOP_MIN_DURATION_MS = 2_000;

// ---------------------------------------------------------------------------
// Guard result type
// ---------------------------------------------------------------------------

/** Result returned by {@link checkGuards}. */
export interface GuardResult {
  /** Whether all guards passed. */
  passed: boolean;
  /** Human-readable reason when `passed` is false. */
  reason?: string;
  /** Suggested action when `passed` is false. */
  action?: 'stop' | 'warn';
}

// ---------------------------------------------------------------------------
// Internal mutable state
// ---------------------------------------------------------------------------

/** Rolling count of consecutive iteration errors. */
let consecutiveErrorCount = 0;

/**
 * History of recent pending-effect counts, used for doom-loop detection.
 * Each entry records the number of pending effects at the end of an iteration.
 */
const pendingCountHistory: number[] = [];

/**
 * Recent iteration digests used for doom-loop detection (legacy compat).
 * @internal
 */
const iterationDigests: string[] = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check all guards against the current run state.
 *
 * Evaluates, in order:
 *   1. Maximum iteration count
 *   2. Wall-clock time budget
 *   3. Consecutive error threshold
 *   4. Doom-loop detection
 *
 * Returns `{ passed: true }` when the next iteration may proceed, or
 * `{ passed: false, reason, action }` when a limit has been breached.
 *
 * @param runState - The current {@link RunState} snapshot.
 * @returns Whether the next iteration is allowed.
 */
export function checkGuards(runState: RunState): GuardResult {
  // 1. Max iterations
  const maxIter = runState.maxIterations ?? MAX_ITERATIONS_DEFAULT;
  if (runState.iteration >= maxIter) {
    return {
      passed: false,
      reason: `Maximum iterations reached (${runState.iteration} >= ${maxIter}). The run must stop.`,
      action: 'stop',
    };
  }

  // 2. Wall-clock time limit
  const elapsedMs = Date.now() - new Date(runState.startedAt).getTime();
  if (elapsedMs >= MAX_RUN_DURATION_MS) {
    return {
      passed: false,
      reason: `Maximum duration exceeded (${Math.round(elapsedMs / 1000)}s >= ${Math.round(MAX_RUN_DURATION_MS / 1000)}s).`,
      action: 'stop',
    };
  }

  // 3. Consecutive error threshold
  if (consecutiveErrorCount > MAX_CONSECUTIVE_ERRORS) {
    return {
      passed: false,
      reason: `Too many consecutive errors (${consecutiveErrorCount} > ${MAX_CONSECUTIVE_ERRORS}).`,
      action: 'stop',
    };
  }

  // 4. Doom-loop detection
  if (isDoomLoop(runState)) {
    return {
      passed: false,
      reason: `Doom loop detected: the last ${DOOM_LOOP_THRESHOLD} iterations were suspiciously fast with no progress.`,
      action: 'stop',
    };
  }

  // 4b. Legacy digest-based doom-loop detection (for callers using recordIterationDigest)
  if (isDigestDoomLoop(DOOM_LOOP_THRESHOLD)) {
    return {
      passed: false,
      reason: `Doom loop detected: the last ${DOOM_LOOP_THRESHOLD} iterations produced identical output.`,
      action: 'warn',
    };
  }

  return { passed: true };
}

/**
 * Reset all internal guard state (counters, histories).
 *
 * Called on session cleanup or when starting a fresh run.
 */
export function resetGuardState(): void {
  consecutiveErrorCount = 0;
  pendingCountHistory.length = 0;
  iterationDigests.length = 0;
}

/**
 * Record the outcome of an iteration for consecutive-error tracking.
 *
 * @param success - `true` if the iteration succeeded, `false` if it errored.
 */
export function recordIterationOutcome(success: boolean): void {
  if (success) {
    consecutiveErrorCount = 0;
  } else {
    consecutiveErrorCount += 1;
  }
}

/**
 * Record the number of pending effects after an iteration, for doom-loop
 * detection.
 *
 * @param pendingCount - The number of effects still pending.
 */
export function recordPendingCount(pendingCount: number): void {
  pendingCountHistory.push(pendingCount);
  // Keep a bounded history
  if (pendingCountHistory.length > 32) {
    pendingCountHistory.shift();
  }
}

/**
 * Check whether the run is stuck in a doom loop.
 *
 * A doom loop is detected when the last {@link DOOM_LOOP_THRESHOLD}
 * iterations all completed in under {@link DOOM_LOOP_MIN_DURATION_MS}
 * each AND the pending effect count has not changed across those
 * iterations.
 *
 * @param runState - The current {@link RunState} snapshot.
 * @returns `true` if the run appears to be looping without making progress.
 */
export function isDoomLoop(runState: RunState): boolean {
  const times = runState.iterationTimes;

  // Need at least DOOM_LOOP_THRESHOLD iterations to check
  if (!times || times.length < DOOM_LOOP_THRESHOLD) {
    return false;
  }

  // Check if the last N iteration times are all suspiciously fast
  const recentTimes = times.slice(-DOOM_LOOP_THRESHOLD);
  const allFast = recentTimes.every((t) => t < DOOM_LOOP_MIN_DURATION_MS);
  if (!allFast) {
    return false;
  }

  // Check if pending effect count hasn't changed over the same window
  if (pendingCountHistory.length < DOOM_LOOP_THRESHOLD) {
    // Not enough pending-count data -- fall through to time-only check
    return true;
  }

  const recentPending = pendingCountHistory.slice(-DOOM_LOOP_THRESHOLD);
  const firstPending = recentPending[0];
  const pendingUnchanged = recentPending.every((c) => c === firstPending);

  return pendingUnchanged;
}

// ---------------------------------------------------------------------------
// Legacy compatibility exports
// ---------------------------------------------------------------------------

/**
 * Record the digest of an iteration's output for doom-loop tracking.
 *
 * @deprecated Prefer {@link recordPendingCount} for doom-loop detection.
 * @param digest - A string digest (e.g. JSON.stringify of pending effects).
 */
export function recordIterationDigest(digest: string): void {
  iterationDigests.push(digest);
  if (iterationDigests.length > 32) {
    iterationDigests.shift();
  }
}

/**
 * Reset digest history.
 *
 * @deprecated Use {@link resetGuardState} instead.
 */
export function resetDigests(): void {
  resetGuardState();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Legacy digest-based doom-loop check.
 *
 * @param windowSize - Number of consecutive identical digests to trigger.
 * @returns `true` if the last `windowSize` digests are all equal.
 */
function isDigestDoomLoop(windowSize: number): boolean {
  if (iterationDigests.length < windowSize) {
    return false;
  }

  const tail = iterationDigests.slice(-windowSize);
  const first = tail[0];
  return tail.every((d) => d === first);
}
