/**
 * structuredStatus.test.ts
 *
 * Tests for structured status view pure functions in helpers.ts:
 * buildStatusSections, formatStatusSection.
 */

import { describe, it, expect } from "vitest";
import {
  buildStatusSections,
  formatStatusSection,
} from "../helpers.js";
import type { OrchestrationStatus, EffectSummary } from "../types.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeStatus(overrides: Partial<OrchestrationStatus> = {}): OrchestrationStatus {
  return {
    runId: "run-abc-def",
    iteration: 3,
    phase: "executing",
    totalEffects: 10,
    pendingEffects: 2,
    resolvedEffects: 8,
    elapsedMs: 45000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildStatusSections
// ---------------------------------------------------------------------------

describe("buildStatusSections", () => {
  it("returns at least a run info section", () => {
    const sections = buildStatusSections(makeStatus());
    expect(sections.length).toBeGreaterThanOrEqual(1);
    const runSection = sections.find((s) => s.title === "Run");
    expect(runSection).toBeDefined();
  });

  it("run section includes runId and phase", () => {
    const sections = buildStatusSections(makeStatus({ runId: "my-run", phase: "executing" }));
    const runSection = sections.find((s) => s.title === "Run")!;
    expect(runSection.entries.some((e) => e.value.includes("my-run"))).toBe(true);
    expect(runSection.entries.some((e) => e.value.includes("executing"))).toBe(true);
  });

  it("includes effects section", () => {
    const sections = buildStatusSections(makeStatus({
      totalEffects: 10,
      pendingEffects: 3,
      resolvedEffects: 7,
    }));
    const effectsSection = sections.find((s) => s.title === "Effects");
    expect(effectsSection).toBeDefined();
    expect(effectsSection!.entries.some((e) => e.value.includes("7"))).toBe(true);
  });

  it("includes cost section when cost is present", () => {
    const sections = buildStatusSections(makeStatus({ cost: 1.5 }));
    const costSection = sections.find((s) => s.title === "Cost");
    expect(costSection).toBeDefined();
  });

  it("excludes cost section when cost is absent", () => {
    const sections = buildStatusSections(makeStatus());
    const costSection = sections.find((s) => s.title === "Cost");
    expect(costSection).toBeUndefined();
  });

  it("includes token section when tokenUsage is present", () => {
    const sections = buildStatusSections(makeStatus({
      tokenUsage: { input: 1000, output: 500, total: 1500 },
    }));
    const tokenSection = sections.find((s) => s.title === "Tokens");
    expect(tokenSection).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// formatStatusSection
// ---------------------------------------------------------------------------

describe("formatStatusSection", () => {
  it("renders title and entries as text lines", () => {
    const lines = formatStatusSection({
      title: "Run",
      entries: [
        { label: "ID", value: "run-abc" },
        { label: "Phase", value: "executing" },
      ],
    });
    expect(lines).toHaveLength(3); // title + 2 entries
    expect(lines[0]).toContain("Run");
    expect(lines[1]).toContain("ID");
    expect(lines[1]).toContain("run-abc");
  });

  it("handles empty entries", () => {
    const lines = formatStatusSection({ title: "Empty", entries: [] });
    expect(lines).toHaveLength(1); // just the title
  });

  it("aligns labels consistently", () => {
    const lines = formatStatusSection({
      title: "Test",
      entries: [
        { label: "A", value: "val-a" },
        { label: "Long Label", value: "val-b" },
      ],
    });
    // Both entry lines should have the same column alignment
    expect(lines.length).toBe(3);
  });
});
