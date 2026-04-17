/**
 * diffHelpers.test.ts
 *
 * Tests for diff parsing and formatting pure functions.
 */

import { describe, it, expect } from "vitest";
import {
  parseDiffHunks,
  classifyDiffLine,
  formatDiffStats,
} from "../helpers.js";
import type { DiffLineKind } from "../helpers.js";

// ---------------------------------------------------------------------------
// classifyDiffLine
// ---------------------------------------------------------------------------

describe("classifyDiffLine", () => {
  it("classifies lines starting with + as add", () => {
    expect(classifyDiffLine("+added line")).toBe("add");
  });

  it("classifies lines starting with - as remove", () => {
    expect(classifyDiffLine("-removed line")).toBe("remove");
  });

  it("classifies lines starting with space as context", () => {
    expect(classifyDiffLine(" context line")).toBe("context");
  });

  it("classifies @@ lines as hunk-header", () => {
    expect(classifyDiffLine("@@ -1,3 +1,4 @@")).toBe("hunk-header");
  });

  it("classifies empty lines as context", () => {
    expect(classifyDiffLine("")).toBe("context");
  });

  it("does not confuse +++ header with add", () => {
    expect(classifyDiffLine("+++ b/file.ts")).toBe("header");
  });

  it("does not confuse --- header with remove", () => {
    expect(classifyDiffLine("--- a/file.ts")).toBe("header");
  });
});

// ---------------------------------------------------------------------------
// parseDiffHunks
// ---------------------------------------------------------------------------

describe("parseDiffHunks", () => {
  const sampleDiff = [
    "--- a/file.ts",
    "+++ b/file.ts",
    "@@ -1,3 +1,4 @@",
    " line 1",
    "-removed",
    "+added",
    "+added2",
    " line 3",
    "@@ -10,2 +11,2 @@",
    " line 10",
    "-old",
    "+new",
  ].join("\n");

  it("splits diff into hunks", () => {
    const hunks = parseDiffHunks(sampleDiff);
    expect(hunks).toHaveLength(2);
  });

  it("first hunk has correct line count", () => {
    const hunks = parseDiffHunks(sampleDiff);
    expect(hunks[0].lines.length).toBe(5); // context, remove, add, add2, context
  });

  it("preserves hunk header", () => {
    const hunks = parseDiffHunks(sampleDiff);
    expect(hunks[0].header).toContain("@@ -1,3 +1,4 @@");
  });

  it("returns empty array for empty input", () => {
    expect(parseDiffHunks("")).toHaveLength(0);
  });

  it("returns empty array for non-diff text", () => {
    expect(parseDiffHunks("just some text\nno diff here")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// formatDiffStats
// ---------------------------------------------------------------------------

describe("formatDiffStats", () => {
  it("counts additions and removals", () => {
    const lines = [
      "+added1",
      "+added2",
      "-removed1",
      " context",
    ];
    const stats = formatDiffStats(lines);
    expect(stats.additions).toBe(2);
    expect(stats.deletions).toBe(1);
  });

  it("returns zeros for empty input", () => {
    const stats = formatDiffStats([]);
    expect(stats.additions).toBe(0);
    expect(stats.deletions).toBe(0);
  });

  it("returns zeros for context-only diff", () => {
    const stats = formatDiffStats([" line 1", " line 2"]);
    expect(stats.additions).toBe(0);
    expect(stats.deletions).toBe(0);
  });

  it("includes a formatted summary string", () => {
    const stats = formatDiffStats(["+a", "+b", "-c"]);
    expect(stats.summary).toContain("2");
    expect(stats.summary).toContain("1");
  });
});
