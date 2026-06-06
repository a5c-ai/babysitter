/**
 * cost:stats command - Show cost tracking statistics from run journals
 *
 * Usage:
 *   babysitter cost:stats [runId] [--json] [--all] [--runs-dir <dir>]
 *
 * With runId: reads journal for that run, finds COST_TRACKED events, prints table
 * With --all: aggregates across all runs in the runs directory
 * With --json: outputs JSON instead of table
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { getReadableRunsDirs, resolveExistingRunDir } from "../../config";
import { loadJournal } from "../../storage";
import { computeRunCostStats } from "../../cost/journal";
import type {
  CostStatsOptions,
  RunCostStats,
  AggregateCostStats,
  ModelCostStats,
  KindCostStats,
} from "../../cost/types";

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
// Single Run
// ============================================================================

async function costStatsForRun(runId: string, runsDirOverride?: string): Promise<RunCostStats | null> {
  const runDir = resolveExistingRunDir(runId, { override: runsDirOverride });

  let stat;
  try {
    stat = await fs.stat(runDir);
  } catch {
    return null;
  }
  if (!stat.isDirectory()) return null;

  const events = await loadJournal(runDir);
  return computeRunCostStats(runId, events);
}

// ============================================================================
// All Runs
// ============================================================================

async function costStatsForAllRuns(readableRunsDirs: string[]): Promise<AggregateCostStats> {
  const runs: RunCostStats[] = [];
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

      const events = await loadJournal(runDir);
      const stats = computeRunCostStats(entry, events);
      if (stats.eventCount === 0) continue;
      runs.push(stats);
    }
  }

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheCreation = 0;
  let totalCacheRead = 0;
  let totalCostUsd = 0;
  let totalEvents = 0;
  for (const r of runs) {
    totalInputTokens += r.totalInputTokens;
    totalOutputTokens += r.totalOutputTokens;
    totalCacheCreation += r.totalCacheCreation;
    totalCacheRead += r.totalCacheRead;
    totalCostUsd += r.totalCostUsd;
    totalEvents += r.eventCount;
  }
  totalCostUsd = Math.round(totalCostUsd * 1_000_000) / 1_000_000;

  return {
    totalRuns: runs.length,
    totalEvents,
    totalInputTokens,
    totalOutputTokens,
    totalCacheCreation,
    totalCacheRead,
    totalCostUsd,
    overallCostUsd: totalCostUsd,
    runs,
  };
}

// ============================================================================
// Formatting
// ============================================================================

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(4)}`;
}

function pad(s: string, width: number, right = false): string {
  if (right) return s.padStart(width);
  return s.padEnd(width);
}

function printSingleRunTable(stats: RunCostStats, useColors: boolean): void {
  console.log("");
  console.log(col(`Run: ${stats.runId}`, "bold", useColors));
  console.log(col(`Date: ${stats.date}`, "dim", useColors));
  console.log("");

  if (stats.eventCount === 0) {
    console.log(col("  No COST_TRACKED events found in this run.", "yellow", useColors));
    console.log("");
    return;
  }

  // Summary row
  console.log(col("  Summary", "cyan", useColors));
  console.log(`  Events:            ${col(fmtNum(stats.eventCount), "bold", useColors)}`);
  console.log(`  Input tokens:      ${col(fmtNum(stats.totalInputTokens), "bold", useColors)}`);
  console.log(`  Output tokens:     ${col(fmtNum(stats.totalOutputTokens), "bold", useColors)}`);
  console.log(`  Cache write:       ${col(fmtNum(stats.totalCacheCreation), "bold", useColors)}`);
  console.log(`  Cache read:        ${col(fmtNum(stats.totalCacheRead), "bold", useColors)}`);
  console.log(`  Total cost:        ${col(fmtUsd(stats.totalCostUsd), "green", useColors)}`);
  console.log("");

  // Per-model breakdown
  const models = Object.keys(stats.byModel).sort();
  if (models.length > 0) {
    console.log(col("  By Model", "cyan", useColors));
    const hdr = [
      pad("Model", 24),
      pad("Events", 8, true),
      pad("Input Tokens", 14, true),
      pad("Output Tokens", 15, true),
      pad("Cache Write", 13, true),
      pad("Cache Read", 12, true),
      pad("Cost ($)", 12, true),
    ].join("  ");
    console.log(col(`  ${hdr}`, "dim", useColors));
    console.log(col(`  ${"-".repeat(hdr.length)}`, "dim", useColors));
    for (const model of models) {
      const m: ModelCostStats = stats.byModel[model];
      const row = [
        pad(m.model, 24),
        pad(fmtNum(m.eventCount), 8, true),
        pad(fmtNum(m.inputTokens), 14, true),
        pad(fmtNum(m.outputTokens), 15, true),
        pad(fmtNum(m.cacheCreationTokens), 13, true),
        pad(fmtNum(m.cacheReadTokens), 12, true),
        pad(fmtUsd(m.costUsd), 12, true),
      ].join("  ");
      console.log(`  ${row}`);
    }
    console.log("");
  }

  // Per-kind breakdown
  const kinds = Object.keys(stats.byKind).sort();
  if (kinds.length > 0) {
    console.log(col("  By Task Kind", "cyan", useColors));
    const hdr = [
      pad("Kind", 24),
      pad("Events", 8, true),
      pad("Cost ($)", 12, true),
    ].join("  ");
    console.log(col(`  ${hdr}`, "dim", useColors));
    console.log(col(`  ${"-".repeat(hdr.length)}`, "dim", useColors));
    for (const kind of kinds) {
      const k: KindCostStats = stats.byKind[kind];
      const row = [
        pad(k.kind, 24),
        pad(fmtNum(k.eventCount), 8, true),
        pad(fmtUsd(k.costUsd), 12, true),
      ].join("  ");
      console.log(`  ${row}`);
    }
    console.log("");
  }
}

function printAggregateTable(agg: AggregateCostStats, useColors: boolean): void {
  console.log("");
  console.log(col("Cost Stats \u2014 All Runs", "bold", useColors));
  console.log("");

  if (agg.totalRuns === 0) {
    console.log(col("  No runs with COST_TRACKED events found.", "yellow", useColors));
    console.log("");
    return;
  }

  console.log(`  Total runs with cost data: ${col(fmtNum(agg.totalRuns), "bold", useColors)}`);
  console.log(`  Total events:              ${col(fmtNum(agg.totalEvents), "bold", useColors)}`);
  console.log(`  Total input tokens:        ${col(fmtNum(agg.totalInputTokens), "bold", useColors)}`);
  console.log(`  Total output tokens:       ${col(fmtNum(agg.totalOutputTokens), "bold", useColors)}`);
  console.log(`  Total cache write:         ${col(fmtNum(agg.totalCacheCreation), "bold", useColors)}`);
  console.log(`  Total cache read:          ${col(fmtNum(agg.totalCacheRead), "bold", useColors)}`);
  console.log(`  Total cost:                ${col(fmtUsd(agg.totalCostUsd), "green", useColors)}`);
  console.log("");

  if (agg.runs.length > 0) {
    console.log(col("  Per-Run Breakdown", "cyan", useColors));
    const hdr = [
      pad("Run ID", 28),
      pad("Date", 24),
      pad("Events", 8, true),
      pad("Input", 12, true),
      pad("Output", 12, true),
      pad("Cost ($)", 12, true),
    ].join("  ");
    console.log(col(`  ${hdr}`, "dim", useColors));
    console.log(col(`  ${"-".repeat(hdr.length)}`, "dim", useColors));

    const sorted = [...agg.runs].sort((a, b) => b.totalCostUsd - a.totalCostUsd);
    for (const r of sorted) {
      const row = [
        pad(r.runId, 28),
        pad(r.date.slice(0, 24), 24),
        pad(fmtNum(r.eventCount), 8, true),
        pad(fmtNum(r.totalInputTokens), 12, true),
        pad(fmtNum(r.totalOutputTokens), 12, true),
        pad(fmtUsd(r.totalCostUsd), 12, true),
      ].join("  ");
      console.log(`  ${row}`);
    }
    console.log("");
  }
}

// ============================================================================
// Main Handler
// ============================================================================

export async function handleCostStats(options: CostStatsOptions): Promise<number> {
  const readableRunsDirs = getReadableRunsDirs({ override: options.runsDir });
  const useColors = supportsColors();

  if (options.all) {
    const agg = await costStatsForAllRuns(readableRunsDirs);
    if (options.json) {
      console.log(JSON.stringify(agg, null, 2));
    } else {
      printAggregateTable(agg, useColors);
    }
    return 0;
  }

  if (options.runId) {
    const stats = await costStatsForRun(options.runId, options.runsDir);
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
  console.error("Usage: babysitter cost:stats [runId] [--all] [--json] [--runs-dir <dir>]");
  console.error("  runId    Show cost stats for a specific run");
  console.error("  --all    Aggregate cost stats across all runs");
  console.error("  --json   Output JSON instead of table");
  return 1;
}
