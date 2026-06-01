/**
 * Sliding-window compaction strategy.
 *
 * Keeps only the most recent N entries (or entries fitting within the
 * token budget), discarding older ones from the front of the window.
 */

import type {
  ContextEntry,
  SlidingCompactionStrategy,
  TokenEstimatorContext,
} from "../types";
import { estimateEntryTokens } from "../token-estimator";

/**
 * Result of a sliding-window compaction pass.
 */
export interface SlidingCompactionResult {
  /** Entries that survived compaction (conversation order preserved). */
  readonly retained: readonly ContextEntry[];
  /** Entries that were evicted. */
  readonly evicted: readonly ContextEntry[];
}

/**
 * Apply sliding-window compaction to the given entries.
 *
 * @param entries        - Current context entries in conversation order.
 * @param maxTokens      - Token budget to compact into.
 * @param strategy       - The sliding compaction configuration.
 * @param preserveSystem - When `true`, system entries are always retained.
 * @returns The retained and evicted entry sets.
 */
export function applySlidingCompaction(
  entries: readonly ContextEntry[],
  maxTokens: number,
  strategy: SlidingCompactionStrategy,
  preserveSystem = true,
  tokenEstimatorContext?: TokenEstimatorContext,
): SlidingCompactionResult {
  const { windowSize } = strategy;
  const effectivePreserveSystem =
    strategy.preserveSystemPrompt ?? preserveSystem;

  // Separate system entries (always retained) from the rest.
  const systemEntries: ContextEntry[] = [];
  const nonSystem: ContextEntry[] = [];

  for (const entry of entries) {
    if (effectivePreserveSystem && entry.role === "system") {
      systemEntries.push(entry);
    } else {
      nonSystem.push(entry);
    }
  }

  // Take the most recent `windowSize` non-system entries.
  const startIndex = Math.max(0, nonSystem.length - windowSize);
  const retainedNonSystem = nonSystem.slice(startIndex);
  const evictedNonSystem = nonSystem.slice(0, startIndex);

  // Further trim retained entries if they exceed the token budget.
  let tokenBudget = maxTokens;
  for (const e of systemEntries) tokenBudget -= estimateEntryTokens(e, tokenEstimatorContext);

  const finalRetained: ContextEntry[] = [];
  const additionalEvicted: ContextEntry[] = [];

  // Walk backwards (most recent first) so newer entries are preferred.
  let usedTokens = 0;
  for (let i = retainedNonSystem.length - 1; i >= 0; i--) {
    const entry = retainedNonSystem[i]!;
    const tokens = estimateEntryTokens(entry, tokenEstimatorContext);
    if (usedTokens + tokens <= tokenBudget) {
      finalRetained.unshift(entry);
      usedTokens += tokens;
    } else {
      additionalEvicted.push(entry);
    }
  }

  // Combine evicted lists (order doesn't strictly matter for evicted).
  const evicted = [...evictedNonSystem, ...additionalEvicted];

  // Rebuild retained in conversation order: system first, then the window.
  const retained = [...systemEntries, ...finalRetained];

  return { retained, evicted };
}
