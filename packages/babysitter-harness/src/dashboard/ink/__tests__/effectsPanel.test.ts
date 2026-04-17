/**
 * effectsPanel.test.ts
 *
 * Integration tests for the Effects & Orchestration UI component wiring.
 * Verifies that helpers are correctly composed into the pipeline used by
 * EffectsPanel and EffectsContext.
 */

import { describe, it, expect } from "vitest";
import type { EffectSummary, OrchestrationPhase } from "../types.js";
import {
  buildEffectTree,
  derivePhase,
  aggregateOrchestrationStatus,
  groupPendingEffects,
  summarizePendingGroups,
  getEffectIcon,
  getEffectStatusColor,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mkEffect = (
  id: string,
  kind: EffectSummary["kind"],
  status: EffectSummary["status"],
  extra?: Partial<EffectSummary>,
): EffectSummary => ({
  effectId: id,
  kind,
  status,
  ...extra,
});

// ---------------------------------------------------------------------------
// Integration: aggregateOrchestrationStatus + derivePhase pipeline
// ---------------------------------------------------------------------------

describe("aggregateOrchestrationStatus + derivePhase pipeline", () => {
  it("produces correct status with mixed effects", () => {
    const effects: EffectSummary[] = [
      mkEffect("e1", "node", "resolved"),
      mkEffect("e2", "breakpoint", "pending"),
      mkEffect("e3", "node", "resolved"),
    ];
    const status = aggregateOrchestrationStatus({
      runId: "run-1",
      effects,
      iteration: 5,
      startedAt: 1000,
      now: 6000,
    });

    expect(status.runId).toBe("run-1");
    expect(status.iteration).toBe(5);
    expect(status.phase).toBe("executing" as OrchestrationPhase);
    expect(status.totalEffects).toBe(3);
    expect(status.pendingEffects).toBe(1);
    expect(status.resolvedEffects).toBe(2);
    expect(status.elapsedMs).toBe(5000);
  });

  it("marks phase as complete when all resolved", () => {
    const effects: EffectSummary[] = [
      mkEffect("e1", "node", "resolved"),
      mkEffect("e2", "node", "resolved"),
    ];
    const status = aggregateOrchestrationStatus({ runId: "r", effects });
    expect(status.phase).toBe("complete" as OrchestrationPhase);
  });

  it("marks phase as failed when any failed and none pending", () => {
    const effects: EffectSummary[] = [
      mkEffect("e1", "node", "resolved"),
      mkEffect("e2", "node", "failed"),
    ];
    const status = aggregateOrchestrationStatus({ runId: "r", effects });
    expect(status.phase).toBe("failed" as OrchestrationPhase);
  });

  it("marks phase as waiting when no effects", () => {
    const status = aggregateOrchestrationStatus({ runId: "r", effects: [] });
    expect(status.phase).toBe("waiting" as OrchestrationPhase);
  });

  it("includes token usage and cost when provided", () => {
    const status = aggregateOrchestrationStatus({
      runId: "r",
      effects: [],
      tokenUsage: { input: 100, output: 50, total: 150 },
      cost: 0.05,
    });
    expect(status.tokenUsage).toEqual({ input: 100, output: 50, total: 150 });
    expect(status.cost).toBe(0.05);
  });
});

// ---------------------------------------------------------------------------
// Integration: groupPendingEffects + summarizePendingGroups pipeline
// ---------------------------------------------------------------------------

describe("groupPendingEffects + summarizePendingGroups pipeline", () => {
  it("groups and summarizes pending effects by kind", () => {
    const effects: EffectSummary[] = [
      mkEffect("e1", "node", "pending", { title: "Compile" }),
      mkEffect("e2", "node", "pending", { title: "Lint" }),
      mkEffect("e3", "breakpoint", "pending", { title: "Approve deploy" }),
      mkEffect("e4", "node", "resolved", { title: "Already done" }),
    ];

    const groups = groupPendingEffects(effects);
    const summaries = summarizePendingGroups(groups);

    // node group should have 2 pending, breakpoint should have 1
    expect(summaries).toHaveLength(2);
    // sorted by count descending — node (2) first
    expect(summaries[0].kind).toBe("node");
    expect(summaries[0].count).toBe(2);
    expect(summaries[0].titles).toEqual(["Compile", "Lint"]);
    expect(summaries[1].kind).toBe("breakpoint");
    expect(summaries[1].count).toBe(1);
    expect(summaries[1].titles).toEqual(["Approve deploy"]);
  });

  it("returns empty array when no pending effects", () => {
    const effects: EffectSummary[] = [
      mkEffect("e1", "node", "resolved"),
    ];
    const groups = groupPendingEffects(effects);
    const summaries = summarizePendingGroups(groups);
    expect(summaries).toHaveLength(0);
  });

  it("uses effectId as fallback title", () => {
    const effects: EffectSummary[] = [
      mkEffect("e1", "sleep", "pending"),
    ];
    const groups = groupPendingEffects(effects);
    const summaries = summarizePendingGroups(groups);
    expect(summaries[0].titles).toEqual(["e1"]);
  });
});

// ---------------------------------------------------------------------------
// Integration: full pipeline effects -> tree + grouped summaries
// ---------------------------------------------------------------------------

describe("full effects pipeline", () => {
  it("converts effects to tree nodes AND grouped summaries simultaneously", () => {
    const effects: EffectSummary[] = [
      mkEffect("e1", "node", "resolved", { title: "Build", elapsedMs: 2000 }),
      mkEffect("e2", "breakpoint", "pending", { title: "Deploy gate" }),
      mkEffect("e3", "node", "failed", { title: "Test", error: "1 test failed" }),
    ];

    // Tree path
    const tree = buildEffectTree(effects);
    expect(tree).toHaveLength(3);
    // pending first in tree (sorted by status)
    expect(tree[0].label).toContain("Deploy gate");
    expect(tree[0].icon).toBe("\u25CC"); // pending dotted circle
    expect(tree[0].color).toBe("warning");

    // Grouped summaries path
    const groups = groupPendingEffects(effects);
    const summaries = summarizePendingGroups(groups);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].kind).toBe("breakpoint");

    // Orchestration status path
    const status = aggregateOrchestrationStatus({
      runId: "run-x",
      effects,
      iteration: 3,
    });
    expect(status.phase).toBe("executing");
    expect(status.pendingEffects).toBe(1);
  });

  it("handles empty effects array gracefully across all paths", () => {
    const effects: EffectSummary[] = [];

    const tree = buildEffectTree(effects);
    expect(tree).toHaveLength(0);

    const groups = groupPendingEffects(effects);
    const summaries = summarizePendingGroups(groups);
    expect(summaries).toHaveLength(0);

    const status = aggregateOrchestrationStatus({ runId: "r", effects });
    expect(status.phase).toBe("waiting");
    expect(status.totalEffects).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Icon and color consistency across tree rendering
// ---------------------------------------------------------------------------

describe("icon/color consistency for tree rendering", () => {
  const kinds = ["node", "breakpoint", "orchestrator_task", "sleep", "custom_kind"] as const;
  const statuses = ["pending", "resolved", "failed"] as const;

  for (const kind of kinds) {
    it(`getEffectIcon returns non-empty string for kind "${kind}"`, () => {
      const icon = getEffectIcon(kind);
      expect(typeof icon).toBe("string");
      expect(icon.length).toBeGreaterThan(0);
    });
  }

  for (const status of statuses) {
    it(`getEffectStatusColor returns theme color key for status "${status}"`, () => {
      const color = getEffectStatusColor(status);
      expect(typeof color).toBe("string");
      expect(["warning", "success", "error", "muted"]).toContain(color);
    });
  }
});
