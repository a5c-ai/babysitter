/**
 * Concurrent Effects Execution (GAP-PAR-001).
 *
 * Provides concurrency-limited execution of effect groups using a
 * semaphore pattern. Complements the SDK-level concurrentExecution.ts
 * with platform-layer policies and group execution.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Policy controlling how concurrent effects are dispatched. */
export interface ConcurrencyPolicy {
  /** Maximum number of effects to execute simultaneously. */
  maxConcurrency: number;
  /**
   * Whether to continue executing remaining effects when one fails.
   * Default: true (best-effort).
   */
  continueOnFailure?: boolean;
}

/** Result of a single effect execution within a concurrent group. */
export interface ConcurrentEffectResult<T = unknown> {
  /** Index within the group. */
  index: number;
  /** Whether the execution succeeded. */
  status: "fulfilled" | "rejected";
  /** Resolved value, if successful. */
  value?: T;
  /** Error reason, if rejected. */
  reason?: unknown;
}

// ---------------------------------------------------------------------------
// Semaphore
// ---------------------------------------------------------------------------

/**
 * Simple counting semaphore for concurrency control.
 * Limits the number of concurrent Promise executions.
 */
class Semaphore {
  private current = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.limit) {
      this.current += 1;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    const next = this.waiters.shift();
    if (next) {
      next();
    } else {
      this.current -= 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Execute a group of effect tasks concurrently, respecting the
 * concurrency limit specified in the policy.
 *
 * Each effect is represented as an async function. The semaphore ensures
 * at most `policy.maxConcurrency` effects run simultaneously.
 *
 * Returns settled results (never throws).
 */
export async function executeConcurrentGroup<T>(
  effects: Array<() => Promise<T>>,
  policy: ConcurrencyPolicy,
): Promise<Array<ConcurrentEffectResult<T>>> {
  if (effects.length === 0) return [];

  const concurrency = Math.max(1, Math.min(effects.length, policy.maxConcurrency));
  const semaphore = new Semaphore(concurrency);
  const continueOnFailure = policy.continueOnFailure ?? true;

  const results: Array<ConcurrentEffectResult<T>> = new Array(effects.length);
  let aborted = false;

  const tasks = effects.map(async (effect, index) => {
    if (aborted) {
      results[index] = { index, status: "rejected", reason: new Error("Aborted due to prior failure") };
      return;
    }

    await semaphore.acquire();
    try {
      if (aborted) {
        results[index] = { index, status: "rejected", reason: new Error("Aborted due to prior failure") };
        return;
      }
      const value = await effect();
      results[index] = { index, status: "fulfilled", value };
    } catch (error) {
      results[index] = { index, status: "rejected", reason: error };
      if (!continueOnFailure) {
        aborted = true;
      }
    } finally {
      semaphore.release();
    }
  });

  await Promise.all(tasks);
  return results;
}
