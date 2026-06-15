/**
 * Claude Code JSONL session file parser for cost data collection.
 *
 * Parses Claude Code session JSONL files (main session and subagent files)
 * to extract token usage data and compute costs. Each assistant message with
 * a `usage` block becomes a {@link CostEventData} entry.
 *
 * JSONL format (one JSON object per line):
 * ```json
 * {
 *   "type": "assistant",
 *   "message": {
 *     "model": "claude-opus-4-6",
 *     "usage": {
 *       "input_tokens": 3,
 *       "cache_creation_input_tokens": 26928,
 *       "cache_read_input_tokens": 0,
 *       "cache_creation": { "ephemeral_5m_input_tokens": 0, "ephemeral_1h_input_tokens": 26928 },
 *       "output_tokens": 28,
 *       "service_tier": "standard"
 *     }
 *   },
 *   "timestamp": "2026-04-05T..."
 * }
 * ```
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { CostEventData, ModelCostStats } from "./types";
import { calculateCostUsdExtended } from "./types";

// ============================================================================
// Internal types for the raw JSONL shape
// ============================================================================

/** Shape of the `cache_creation` sub-object in the Anthropic API response. */
interface RawCacheCreation {
  ephemeral_5m_input_tokens?: number;
  ephemeral_1h_input_tokens?: number;
}

/** Shape of the `usage` block inside an assistant message. */
interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation?: RawCacheCreation;
  service_tier?: string;
}

/** Minimal shape of a JSONL line we care about. */
interface RawJsonlEntry {
  type?: string;
  message?: {
    model?: string;
    usage?: RawUsage;
  };
  timestamp?: string;
}

// ============================================================================
// Single-file parser
// ============================================================================

/**
 * Parse a single Claude Code session JSONL file into cost events.
 *
 * Reads the file, splits by newline, and for each line that represents an
 * assistant message with usage data, extracts token counts and computes
 * the USD cost using the extended pricing model.
 *
 * @param sessionJsonlPath - Absolute path to the `.jsonl` file.
 * @returns Array of cost events extracted from assistant messages.
 */
export async function parseClaudeCodeSession(
  sessionJsonlPath: string,
): Promise<CostEventData[]> {
  let content: string;
  try {
    content = await fs.readFile(sessionJsonlPath, "utf-8");
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return [];
    throw err;
  }

  const lines = content.split("\n");
  const events: CostEventData[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let entry: RawJsonlEntry;
    try {
      entry = JSON.parse(trimmed) as RawJsonlEntry;
    } catch {
      // Malformed line — skip silently.
      continue;
    }

    if (entry.type !== "assistant") continue;
    const usage = entry.message?.usage;
    if (!usage) continue;

    const model = entry.message?.model ?? "unknown";
    const inputTokens = usage.input_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
    const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
    const cacheCreation5mTokens =
      usage.cache_creation?.ephemeral_5m_input_tokens ?? 0;
    const cacheCreation1hTokens =
      usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;

    const costUsd = calculateCostUsdExtended(
      model,
      inputTokens,
      outputTokens,
      cacheCreation5mTokens,
      cacheCreation1hTokens,
      cacheReadTokens,
    );

    events.push({
      model,
      inputTokens,
      outputTokens,
      cacheCreationTokens,
      cacheReadTokens,
      cacheCreation5mTokens,
      cacheCreation1hTokens,
      serviceTier: usage.service_tier,
      costUsd: costUsd ?? undefined,
      timestamp: entry.timestamp,
    });
  }

  return events;
}

// ============================================================================
// Session + subagent parser
// ============================================================================

/**
 * Parse a Claude Code session JSONL file and all associated subagent files.
 *
 * Subagent files live at `<sessionDir>/subagents/agent-*.jsonl` where
 * `<sessionDir>` is derived by stripping the `.jsonl` extension from the
 * main session file path.
 *
 * @param sessionJsonlPath - Absolute path to the main session `.jsonl` file.
 * @returns Merged array of cost events from the main session and all subagents.
 */
