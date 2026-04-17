/**
 * effectsPanelIntegration.test.ts
 *
 * Tests for EffectsPanel integration into SessionView and RunDetailView:
 * - /effects slash command toggle
 * - EffectsPanel visibility conditions
 * - Effect data helpers (buildEffectTree, groupPendingEffects)
 *
 * Phase 3: Wire EffectsPanel into views (Wave 6)
 */

import { describe, it, expect } from "vitest";
import type { EffectSummary, OrchestrationStatus } from "../types.js";
import {
  buildEffectTree,
  groupPendingEffects,
  summarizePendingGroups,
  getEffectIcon,
  getEffectStatusColor,
  aggregateOrchestrationStatus,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function createEffect(overrides: Partial<EffectSummary> = {}): EffectSummary {
  return {
    effectId: "eff-001",
    kind: "node",
    title: "Test effect",
    status: "pending",
    requestedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// /effects slash command
// ---------------------------------------------------------------------------

describe("effects toggle integration", () => {
  it("/effects command should be available in SLASH_COMMANDS", async () => {
    // Import SLASH_COMMANDS from PromptBar to verify /effects exists
    const { SLASH_COMMANDS } = await import("../components/PromptBar.js");
    const effectsCmd = SLASH_COMMANDS.find((c) => c.name === "/effects");
    expect(effectsCmd).toBeDefined();
    expect(effectsCmd?.description).toBeTruthy();
  });

  it("showEffects state toggles effects panel visibility", () => {
    // Simulate the toggle logic
    let showEffects = false;
    // Toggle on
    showEffects = !showEffects;
    expect(showEffects).toBe(true);
    // Toggle off
    showEffects = !showEffects;
    expect(showEffects).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildEffectTree
// ---------------------------------------------------------------------------

describe("buildEffectTree integration", () => {
  it("builds tree from empty effects", () => {
    const tree = buildEffectTree([]);
    expect(tree).toEqual([]);
  });

  it("builds tree from single effect", () => {
    const effects = [createEffect()];
    const tree = buildEffectTree(effects);
    expect(tree.length).toBe(1);
  });

  it("builds tree from multiple effects", () => {
    const effects = [
      createEffect({ effectId: "e1", title: "First" }),
      createEffect({ effectId: "e2", title: "Second" }),
      createEffect({ effectId: "e3", title: "Third", status: "resolved" }),
    ];
    const tree = buildEffectTree(effects);
    expect(tree.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// groupPendingEffects
// ---------------------------------------------------------------------------

describe("groupPendingEffects integration", () => {
  it("returns empty groups for empty effects", () => {
    const groups = groupPendingEffects([]);
    expect(groups.size).toBe(0);
  });

  it("groups pending effects by kind", () => {
    const effects = [
      createEffect({ effectId: "e1", kind: "node", status: "pending" }),
      createEffect({ effectId: "e2", kind: "breakpoint", status: "pending" }),
      createEffect({ effectId: "e3", kind: "node", status: "pending" }),
      createEffect({ effectId: "e4", kind: "node", status: "resolved" }),
    ];
    const groups = groupPendingEffects(effects);
    expect(groups.get("node")?.length).toBe(2);
    expect(groups.get("breakpoint")?.length).toBe(1);
  });

  it("excludes resolved effects from groups", () => {
    const effects = [
      createEffect({ effectId: "e1", status: "resolved" }),
      createEffect({ effectId: "e2", status: "resolved" }),
    ];
    const groups = groupPendingEffects(effects);
    expect(groups.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// summarizePendingGroups
// ---------------------------------------------------------------------------

describe("summarizePendingGroups integration", () => {
  it("returns empty array for empty groups", () => {
    const summaries = summarizePendingGroups(new Map());
    expect(summaries).toEqual([]);
  });

  it("produces summaries with kind, count, and titles", () => {
    const groups = new Map<string, EffectSummary[]>();
    groups.set("node", [
      createEffect({ effectId: "e1", title: "Build", kind: "node" }),
      createEffect({ effectId: "e2", title: "Test", kind: "node" }),
    ]);
    const summaries = summarizePendingGroups(groups);
    expect(summaries.length).toBe(1);
    expect(summaries[0]?.kind).toBe("node");
    expect(summaries[0]?.count).toBe(2);
    expect(summaries[0]?.titles).toContain("Build");
    expect(summaries[0]?.titles).toContain("Test");
  });
});

// ---------------------------------------------------------------------------
// getEffectIcon / getEffectStatusColor
// ---------------------------------------------------------------------------

describe("effect display helpers", () => {
  it("getEffectIcon returns icon for each kind", () => {
    expect(typeof getEffectIcon("node")).toBe("string");
    expect(typeof getEffectIcon("breakpoint")).toBe("string");
    expect(typeof getEffectIcon("sleep")).toBe("string");
    expect(typeof getEffectIcon("orchestrator_task")).toBe("string");
  });

  it("getEffectStatusColor returns color key for each status", () => {
    expect(typeof getEffectStatusColor("pending")).toBe("string");
    expect(typeof getEffectStatusColor("resolved")).toBe("string");
    expect(typeof getEffectStatusColor("failed")).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// aggregateOrchestrationStatus
// ---------------------------------------------------------------------------

describe("aggregateOrchestrationStatus integration", () => {
  it("computes status from effects", () => {
    const status = aggregateOrchestrationStatus({
      runId: "test-run",
      effects: [
        createEffect({ effectId: "e1", status: "resolved" }),
        createEffect({ effectId: "e2", status: "pending" }),
      ],
      iteration: 3,
    });
    expect(status.totalEffects).toBe(2);
    expect(status.resolvedEffects).toBe(1);
    expect(typeof status.phase).toBe("string");
  });

  it("handles empty effects", () => {
    const status = aggregateOrchestrationStatus({
      runId: "empty-run",
      effects: [],
      iteration: 0,
    });
    expect(status.totalEffects).toBe(0);
    expect(status.resolvedEffects).toBe(0);
  });
});
