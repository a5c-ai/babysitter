/**
 * promptHelpers.test.ts
 *
 * Tests for the helper functions extracted from PromptBar.tsx.
 *
 *   countLines(text: string): number
 *     → counts newline-delimited lines (always ≥ 1; an empty string is 1 line)
 *
 * Also tests the printable-character detection logic (isPrintable guard) used
 * inside the useInput handler — exercised as a pure boolean predicate.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Re-implementations (must stay in sync with PromptBar.tsx)
// ---------------------------------------------------------------------------

function countLines(text: string): number {
  return text.split("\n").length;
}

/**
 * Mirrors the isPrintable check in PromptBar's useInput handler.
 * A character is printable if its first codepoint is ≥ 32 (i.e., not a
 * C0 control code or empty string).
 */
function isPrintable(input: string): boolean {
  if (!input || input.length === 0) return false;
  const cp = input.codePointAt(0);
  return cp !== undefined && cp >= 32;
}

// ---------------------------------------------------------------------------
// countLines
// ---------------------------------------------------------------------------

describe("countLines", () => {
  it("returns 1 for an empty string", () => {
    expect(countLines("")).toBe(1);
  });

  it("returns 1 for a string with no newlines", () => {
    expect(countLines("hello world")).toBe(1);
  });

  it("returns 2 for a string with one newline", () => {
    expect(countLines("line one\nline two")).toBe(2);
  });

  it("returns 3 for a string with two newlines", () => {
    expect(countLines("a\nb\nc")).toBe(3);
  });

  it("counts a trailing newline as an extra line", () => {
    expect(countLines("hello\n")).toBe(2);
  });

  it("counts a leading newline", () => {
    expect(countLines("\nhello")).toBe(2);
  });

  it("handles only newlines", () => {
    expect(countLines("\n\n\n")).toBe(4);
  });

  it("handles Windows-style CRLF as a newline + carriage return", () => {
    // split("\n") treats \r\n as: ["line\r", "line"] → 2 segments
    expect(countLines("line1\r\nline2")).toBe(2);
  });

  it("is always at least 1", () => {
    const inputs = ["", "a", "a\n", "\n", "\n\n", "multi\nline\ntext"];
    for (const input of inputs) {
      expect(countLines(input)).toBeGreaterThanOrEqual(1);
    }
  });

  it("handles a very long single-line string", () => {
    const longLine = "a".repeat(10_000);
    expect(countLines(longLine)).toBe(1);
  });

  it("handles a multi-line code block", () => {
    const code = "function foo() {\n  return 42;\n}\n";
    expect(countLines(code)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// isPrintable
// ---------------------------------------------------------------------------

describe("isPrintable (PromptBar input guard)", () => {
  it("returns false for an empty string", () => {
    expect(isPrintable("")).toBe(false);
  });

  it("returns false for NUL character (codepoint 0)", () => {
    expect(isPrintable("\x00")).toBe(false);
  });

  it("returns false for BEL (codepoint 7)", () => {
    expect(isPrintable("\x07")).toBe(false);
  });

  it("returns false for tab (codepoint 9)", () => {
    // Tab is below 32 — consistent with the guard's intent to block control chars
    expect(isPrintable("\t")).toBe(false);
  });

  it("returns false for newline (codepoint 10)", () => {
    expect(isPrintable("\n")).toBe(false);
  });

  it("returns false for escape (codepoint 27)", () => {
    expect(isPrintable("\x1b")).toBe(false);
  });

  it("returns false for unit separator (codepoint 31)", () => {
    expect(isPrintable("\x1f")).toBe(false);
  });

  it("returns true for space (codepoint 32)", () => {
    expect(isPrintable(" ")).toBe(true);
  });

  it("returns true for ASCII letters", () => {
    expect(isPrintable("a")).toBe(true);
    expect(isPrintable("Z")).toBe(true);
  });

  it("returns true for digits", () => {
    expect(isPrintable("0")).toBe(true);
    expect(isPrintable("9")).toBe(true);
  });

  it("returns true for common punctuation", () => {
    for (const ch of "!@#$%^&*()-_=+[]{}|;':\",./<>?") {
      expect(isPrintable(ch)).toBe(true);
    }
  });

  it("returns true for a multi-char string whose first char is printable", () => {
    // The guard checks only the first codepoint
    expect(isPrintable("hello")).toBe(true);
  });

  it("returns true for a basic emoji (codepoint > 127)", () => {
    expect(isPrintable("A")).toBe(true); // sanity
    // High codepoints are >= 32
    expect(isPrintable("🚀")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Integration: countLines × typical PromptBar scenarios
// ---------------------------------------------------------------------------

describe("PromptBar scenarios using countLines", () => {
  it("single-line prompt does not show line hint (lineCount === 1)", () => {
    const value = "fix the bug in session.ts";
    expect(countLines(value) > 1).toBe(false);
  });

  it("multi-line prompt triggers line hint (lineCount > 1)", () => {
    const value = "step 1: read the file\nstep 2: fix the function\nstep 3: run tests";
    expect(countLines(value) > 1).toBe(true);
    expect(countLines(value)).toBe(3);
  });

  it("pasting a code snippet with many lines is counted correctly", () => {
    const snippet = Array.from({ length: 20 }, (_, i) => `line ${String(i + 1)}`).join("\n");
    expect(countLines(snippet)).toBe(20);
  });
});
