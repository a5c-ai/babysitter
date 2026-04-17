/**
 * stderrRendering.test.ts
 *
 * Tests for stream source distinction in SessionView streaming.
 * Stderr-sourced lines should be prefixed to distinguish them visually.
 *
 * Phase 2: Forward stream source, render stderr distinctly (Wave 9)
 */

import { describe, it, expect } from "vitest";
import { formatStreamLine } from "../helpers.js";

describe("formatStreamLine", () => {
  it("returns plain line for stdout source", () => {
    expect(formatStreamLine("Hello world", "stdout")).toBe("Hello world");
  });

  it("returns plain line when source is undefined", () => {
    expect(formatStreamLine("Hello world")).toBe("Hello world");
  });

  it("prefixes stderr lines with [stderr] marker", () => {
    expect(formatStreamLine("Error: something broke", "stderr")).toBe("[stderr] Error: something broke");
  });

  it("does not double-prefix if line already starts with [stderr]", () => {
    expect(formatStreamLine("[stderr] already prefixed", "stderr")).toBe("[stderr] already prefixed");
  });

  it("handles empty lines for stdout", () => {
    expect(formatStreamLine("", "stdout")).toBe("");
  });

  it("handles empty lines for stderr", () => {
    expect(formatStreamLine("", "stderr")).toBe("");
  });

  it("handles whitespace-only stderr lines", () => {
    expect(formatStreamLine("   ", "stderr")).toBe("[stderr]    ");
  });
});
