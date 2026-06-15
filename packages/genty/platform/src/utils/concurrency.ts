/**
 * Effective concurrency calculation for effect dispatch groups.
 *
 * Ported from @a5c-ai/babysitter-sdk/tasks/grouping for local use so that
 * the platform does not need a runtime SDK import for this pure function.
 */

interface ConcurrencyAction {
  schedulerHints?: {
    pendingCount?: number;
  };
}

interface EffectiveConcurrencyOptions {
  maxConcurrency?: number;
}

/**
 * Determine the effective concurrency for a group of effect actions.
 *
 * Considers:
 *   - An explicit maxConcurrency option
 *   - The minimum pendingCount from any action's schedulerHints (if any have it)
 *   - The number of actions (default upper bound)
 *
 * Returns at least 0 for empty arrays, at least 1 otherwise.
 */
export function getEffectiveConcurrency(
  actions: ConcurrencyAction[],
  options?: EffectiveConcurrencyOptions,
): number {
  if (actions.length === 0) {
    return 0;
  }

  const candidates: number[] = [actions.length];

  if (options?.maxConcurrency !== undefined) {
    candidates.push(options.maxConcurrency);
  }

  // Check per-action pendingCount hints as concurrency bounds
  for (const action of actions) {
    const pendingCount = action.schedulerHints?.pendingCount;
    if (typeof pendingCount === "number") {
      candidates.push(pendingCount);
    }
  }

  // If we have explicit hints (maxConcurrency or pendingCount), use only those
  // (don't bound by actions.length). Otherwise fall back to actions.length.
  const explicitCandidates = candidates.slice(1); // everything except actions.length
  const effective =
    explicitCandidates.length > 0
      ? Math.min(...explicitCandidates)
      : actions.length;

  return Math.max(effective, 1);
}
