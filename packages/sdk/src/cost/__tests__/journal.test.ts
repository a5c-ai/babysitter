import { describe, expect, test } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createRunDir, loadJournal } from "../../storage";
import { nextUlid } from "../../storage/ulids";
import type { JournalEvent } from "../../storage/types";
import {
  COST_TRACKED_EVENT_TYPE,
  appendCostEventOnce,
  extractCostEvents,
  computeRunCostStats,
} from "../journal";

// ============================================================================
// Helpers
// ============================================================================

let seqCounter = 0;

function makeCostEvent(overrides: Record<string, unknown> = {}): JournalEvent {
  seqCounter += 1;
  return {
    seq: seqCounter,
    ulid: `01COST${String(seqCounter).padStart(10, "0")}`,
    filename: `${String(seqCounter).padStart(6, "0")}.01COST${String(seqCounter).padStart(10, "0")}.json`,
    path: `/fake/runs/test-run/journal/${String(seqCounter).padStart(6, "0")}.json`,
    type: COST_TRACKED_EVENT_TYPE,
    recordedAt: "2026-04-05T12:00:00.000Z",
    data: {
      model: "claude-opus-4-6",
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationTokens: 200,
      cacheReadTokens: 100,
      costUsd: 0.01880,
      taskKind: "orchestrator_task",
      ...overrides,
    },
  };
}

function makeNonCostEvent(type: string): JournalEvent {
  seqCounter += 1;
  return {
    seq: seqCounter,
    ulid: `01OTHER${String(seqCounter).padStart(9, "0")}`,
    filename: `${String(seqCounter).padStart(6, "0")}.01OTHER${String(seqCounter).padStart(9, "0")}.json`,
    path: `/fake/runs/test-run/journal/${String(seqCounter).padStart(6, "0")}.json`,
    type,
    recordedAt: "2026-04-05T12:00:00.000Z",
    data: { runId: "test-run" },
  };
}

// ============================================================================
// extractCostEvents
// ============================================================================

describe("extractCostEvents", () => {
  test("filters only COST_TRACKED events from a mixed journal", () => {
    const events: JournalEvent[] = [
      makeNonCostEvent("RUN_CREATED"),
      makeCostEvent(),
      makeNonCostEvent("EFFECT_REQUESTED"),
      makeCostEvent(),
      makeNonCostEvent("EFFECT_RESOLVED"),
      makeCostEvent(),
      makeNonCostEvent("RUN_COMPLETED"),
    ];

    const costEvents = extractCostEvents(events);
    expect(costEvents).toHaveLength(3);
    for (const e of costEvents) {
      expect(e.type).toBe(COST_TRACKED_EVENT_TYPE);
    }
  });

  test("returns empty array when no COST_TRACKED events exist", () => {
    const events: JournalEvent[] = [
      makeNonCostEvent("RUN_CREATED"),
      makeNonCostEvent("EFFECT_REQUESTED"),
      makeNonCostEvent("RUN_COMPLETED"),
    ];

    const costEvents = extractCostEvents(events);
    expect(costEvents).toHaveLength(0);
  });

  test("returns empty array for empty input", () => {
    expect(extractCostEvents([])).toEqual([]);
  });

  test("returns all events when every event is COST_TRACKED", () => {
    const events = [makeCostEvent(), makeCostEvent(), makeCostEvent()];
    const costEvents = extractCostEvents(events);
    expect(costEvents).toHaveLength(3);
  });
});

// ============================================================================
// COST_TRACKED_EVENT_TYPE
// ============================================================================

describe("COST_TRACKED_EVENT_TYPE", () => {
  test("is the string 'COST_TRACKED'", () => {
    expect(COST_TRACKED_EVENT_TYPE).toBe("COST_TRACKED");
  });
});

// ============================================================================
// computeRunCostStats
// ============================================================================

