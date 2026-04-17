/**
 * runScannerHarness.test.ts
 *
 * Tests that RunSummary and RunDetail include the harness field,
 * and that display helpers format it correctly.
 *
 * Phase 3: Surface harness in runScanner + run views (Wave 9)
 */

import { describe, it, expect } from "vitest";
import type { RunSummary, RunDetail } from "../data/runScanner.js";
import { formatHarnessBadge } from "../helpers.js";

// ---------------------------------------------------------------------------
// RunSummary type includes harness
// ---------------------------------------------------------------------------

describe("RunSummary harness field", () => {
  it("accepts a harness field", () => {
    const summary: RunSummary = {
      runId: "test-001",
      runDir: "/tmp/runs/test-001",
      state: "completed",
      processId: "test-process",
      createdAt: "2026-01-01T00:00:00Z",
      eventCount: 5,
      pendingCount: 0,
      harness: "claude-code",
    };
    expect(summary.harness).toBe("claude-code");
  });

  it("harness is optional", () => {
    const summary: RunSummary = {
      runId: "test-002",
      runDir: "/tmp/runs/test-002",
      state: "created",
      processId: "test-process",
      createdAt: "2026-01-01T00:00:00Z",
      eventCount: 0,
      pendingCount: 0,
    };
    expect(summary.harness).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// RunDetail type includes harness
// ---------------------------------------------------------------------------

describe("RunDetail harness field", () => {
  it("accepts a harness field", () => {
    const detail: RunDetail = {
      runId: "test-003",
      runDir: "/tmp/runs/test-003",
      state: "waiting",
      processId: "test-process",
      createdAt: "2026-01-01T00:00:00Z",
      eventCount: 3,
      pendingCount: 1,
      resolvedCount: 2,
      events: [],
      harness: "codex",
    };
    expect(detail.harness).toBe("codex");
  });
});

// ---------------------------------------------------------------------------
// formatHarnessBadge helper
// ---------------------------------------------------------------------------

describe("formatHarnessBadge", () => {
  it("returns the harness name for known harnesses", () => {
    expect(formatHarnessBadge("claude-code")).toBe("claude-code");
  });

  it("returns the harness name for unknown harnesses", () => {
    expect(formatHarnessBadge("some-harness")).toBe("some-harness");
  });

  it("returns dash for undefined", () => {
    expect(formatHarnessBadge(undefined)).toBe("-");
  });

  it("returns dash for empty string", () => {
    expect(formatHarnessBadge("")).toBe("-");
  });
});
