/**
 * statusLine.test.ts
 *
 * Tests for the pure functions exported from StatusLine.tsx:
 * formatElapsed, phaseToColorKey, formatCostForStatus, formatStatusSegments.
 *
 * Also tests truncateRunId from helpers.ts (used by formatStatusSegments).
 */

import { describe, it, expect } from "vitest";
import type {
  OrchestrationStatus,
  OrchestrationPhase,
  ThemeColors,
} from "../types.js";
import {
  formatElapsed,
  phaseToColorKey,
  formatCostForStatus,
  formatStatusSegments,
  type StatusSegment,
} from "../components/StatusLine.js";
import { truncateRunId } from "../helpers.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const testColors: ThemeColors = {
  primary: "cyan",
  secondary: "#7b61ff",
  muted: "#6b7280",
  error: "#ef4444",
  warning: "#f59e0b",
  success: "#22c55e",
  foreground: "#e5e7eb",
  background: "#0a0a0f",
  border: "#374151",
  toolCall: "#a78bfa",
  subagent: "#38bdf8",
};

function makeStatus(
  overrides: Partial<OrchestrationStatus> = {}
): OrchestrationStatus {
  return {
    runId: "run-abc-def-ghi-jkl",
    iteration: 3,
    phase: "executing",
    totalEffects: 10,
    pendingEffects: 4,
    resolvedEffects: 6,
    elapsedMs: 45000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatElapsed
// ---------------------------------------------------------------------------

describe("formatElapsed", () => {
  it("formats milliseconds below 1 second", () => {
    expect(formatElapsed(500)).toBe("500ms");
  });

  it("formats exactly 1 second", () => {
    expect(formatElapsed(1000)).toBe("1s");
  });

  it("formats seconds below 1 minute", () => {
    expect(formatElapsed(45000)).toBe("45s");
  });

  it("formats minutes with remaining seconds", () => {
    expect(formatElapsed(90000)).toBe("1m30s");
  });

  it("formats exact minutes", () => {
    expect(formatElapsed(120000)).toBe("2m0s");
  });

  it("formats hours with remaining minutes", () => {
    expect(formatElapsed(3660000)).toBe("1h1m");
  });

  it("formats 0ms", () => {
    expect(formatElapsed(0)).toBe("0ms");
  });
});

// ---------------------------------------------------------------------------
// phaseToColorKey
// ---------------------------------------------------------------------------

describe("phaseToColorKey", () => {
  it("maps complete to success", () => {
    expect(phaseToColorKey("complete")).toBe("success");
  });

  it("maps failed to error", () => {
    expect(phaseToColorKey("failed")).toBe("error");
  });

  it("maps waiting to warning", () => {
    expect(phaseToColorKey("waiting")).toBe("warning");
  });

  it("maps executing to primary", () => {
    expect(phaseToColorKey("executing")).toBe("primary");
  });

  it("maps planning to primary", () => {
    expect(phaseToColorKey("planning")).toBe("primary");
  });

  it("maps verifying to primary", () => {
    expect(phaseToColorKey("verifying")).toBe("primary");
  });
});

// ---------------------------------------------------------------------------
// formatCostForStatus
// ---------------------------------------------------------------------------

describe("formatCostForStatus", () => {
  it("formats sub-dollar costs with 4 decimal places", () => {
    expect(formatCostForStatus(0.0523)).toBe("$0.0523");
  });

  it("formats costs >= $1 with 2 decimal places", () => {
    expect(formatCostForStatus(1.5)).toBe("$1.50");
  });

  it("formats zero cost", () => {
    expect(formatCostForStatus(0)).toBe("$0.0000");
  });

  it("formats exactly $1", () => {
    expect(formatCostForStatus(1)).toBe("$1.00");
  });

  it("formats large costs with 2 decimal places", () => {
    expect(formatCostForStatus(10.123)).toBe("$10.12");
  });
});

// ---------------------------------------------------------------------------
// formatStatusSegments
// ---------------------------------------------------------------------------

describe("formatStatusSegments", () => {
  describe("mandatory segments", () => {
    it("returns at least 5 segments for a minimal status", () => {
      const segments = formatStatusSegments(makeStatus(), testColors);
      expect(segments.length).toBeGreaterThanOrEqual(5);
    });

    it("first segment is the phase in uppercase and bold", () => {
      const segments = formatStatusSegments(makeStatus(), testColors);
      expect(segments[0].text).toBe("EXECUTING");
      expect(segments[0].bold).toBe(true);
    });

    it("second segment is truncated runId", () => {
      const segments = formatStatusSegments(makeStatus(), testColors);
      expect(segments[1].text).toBe("run-abc-def-");
      expect(segments[1].colorKey).toBe("muted");
    });

    it("third segment shows iteration", () => {
      const segments = formatStatusSegments(
        makeStatus({ iteration: 7 }),
        testColors
      );
      expect(segments[2].text).toBe("iter:7");
    });

    it("fourth segment shows effects summary", () => {
      const segments = formatStatusSegments(makeStatus(), testColors);
      expect(segments[3].text).toBe("effects:6/10");
    });

    it("effects segment uses warning color when pending > 0", () => {
      const segments = formatStatusSegments(
        makeStatus({ pendingEffects: 3 }),
        testColors
      );
      expect(segments[3].colorKey).toBe("warning");
    });

    it("effects segment uses success color when all resolved", () => {
      const segments = formatStatusSegments(
        makeStatus({
          totalEffects: 10,
          pendingEffects: 0,
          resolvedEffects: 10,
        }),
        testColors
      );
      expect(segments[3].colorKey).toBe("success");
    });

    it("fifth segment shows elapsed time", () => {
      const segments = formatStatusSegments(
        makeStatus({ elapsedMs: 45000 }),
        testColors
      );
      expect(segments[4].text).toBe("45s");
      expect(segments[4].colorKey).toBe("muted");
    });
  });

  describe("phase color mapping", () => {
    it("complete phase uses success color key", () => {
      const segments = formatStatusSegments(
        makeStatus({ phase: "complete" }),
        testColors
      );
      expect(segments[0].colorKey).toBe("success");
    });

    it("failed phase uses error color key", () => {
      const segments = formatStatusSegments(
        makeStatus({ phase: "failed" }),
        testColors
      );
      expect(segments[0].colorKey).toBe("error");
    });

    it("waiting phase uses warning color key", () => {
      const segments = formatStatusSegments(
        makeStatus({ phase: "waiting" }),
        testColors
      );
      expect(segments[0].colorKey).toBe("warning");
    });

    it("executing phase uses primary color key", () => {
      const segments = formatStatusSegments(
        makeStatus({ phase: "executing" }),
        testColors
      );
      expect(segments[0].colorKey).toBe("primary");
    });
  });

  describe("optional tokenUsage segment", () => {
    it("includes token segment when tokenUsage is provided", () => {
      const segments = formatStatusSegments(
        makeStatus({
          tokenUsage: { input: 1000, output: 500, total: 1500 },
        }),
        testColors
      );
      const tokenSegment = segments.find((s) => s.text.startsWith("tokens:"));
      expect(tokenSegment).toBeDefined();
      expect(tokenSegment!.text).toBe("tokens:1500");
    });

    it("does not include token segment when tokenUsage is absent", () => {
      const segments = formatStatusSegments(makeStatus(), testColors);
      const tokenSegment = segments.find((s) => s.text.startsWith("tokens:"));
      expect(tokenSegment).toBeUndefined();
    });
  });

  describe("optional cost segment", () => {
    it("includes cost segment when cost is provided", () => {
      const segments = formatStatusSegments(
        makeStatus({ cost: 0.0523 }),
        testColors
      );
      const costSegment = segments.find((s) => s.text.startsWith("$"));
      expect(costSegment).toBeDefined();
      expect(costSegment!.text).toBe("$0.0523");
    });

    it("formats cost >= $1 with 2 decimal places", () => {
      const segments = formatStatusSegments(
        makeStatus({ cost: 1.5 }),
        testColors
      );
      const costSegment = segments.find((s) => s.text.startsWith("$"));
      expect(costSegment!.text).toBe("$1.50");
    });

    it("does not include cost segment when cost is absent", () => {
      const segments = formatStatusSegments(makeStatus(), testColors);
      const costSegment = segments.find((s) => s.text.startsWith("$"));
      expect(costSegment).toBeUndefined();
    });
  });

  describe("all segments have required fields", () => {
    it("every segment has non-empty text and colorKey", () => {
      const segments = formatStatusSegments(
        makeStatus({
          tokenUsage: { input: 100, output: 50, total: 150 },
          cost: 0.05,
        }),
        testColors
      );
      for (const seg of segments) {
        expect(seg.text.length).toBeGreaterThan(0);
        expect(seg.colorKey.length).toBeGreaterThan(0);
      }
    });
  });
});
