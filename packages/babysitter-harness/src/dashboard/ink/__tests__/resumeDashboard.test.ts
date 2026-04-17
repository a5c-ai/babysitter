/**
 * resumeDashboard.test.ts
 *
 * Tests for resume dashboard pure functions in helpers.ts:
 * rankRunsForResume, getResumableRuns, formatRunSummaryLine.
 */

import { describe, it, expect } from "vitest";
import {
  rankRunsForResume,
  getResumableRuns,
  formatRunSummaryLine,
} from "../helpers.js";
import type { RunSummary } from "../data/runScanner.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "run-001",
    runDir: "/tmp/runs/run-001",
    state: "created",
    processId: "test-process",
    createdAt: "2026-04-10T10:00:00Z",
    eventCount: 5,
    pendingCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getResumableRuns
// ---------------------------------------------------------------------------

describe("getResumableRuns", () => {
  it("returns waiting and created runs", () => {
    const runs = [
      makeRun({ runId: "r1", state: "waiting" }),
      makeRun({ runId: "r2", state: "completed" }),
      makeRun({ runId: "r3", state: "created" }),
      makeRun({ runId: "r4", state: "failed" }),
    ];
    const result = getResumableRuns(runs);
    expect(result.map((r) => r.runId)).toEqual(["r1", "r3"]);
  });

  it("returns empty array when no resumable runs", () => {
    const runs = [
      makeRun({ runId: "r1", state: "completed" }),
      makeRun({ runId: "r2", state: "failed" }),
    ];
    expect(getResumableRuns(runs)).toEqual([]);
  });

  it("returns empty for empty input", () => {
    expect(getResumableRuns([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// rankRunsForResume
// ---------------------------------------------------------------------------

describe("rankRunsForResume", () => {
  it("prioritizes waiting runs over created runs", () => {
    const runs = [
      makeRun({ runId: "r1", state: "created", createdAt: "2026-04-10T10:00:00Z" }),
      makeRun({ runId: "r2", state: "waiting", createdAt: "2026-04-10T09:00:00Z" }),
    ];
    const result = rankRunsForResume(runs);
    expect(result[0].runId).toBe("r2"); // waiting first even though older
  });

  it("sorts by recency within same state", () => {
    const runs = [
      makeRun({ runId: "r1", state: "waiting", createdAt: "2026-04-10T09:00:00Z" }),
      makeRun({ runId: "r2", state: "waiting", createdAt: "2026-04-10T10:00:00Z" }),
    ];
    const result = rankRunsForResume(runs);
    expect(result[0].runId).toBe("r2"); // more recent first
  });

  it("excludes completed and failed runs", () => {
    const runs = [
      makeRun({ runId: "r1", state: "completed" }),
      makeRun({ runId: "r2", state: "failed" }),
      makeRun({ runId: "r3", state: "waiting" }),
    ];
    const result = rankRunsForResume(runs);
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("r3");
  });

  it("returns empty for no resumable runs", () => {
    const runs = [makeRun({ state: "completed" })];
    expect(rankRunsForResume(runs)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// formatRunSummaryLine
// ---------------------------------------------------------------------------

describe("formatRunSummaryLine", () => {
  it("includes run ID and process ID", () => {
    const line = formatRunSummaryLine(makeRun({
      runId: "01ABCDEFGHIJ",
      processId: "tui-convergence",
    }));
    expect(line).toContain("01ABCDEFGHIJ");
    expect(line).toContain("tui-convergence");
  });

  it("includes state indicator", () => {
    const line = formatRunSummaryLine(makeRun({ state: "waiting" }));
    expect(line).toContain("waiting");
  });

  it("includes pending count when > 0", () => {
    const line = formatRunSummaryLine(makeRun({ pendingCount: 3 }));
    expect(line).toContain("3");
  });

  it("includes prompt excerpt when available", () => {
    const line = formatRunSummaryLine(makeRun({
      prompt: "Implement feature X with quality convergence",
    }));
    expect(line).toContain("Implement feature X");
  });

  it("truncates long prompts", () => {
    const longPrompt = "A".repeat(200);
    const line = formatRunSummaryLine(makeRun({ prompt: longPrompt }));
    expect(line.length).toBeLessThan(250);
  });
});
