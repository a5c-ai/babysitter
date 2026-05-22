/**
 * tokens:stats command - Show token compression statistics from run journals
 *
 * Usage:
 *   babysitter tokens:stats [runId] [--json] [--all] [--runs-dir <dir>]
 *
 * With runId: reads journal for that run, finds COMPRESSION_APPLIED events, prints table
 * With --all: aggregates across all runs in the runs directory
 * With --json: outputs JSON instead of table
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { getReadableRunsDirs, resolveExistingRunDir } from "../../config";
import {
  supportsColors,
  printSingleRunTable,
  printAggregateTable,
} from "./tokensStatsFormatting";

// ============================================================================
// Types
// ============================================================================

export interface CompressionEventData {
  runId: string;
  effectId?: string;
  sessionId?: string;
  layer: "1a" | "1b" | "2" | "3";
  tool: "imptokens" | "rtk" | "open-thetokenco";
  contentType: "user_prompt" | "bash_output" | "agent_task_context" | "task_result" | "process_library_file";
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
  reductionPct: number;
  durationMs?: number;
  model?: string;
  [key: string]: unknown;
}

export interface CompressionEvent {
  type: "COMPRESSION_APPLIED";
  recordedAt: string;
  checksum?: string;
  data: CompressionEventData;
}

export interface JournalEventRaw {
  type: string;
  recordedAt?: string;
  checksum?: string;
  data?: unknown;
}

export interface RunCompressionStats {
  runId: string;
  date: string;
  eventCount: number;
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
  reductionPct: number;
  byLayer: Record<string, LayerStats>;
}

export interface LayerStats {
  eventCount: number;
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
}

export interface AggregateStats {
  totalRuns: number;
  totalEvents: number;
  totalOriginalTokens: number;
  totalCompressedTokens: number;
  totalTokensSaved: number;
  overallReductionPct: number;
  runs: RunCompressionStats[];
}

export interface TokensStatsOptions {
  runId?: string;
  all?: boolean;
  json?: boolean;
  runsDir?: string;
}

// ============================================================================
// Journal Reading
// ============================================================================

async function readJournalDir(journalDir: string): Promise<JournalEventRaw[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(journalDir);
  } catch {
    return [];
  }
  const jsonFiles = entries
    .filter((f) => f.endsWith(".json"))
    .sort();

  const events: JournalEventRaw[] = [];
  for (const file of jsonFiles) {
    try {
      const raw = await fs.readFile(path.join(journalDir, file), "utf8");
      const parsed = JSON.parse(raw) as JournalEventRaw;
      events.push(parsed);
    } catch {
      // skip malformed events
    }
  }
  return events;
}

function extractCompressionEvents(events: JournalEventRaw[]): CompressionEvent[] {
  return events.filter(
    (e): e is CompressionEvent =>
      e.type === "COMPRESSION_APPLIED" &&
      e.data !== null &&
      typeof e.data === "object"
  );
}

// ============================================================================
// Stats Computation
// ============================================================================

function computeRunStats(runId: string, events: CompressionEvent[]): RunCompressionStats {
  let originalTokens = 0;
  let compressedTokens = 0;
  const byLayer: Record<string, LayerStats> = {};

  for (const event of events) {
    const d = event.data;
    const orig = typeof d.originalTokens === "number" ? d.originalTokens : 0;
    const comp = typeof d.compressedTokens === "number" ? d.compressedTokens : 0;
    originalTokens += orig;
    compressedTokens += comp;

    const layer = d.layer ?? "unknown";
    if (!byLayer[layer]) {
      byLayer[layer] = { eventCount: 0, originalTokens: 0, compressedTokens: 0, tokensSaved: 0 };
    }
    byLayer[layer].eventCount += 1;
    byLayer[layer].originalTokens += orig;
    byLayer[layer].compressedTokens += comp;
    byLayer[layer].tokensSaved += orig - comp;
  }

  const tokensSaved = originalTokens - compressedTokens;
  const reductionPct = originalTokens > 0 ? (tokensSaved / originalTokens) * 100 : 0;
  const date = events.length > 0 ? (events[0].recordedAt ?? "") : "";

  return {
    runId,
    date,
    eventCount: events.length,
    originalTokens,
    compressedTokens,
    tokensSaved,
    reductionPct,
    byLayer,
  };
}

// ============================================================================
// Single Run
// ============================================================================

async function statsForRun(runId: string, runsDirOverride?: string): Promise<RunCompressionStats | null> {
  const runDir = resolveExistingRunDir(runId, { override: runsDirOverride });
  const journalDir = path.join(runDir, "journal");

  let stat;
  try {
    stat = await fs.stat(runDir);
  } catch {
    return null;
  }
  if (!stat.isDirectory()) return null;

  const events = await readJournalDir(journalDir);
  const compressionEvents = extractCompressionEvents(events);
  return computeRunStats(runId, compressionEvents);
}

// ============================================================================
// All Runs
// ============================================================================

async function statsForAllRuns(readableRunsDirs: string[]): Promise<AggregateStats> {
  const runs: RunCompressionStats[] = [];
  const seenRunDirs = new Set<string>();

  for (const runsDir of readableRunsDirs) {
    let entries: string[];
    try {
      entries = await fs.readdir(runsDir);
    } catch {
      entries = [];
    }

    for (const entry of entries) {
      const runDir = path.join(runsDir, entry);
      let normalizedRunDir: string;
      try {
        const s = await fs.stat(runDir);
        if (!s.isDirectory()) continue;
        normalizedRunDir = path.resolve(runDir);
      } catch {
        continue;
      }
      if (seenRunDirs.has(normalizedRunDir)) {
        continue;
      }
      seenRunDirs.add(normalizedRunDir);

      const journalDir = path.join(runDir, "journal");
      const events = await readJournalDir(journalDir);
      const compressionEvents = extractCompressionEvents(events);
      if (compressionEvents.length === 0) continue;
      runs.push(computeRunStats(entry, compressionEvents));
    }
  }

  let totalOriginal = 0;
  let totalCompressed = 0;
  let totalEvents = 0;
  for (const r of runs) {
    totalOriginal += r.originalTokens;
    totalCompressed += r.compressedTokens;
    totalEvents += r.eventCount;
  }
  const totalSaved = totalOriginal - totalCompressed;
  const overallReductionPct = totalOriginal > 0 ? (totalSaved / totalOriginal) * 100 : 0;

  return {
    totalRuns: runs.length,
    totalEvents,
    totalOriginalTokens: totalOriginal,
    totalCompressedTokens: totalCompressed,
    totalTokensSaved: totalSaved,
    overallReductionPct,
    runs,
  };
}

// ============================================================================
// Main Handler
// ============================================================================

export async function handleTokensStats(options: TokensStatsOptions): Promise<number> {
  const readableRunsDirs = getReadableRunsDirs({ override: options.runsDir });
  const useColors = supportsColors();

  if (options.all) {
    const agg = await statsForAllRuns(readableRunsDirs);
    if (options.json) {
      console.log(JSON.stringify(agg, null, 2));
    } else {
      printAggregateTable(agg, useColors);
    }
    return 0;
  }

  if (options.runId) {
    const stats = await statsForRun(options.runId, options.runsDir);
    if (!stats) {
      const msg = `Run not found: ${options.runId} (looked in ${readableRunsDirs.join(", ")})`;
      if (options.json) {
        console.error(JSON.stringify({ error: msg }));
      } else {
        console.error(msg);
      }
      return 1;
    }
    if (options.json) {
      console.log(JSON.stringify(stats, null, 2));
    } else {
      printSingleRunTable(stats, useColors);
    }
    return 0;
  }

  // No runId and no --all: print help
  console.error("Usage: babysitter tokens:stats [runId] [--all] [--json] [--runs-dir <dir>]");
  console.error("  runId    Show compression stats for a specific run");
  console.error("  --all    Aggregate stats across all runs");
  console.error("  --json   Output JSON instead of table");
  return 1;
}
