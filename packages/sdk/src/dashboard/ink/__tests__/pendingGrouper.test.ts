/**
 * pendingGrouper.test.ts
 *
 * TDD tests for Phase 3 "Effect Visualization & Orchestration Status".
 *
 * Tests pure functions that group and summarize pending effects by kind,
 * for display in the orchestration dashboard.
 *
 * All functions are imported from ../helpers.js ().
 */

import { describe, it, expect } from "vitest";
import type { EffectSummary, EffectKind } from "../types.js";
import {
  groupPendingEffects,
  summarizePendingGroups,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Helper factory
// ---------------------------------------------------------------------------

function makeEffect(
  overrides: Partial<EffectSummary> & { effectId: string; kind: string; status: EffectSummary["status"] },
): EffectSummary {
  return { ...overrides } as EffectSummary;
}

// ---------------------------------------------------------------------------
// PendingGroupSummary type (imported from helpers once implemented)
// For now, define the shape we expect:
// { kind: EffectKind; count: number; titles: string[] }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// groupPendingEffects
// ---------------------------------------------------------------------------

describe("groupPendingEffects", () => {
  it("returns empty map for empty effects list", () => {
    const result = groupPendingEffects([]);
    expect(result.size).toBe(0);
  });

  it("filters to only pending status effects", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e2", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e3", kind: "node", status: "failed" }),
    ];
    const result = groupPendingEffects(effects);
    expect(result.size).toBe(1);
    expect(result.get("node")).toHaveLength(1);
  });

  it("excludes resolved effects entirely", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "resolved" }),
      makeEffect({ effectId: "e2", kind: "breakpoint", status: "resolved" }),
    ];
    const result = groupPendingEffects(effects);
    expect(result.size).toBe(0);
  });

  it("excludes failed effects entirely", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "failed" }),
    ];
    const result = groupPendingEffects(effects);
    expect(result.size).toBe(0);
  });

  it("groups pending effects by kind", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e2", kind: "breakpoint", status: "pending" }),
      makeEffect({ effectId: "e3", kind: "node", status: "pending" }),
    ];
    const result = groupPendingEffects(effects);
    expect(result.size).toBe(2);
    expect(result.get("node")).toHaveLength(2);
    expect(result.get("breakpoint")).toHaveLength(1);
  });

  it("sorts effects within each group by effectId ascending", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "eff-c", kind: "node", status: "pending" }),
      makeEffect({ effectId: "eff-a", kind: "node", status: "pending" }),
      makeEffect({ effectId: "eff-b", kind: "node", status: "pending" }),
    ];
    const result = groupPendingEffects(effects);
    const nodeGroup = result.get("node")!;
    expect(nodeGroup[0].effectId).toBe("eff-a");
    expect(nodeGroup[1].effectId).toBe("eff-b");
    expect(nodeGroup[2].effectId).toBe("eff-c");
  });

  it("handles multiple kinds with proper grouping", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e2", kind: "sleep", status: "pending" }),
      makeEffect({ effectId: "e3", kind: "breakpoint", status: "pending" }),
      makeEffect({ effectId: "e4", kind: "sleep", status: "pending" }),
      makeEffect({ effectId: "e5", kind: "orchestrator_task", status: "pending" }),
    ];
    const result = groupPendingEffects(effects);
    expect(result.size).toBe(4);
    expect(result.get("node")).toHaveLength(1);
    expect(result.get("sleep")).toHaveLength(2);
    expect(result.get("breakpoint")).toHaveLength(1);
    expect(result.get("orchestrator_task")).toHaveLength(1);
  });

  it("handles custom/unknown kind strings", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "custom_webhook", status: "pending" }),
      makeEffect({ effectId: "e2", kind: "custom_webhook", status: "pending" }),
    ];
    const result = groupPendingEffects(effects);
    expect(result.get("custom_webhook")).toHaveLength(2);
  });

  it("preserves effect data within groups", () => {
    const effects: EffectSummary[] = [
      makeEffect({ effectId: "e1", kind: "node", status: "pending", title: "Lint check" }),
    ];
    const result = groupPendingEffects(effects);
    const nodeGroup = result.get("node")!;
    expect(nodeGroup[0].effectId).toBe("e1");
    expect(nodeGroup[0].title).toBe("Lint check");
    expect(nodeGroup[0].status).toBe("pending");
  });

  it("returns a Map (not plain object)", () => {
    const result = groupPendingEffects([]);
    expect(result).toBeInstanceOf(Map);
  });
});

// ---------------------------------------------------------------------------
// summarizePendingGroups
// ---------------------------------------------------------------------------

