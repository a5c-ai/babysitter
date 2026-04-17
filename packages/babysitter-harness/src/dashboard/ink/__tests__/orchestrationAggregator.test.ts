/**
 * orchestrationAggregator.test.ts
 *
 * TDD tests for Phase 3 "Effect Visualization & Orchestration Status".
 *
 * Tests pure functions that aggregate effect summaries into an
 * OrchestrationStatus object and derive orchestration phase from effects.
 *
 * All functions are imported from ../helpers.js ().
 */

import { describe, it, expect } from "vitest";
import type {
  EffectSummary,
  OrchestrationStatus,
  OrchestrationPhase,
  TokenUsage,
} from "../types.js";
import {
  aggregateOrchestrationStatus,
  derivePhase,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeEffect(
  overrides: Partial<EffectSummary> & { effectId: string; kind: string; status: EffectSummary["status"] },
): EffectSummary {
  return { ...overrides } as EffectSummary;
}

// ---------------------------------------------------------------------------
// derivePhase
// ---------------------------------------------------------------------------

describe("derivePhase", () => {
  it("returns 'waiting' for empty effects list", () => {
    expect(derivePhase([])).toBe("waiting");
  });

  it("returns 'complete' when all effects are resolved", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e2", kind: "node", status: "resolved" }),
    ];
    expect(derivePhase(effects)).toBe("complete");
  });

  it("returns 'executing' when any effect is pending", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e2", kind: "node", status: "pending" }),
    ];
    expect(derivePhase(effects)).toBe("executing");
  });

  it("returns 'failed' when all non-resolved are failed and none pending", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "failed" }),
      makeEffect({ effectId: "e2", kind: "node", status: "failed" }),
    ];
    expect(derivePhase(effects)).toBe("failed");
  });

  it("returns 'failed' with mix of resolved and failed but no pending", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e2", kind: "node", status: "failed" }),
    ];
    expect(derivePhase(effects)).toBe("failed");
  });

  it("returns 'executing' when pending exists alongside failed", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e2", kind: "node", status: "failed" }),
    ];
    expect(derivePhase(effects)).toBe("executing");
  });

  it("returns 'complete' for single resolved effect", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "resolved" }),
    ];
    expect(derivePhase(effects)).toBe("complete");
  });

  it("returns 'executing' for single pending effect", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
    ];
    expect(derivePhase(effects)).toBe("executing");
  });

  it("returns 'failed' for single failed effect", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "failed" }),
    ];
    expect(derivePhase(effects)).toBe("failed");
  });
});

// ---------------------------------------------------------------------------
// aggregateOrchestrationStatus
// ---------------------------------------------------------------------------

describe("aggregateOrchestrationStatus", () => {
  // -- Basic counts --

  it("returns all counts as 0 when no effects", () => {
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
    });
    expect(result.totalEffects).toBe(0);
    expect(result.pendingEffects).toBe(0);
    expect(result.resolvedEffects).toBe(0);
  });

  it("returns phase 'waiting' when no effects", () => {
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
    });
    expect(result.phase).toBe("waiting");
  });

  it("counts totalEffects correctly", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e2", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e3", kind: "node", status: "failed" }),
    ];
    const result = aggregateOrchestrationStatus({ runId: "run-001", effects });
    expect(result.totalEffects).toBe(3);
  });

  it("counts pendingEffects correctly", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e2", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e3", kind: "node", status: "resolved" }),
    ];
    const result = aggregateOrchestrationStatus({ runId: "run-001", effects });
    expect(result.pendingEffects).toBe(2);
  });

  it("counts resolvedEffects correctly", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e2", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e3", kind: "node", status: "failed" }),
    ];
    const result = aggregateOrchestrationStatus({ runId: "run-001", effects });
    expect(result.resolvedEffects).toBe(2);
  });

  // -- Phase derivation --

  it("returns phase 'complete' when all effects resolved", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e2", kind: "node", status: "resolved" }),
    ];
    const result = aggregateOrchestrationStatus({ runId: "run-001", effects });
    expect(result.phase).toBe("complete");
  });

  it("returns phase 'executing' when some pending", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e2", kind: "node", status: "resolved" }),
    ];
    const result = aggregateOrchestrationStatus({ runId: "run-001", effects });
    expect(result.phase).toBe("executing");
  });

  it("returns phase 'failed' when all failed", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "failed" }),
    ];
    const result = aggregateOrchestrationStatus({ runId: "run-001", effects });
    expect(result.phase).toBe("failed");
  });

  // -- runId passthrough --

  it("passes runId through to result", () => {
    const result = aggregateOrchestrationStatus({
      runId: "run-xyz-123",
      effects: [],
    });
    expect(result.runId).toBe("run-xyz-123");
  });

  // -- Iteration default --

  it("defaults iteration to 0 when not provided", () => {
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
    });
    expect(result.iteration).toBe(0);
  });

  it("uses provided iteration value", () => {
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
      iteration: 5,
    });
    expect(result.iteration).toBe(5);
  });

  // -- elapsedMs --

  it("returns elapsedMs as 0 when no startedAt provided", () => {
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
    });
    expect(result.elapsedMs).toBe(0);
  });

  it("returns positive elapsedMs when startedAt is in the past", () => {
    const startedAt = Date.now() - 5000;
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
      startedAt,
    });
    expect(result.elapsedMs).toBeGreaterThan(0);
  });

  it("computes elapsedMs as roughly Date.now() minus startedAt", () => {
    const startedAt = Date.now() - 2000;
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
      startedAt,
    });
    // Allow 500ms tolerance for test execution time
    expect(result.elapsedMs).toBeGreaterThanOrEqual(1500);
    expect(result.elapsedMs).toBeLessThan(3000);
  });

  // -- tokenUsage passthrough --

  it("passes tokenUsage through when provided", () => {
    const tokenUsage: TokenUsage = {
      input: 1000,
      output: 500,
      total: 1500,
      cacheRead: 200,
      cacheWrite: 100,
    };
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
      tokenUsage,
    });
    expect(result.tokenUsage).toEqual(tokenUsage);
  });

  it("leaves tokenUsage undefined when not provided", () => {
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
    });
    expect(result.tokenUsage).toBeUndefined();
  });

  // -- cost passthrough --

  it("passes cost through when provided", () => {
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
      cost: 0.0042,
    });
    expect(result.cost).toBe(0.0042);
  });

  it("leaves cost undefined when not provided", () => {
    const result = aggregateOrchestrationStatus({
      runId: "run-001",
      effects: [],
    });
    expect(result.cost).toBeUndefined();
  });

  // -- Full integration scenario --

  it("produces correct full OrchestrationStatus for a realistic scenario", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e2", kind: "breakpoint", status: "pending" }),
      makeEffect({ effectId: "e3", kind: "sleep", status: "resolved" }),
      makeEffect({ effectId: "e4", kind: "node", status: "pending" }),
    ];
    const tokenUsage: TokenUsage = { input: 500, output: 200, total: 700 };
    const startedAt = Date.now() - 10000;

    const result = aggregateOrchestrationStatus({
      runId: "run-full",
      effects,
      iteration: 3,
      startedAt,
      tokenUsage,
      cost: 1.25,
    });

    expect(result.runId).toBe("run-full");
    expect(result.iteration).toBe(3);
    expect(result.phase).toBe("executing");
    expect(result.totalEffects).toBe(4);
    expect(result.pendingEffects).toBe(2);
    expect(result.resolvedEffects).toBe(2);
    expect(result.elapsedMs).toBeGreaterThan(0);
    expect(result.tokenUsage).toEqual(tokenUsage);
    expect(result.cost).toBe(1.25);
  });
});
