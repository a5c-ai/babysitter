/**
 * richMessages.test.ts
 *
 * Tests for rich message rendering pipeline.
 * Verifies that getMessageIcon, getMessageColor, shouldShowTimestamp,
 * formatToolCallSummary, formatShellOutput, and formatToolOutput work
 * correctly for the Message component wiring.
 */

import { describe, it, expect } from "vitest";
import type { MessageKind, ThemeColors } from "../types.js";
import {
  getMessageIcon,
  getMessageColor,
  shouldShowTimestamp,
  formatToolCallSummary,
  formatShellOutput,
  formatToolOutput,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

const mockColors: ThemeColors = {
  primary: "#00ff00",
  secondary: "#0000ff",
  muted: "#888888",
  error: "#ff0000",
  warning: "#ffaa00",
  success: "#00cc00",
  foreground: "#ffffff",
  background: "#000000",
  border: "#444444",
  toolCall: "#ff00ff",
  subagent: "#00ffff",
};

// ---------------------------------------------------------------------------
// getMessageIcon
// ---------------------------------------------------------------------------

describe("getMessageIcon", () => {
  const kinds: MessageKind[] = ["user", "assistant", "tool_call", "subagent", "system", "error"];

  for (const kind of kinds) {
    it(`returns a string for kind "${kind}"`, () => {
      const icon = getMessageIcon(kind);
      expect(typeof icon).toBe("string");
    });
  }

  it("returns non-empty icon for user", () => {
    expect(getMessageIcon("user").length).toBeGreaterThan(0);
  });

  it("returns non-empty icon for error", () => {
    expect(getMessageIcon("error").length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getMessageColor
// ---------------------------------------------------------------------------

describe("getMessageColor", () => {
  it("returns primary color for user messages", () => {
    expect(getMessageColor("user", mockColors)).toBe("#00ff00");
  });

  it("returns foreground for assistant", () => {
    expect(getMessageColor("assistant", mockColors)).toBe("#ffffff");
  });

  it("returns toolCall color for tool_call", () => {
    expect(getMessageColor("tool_call", mockColors)).toBe("#ff00ff");
  });

  it("returns error color for error", () => {
    expect(getMessageColor("error", mockColors)).toBe("#ff0000");
  });

  it("returns muted for system", () => {
    expect(getMessageColor("system", mockColors)).toBe("#888888");
  });

  it("returns subagent color for subagent", () => {
    expect(getMessageColor("subagent", mockColors)).toBe("#00ffff");
  });
});

// ---------------------------------------------------------------------------
// shouldShowTimestamp
// ---------------------------------------------------------------------------

describe("shouldShowTimestamp", () => {
  it("returns true for user", () => {
    expect(shouldShowTimestamp("user")).toBe(true);
  });

  it("returns true for assistant", () => {
    expect(shouldShowTimestamp("assistant")).toBe(true);
  });

  it("returns true for error", () => {
    expect(shouldShowTimestamp("error")).toBe(true);
  });

  it("returns false for tool_call", () => {
    expect(shouldShowTimestamp("tool_call")).toBe(false);
  });

  it("returns false for system", () => {
    expect(shouldShowTimestamp("system")).toBe(false);
  });

  it("returns false for subagent", () => {
    expect(shouldShowTimestamp("subagent")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatToolCallSummary
// ---------------------------------------------------------------------------

describe("formatToolCallSummary", () => {
  it("includes tool name", () => {
    const summary = formatToolCallSummary("read_file", {});
    expect(summary).toContain("read_file");
  });

  it("includes args", () => {
    const summary = formatToolCallSummary("edit_file", { path: "/foo/bar.ts" });
    expect(summary).toContain("path");
  });

  it("includes elapsed time when provided", () => {
    const summary = formatToolCallSummary("run_tests", {}, 3500);
    expect(summary).toContain("3.5");
  });

  it("includes output preview when provided", () => {
    const summary = formatToolCallSummary("grep", {}, undefined, "found 3 matches in foo.ts");
    expect(summary).toContain("found 3 matches");
  });

  it("works with minimal args", () => {
    const summary = formatToolCallSummary("ls", null);
    expect(summary).toContain("ls");
  });
});

// ---------------------------------------------------------------------------
// formatShellOutput
// ---------------------------------------------------------------------------

describe("formatShellOutput", () => {
  it("separates stdout lines", () => {
    const result = formatShellOutput("line1\nline2", "", 0);
    expect(result.lines).toContain("line1");
    expect(result.lines).toContain("line2");
    expect(result.hasError).toBe(false);
  });

  it("marks stderr lines with prefix", () => {
    const result = formatShellOutput("", "error: oops", 1);
    expect(result.lines.some((l) => l.includes("stderr:"))).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("combines stdout and stderr", () => {
    const result = formatShellOutput("output", "warning", 0);
    expect(result.lines.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty output", () => {
    const result = formatShellOutput("", "", 0);
    expect(result.hasError).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatToolOutput
// ---------------------------------------------------------------------------

describe("formatToolOutput", () => {
  it("handles null", () => {
    expect(formatToolOutput(null)).toEqual([]);
  });

  it("handles undefined", () => {
    expect(formatToolOutput(undefined)).toEqual([]);
  });

  it("handles empty string", () => {
    expect(formatToolOutput("")).toEqual([]);
  });

  it("splits multi-line string", () => {
    const lines = formatToolOutput("a\nb\nc");
    expect(lines).toEqual(["a", "b", "c"]);
  });

  it("handles numbers", () => {
    expect(formatToolOutput(42)).toEqual(["42"]);
  });

  it("handles booleans", () => {
    expect(formatToolOutput(true)).toEqual(["true"]);
  });

  it("JSON-formats objects", () => {
    const lines = formatToolOutput({ key: "value" });
    expect(lines.join("\n")).toContain('"key"');
    expect(lines.join("\n")).toContain('"value"');
  });
});

// ---------------------------------------------------------------------------
// Pipeline integration
// ---------------------------------------------------------------------------

describe("rich message rendering pipeline", () => {
  it("produces consistent icon + color + timestamp for each kind", () => {
    const kinds: MessageKind[] = ["user", "assistant", "tool_call", "subagent", "system", "error"];
    for (const kind of kinds) {
      const icon = getMessageIcon(kind);
      const color = getMessageColor(kind, mockColors);
      const showTs = shouldShowTimestamp(kind);

      expect(typeof icon).toBe("string");
      expect(typeof color).toBe("string");
      expect(typeof showTs).toBe("boolean");
    }
  });
});
