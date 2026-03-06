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
import { DEFAULTS, CONFIG_ENV_VARS } from "../../config/defaults";

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
// ANSI Colors
// ============================================================================

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
} as const;

function supportsColors(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR !== undefined) return true;
  return Boolean(process.stdout?.isTTY);
}

function col(text: string, color: keyof typeof COLORS, useColors: boolean): string {
  return useColors ? `${COLORS[color]}${text}${COLORS.reset}` : text;
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

async function statsForRun(runsDir: string, runId: string): Promise<RunCompressionStats | null> {
  const runDir = path.join(runsDir, runId);
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

async function statsForAllRuns(runsDir: string): Promise<AggregateStats> {
  let entries: string[];
  try {
    entries = await fs.readdir(runsDir);
  } catch {
    entries = [];
  }

  const runs: RunCompressionStats[] = [];
  for (const entry of entries) {
    const runDir = path.join(runsDir, entry);
    try {
      const s = await fs.stat(runDir);
      if (!s.isDirectory()) continue;
    } catch {
      continue;
    }
    const journalDir = path.join(runDir, "journal");
    const events = await readJournalDir(journalDir);
    const compressionEvents = extractCompressionEvents(events);
    if (compressionEvents.length === 0) continue;
    runs.push(computeRunStats(entry, compressionEvents));
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
// Formatting
// ============================================================================

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function pad(s: string, width: number, right = false): string {
  if (right) return s.padStart(width);
  return s.padEnd(width);
}

function printSingleRunTable(stats: RunCompressionStats, useColors: boolean): void {
  console.log("");
  console.log(col(`Run: ${stats.runId}`, "bold", useColors));
  console.log(col(`Date: ${stats.date}`, "dim", useColors));
  console.log("");

  if (stats.eventCount === 0) {
    console.log(col("  No COMPRESSION_APPLIED events found in this run.", "yellow", useColors));
    console.log("");
    return;
  }

  // Summary row
  console.log(col("  Summary", "cyan", useColors));
  console.log(`  Events:            ${col(fmtNum(stats.eventCount), "bold", useColors)}`);
  console.log(`  Original tokens:   ${col(fmtNum(stats.originalTokens), "bold", useColors)}`);
  console.log(`  Compressed tokens: ${col(fmtNum(stats.compressedTokens), "bold", useColors)}`);
  console.log(`  Tokens saved:      ${col(fmtNum(stats.tokensSaved), "green", useColors)}`);
  console.log(`  Reduction:         ${col(fmtPct(stats.reductionPct), "green", useColors)}`);
  console.log("");

  const layers = Object.keys(stats.byLayer).sort();
  if (layers.length > 0) {
    console.log(col("  By Layer", "cyan", useColors));
    const hdr = [
      pad("Layer", 8),
      pad("Events", 8, true),
      pad("Original", 12, true),
      pad("Compressed", 12, true),
      pad("Saved", 12, true),
      pad("Reduction", 10, true),
    ].join("  ");
    console.log(col(`  ${hdr}`, "dim", useColors));
    console.log(col(`  ${"-".repeat(hdr.length)}`, "dim", useColors));
    for (const layer of layers) {
      const l = stats.byLayer[layer];
      const redPct = l.originalTokens > 0 ? (l.tokensSaved / l.originalTokens) * 100 : 0;
      const row = [
        pad(`Layer ${layer}`, 8),
        pad(fmtNum(l.eventCount), 8, true),
        pad(fmtNum(l.originalTokens), 12, true),
        pad(fmtNum(l.compressedTokens), 12, true),
        pad(fmtNum(l.tokensSaved), 12, true),
        pad(fmtPct(redPct), 10, true),
      ].join("  ");
      console.log(`  ${row}`);
    }
    console.log("");
  }
}

function printAggregateTable(agg: AggregateStats, useColors: boolean): void {
  console.log("");
  console.log(col("Token Compression Stats — All Runs", "bold", useColors));
  console.log("");

  if (agg.totalRuns === 0) {
    console.log(col("  No runs with COMPRESSION_APPLIED events found.", "yellow", useColors));
    console.log("");
    return;
  }

  console.log(`  Total runs with compression: ${col(fmtNum(agg.totalRuns), "bold", useColors)}`);
  console.log(`  Total events:                ${col(fmtNum(agg.totalEvents), "bold", useColors)}`);
  console.log(`  Total original tokens:       ${col(fmtNum(agg.totalOriginalTokens), "bold", useColors)}`);
  console.log(`  Total compressed tokens:     ${col(fmtNum(agg.totalCompressedTokens), "bold", useColors)}`);
  console.log(`  Total tokens saved:          ${col(fmtNum(agg.totalTokensSaved), "green", useColors)}`);
  console.log(`  Overall reduction:           ${col(fmtPct(agg.overallReductionPct), "green", useColors)}`);
  console.log("");

  if (agg.runs.length > 0) {
    console.log(col("  Per-Run Breakdown", "cyan", useColors));
    const hdr = [
      pad("Run ID", 28),
      pad("Date", 24),
      pad("Events", 8, true),
      pad("Original", 12, true),
      pad("Compressed", 12, true),
      pad("Reduction", 10, true),
    ].join("  ");
    console.log(col(`  ${hdr}`, "dim", useColors));
    console.log(col(`  ${"-".repeat(hdr.length)}`, "dim", useColors));

    const sorted = [...agg.runs].sort((a, b) => b.tokensSaved - a.tokensSaved);
    for (const r of sorted) {
      const row = [
        pad(r.runId, 28),
        pad(r.date.slice(0, 24), 24),
        pad(fmtNum(r.eventCount), 8, true),
        pad(fmtNum(r.originalTokens), 12, true),
        pad(fmtNum(r.compressedTokens), 12, true),
        pad(fmtPct(r.reductionPct), 10, true),
      ].join("  ");
      console.log(`  ${row}`);
    }
    console.log("");
  }
}

// ============================================================================
// Main Handler
// ============================================================================

export async function handleTokensStats(options: TokensStatsOptions): Promise<number> {
  const runsDir = options.runsDir ?? process.env[CONFIG_ENV_VARS.RUNS_DIR] ?? DEFAULTS.runsDir;
  const resolvedRunsDir = path.resolve(runsDir);
  const useColors = supportsColors();

  if (options.all) {
    const agg = await statsForAllRuns(resolvedRunsDir);
    if (options.json) {
      console.log(JSON.stringify(agg, null, 2));
    } else {
      printAggregateTable(agg, useColors);
    }
    return 0;
  }

  if (options.runId) {
    const stats = await statsForRun(resolvedRunsDir, options.runId);
    if (!stats) {
      const msg = `Run not found: ${options.runId} (looked in ${resolvedRunsDir})`;
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
