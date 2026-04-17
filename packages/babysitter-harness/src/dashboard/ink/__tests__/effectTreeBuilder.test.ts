/**
 * effectTreeBuilder.test.ts
 *
 * TDD tests for Phase 3 "Effect Visualization & Orchestration Status".
 *
 * Tests pure functions that convert effect summaries into tree structures
 * suitable for the Tree primitive, plus icon/color mapping helpers.
 *
 * All functions are imported from ../helpers.js ().
 */

import { describe, it, expect } from "vitest";
import type { EffectSummary, EffectKind, TuiEffectStatus } from "../types.js";
import type { TreeNode } from "../components/primitives/Tree.js";
import {
  buildEffectTree,
  getEffectIcon,
  getEffectStatusColor,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// getEffectIcon
// ---------------------------------------------------------------------------

describe("getEffectIcon", () => {
  it("returns gear icon for 'node' kind", () => {
    expect(getEffectIcon("node")).toBe("⚙");
  });

  it("returns pause icon for 'breakpoint' kind", () => {
    expect(getEffectIcon("breakpoint")).toBe("⏸");
  });

  it("returns diamond icon for 'orchestrator_task' kind", () => {
    expect(getEffectIcon("orchestrator_task")).toBe("◈");
  });

  it("returns hourglass icon for 'sleep' kind", () => {
    expect(getEffectIcon("sleep")).toBe("⏳");
  });

  it("returns circle icon for unknown kind", () => {
    expect(getEffectIcon("custom_kind")).toBe("○");
  });

  it("returns circle icon for empty string kind", () => {
    expect(getEffectIcon("")).toBe("○");
  });
});

// ---------------------------------------------------------------------------
// getEffectStatusColor
// ---------------------------------------------------------------------------

describe("getEffectStatusColor", () => {
  it("returns 'warning' for pending status", () => {
    expect(getEffectStatusColor("pending")).toBe("warning");
  });

  it("returns 'success' for resolved status", () => {
    expect(getEffectStatusColor("resolved")).toBe("success");
  });

  it("returns 'error' for failed status", () => {
    expect(getEffectStatusColor("failed")).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// buildEffectTree
// ---------------------------------------------------------------------------

describe("buildEffectTree", () => {
  // -- Empty input --

  it("returns empty array for empty effects list", () => {
    const result: TreeNode[] = buildEffectTree([]);
    expect(result).toEqual([]);
  });

  // -- Single effect --

  it("returns a single root node for one effect", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "pending", title: "Run lint" },
    ];
    const result = buildEffectTree(effects);
    expect(result).toHaveLength(1);
  });

  it("includes effectId and title in node label", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "pending", title: "Run lint" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].label).toContain("eff-001");
    expect(result[0].label).toContain("Run lint");
  });

  // -- Multiple effects --

  it("returns multiple root nodes for multiple effects", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "resolved" },
      { effectId: "eff-002", kind: "breakpoint", status: "pending" },
      { effectId: "eff-003", kind: "sleep", status: "failed" },
    ];
    const result = buildEffectTree(effects);
    expect(result).toHaveLength(3);
  });

  // -- Status icons --

  it("uses pending icon (◌) for pending effects", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "pending" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].icon).toBe("◌");
  });

  it("uses resolved icon (✓) for resolved effects", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "resolved" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].icon).toBe("✓");
  });

  it("uses failed icon (✗) for failed effects", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "failed" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].icon).toBe("✗");
  });

  // -- Status colors --

  it("uses 'warning' color for pending effects", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "pending" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].color).toBe("warning");
  });

  it("uses 'success' color for resolved effects", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "resolved" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].color).toBe("success");
  });

  it("uses 'error' color for failed effects", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "failed" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].color).toBe("error");
  });

  // -- Elapsed time --

  it("includes elapsed time in label when elapsedMs is present", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "resolved", title: "Build", elapsedMs: 1200 },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].label).toContain("1.2s");
  });

  it("omits elapsed time from label when elapsedMs is absent", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "resolved", title: "Build" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].label).not.toMatch(/\d+(\.\d+)?s/);
  });

  // -- Error text --

  it("includes error text in label when error is present", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "failed", error: "Timeout exceeded" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].label).toContain("Timeout exceeded");
  });

  it("omits error text from label when error is absent", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "resolved" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].label).not.toContain("error");
  });

  // -- Sorting by status --

  it("sorts effects: pending first, then resolved, then failed", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-resolved", kind: "node", status: "resolved" },
      { effectId: "eff-failed", kind: "node", status: "failed" },
      { effectId: "eff-pending", kind: "node", status: "pending" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].label).toContain("eff-pending");
    expect(result[1].label).toContain("eff-resolved");
    expect(result[2].label).toContain("eff-failed");
  });

  it("preserves relative order within same status group", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-p2", kind: "node", status: "pending" },
      { effectId: "eff-p1", kind: "node", status: "pending" },
      { effectId: "eff-r1", kind: "node", status: "resolved" },
    ];
    const result = buildEffectTree(effects);
    // Within pending group, original order preserved
    expect(result[0].label).toContain("eff-p2");
    expect(result[1].label).toContain("eff-p1");
    expect(result[2].label).toContain("eff-r1");
  });

  // -- Label format with kind icon --

  it("uses kind icon in the label when no title is provided", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "breakpoint", status: "pending" },
    ];
    const result = buildEffectTree(effects);
    expect(result[0].label).toContain("eff-001");
  });

  // -- Combined label format --

  it("builds full label: effectId, title, and elapsed when all present", () => {
    const effects: EffectSummary[] = [
      {
        effectId: "eff-001",
        kind: "node",
        status: "resolved",
        title: "Compile",
        elapsedMs: 3500,
      },
    ];
    const result = buildEffectTree(effects);
    const label = result[0].label;
    expect(label).toContain("eff-001");
    expect(label).toContain("Compile");
    expect(label).toContain("3.5s");
  });

  it("builds label with effectId and error when failed with no title", () => {
    const effects: EffectSummary[] = [
      {
        effectId: "eff-002",
        kind: "node",
        status: "failed",
        error: "ENOMEM",
      },
    ];
    const result = buildEffectTree(effects);
    const label = result[0].label;
    expect(label).toContain("eff-002");
    expect(label).toContain("ENOMEM");
  });

  // -- TreeNode structure compliance --

  it("produces valid TreeNode objects (label, color, icon fields)", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "pending", title: "Test" },
    ];
    const result = buildEffectTree(effects);
    const node = result[0];
    expect(typeof node.label).toBe("string");
    expect(typeof node.icon).toBe("string");
    expect(typeof node.color).toBe("string");
  });

  it("does not produce children on root nodes (flat structure)", () => {
    const effects: EffectSummary[] = [
      { effectId: "eff-001", kind: "node", status: "pending" },
      { effectId: "eff-002", kind: "node", status: "resolved" },
    ];
    const result = buildEffectTree(effects);
    for (const node of result) {
      expect(node.children).toBeUndefined();
    }
  });
});
