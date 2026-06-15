/**
 * GAP-STATE-002: Memory Consolidation.
 *
 * Deduplicates, merges, and prunes long-term memory entries to keep
 * the memory store within size limits while preserving high-value entries.
 */

import type { MemoryEntry, MemoryConfidence } from './memoryExtraction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConsolidationResult {
  /** Entries that survived consolidation (merged + unique). */
  merged: MemoryEntry[];
  /** Entries that were dropped during pruning. */
  dropped: MemoryEntry[];
  /** Number of duplicate pairs that were merged. */
  conflictsResolved: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_ENTRIES = 200;
const SIMILARITY_THRESHOLD = 0.4;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Consolidate memory entries: deduplicate similar entries, merge overlapping
 * content, and prune to fit within maxEntries.
 */
export function consolidateMemories(
  entries: MemoryEntry[],
  maxEntries: number = DEFAULT_MAX_ENTRIES,
): ConsolidationResult {
  if (entries.length === 0) {
    return { merged: [], dropped: [], conflictsResolved: 0 };
  }

  // Step 1: detect and merge duplicates
  const duplicatePairs = detectDuplicates(entries);
  let conflictsResolved = 0;

  const consumed = new Set<string>();
  const consolidated: MemoryEntry[] = [];

  for (const entry of entries) {
    if (consumed.has(entry.id)) continue;

    // Find if this entry is part of a duplicate pair
    const partner = duplicatePairs.find(
      ([a, b]) => (a.id === entry.id || b.id === entry.id) && !consumed.has(a.id) && !consumed.has(b.id),
    );

    if (partner) {
      const [a, b] = partner;
      const merged = mergeEntries(a, b);
      consolidated.push(merged);
      consumed.add(a.id);
      consumed.add(b.id);
      conflictsResolved++;
    } else {
      consolidated.push(entry);
      consumed.add(entry.id);
    }
  }

  // Step 2: sort by confidence (high > medium > low) then by recency
  const ranked = consolidated.sort((a, b) => {
    const confOrder = confidenceRank(b.confidence) - confidenceRank(a.confidence);
    if (confOrder !== 0) return confOrder;
    return (b.extractedAt ?? '').localeCompare(a.extractedAt ?? '');
  });

  // Step 3: prune to max entries
  const merged = ranked.slice(0, maxEntries);
  const dropped = ranked.slice(maxEntries);

  return { merged, dropped, conflictsResolved };
}

/**
 * Detect pairs of entries with similar content using Jaccard similarity
 * on word sets.
 */
export function detectDuplicates(entries: MemoryEntry[]): Array<[MemoryEntry, MemoryEntry]> {
  const pairs: Array<[MemoryEntry, MemoryEntry]> = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const sim = jaccardSimilarity(entries[i].content, entries[j].content);
      if (sim >= SIMILARITY_THRESHOLD) {
        pairs.push([entries[i], entries[j]]);
      }
    }
  }

  return pairs;
}

/**
 * Merge two similar memory entries into one.
 * Keeps the longer content and higher confidence.
 */
export function mergeEntries(a: MemoryEntry, b: MemoryEntry): MemoryEntry {
  const keepBase = a.content.length >= b.content.length ? a : b;
  const other = keepBase === a ? b : a;

  return {
    ...keepBase,
    confidence: higherConfidence(a.confidence, b.confidence),
    tags: [...new Set([...a.tags, ...b.tags])],
    extractedAt: a.extractedAt > b.extractedAt ? a.extractedAt : b.extractedAt,
    lastAccessedAt: laterOf(a.lastAccessedAt, b.lastAccessedAt),
    sourceRunId: keepBase.sourceRunId ?? other.sourceRunId,
    sourceSessionId: keepBase.sourceSessionId ?? other.sourceSessionId,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 1),
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const CONFIDENCE_ORDER: Record<MemoryConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function confidenceRank(c: MemoryConfidence): number {
  return CONFIDENCE_ORDER[c] ?? 0;
}

function higherConfidence(a: MemoryConfidence, b: MemoryConfidence): MemoryConfidence {
  return confidenceRank(a) >= confidenceRank(b) ? a : b;
}

function laterOf(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
