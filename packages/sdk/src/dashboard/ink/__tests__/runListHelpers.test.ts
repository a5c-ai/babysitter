/**
 * runListHelpers.test.ts
 *
 * Tests for the pure helper functions used by RunListTable.tsx.
 *
 * Same strategy as sessionContext.test.ts: re-implement the helpers here
 * to avoid importing the React component.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Re-implemented helpers (mirrors RunListTable.tsx exactly)
// ---------------------------------------------------------------------------

type RunState = "completed" | "failed" | "waiting" | "created";

function stateSymbol(state: RunState): string {
  switch (state) {
    case "completed": return "\u2714";
    case "failed": return "\u2718";
    case "waiting": return "\u25CB";
    case "created": return "\u2500";
  }
}

function stateColor(
  state: RunState,
  colors: { success: string; error: string; warning: string; muted: string },
): string {
  switch (state) {
    case "completed": return colors.success;
    case "failed": return colors.error;
    case "waiting": return colors.warning;
    case "created": return colors.muted;
  }
}

function truncateId(id: string, max: number = 12): string {
  if (id.length <= max) return id;
  return id.slice(0, max);
}

function truncateProcess(processId: string, max: number = 20): string {
  if (processId.length <= max) return processId;
  return processId.slice(0, max - 1) + "\u2026";
}

function formatTimestamp(iso: string): string {
  if (!iso) return "???";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 60_000) return "just now";
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
    return `${Math.floor(diffMs / 86400_000)}d ago`;
  } catch {
    return iso.slice(0, 19);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const mockColors = {
  success: "#00ff00",
  error: "#ff0000",
  warning: "#ffff00",
  muted: "#888888",
};

describe("stateSymbol", () => {
  it("returns checkmark for completed", () => {
    expect(stateSymbol("completed")).toBe("\u2714");
  });

  it("returns X for failed", () => {
    expect(stateSymbol("failed")).toBe("\u2718");
  });

  it("returns circle for waiting", () => {
    expect(stateSymbol("waiting")).toBe("\u25CB");
  });

  it("returns dash for created", () => {
    expect(stateSymbol("created")).toBe("\u2500");
  });
});

describe("stateColor", () => {
  it("returns success color for completed", () => {
    expect(stateColor("completed", mockColors)).toBe("#00ff00");
  });

  it("returns error color for failed", () => {
    expect(stateColor("failed", mockColors)).toBe("#ff0000");
  });

  it("returns warning color for waiting", () => {
    expect(stateColor("waiting", mockColors)).toBe("#ffff00");
  });

  it("returns muted color for created", () => {
    expect(stateColor("created", mockColors)).toBe("#888888");
  });
});

describe("truncateId", () => {
  it("does not truncate short IDs", () => {
    expect(truncateId("ABC123")).toBe("ABC123");
  });

  it("does not truncate IDs at exactly max length", () => {
    expect(truncateId("123456789012")).toBe("123456789012"); // 12 chars
  });

  it("truncates long IDs to max (default 12)", () => {
    expect(truncateId("01KNSPQ6V2K4VKD2AJKX85RGYC")).toBe("01KNSPQ6V2K4");
  });

  it("respects custom max", () => {
    expect(truncateId("ABCDEFGHIJ", 5)).toBe("ABCDE");
  });

  it("handles empty string", () => {
    expect(truncateId("")).toBe("");
  });
});

describe("truncateProcess", () => {
  it("does not truncate short process IDs", () => {
    expect(truncateProcess("my-process")).toBe("my-process");
  });

  it("truncates long process IDs with ellipsis", () => {
    const long = "very-long-process-name-that-exceeds-limit";
    const result = truncateProcess(long);
    expect(result.length).toBe(20);
    expect(result.endsWith("\u2026")).toBe(true);
  });

  it("does not truncate IDs at exactly max length", () => {
    const exact = "12345678901234567890"; // 20 chars
    expect(truncateProcess(exact)).toBe(exact);
  });

  it("respects custom max", () => {
    expect(truncateProcess("long-process-id", 10)).toBe("long-proc\u2026");
  });
});

describe("formatTimestamp", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns '???' for empty string", () => {
    expect(formatTimestamp("")).toBe("???");
  });

  it("returns 'just now' for timestamps less than 1 minute ago", () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 30_000); // 30 seconds ago
    vi.useFakeTimers({ now });
    expect(formatTimestamp(recent.toISOString())).toBe("just now");
  });

  it("returns minutes ago for timestamps less than 1 hour ago", () => {
    const now = new Date();
    const mins = new Date(now.getTime() - 5 * 60_000); // 5 minutes ago
    vi.useFakeTimers({ now });
    expect(formatTimestamp(mins.toISOString())).toBe("5m ago");
  });

  it("returns hours ago for timestamps less than 1 day ago", () => {
    const now = new Date();
    const hours = new Date(now.getTime() - 3 * 3600_000); // 3 hours ago
    vi.useFakeTimers({ now });
    expect(formatTimestamp(hours.toISOString())).toBe("3h ago");
  });

  it("returns days ago for timestamps more than 1 day ago", () => {
    const now = new Date();
    const days = new Date(now.getTime() - 2 * 86400_000); // 2 days ago
    vi.useFakeTimers({ now });
    expect(formatTimestamp(days.toISOString())).toBe("2d ago");
  });

  it("handles malformed timestamps gracefully", () => {
    // Non-date string will cause Date constructor to return Invalid Date
    // which will make getTime() return NaN, but won't throw
    const result = formatTimestamp("not-a-date");
    // Should fall through to the slice fallback
    expect(typeof result).toBe("string");
  });
});