describe("computeRunCostStats", () => {
  test("computes correct totals from cost events", () => {
    const events: JournalEvent[] = [
      makeNonCostEvent("RUN_CREATED"),
      makeCostEvent({
        model: "claude-opus-4-6",
        inputTokens: 1000,
        outputTokens: 500,
        cacheCreationTokens: 200,
        cacheReadTokens: 100,
        costUsd: 0.02,
        taskKind: "orchestrator_task",
      }),
      makeCostEvent({
        model: "claude-opus-4-6",
        inputTokens: 2000,
        outputTokens: 1000,
        cacheCreationTokens: 400,
        cacheReadTokens: 200,
        costUsd: 0.04,
        taskKind: "node",
      }),
      makeNonCostEvent("RUN_COMPLETED"),
    ];

    const stats = computeRunCostStats("run-123", events);

    expect(stats.runId).toBe("run-123");
    expect(stats.eventCount).toBe(2);
    expect(stats.totalInputTokens).toBe(3000);
    expect(stats.totalOutputTokens).toBe(1500);
    expect(stats.totalCacheCreation).toBe(600);
    expect(stats.totalCacheRead).toBe(300);
    expect(stats.totalCostUsd).toBeCloseTo(0.06, 6);
  });

  test("produces per-model breakdown", () => {
    const events: JournalEvent[] = [
      makeCostEvent({
        model: "claude-opus-4-6",
        inputTokens: 1000,
        outputTokens: 500,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        costUsd: 0.01,
        taskKind: "orchestrator_task",
      }),
      makeCostEvent({
        model: "claude-sonnet-4-6",
        inputTokens: 2000,
        outputTokens: 1000,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        costUsd: 0.005,
        taskKind: "orchestrator_task",
      }),
    ];

    const stats = computeRunCostStats("run-456", events);

    expect(Object.keys(stats.byModel)).toHaveLength(2);

    const opus = stats.byModel["claude-opus-4-6"];
    expect(opus.eventCount).toBe(1);
    expect(opus.inputTokens).toBe(1000);
    expect(opus.outputTokens).toBe(500);
    expect(opus.costUsd).toBeCloseTo(0.01, 6);

    const sonnet = stats.byModel["claude-sonnet-4-6"];
    expect(sonnet.eventCount).toBe(1);
    expect(sonnet.inputTokens).toBe(2000);
    expect(sonnet.outputTokens).toBe(1000);
    expect(sonnet.costUsd).toBeCloseTo(0.005, 6);
  });

  test("produces per-kind breakdown", () => {
    const events: JournalEvent[] = [
      makeCostEvent({ taskKind: "orchestrator_task", costUsd: 0.01 }),
      makeCostEvent({ taskKind: "orchestrator_task", costUsd: 0.02 }),
      makeCostEvent({ taskKind: "node", costUsd: 0.005 }),
      makeCostEvent({ taskKind: "breakpoint", costUsd: 0.001 }),
    ];

    const stats = computeRunCostStats("run-789", events);

    expect(Object.keys(stats.byKind)).toHaveLength(3);

    const orchestrator = stats.byKind["orchestrator_task"];
    expect(orchestrator.eventCount).toBe(2);
    expect(orchestrator.costUsd).toBeCloseTo(0.03, 6);

    const node = stats.byKind["node"];
    expect(node.eventCount).toBe(1);
    expect(node.costUsd).toBeCloseTo(0.005, 6);

    const breakpoint = stats.byKind["breakpoint"];
    expect(breakpoint.eventCount).toBe(1);
    expect(breakpoint.costUsd).toBeCloseTo(0.001, 6);
  });

  test("defaults missing taskKind to 'unknown'", () => {
    const events: JournalEvent[] = [
      makeCostEvent({ taskKind: undefined, costUsd: 0.01 }),
    ];

    const stats = computeRunCostStats("run-no-kind", events);
    expect(stats.byKind["unknown"]).toBeDefined();
    expect(stats.byKind["unknown"].eventCount).toBe(1);
  });

  test("returns zero stats for journal with no cost events", () => {
    const events: JournalEvent[] = [
      makeNonCostEvent("RUN_CREATED"),
      makeNonCostEvent("EFFECT_REQUESTED"),
      makeNonCostEvent("RUN_COMPLETED"),
    ];

    const stats = computeRunCostStats("run-empty", events);
    expect(stats.runId).toBe("run-empty");
    expect(stats.eventCount).toBe(0);
    expect(stats.totalInputTokens).toBe(0);
    expect(stats.totalOutputTokens).toBe(0);
    expect(stats.totalCostUsd).toBe(0);
    expect(Object.keys(stats.byModel)).toHaveLength(0);
    expect(Object.keys(stats.byKind)).toHaveLength(0);
  });

  test("returns zero stats for empty events array", () => {
    const stats = computeRunCostStats("run-nil", []);
    expect(stats.eventCount).toBe(0);
    expect(stats.totalCostUsd).toBe(0);
  });

  test("uses date from first cost event as run date", () => {
    const events: JournalEvent[] = [
      makeNonCostEvent("RUN_CREATED"),
      {
        ...makeCostEvent(),
        recordedAt: "2026-03-15T08:30:00.000Z",
      },
      {
        ...makeCostEvent(),
        recordedAt: "2026-03-15T09:00:00.000Z",
      },
    ];

    const stats = computeRunCostStats("run-date", events);
    expect(stats.date).toBe("2026-03-15T08:30:00.000Z");
  });

  test("calculates costUsd on the fly when event data omits it", () => {
    // When costUsd is not in the event data, computeRunCostStats should
    // call calculateCostUsd to derive it.
    const events: JournalEvent[] = [
      makeCostEvent({
        model: "claude-sonnet-4-6",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        costUsd: undefined, // force on-the-fly calculation
        taskKind: "node",
      }),
    ];

    const stats = computeRunCostStats("run-calc", events);
    // sonnet-4-6: 1M input at $3 + 1M output at $15 = $18
    expect(stats.totalCostUsd).toBe(18);
  });

  test("rounds final totals to 6 decimal places", () => {
    // Many small events to provoke floating-point drift
    const events: JournalEvent[] = Array.from({ length: 50 }, () =>
      makeCostEvent({ costUsd: 0.000003 }),
    );

    const stats = computeRunCostStats("run-round", events);
    // 50 * 0.000003 = 0.00015 exactly if rounding works
    expect(stats.totalCostUsd).toBeCloseTo(0.00015, 6);
    const parts = stats.totalCostUsd.toString().split(".");
    if (parts.length > 1) {
      expect(parts[1].length).toBeLessThanOrEqual(6);
    }
  });
});

