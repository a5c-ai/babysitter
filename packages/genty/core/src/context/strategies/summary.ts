/**
 * Summary compaction strategy.
 *
 * Replaces entries older than a threshold with a single condensed
 * summary entry, keeping the context window compact while preserving
 * important information in distilled form.
 */

import type {
  ContextEntry,
  SummaryCompactionStrategy,
  TokenEstimatorContext,
} from "../types";
import { estimateEntryTokens, estimateTokens } from "../token-estimator";

/**
 * Function signature for the user-provided summarizer.
 *
 * Receives the entries to condense and returns a summary string.
 */
export type SummarizeFn = (entries: readonly ContextEntry[]) => string;

/**
 * Result of a summary compaction pass.
 */
export interface SummaryCompactionResult {
  /** Entries after compaction (conversation order). Includes the summary entry if generated. */
  readonly retained: readonly ContextEntry[];
  /** Original entries that were replaced by the summary. */
  readonly evicted: readonly ContextEntry[];
  /** The summary entry that was injected, if any. */
  readonly summaryEntry: ContextEntry | null;
}

/**
 * Apply summary compaction to the given entries.
 *
 * Entries are split into two groups: those that fit within the token
 * budget (kept from the end) and those that overflow (older entries).
 * The overflow group is replaced with a single summary entry.
 *
 * @param entries         - Current context entries in conversation order.
 * @param maxTokens       - Token budget to compact into.
 * @param _strategy       - The summary compaction configuration.
 * @param summarizeFn     - Function that reduces entries to a summary string.
 * @param preserveSystem  - When `true`, system entries are never evicted.
 * @returns The retained entries (including the summary), evicted entries, and the summary entry.
 */
export function applySummaryCompaction(
  entries: readonly ContextEntry[],
  maxTokens: number,
  _strategy: SummaryCompactionStrategy,
  summarizeFn: SummarizeFn,
  preserveSystem = true,
  tokenEstimatorContext?: TokenEstimatorContext,
): SummaryCompactionResult {
  if (entries.length === 0) {
    return { retained: [], evicted: [], summaryEntry: null };
  }

  // Separate system entries.
  const systemEntries: ContextEntry[] = [];
  const nonSystem: ContextEntry[] = [];

  for (const entry of entries) {
    if (preserveSystem && entry.role === "system") {
      systemEntries.push(entry);
    } else {
      nonSystem.push(entry);
    }
  }

  let systemTokens = 0;
  for (const e of systemEntries) systemTokens += estimateEntryTokens(e, tokenEstimatorContext);

  const remainingBudget = maxTokens - systemTokens;

  // Walk from the end, accumulate entries that fit within budget.
  const keep: ContextEntry[] = [];
  let keepTokens = 0;

  for (let i = nonSystem.length - 1; i >= 0; i--) {
    const entry = nonSystem[i]!;
    const tokens = estimateEntryTokens(entry, tokenEstimatorContext);
    if (keepTokens + tokens <= remainingBudget) {
      keep.unshift(entry);
      keepTokens += tokens;
    } else {
      break; // All earlier entries become candidates for summarization.
    }
  }

  const evicted = nonSystem.slice(0, nonSystem.length - keep.length);

  if (evicted.length === 0) {
    return { retained: entries as ContextEntry[], evicted: [], summaryEntry: null };
  }

  // Generate summary.
  const summaryText = summarizeFn(evicted);
  const summaryEntry: ContextEntry = {
    id: `summary-${Date.now()}`,
    role: "summary",
    content: summaryText,
    priority: 0.8,
    tokenCount: estimateTokens(summaryText, tokenEstimatorContext),
    timestamp: new Date(),
  };

  const retained = [...systemEntries, summaryEntry, ...keep];

  return { retained, evicted, summaryEntry };
}
