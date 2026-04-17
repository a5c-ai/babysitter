/**
 * messageDispatch.test.ts
 *
 * Tests for message dispatch helper functions — pure functions
 * that map message kinds to icons, colors, and display rules.
 *
 *   getMessageIcon(kind)                          → icon string
 *   getMessageColor(kind, colors)                 → color string
 *   shouldShowTimestamp(kind)                      → boolean
 *   formatToolCallSummary(toolName, input, ...)    → formatted string
 */

import { describe, it, expect } from "vitest";
import type { MessageKind, ThemeColors } from "../types.js";
import {
  getMessageIcon,
  getMessageColor,
  shouldShowTimestamp,
  formatToolCallSummary,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const testColors: ThemeColors = {
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
  it("returns '>' for user messages", () => {
    expect(getMessageIcon("user")).toBe(">");
  });

  it("returns empty string for assistant messages", () => {
    expect(getMessageIcon("assistant")).toBe("");
  });

  it("returns gear icon for tool_call", () => {
    expect(getMessageIcon("tool_call")).toBe("\u2699");
  });

  it("returns diamond icon for subagent", () => {
    expect(getMessageIcon("subagent")).toBe("\u25C8");
  });

  it("returns info icon for system", () => {
    expect(getMessageIcon("system")).toBe("\u2139");
  });

  it("returns cross mark for error", () => {
    expect(getMessageIcon("error")).toBe("\u2717");
  });

  it("handles all MessageKind values exhaustively", () => {
    const allKinds: MessageKind[] = [
      "user",
      "assistant",
      "tool_call",
      "subagent",
      "system",
      "error",
    ];
    for (const kind of allKinds) {
      expect(typeof getMessageIcon(kind)).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// getMessageColor
// ---------------------------------------------------------------------------

describe("getMessageColor", () => {
  it("returns primary color for user messages", () => {
    expect(getMessageColor("user", testColors)).toBe(testColors.primary);
  });

  it("returns foreground color for assistant messages", () => {
    expect(getMessageColor("assistant", testColors)).toBe(
      testColors.foreground,
    );
  });

  it("returns toolCall color for tool_call messages", () => {
    expect(getMessageColor("tool_call", testColors)).toBe(testColors.toolCall);
  });

  it("returns subagent color for subagent messages", () => {
    expect(getMessageColor("subagent", testColors)).toBe(testColors.subagent);
  });

  it("returns muted color for system messages", () => {
    expect(getMessageColor("system", testColors)).toBe(testColors.muted);
  });

  it("returns error color for error messages", () => {
    expect(getMessageColor("error", testColors)).toBe(testColors.error);
  });

  it("works with different theme color objects", () => {
    const altColors: ThemeColors = {
      ...testColors,
      primary: "#aabbcc",
      error: "#dd0000",
    };
    expect(getMessageColor("user", altColors)).toBe("#aabbcc");
    expect(getMessageColor("error", altColors)).toBe("#dd0000");
  });
});

// ---------------------------------------------------------------------------
// shouldShowTimestamp
// ---------------------------------------------------------------------------

describe("shouldShowTimestamp", () => {
  it("returns true for user messages", () => {
    expect(shouldShowTimestamp("user")).toBe(true);
  });

  it("returns true for assistant messages", () => {
    expect(shouldShowTimestamp("assistant")).toBe(true);
  });

  it("returns true for error messages", () => {
    expect(shouldShowTimestamp("error")).toBe(true);
  });

  it("returns false for tool_call messages", () => {
    expect(shouldShowTimestamp("tool_call")).toBe(false);
  });

  it("returns false for subagent messages", () => {
    expect(shouldShowTimestamp("subagent")).toBe(false);
  });

  it("returns false for system messages", () => {
    expect(shouldShowTimestamp("system")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatToolCallSummary
// ---------------------------------------------------------------------------

describe("formatToolCallSummary", () => {
  it("formats basic tool call with name and args", () => {
    const result = formatToolCallSummary("Read", { file: "foo.ts" });
    expect(result).toContain("\u2699");
    expect(result).toContain("Read");
  });

  it("includes briefArgs representation of input", () => {
    const result = formatToolCallSummary("Edit", {
      file: "bar.ts",
      old: "x",
      new: "y",
    });
    expect(result).toContain("Edit");
    // Should contain some stringified representation of the input
    expect(result.length).toBeGreaterThan(6);
  });

  it("appends elapsed time when provided", () => {
    const result = formatToolCallSummary("Bash", { cmd: "ls" }, 1200);
    expect(result).toContain("1.2s");
  });

  it("does not include elapsed when undefined", () => {
    const result = formatToolCallSummary("Bash", { cmd: "ls" });
    expect(result).not.toMatch(/\d+(\.\d+)?[ms]/);
  });

  it("includes truncated output preview when output is provided", () => {
    const result = formatToolCallSummary(
      "Bash",
      { cmd: "ls" },
      500,
      "file1.ts\nfile2.ts\nfile3.ts",
    );
    expect(result).toContain("\u2192"); // → arrow
  });

  it("truncates output preview to 40 chars", () => {
    const longOutput = "a".repeat(100);
    const result = formatToolCallSummary("Bash", { cmd: "ls" }, 100, longOutput);
    // The output preview portion should be at most 40 chars + "..."
    expect(result).toContain("...");
  });

  it("handles null input gracefully", () => {
    const result = formatToolCallSummary("Ping", null);
    expect(result).toContain("Ping");
  });

  it("handles string output", () => {
    const result = formatToolCallSummary("Read", { f: "x" }, 50, "contents");
    expect(result).toContain("contents");
  });

  it("formats with all parameters present", () => {
    const result = formatToolCallSummary(
      "Write",
      { path: "/tmp/test.ts" },
      2500,
      "OK written",
    );
    expect(result).toContain("\u2699");
    expect(result).toContain("Write");
    expect(result).toContain("2.5s");
    expect(result).toContain("\u2192");
  });
});