describe("summarizePendingGroups", () => {
  it("returns empty array for empty map", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    const result = summarizePendingGroups(groups);
    expect(result).toEqual([]);
  });

  it("produces summary with correct count for one group", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    groups.set("node", [
      makeEffect({ effectId: "e1", kind: "node", status: "pending", title: "Build" }),
      makeEffect({ effectId: "e2", kind: "node", status: "pending", title: "Test" }),
      makeEffect({ effectId: "e3", kind: "node", status: "pending", title: "Lint" }),
    ]);
    const result = summarizePendingGroups(groups);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("node");
    expect(result[0].count).toBe(3);
  });

  it("includes titles from effects in titles array", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    groups.set("node", [
      makeEffect({ effectId: "e1", kind: "node", status: "pending", title: "Build" }),
      makeEffect({ effectId: "e2", kind: "node", status: "pending", title: "Test" }),
    ]);
    const result = summarizePendingGroups(groups);
    expect(result[0].titles).toContain("Build");
    expect(result[0].titles).toContain("Test");
  });

  it("uses effectId as fallback title when title is absent", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    groups.set("node", [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
    ]);
    const result = summarizePendingGroups(groups);
    expect(result[0].titles).toContain("e1");
  });

  it("mixes titles and effectId fallbacks", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    groups.set("node", [
      makeEffect({ effectId: "e1", kind: "node", status: "pending", title: "Build" }),
      makeEffect({ effectId: "e2", kind: "node", status: "pending" }),
    ]);
    const result = summarizePendingGroups(groups);
    expect(result[0].titles).toEqual(["Build", "e2"]);
  });

  it("sorts multiple groups by count descending", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    groups.set("sleep", [
      makeEffect({ effectId: "e1", kind: "sleep", status: "pending" }),
    ]);
    groups.set("node", [
      makeEffect({ effectId: "e2", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e3", kind: "node", status: "pending" }),
      makeEffect({ effectId: "e4", kind: "node", status: "pending" }),
    ]);
    groups.set("breakpoint", [
      makeEffect({ effectId: "e5", kind: "breakpoint", status: "pending" }),
      makeEffect({ effectId: "e6", kind: "breakpoint", status: "pending" }),
    ]);
    const result = summarizePendingGroups(groups);
    expect(result).toHaveLength(3);
    expect(result[0].kind).toBe("node");
    expect(result[0].count).toBe(3);
    expect(result[1].kind).toBe("breakpoint");
    expect(result[1].count).toBe(2);
    expect(result[2].kind).toBe("sleep");
    expect(result[2].count).toBe(1);
  });

  it("handles groups with equal counts (stable sort)", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    groups.set("node", [
      makeEffect({ effectId: "e1", kind: "node", status: "pending" }),
    ]);
    groups.set("sleep", [
      makeEffect({ effectId: "e2", kind: "sleep", status: "pending" }),
    ]);
    const result = summarizePendingGroups(groups);
    expect(result).toHaveLength(2);
    // Both have count 1, just verify they are present
    const kinds = result.map((s) => s.kind);
    expect(kinds).toContain("node");
    expect(kinds).toContain("sleep");
  });

  it("each summary has kind, count, and titles fields", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    groups.set("breakpoint", [
      makeEffect({ effectId: "e1", kind: "breakpoint", status: "pending", title: "Approve deploy" }),
    ]);
    const result = summarizePendingGroups(groups);
    const summary = result[0];
    expect(summary).toHaveProperty("kind");
    expect(summary).toHaveProperty("count");
    expect(summary).toHaveProperty("titles");
    expect(typeof summary.kind).toBe("string");
    expect(typeof summary.count).toBe("number");
    expect(Array.isArray(summary.titles)).toBe(true);
  });

  it("handles single-item groups correctly", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    groups.set("orchestrator_task", [
      makeEffect({
        effectId: "e1",
        kind: "orchestrator_task",
        status: "pending",
        title: "Plan next step",
      }),
    ]);
    const result = summarizePendingGroups(groups);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("orchestrator_task");
    expect(result[0].count).toBe(1);
    expect(result[0].titles).toEqual(["Plan next step"]);
  });

  it("titles array length matches count", () => {
    const groups = new Map<EffectKind, EffectSummary[]>();
    groups.set("node", [
      makeEffect({ effectId: "e1", kind: "node", status: "pending", title: "A" }),
      makeEffect({ effectId: "e2", kind: "node", status: "pending", title: "B" }),
      makeEffect({ effectId: "e3", kind: "node", status: "pending" }),
    ]);
    const result = summarizePendingGroups(groups);
    expect(result[0].titles).toHaveLength(result[0].count);
  });
});
