import type { EffectAction } from "../runtime/types";

const UNGROUPED_KEY = "__ungrouped__";

/**
 * Groups actions by their schedulerHints.parallelGroupId.
 * Actions without a parallelGroupId are placed under '__ungrouped__'.
 */
export function groupActionsByParallelGroup(
  actions: EffectAction[]
): Map<string, EffectAction[]> {
  const groups = new Map<string, EffectAction[]>();

  for (const action of actions) {
    const groupId = action.schedulerHints?.parallelGroupId ?? UNGROUPED_KEY;
    const existing = groups.get(groupId);
    if (existing) {
      existing.push(action);
    } else {
      groups.set(groupId, [action]);
    }
  }

  return groups;
}

export interface EffectiveConcurrencyOptions {
  maxConcurrency?: number;
}

/**
 * Returns the effective concurrency for a set of actions.
 * Takes the minimum of:
 *   - The explicit maxConcurrency option (if provided)
 *   - The minimum pendingCount from any action's schedulerHints (if any have it)
 *   - The number of actions (default upper bound)
 * Returns at least 0 for empty arrays, at least 1 otherwise.
 */
export function getEffectiveConcurrency(
  actions: EffectAction[],
  options?: EffectiveConcurrencyOptions
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
  const effective = explicitCandidates.length > 0
    ? Math.min(...explicitCandidates)
    : actions.length;

  return Math.max(effective, 1);
}
