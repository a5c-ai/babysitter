/**
 * Cost tracking journal helpers for Babysitter SDK.
 *
 * Provides functions to append COST_TRACKED events to the run journal,
 * extract cost events from a journal, and compute aggregated cost statistics.
 */

import { appendEvent, type AppendEventResult, type JournalEvent } from "@a5c-ai/babysitter-sdk";
import type {
  CostEventData,
  RunCostStats,
  ModelCostStats,
  KindCostStats,
} from "./types";
import { calculateCostUsd } from "./types";

/** Journal event type constant for cost tracking events. */
export const COST_TRACKED_EVENT_TYPE = "COST_TRACKED";

/**
 * Append a COST_TRACKED event to a run's journal.
 *
 * Computes the USD cost (if not already set) before persisting so that the
 * journal record is self-contained.
 *
 * @param runDir - Absolute path to the run directory.
 * @param costData - Token usage and metadata for the cost event.
 * @returns The append result with seq, ulid, filename, checksum, path, and recordedAt.
 */
export async function appendCostEvent(
  runDir: string,
  costData: CostEventData,
): Promise<AppendEventResult> {
  // Pre-compute costUsd if the caller did not supply it.
  const enriched: CostEventData = { ...costData };
  if (enriched.costUsd == null) {
    const computed = calculateCostUsd(
      enriched.model,
      enriched.inputTokens,
      enriched.outputTokens,
      enriched.cacheCreationTokens,
      enriched.cacheReadTokens,
    );
    if (computed !== undefined) {
      enriched.costUsd = computed;
    }
  }

  // Set timestamp if missing.
  if (!enriched.timestamp) {
    enriched.timestamp = new Date().toISOString();
  }

  // Convert CostEventData to JsonRecord (Record<string, unknown>) without a
  // double-cast.  Spread produces a plain object whose type satisfies the
  // index signature that CostEventData's interface lacks.
  const eventRecord: Record<string, unknown> = { ...enriched };

  return appendEvent({
    runDir,
    eventType: COST_TRACKED_EVENT_TYPE,
    event: eventRecord,
  });
}

/**
 * Filter journal events to only COST_TRACKED entries.
 *
 * @param events - Full journal event list (as returned by `loadJournal`).
 * @returns Subset of events whose type is COST_TRACKED.
 */
export function extractCostEvents(events: JournalEvent[]): JournalEvent[] {
  return events.filter((e) => e.type === COST_TRACKED_EVENT_TYPE);
}

/**
 * Compute aggregated cost statistics for a run from its journal events.
 *
 * Extracts COST_TRACKED events, then accumulates totals with per-model and
 * per-task-kind breakdowns.
 *
 * @param runId - The run identifier (included in the returned stats object).
 * @param events - Full journal event list for the run.
 * @returns Aggregated cost stats for the run.
 */
export function computeRunCostStats(
  runId: string,
  events: JournalEvent[],
): RunCostStats {
  const costEvents = extractCostEvents(events);

  const stats: RunCostStats = {
    runId,
    date: costEvents.length > 0 ? costEvents[0].recordedAt : new Date().toISOString(),
    eventCount: costEvents.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheCreation: 0,
    totalCacheRead: 0,
    totalCostUsd: 0,
    byModel: {},
    byKind: {},
  };

  for (const event of costEvents) {
    // Validate the expected shape before treating data as CostEventData.
    // journal event data is typed as JsonRecord (Record<string, unknown>),
    // so we perform a runtime check on the critical numeric fields.
    const raw = event.data;
    if (typeof raw !== "object" || raw === null) {
      continue; // skip malformed events
    }
    const data: CostEventData = {
      model: typeof raw.model === "string" ? raw.model : "unknown",
      inputTokens: typeof raw.inputTokens === "number" ? raw.inputTokens : 0,
      outputTokens: typeof raw.outputTokens === "number" ? raw.outputTokens : 0,
      cacheCreationTokens: typeof raw.cacheCreationTokens === "number" ? raw.cacheCreationTokens : 0,
      cacheReadTokens: typeof raw.cacheReadTokens === "number" ? raw.cacheReadTokens : 0,
      cacheCreation5mTokens: typeof raw.cacheCreation5mTokens === "number" ? raw.cacheCreation5mTokens : 0,
      cacheCreation1hTokens: typeof raw.cacheCreation1hTokens === "number" ? raw.cacheCreation1hTokens : 0,
      costUsd: typeof raw.costUsd === "number" ? raw.costUsd : undefined,
      taskKind: typeof raw.taskKind === "string" ? raw.taskKind : undefined,
    };

    const inputTokens = data.inputTokens ?? 0;
    const outputTokens = data.outputTokens ?? 0;
    const cacheCreationTokens = data.cacheCreationTokens ?? 0;
    const cacheReadTokens = data.cacheReadTokens ?? 0;

    // Resolve per-event cost: use pre-computed value or calculate on the fly.
    const eventCost =
      data.costUsd ??
      calculateCostUsd(
        data.model,
        inputTokens,
        outputTokens,
        cacheCreationTokens,
        cacheReadTokens,
      ) ??
      0;

    // --- Run-level totals ---
    stats.totalInputTokens += inputTokens;
    stats.totalOutputTokens += outputTokens;
    stats.totalCacheCreation += cacheCreationTokens;
    stats.totalCacheRead += cacheReadTokens;
    stats.totalCostUsd += eventCost;

    // --- Per-model breakdown ---
    const model = data.model ?? "unknown";
    if (!stats.byModel[model]) {
      stats.byModel[model] = {
        model,
        eventCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        costUsd: 0,
      } satisfies ModelCostStats;
    }
    const ms = stats.byModel[model];
    ms.eventCount += 1;
    ms.inputTokens += inputTokens;
    ms.outputTokens += outputTokens;
    ms.cacheCreationTokens += cacheCreationTokens;
    ms.cacheReadTokens += cacheReadTokens;
    ms.costUsd += eventCost;

    // --- Per-kind breakdown ---
    const kind = data.taskKind ?? "unknown";
    if (!stats.byKind[kind]) {
      stats.byKind[kind] = {
        kind,
        eventCount: 0,
        costUsd: 0,
      } satisfies KindCostStats;
    }
    const ks = stats.byKind[kind];
    ks.eventCount += 1;
    ks.costUsd += eventCost;
  }

  // Round totals to 6 decimal places to avoid floating-point drift.
  stats.totalCostUsd = Math.round(stats.totalCostUsd * 1_000_000) / 1_000_000;
  for (const ms of Object.values(stats.byModel)) {
    ms.costUsd = Math.round(ms.costUsd * 1_000_000) / 1_000_000;
  }
  for (const ks of Object.values(stats.byKind)) {
    ks.costUsd = Math.round(ks.costUsd * 1_000_000) / 1_000_000;
  }

  return stats;
}
