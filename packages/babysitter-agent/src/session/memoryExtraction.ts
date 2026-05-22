/**
 * GAP-STATE-001: Long-Term Memory Extraction.
 *
 * Extract and persist important facts, decisions, and patterns from
 * session history into a long-term memory store for cross-session recall.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemoryCategory = "fact" | "decision" | "pattern" | "preference" | "architecture" | "other";
export type MemoryConfidence = "high" | "medium" | "low";

export interface MemoryEntry {
  id: string;
  content: string;
  category: MemoryCategory;
  confidence: MemoryConfidence;
  sourceRunId?: string;
  sourceSessionId?: string;
  tags: string[];
  extractedAt: string;
  lastAccessedAt?: string;
}

export interface LongTermMemoryStore {
  schemaVersion: string;
  entries: MemoryEntry[];
  updatedAt: string;
}

export interface MemoryExtractionInput {
  decisions: Array<{ summary: string; rationale?: string; timestamp: string; runId?: string }>;
  findings: Array<{ content: string; category: string; timestamp: string; runId?: string }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LONG_TERM_MEMORY_SCHEMA_VERSION = "2026.01.long-term-memory-v1";
const DEFAULT_MAX_ENTRIES = 500;
const MEMORY_FILENAME = "long-term-memory.json";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emptyStore(): LongTermMemoryStore {
  return {
    schemaVersion: LONG_TERM_MEMORY_SCHEMA_VERSION,
    entries: [],
    updatedAt: new Date().toISOString(),
  };
}

function generateMemoryId(): string {
  return `mem-${crypto.randomUUID()}`;
}

function getStorePath(globalStateDir: string): string {
  return path.join(globalStateDir, MEMORY_FILENAME);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract memory entries from session data. Pure function, no I/O.
 * Deduplicates by content string.
 */
export function extractMemoriesFromSession(input: MemoryExtractionInput): MemoryEntry[] {
  const seen = new Set<string>();
  const entries: MemoryEntry[] = [];
  const now = new Date().toISOString();

  for (const decision of input.decisions) {
    if (seen.has(decision.summary)) continue;
    seen.add(decision.summary);
    entries.push({
      id: generateMemoryId(),
      content: decision.summary,
      category: "decision",
      confidence: "high",
      sourceRunId: decision.runId,
      tags: [],
      extractedAt: now,
    });
  }

  for (const finding of input.findings) {
    if (seen.has(finding.content)) continue;
    seen.add(finding.content);
    const category = (["fact", "decision", "pattern", "preference", "architecture", "other"] as const)
      .find((c) => c === finding.category) ?? "other";
    entries.push({
      id: generateMemoryId(),
      content: finding.content,
      category,
      confidence: "medium",
      sourceRunId: finding.runId,
      tags: [],
      extractedAt: now,
    });
  }

  return entries;
}

/**
 * Read the long-term memory store. Returns empty store on ENOENT or corrupt JSON.
 */
export async function readLongTermMemory(globalStateDir: string): Promise<LongTermMemoryStore> {
  const filePath = getStorePath(globalStateDir);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return emptyStore();
  }
  try {
    const data = JSON.parse(raw) as Partial<LongTermMemoryStore>;
    return {
      schemaVersion: typeof data.schemaVersion === "string" ? data.schemaVersion : LONG_TERM_MEMORY_SCHEMA_VERSION,
      entries: Array.isArray(data.entries) ? data.entries : [],
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(globalStateDir: string, store: LongTermMemoryStore): Promise<void> {
  const filePath = getStorePath(globalStateDir);
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.tmp.${process.pid}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempPath, filePath);
}

/**
 * Merge new entries into existing store. Deduplicates by id. Trims to maxEntries.
 */
export async function persistMemories(
  globalStateDir: string,
  newEntries: MemoryEntry[],
  maxEntries: number = DEFAULT_MAX_ENTRIES,
): Promise<void> {
  const store = await readLongTermMemory(globalStateDir);
  const existingIds = new Set(store.entries.map((e) => e.id));

  for (const entry of newEntries) {
    if (!existingIds.has(entry.id)) {
      store.entries.push(entry);
      existingIds.add(entry.id);
    }
  }

  // Sort by extractedAt descending (newest first), trim to maxEntries
  store.entries.sort((a, b) => b.extractedAt.localeCompare(a.extractedAt));
  if (store.entries.length > maxEntries) {
    store.entries = store.entries.slice(0, maxEntries);
  }

  store.updatedAt = new Date().toISOString();
  await writeStore(globalStateDir, store);
}

/**
 * Query memories with optional filters.
 */
export async function queryMemories(
  globalStateDir: string,
  options?: { category?: string; tags?: string[]; limit?: number },
): Promise<MemoryEntry[]> {
  const store = await readLongTermMemory(globalStateDir);
  let results = store.entries;

  if (options?.category) {
    results = results.filter((e) => e.category === options.category);
  }

  if (options?.tags && options.tags.length > 0) {
    const filterTags = options.tags;
    results = results.filter((e) =>
      filterTags.some((t) => e.tags.includes(t)),
    );
  }

  // Sort by extractedAt descending (newest first)
  results.sort((a, b) => b.extractedAt.localeCompare(a.extractedAt));

  if (options?.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
}

/**
 * Prune memories beyond keepCount. Returns number pruned.
 */
export async function pruneMemories(
  globalStateDir: string,
  keepCount: number = DEFAULT_MAX_ENTRIES,
): Promise<number> {
  const store = await readLongTermMemory(globalStateDir);
  if (store.entries.length <= keepCount) return 0;

  // Sort by extractedAt descending, keep newest
  store.entries.sort((a, b) => b.extractedAt.localeCompare(a.extractedAt));
  const pruned = store.entries.length - keepCount;
  store.entries = store.entries.slice(0, keepCount);
  store.updatedAt = new Date().toISOString();

  await writeStore(globalStateDir, store);
  return pruned;
}