export async function parseClaudeCodeSessionWithSubagents(
  sessionJsonlPath: string,
): Promise<CostEventData[]> {
  // Parse main session file.
  const mainEvents = await parseClaudeCodeSession(sessionJsonlPath);

  // Derive the session directory (same name without .jsonl extension).
  const sessionDir = sessionJsonlPath.replace(/\.jsonl$/, "");
  const subagentsDir = path.join(sessionDir, "subagents");

  let subagentFiles: string[];
  try {
    const entries = await fs.readdir(subagentsDir);
    subagentFiles = entries
      .filter((f) => f.startsWith("agent-") && f.endsWith(".jsonl"))
      .map((f) => path.join(subagentsDir, f));
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return mainEvents;
    throw err;
  }

  // Parse all subagent files and merge.
  const subagentResults = await Promise.all(
    subagentFiles.map((f) => parseClaudeCodeSession(f)),
  );

  const allEvents = [...mainEvents];
  for (const sub of subagentResults) {
    allEvents.push(...sub);
  }

  return allEvents;
}

// ============================================================================
// Aggregation
// ============================================================================

/** Aggregated usage summary returned by {@link aggregateUsageData}. */
export interface AggregatedUsage {
  /** Total number of cost events. */
  eventCount: number;
  /** Total base input tokens across all events. */
  totalInputTokens: number;
  /** Total output tokens across all events. */
  totalOutputTokens: number;
  /** Total cache-creation tokens (top-level) across all events. */
  totalCacheCreationTokens: number;
  /** Total cache-read tokens across all events. */
  totalCacheReadTokens: number;
  /** Total 5-minute cache-creation tokens. */
  totalCacheCreation5mTokens: number;
  /** Total 1-hour cache-creation tokens. */
  totalCacheCreation1hTokens: number;
  /** Total computed cost in USD. */
  totalCostUsd: number;
  /** Per-model breakdown of usage statistics. */
  byModel: Record<string, ModelCostStats>;
}

/**
 * Aggregate usage data across an array of cost events.
 *
 * Sums token counts and costs, producing both overall totals and a
 * per-model breakdown.
 *
 * @param events - Array of cost events (e.g. from {@link parseClaudeCodeSessionWithSubagents}).
 * @returns Aggregated usage summary with per-model breakdown.
 */
export function aggregateUsageData(events: CostEventData[]): AggregatedUsage {
  const result: AggregatedUsage = {
    eventCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheCreationTokens: 0,
    totalCacheReadTokens: 0,
    totalCacheCreation5mTokens: 0,
    totalCacheCreation1hTokens: 0,
    totalCostUsd: 0,
    byModel: {},
  };

  for (const event of events) {
    result.eventCount += 1;
    result.totalInputTokens += event.inputTokens;
    result.totalOutputTokens += event.outputTokens;
    result.totalCacheCreationTokens += event.cacheCreationTokens;
    result.totalCacheReadTokens += event.cacheReadTokens;
    result.totalCacheCreation5mTokens += event.cacheCreation5mTokens;
    result.totalCacheCreation1hTokens += event.cacheCreation1hTokens;
    result.totalCostUsd += event.costUsd ?? 0;

    // Per-model breakdown.
    const model = event.model ?? "unknown";
    if (!result.byModel[model]) {
      result.byModel[model] = {
        model,
        eventCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        costUsd: 0,
      };
    }
    const ms = result.byModel[model];
    ms.eventCount += 1;
    ms.inputTokens += event.inputTokens;
    ms.outputTokens += event.outputTokens;
    ms.cacheCreationTokens += event.cacheCreationTokens;
    ms.cacheReadTokens += event.cacheReadTokens;
    ms.costUsd += event.costUsd ?? 0;
  }

  // Round totals to 6 decimal places to avoid floating-point drift.
  result.totalCostUsd =
    Math.round(result.totalCostUsd * 1_000_000) / 1_000_000;
  for (const ms of Object.values(result.byModel)) {
    ms.costUsd = Math.round(ms.costUsd * 1_000_000) / 1_000_000;
  }

  return result;
}
