/**
 * toolOutputFormatter.test.ts
 *
 * Tests for tool output formatting helpers — pure functions
 * that transform raw tool outputs into display-ready line arrays.
 *
 *   formatShellOutput(stdout, stderr, exitCode) → { lines, hasError }
 *   formatToolOutput(output)                    → string[]
 */

import { describe, it, expect } from "vitest";
import { formatShellOutput, formatToolOutput } from "../helpers.js";

// ---------------------------------------------------------------------------
// formatShellOutput
// ---------------------------------------------------------------------------

describe("formatShellOutput", () => {
  it("returns empty lines and no error for empty stdout/stderr with exit 0", () => {
    const result = formatShellOutput("", "", 0);
    expect(result.lines).toEqual([]);
    expect(result.hasError).toBe(false);
  });

  it("splits stdout into lines", () => {
    const result = formatShellOutput("line1\nline2\nline3", "", 0);
    expect(result.lines).toEqual(["line1", "line2", "line3"]);
    expect(result.hasError).toBe(false);
  });

  it("handles single-line stdout", () => {
    const result = formatShellOutput("hello", "", 0);
    expect(result.lines).toEqual(["hello"]);
    expect(result.hasError).toBe(false);
  });

  it("prepends stderr lines with 'stderr:' prefix", () => {
    const result = formatShellOutput("", "warning: something", 0);
    expect(result.lines).toContain("stderr: warning: something");
  });

  it("places stderr lines after stdout lines", () => {
    const result = formatShellOutput("output", "error msg", 0);
    const stdoutIdx = result.lines.indexOf("output");
    const stderrIdx = result.lines.findIndex((l: string) =>
      l.startsWith("stderr:"),
    );
    expect(stdoutIdx).toBeLessThan(stderrIdx);
  });

  it("sets hasError true for non-zero exit code", () => {
    const result = formatShellOutput("", "", 1);
    expect(result.hasError).toBe(true);
  });

  it("appends exit code line for non-zero exit", () => {
    const result = formatShellOutput("out", "", 127);
    expect(result.lines).toContain("Exit code: 127");
  });

  it("does not append exit code line for exit 0", () => {
    const result = formatShellOutput("out", "", 0);
    const hasExitLine = result.lines.some((l: string) =>
      l.startsWith("Exit code:"),
    );
    expect(hasExitLine).toBe(false);
  });

  it("combines stdout, stderr, and exit code correctly", () => {
    const result = formatShellOutput("ok", "warn", 2);
    expect(result.hasError).toBe(true);
    expect(result.lines[0]).toBe("ok");
    expect(result.lines[1]).toContain("stderr:");
    expect(result.lines[result.lines.length - 1]).toBe("Exit code: 2");
  });

  it("handles multi-line stderr", () => {
    const result = formatShellOutput("", "err1\nerr2", 1);
    const stderrLines = result.lines.filter((l: string) =>
      l.startsWith("stderr:"),
    );
    expect(stderrLines.length).toBe(2);
  });

  it("handles trailing newlines in stdout gracefully", () => {
    const result = formatShellOutput("hello\n", "", 0);
    // Should not produce an empty trailing line
    expect(result.lines[result.lines.length - 1]).not.toBe("");
  });
});

// ---------------------------------------------------------------------------
// formatToolOutput
// ---------------------------------------------------------------------------

describe("formatToolOutput", () => {
  it("returns empty array for null", () => {
    expect(formatToolOutput(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(formatToolOutput(undefined)).toEqual([]);
  });

  it("splits string output by newlines", () => {
    expect(formatToolOutput("line1\nline2")).toEqual(["line1", "line2"]);
  });

  it("returns single-element array for single-line string", () => {
    expect(formatToolOutput("hello")).toEqual(["hello"]);
  });

  it("returns empty array for empty string", () => {
    expect(formatToolOutput("")).toEqual([]);
  });

  it("JSON.stringifies object with 2-space indent and splits by lines", () => {
    const obj = { key: "value" };
    const result = formatToolOutput(obj);
    // JSON.stringify(obj, null, 2) produces:
    // {
    //   "key": "value"
    // }
    expect(result).toEqual(["{", '  "key": "value"', "}"]);
  });

  it("stringifies number to single-line array", () => {
    expect(formatToolOutput(42)).toEqual(["42"]);
  });

  it("stringifies boolean to single-line array", () => {
    expect(formatToolOutput(true)).toEqual(["true"]);
  });

  it("handles arrays as objects (JSON stringified)", () => {
    const result = formatToolOutput([1, 2, 3]);
    expect(result.length).toBeGreaterThan(1); // multi-line JSON
    expect(result[0]).toBe("[");
  });

  it("handles nested objects", () => {
    const nested = { a: { b: "c" } };
    const result = formatToolOutput(nested);
    expect(result.join("\n")).toBe(JSON.stringify(nested, null, 2));
  });
});
