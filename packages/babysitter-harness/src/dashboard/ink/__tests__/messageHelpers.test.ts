/**
 * messageHelpers.test.ts
 *
 * Tests for pure helper functions used in enhanced message rendering.
 *
 *   truncateOutput(text, maxLines?) → { text, truncated, totalLines }
 *   formatTimestamp(isoString)      → "HH:MM:SS"
 *   formatElapsedCompact(ms)        → compact duration string
 *   briefArgs(input)                → short stringified preview
 */

import { describe, it, expect } from "vitest";
import {
  truncateOutput,
  formatTimestamp,
  formatElapsedCompact,
  briefArgs,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// truncateOutput
// ---------------------------------------------------------------------------

describe("truncateOutput", () => {
  it("returns full text when under default maxLines (50)", () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line ${i}`).join("\n");
    const result = truncateOutput(lines);
    expect(result.text).toBe(lines);
    expect(result.truncated).toBe(false);
    expect(result.totalLines).toBe(10);
  });

  it("returns full text when exactly at maxLines", () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line ${i}`).join("\n");
    const result = truncateOutput(lines);
    expect(result.truncated).toBe(false);
    expect(result.totalLines).toBe(50);
  });

  it("truncates and appends indicator when over default maxLines", () => {
    const lines = Array.from({ length: 80 }, (_, i) => `line ${i}`).join("\n");
    const result = truncateOutput(lines);
    expect(result.truncated).toBe(true);
    expect(result.totalLines).toBe(80);
    expect(result.text).toContain("[... 30 more lines]");
    // Should contain exactly maxLines worth of content lines
    const outputLines = result.text.split("\n");
    // 50 content lines + 1 indicator line
    expect(outputLines.length).toBe(51);
  });

  it("respects a custom maxLines parameter", () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line ${i}`).join("\n");
    const result = truncateOutput(lines, 5);
    expect(result.truncated).toBe(true);
    expect(result.totalLines).toBe(20);
    expect(result.text).toContain("[... 15 more lines]");
  });

  it("handles empty string", () => {
    const result = truncateOutput("");
    expect(result.text).toBe("");
    expect(result.truncated).toBe(false);
    expect(result.totalLines).toBe(0);
  });

  it("handles single line (no newlines)", () => {
    const result = truncateOutput("hello world");
    expect(result.text).toBe("hello world");
    expect(result.truncated).toBe(false);
    expect(result.totalLines).toBe(1);
  });

  it("preserves trailing newline when not truncated", () => {
    const result = truncateOutput("line1\nline2\n");
    expect(result.text).toBe("line1\nline2\n");
    expect(result.truncated).toBe(false);
  });

  it("reports correct totalLines for trailing-newline text", () => {
    // "a\nb\n" has 3 lines when split by \n: ["a", "b", ""]
    // but logically it's 2 content lines — implementation should count
    // non-empty lines or raw splits consistently
    const result = truncateOutput("a\nb\n");
    expect(result.totalLines).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// formatTimestamp
// ---------------------------------------------------------------------------

describe("formatTimestamp", () => {
  it("formats a valid ISO string as HH:MM:SS in local time", () => {
    // Use a known date and extract expected local HH:MM:SS
    const iso = "2026-04-09T14:30:45.000Z";
    const expected = new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    expect(formatTimestamp(iso)).toBe(expected);
  });

  it("returns empty string for empty input", () => {
    expect(formatTimestamp("")).toBe("");
  });

  it("returns empty string for invalid date string", () => {
    expect(formatTimestamp("not-a-date")).toBe("");
  });

  it("returns empty string for undefined-ish input", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(formatTimestamp(undefined as any)).toBe("");
  });

  it("handles midnight correctly", () => {
    const iso = "2026-01-01T00:00:00.000Z";
    const result = formatTimestamp(iso);
    // Should be a valid HH:MM:SS string (8 chars, colons at positions 2 and 5)
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// formatElapsedCompact
// ---------------------------------------------------------------------------

describe("formatElapsedCompact", () => {
  it("formats 0 as '0ms'", () => {
    expect(formatElapsedCompact(0)).toBe("0ms");
  });

  it("formats sub-second as milliseconds", () => {
    expect(formatElapsedCompact(123)).toBe("123ms");
  });

  it("formats 999ms as '999ms'", () => {
    expect(formatElapsedCompact(999)).toBe("999ms");
  });

  it("formats 1000ms as seconds with one decimal", () => {
    expect(formatElapsedCompact(1000)).toBe("1.0s");
  });

  it("formats 1200ms as '1.2s'", () => {
    expect(formatElapsedCompact(1200)).toBe("1.2s");
  });

  it("formats 59999ms as seconds", () => {
    expect(formatElapsedCompact(59999)).toBe("60.0s");
  });

  it("formats 60000ms as minutes+seconds", () => {
    expect(formatElapsedCompact(60000)).toBe("1m0s");
  });

  it("formats 83000ms as '1m23s'", () => {
    expect(formatElapsedCompact(83000)).toBe("1m23s");
  });

  it("formats large values in minutes+seconds", () => {
    // 5 minutes 30 seconds = 330000ms
    expect(formatElapsedCompact(330000)).toBe("5m30s");
  });
});

// ---------------------------------------------------------------------------
// briefArgs
// ---------------------------------------------------------------------------

describe("briefArgs", () => {
  it("returns empty string for null", () => {
    expect(briefArgs(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(briefArgs(undefined)).toBe("");
  });

  it("returns short string as-is", () => {
    expect(briefArgs("hello")).toBe("hello");
  });

  it("truncates string longer than 60 chars with ellipsis", () => {
    const long = "a".repeat(80);
    const result = briefArgs(long);
    expect(result.length).toBeLessThanOrEqual(63); // 60 + "..."
    expect(result).toContain("...");
  });

  it("truncates string at exactly 60 chars boundary", () => {
    const exact = "a".repeat(60);
    // 60 chars should NOT be truncated
    expect(briefArgs(exact)).toBe(exact);
  });

  it("JSON.stringifies object and truncates to 80 chars", () => {
    const obj = { key: "value", nested: { deep: "data" } };
    const result = briefArgs(obj);
    expect(result.length).toBeLessThanOrEqual(83); // 80 + "..."
  });

  it("converts number to string", () => {
    expect(briefArgs(42)).toBe("42");
  });

  it("converts boolean to string", () => {
    expect(briefArgs(true)).toBe("true");
  });

  it("truncates long object representation to 80 chars", () => {
    const big = { a: "x".repeat(100), b: "y".repeat(100) };
    const result = briefArgs(big);
    expect(result.length).toBeLessThanOrEqual(83);
    expect(result).toContain("...");
  });
});
