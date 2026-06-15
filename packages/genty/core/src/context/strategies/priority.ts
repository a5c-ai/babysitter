/**
 * Priority-based compaction strategy.
 *
 * Sorts entries by priority (lowest first) and drops them one-by-one
 * until the total token count falls within the budget.
 */

import type {
  ContextEntry,
  PriorityCompactionStrategy,
  TokenEstimatorContext,
} from "../types";
import { estimateEntryTokens } from "../token-estimator";

/**
 * Result of a priority compaction pass.
 */
export interface PriorityCompactionResult {
  /** Entries that survived compaction (conversation order preserved). */
  readonly retained: readonly ContextEntry[];
  /** Entries that were evicted. */
  readonly evicted: readonly ContextEntry[];
}

/**
 * Apply priority compaction to the given entries.
 *
 * System-prompt entries are optionally preserved regardless of priority.
 *
 * @param entries          - Current context entries in conversation order.
 * @param maxTokens        - Token budget to compact into.
 * @param strategy         - The priority compaction configuration.
 * @param preserveSystem   - When `true`, system entries are never evicted.
 * @returns The retained and evicted entry sets.
 */
export function applyPriorityCompaction(
  entries: readonly ContextEntry[],
  maxTokens: number,
  strategy: PriorityCompactionStrategy,
  preserveSystem = true,
  tokenEstimatorContext?: TokenEstimatorContext,
): PriorityCompactionResult {
  const minPriority = strategy.minPriority ?? 0;

  // Partition into eviction-safe and eviction-candidates.
  const safe: ContextEntry[] = [];
  const candidates: ContextEntry[] = [];

  for (const entry of entries) {
    if (preserveSystem && entry.role === "system") {
      safe.push(entry);
    } else {
      candidates.push(entry);
    }
  }

  // Sort candidates by priority ascending (lowest priority first = evict first).
  const sorted = [...candidates].sort(
    (a, b) => (a.priority ?? 0.5) - (b.priority ?? 0.5),
  );

  let currentTokens = 0;
  for (const e of safe) currentTokens += estimateEntryTokens(e, tokenEstimatorContext);
  for (const e of candidates) currentTokens += estimateEntryTokens(e, tokenEstimatorContext);

  const evicted: ContextEntry[] = [];

  // Evict lowest-priority candidates first.
  for (const candidate of sorted) {
    if (currentTokens <= maxTokens) break;

    const priority = candidate.priority ?? 0.5;
    if (priority >= minPriority && currentTokens <= maxTokens) break;

    currentTokens -= estimateEntryTokens(candidate, tokenEstimatorContext);
    evicted.push(candidate);
  }

  // Build the evicted set for fast lookup.
  const evictedIds = new Set(evicted.map((e) => e.id));

  // Retained entries preserve original conversation order.
  const retained = entries.filter((e) => !evictedIds.has(e.id));

  return { retained, evicted };
}
