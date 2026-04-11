/**
 * runListTableHelpers.test.ts
 *
 * Tests for pure helper functions exported from RunListTable.tsx:
 * stateSymbol, stateColor, truncateId, truncateProcess, formatRelativeTimestamp.
 */

import { describe, it, expect } from "vitest";
import {
  stateSymbol,
  stateColor,
  truncateId,
  truncateProcess,
  formatRelativeTimestamp,
} from "../components/RunListTable.js";

// ---------------------------------------------------------------------------
// stateSymbol
// ---------------------------------------------------------------------------

describe("stateSymbol", () => {
  it("returns checkmark for completed", () => {
    expect(stateSymbol("completed")).toBe("\u2714");
  });

  it("returns cross for failed", () => {
    expect(stateSymbol("failed")).toBe("\u2718");
  });

  it("returns circle for waiting", () => {
    expect(stateSymbol("waiting")).toBe("\u25CB");
  });

  it("returns dash for created", () => {
    expect(stateSymbol("created")).toBe("\u2500");
  });
});

// ---------------------------------------------------------------------------
// stateColor
// ---------------------------------------------------------------------------

describe("stateColor", () => {
  const colors = {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    muted: "#6b7280",
  };

  it("returns success for completed", () => {
    expect(stateColor("completed", colors)).toBe(colors.success);
  });

  it("returns error for failed", () => {
    expect(stateColor("failed", colors)).toBe(colors.error);
  });

  it("returns warning for waiting", () => {
    expect(stateColor("waiting", colors)).toBe(colors.warning);
  });

  it("returns muted for created", () => {
    expect(stateColor("created", colors)).toBe(colors.muted);
  });
});

// ---------------------------------------------------------------------------
// truncateId
// ---------------------------------------------------------------------------

describe("truncateId", () => {
  it("returns short IDs unchanged", () => {
    expect(truncateId("abc123")).toBe("abc123");
  });

  it("returns exactly 12-char IDs unchanged", () => {
    expect(truncateId("123456789012")).toBe("123456789012");
  });

  it("truncates IDs longer than 12 chars", () => {
    expect(truncateId("run-abc-def-ghi-jkl")).toBe("run-abc-def-");
  });

  it("respects custom max parameter", () => {
    expect(truncateId("abcdefghij", 5)).toBe("abcde");
  });

  it("handles empty string", () => {
    expect(truncateId("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// truncateProcess
// ---------------------------------------------------------------------------

describe("truncateProcess", () => {
  it("returns short process IDs unchanged", () => {
    expect(truncateProcess("tui-wave2")).toBe("tui-wave2");
  });

  it("returns exactly 20-char IDs unchanged", () => {
    expect(truncateProcess("12345678901234567890")).toBe("12345678901234567890");
  });

  it("truncates with ellipsis for long IDs", () => {
    const longId = "tui-ux-convergence-wave2-process";
    const result = truncateProcess(longId);
    expect(result.length).toBe(20);
    expect(result.endsWith("\u2026")).toBe(true);
  });

  it("respects custom max parameter", () => {
    const result = truncateProcess("abcdefghij", 6);
    expect(result).toBe("abcde\u2026");
    expect(result.length).toBe(6);
  });

  it("handles empty string", () => {
    expect(truncateProcess("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// formatRelativeTimestamp
// ---------------------------------------------------------------------------

describe("formatRelativeTimestamp", () => {
  it("returns 'just now' for timestamps less than 1 minute ago", () => {
    const now = new Date("2026-04-10T12:00:00Z");
    const iso = new Date("2026-04-10T11:59:30Z").toISOString();
    expect(formatRelativeTimestamp(iso, now)).toBe("just now");
  });

  it("returns minutes ago for timestamps less than 1 hour", () => {
    const now = new Date("2026-04-10T12:00:00Z");
    const iso = new Date("2026-04-10T11:45:00Z").toISOString();
    expect(formatRelativeTimestamp(iso, now)).toBe("15m ago");
  });

  it("returns hours ago for timestamps less than 1 day", () => {
    const now = new Date("2026-04-10T12:00:00Z");
    const iso = new Date("2026-04-10T09:00:00Z").toISOString();
    expect(formatRelativeTimestamp(iso, now)).toBe("3h ago");
  });

  it("returns days ago for timestamps more than 1 day", () => {
    const now = new Date("2026-04-10T12:00:00Z");
    const iso = new Date("2026-04-07T12:00:00Z").toISOString();
    expect(formatRelativeTimestamp(iso, now)).toBe("3d ago");
  });

  it("returns '???' for empty string", () => {
    expect(formatRelativeTimestamp("")).toBe("???");
  });

  it("returns truncated string for invalid date", () => {
    const result = formatRelativeTimestamp("not-a-date-string-at-all");
    expect(result).toBe("not-a-date-string-a");
  });
});