describe("appendCostEventOnce", () => {
  test("appends only one COST_TRACKED event for the same idempotency key", async () => {
    const runsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cost-once-"));
    try {
      const { runDir } = await createRunDir({
        runsRoot,
        runId: nextUlid(),
        request: "cost once",
        processId: "cost-once",
      });

      const first = await appendCostEventOnce(runDir, {
        runId: "run-1",
        sessionId: "session-1",
        effectId: "effect-1",
        taskId: "task-1",
        taskKind: "agent",
        source: "transport-mux",
        idempotencyKey: "transport:run-1:effect-1",
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        inputTokens: 12,
        outputTokens: 8,
        cacheCreationTokens: 2,
        cacheReadTokens: 3,
        cacheCreation5mTokens: 0,
        cacheCreation1hTokens: 0,
        costUsd: 0.001,
      });
      const second = await appendCostEventOnce(runDir, {
        runId: "run-1",
        effectId: "effect-1",
        source: "transport-mux",
        idempotencyKey: "transport:run-1:effect-1",
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        inputTokens: 99,
        outputTokens: 99,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        cacheCreation5mTokens: 0,
        cacheCreation1hTokens: 0,
        costUsd: 9,
      });

      expect(first).not.toBeNull();
      expect(second).toBeNull();
      const costEvents = extractCostEvents(await loadJournal(runDir));
      expect(costEvents).toHaveLength(1);
      expect(costEvents[0].data).toMatchObject({
        idempotencyKey: "transport:run-1:effect-1",
        cacheCreationInputTokens: 2,
        cacheReadInputTokens: 3,
      });
    } finally {
      await fs.rm(runsRoot, { recursive: true, force: true }).catch(() => {});
    }
  });
});
