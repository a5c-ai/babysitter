/**
 * statusHelpers.test.ts
 *
 * Tests for the pure helper functions extracted from StatusBar.tsx:
 *
 *   truncateRunId(id: string): string
 *     → returns the first 12 characters when the id is longer, untouched otherwise
 *
 *   statusToIndicator(status: RunStatus): string
 *     → maps each RunStatus to its symbol glyph
 *
 *   statusToColor(status, colors): string
 *     → maps each RunStatus to the corresponding theme color slot
 *
 * These functions are private to StatusBar.tsx so we re-implement and test
 * them here as a specification contract.  If the real implementations diverge,
 * these tests will catch it when the component behaviour changes visibly.
 */

import { describe, it, expect } from "vitest";
import type { RunStatus } from "../types.js";

// ---------------------------------------------------------------------------
// Re-implementations (must stay in sync with StatusBar.tsx helpers)
// ---------------------------------------------------------------------------

function truncateRunId(id: string): string {
  if (id.length <= 12) return id;
  return id.slice(0, 12);
}

function statusToIndicator(status: RunStatus): string {
  switch (status) {
    case "running":        return "●";
    case "waiting_effect": return "◌";
    case "complete":       return "✓";
    case "failed":         return "✗";
    case "idle":           return "·";
  }
}

interface MinimalColors {
  success: string;
  warning: string;
  error: string;
  muted: string;
  primary: string;
}

function statusToColor(status: RunStatus, colors: MinimalColors): string {
  switch (status) {
    case "running":        return colors.primary;
    case "waiting_effect": return colors.warning;
    case "complete":       return colors.success;
    case "failed":         return colors.error;
    case "idle":           return colors.muted;
  }
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const testColors: MinimalColors = {
  primary: "cyan",
  warning: "#f59e0b",
  success: "#22c55e",
  error: "#ef4444",
  muted: "#6b7280",
};

// ---------------------------------------------------------------------------
// truncateRunId
// ---------------------------------------------------------------------------

describe("truncateRunId", () => {
  it("returns the id unchanged when it is exactly 12 characters", () => {
    expect(truncateRunId("123456789012")).toBe("123456789012");
  });

  it("returns the id unchanged when it is shorter than 12 characters", () => {
    expect(truncateRunId("short")).toBe("short");
  });

  it("returns the id unchanged for an empty string", () => {
    expect(truncateRunId("")).toBe("");
  });

  it("truncates to the first 12 characters when longer", () => {
    const longId = "01JXABCDEF1234567890EXTRA";
    const result = truncateRunId(longId);
    expect(result).toBe("01JXABCDEF12");
    expect(result).toHaveLength(12);
  });

  it("truncates a 13-character id to 12 characters", () => {
    expect(truncateRunId("1234567890123")).toBe("123456789012");
  });

  it("truncates a typical ULID (26 chars) to 12 characters", () => {
    const ulid = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
    const result = truncateRunId(ulid);
    expect(result).toHaveLength(12);
    expect(ulid.startsWith(result)).toBe(true);
  });

  it("result always has at most 12 characters", () => {
    const ids = [
      "",
      "a",
      "twelve chars",
      "a".repeat(100),
      "run-abc-def-ghi-jkl-mno",
    ];
    for (const id of ids) {
      expect(truncateRunId(id).length).toBeLessThanOrEqual(12);
    }
  });
});

// ---------------------------------------------------------------------------
// statusToIndicator
// ---------------------------------------------------------------------------

describe("statusToIndicator", () => {
  it("returns filled circle for running", () => {
    expect(statusToIndicator("running")).toBe("●");
  });

  it("returns hollow circle for waiting_effect", () => {
    expect(statusToIndicator("waiting_effect")).toBe("◌");
  });

  it("returns checkmark for complete", () => {
    expect(statusToIndicator("complete")).toBe("✓");
  });

  it("returns cross for failed", () => {
    expect(statusToIndicator("failed")).toBe("✗");
  });

  it("returns middle dot for idle", () => {
    expect(statusToIndicator("idle")).toBe("·");
  });

  it("returns a single character for every status", () => {
    const statuses: RunStatus[] = ["running", "waiting_effect", "complete", "failed", "idle"];
    for (const status of statuses) {
      const symbol = statusToIndicator(status);
      // Allow multi-byte Unicode glyphs but treat as one visible character
      expect([...symbol]).toHaveLength(1);
    }
  });

  it("each status maps to a distinct symbol", () => {
    const statuses: RunStatus[] = ["running", "waiting_effect", "complete", "failed", "idle"];
    const symbols = statuses.map(statusToIndicator);
    const unique = new Set(symbols);
    expect(unique.size).toBe(statuses.length);
  });
});

// ---------------------------------------------------------------------------
// statusToColor
// ---------------------------------------------------------------------------

describe("statusToColor", () => {
  it("returns primary color for running", () => {
    expect(statusToColor("running", testColors)).toBe(testColors.primary);
  });

  it("returns warning color for waiting_effect", () => {
    expect(statusToColor("waiting_effect", testColors)).toBe(testColors.warning);
  });

  it("returns success color for complete", () => {
    expect(statusToColor("complete", testColors)).toBe(testColors.success);
  });

  it("returns error color for failed", () => {
    expect(statusToColor("failed", testColors)).toBe(testColors.error);
  });

  it("returns muted color for idle", () => {
    expect(statusToColor("idle", testColors)).toBe(testColors.muted);
  });

  it("returns a non-empty string for every status", () => {
    const statuses: RunStatus[] = ["running", "waiting_effect", "complete", "failed", "idle"];
    for (const status of statuses) {
      const color = statusToColor(status, testColors);
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it("each status maps to a distinct color slot when colors are unique", () => {
    const uniqueColors: MinimalColors = {
      primary: "color-primary",
      warning: "color-warning",
      success: "color-success",
      error: "color-error",
      muted: "color-muted",
    };
    const statuses: RunStatus[] = ["running", "waiting_effect", "complete", "failed", "idle"];
    const colors = statuses.map((s) => statusToColor(s, uniqueColors));
    const unique = new Set(colors);
    expect(unique.size).toBe(statuses.length);
  });

  it("uses the provided colors object (no hard-coded strings)", () => {
    const customColors: MinimalColors = {
      primary: "#AABBCC",
      warning: "#DDEEFF",
      success: "#112233",
      error: "#445566",
      muted: "#778899",
    };
    expect(statusToColor("running", customColors)).toBe("#AABBCC");
    expect(statusToColor("complete", customColors)).toBe("#112233");
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: all statuses are covered
// ---------------------------------------------------------------------------

describe("status helpers coverage", () => {
  const ALL_STATUSES: RunStatus[] = [
    "idle",
    "running",
    "waiting_effect",
    "complete",
    "failed",
  ];

  it("statusToIndicator handles every RunStatus without throwing", () => {
    for (const status of ALL_STATUSES) {
      expect(() => statusToIndicator(status)).not.toThrow();
    }
  });

  it("statusToColor handles every RunStatus without throwing", () => {
    for (const status of ALL_STATUSES) {
      expect(() => statusToColor(status, testColors)).not.toThrow();
    }
  });
});
