/**
 * Formatting helpers for tokens:stats command.
 * Extracted from tokensStats.ts for max-lines compliance.
 */

import type { RunCompressionStats, AggregateStats } from "./tokensStats";

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

export function supportsColors(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR !== undefined) return true;
  return Boolean(process.stdout?.isTTY);
}

function col(text: string, color: keyof typeof COLORS, useColors: boolean): string {
  return useColors ? `${COLORS[color]}${text}${COLORS.reset}` : text;
}

// ============================================================================
// Formatting Utilities
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

// ============================================================================
// Table Output
// ============================================================================

export function printSingleRunTable(stats: RunCompressionStats, useColors: boolean): void {
  console.log("");
  console.log(col(`Run: ${stats.runId}`, "bold", useColors));
  console.log(col(`Date: ${stats.date}`, "dim", useColors));
  console.log("");

  if (stats.eventCount === 0) {
    console.log(col("  No COMPRESSION_APPLIED events found in this run.", "yellow", useColors));
    console.log("");
    return;
  }

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

export function printAggregateTable(agg: AggregateStats, useColors: boolean): void {
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
