/**
 * statusBarComponentHelpers.test.ts
 *
 * Tests for pure helper functions exported from StatusBar.tsx:
 * formatTokenCount, statusToIndicator, statusToColor.
 */

import { describe, it, expect } from "vitest";
import {
  formatTokenCount,
  statusToIndicator,
  statusToColor,
} from "../components/StatusBar.js";
import type { RunStatus } from "../types.js";

// ---------------------------------------------------------------------------
// formatTokenCount
// ---------------------------------------------------------------------------

describe("formatTokenCount", () => {
  it("formats numbers below 1000 as plain number", () => {
    expect(formatTokenCount(0)).toBe("0");
    expect(formatTokenCount(999)).toBe("999");
  });

  it("formats thousands as Xk with one decimal", () => {
    expect(formatTokenCount(1000)).toBe("1.0k");
    expect(formatTokenCount(1500)).toBe("1.5k");
    expect(formatTokenCount(999999)).toBe("1000.0k");
  });

  it("formats millions as XM with one decimal", () => {
    expect(formatTokenCount(1_000_000)).toBe("1.0M");
    expect(formatTokenCount(2_500_000)).toBe("2.5M");
  });
});

// ---------------------------------------------------------------------------
// statusToIndicator
// ---------------------------------------------------------------------------

describe("statusToIndicator", () => {
  const statuses: RunStatus[] = ["running", "waiting_effect", "complete", "failed", "idle"];

  it("returns a string for every RunStatus", () => {
    for (const status of statuses) {
      const result = statusToIndicator(status);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("returns filled circle for running", () => {
    expect(statusToIndicator("running")).toBe("●");
  });

  it("returns open circle for waiting_effect", () => {
    expect(statusToIndicator("waiting_effect")).toBe("◌");
  });

  it("returns checkmark for complete", () => {
    expect(statusToIndicator("complete")).toBe("✓");
  });

  it("returns cross for failed", () => {
    expect(statusToIndicator("failed")).toBe("✗");
  });

  it("returns dot for idle", () => {
    expect(statusToIndicator("idle")).toBe("·");
  });
});

// ---------------------------------------------------------------------------
// statusToColor
// ---------------------------------------------------------------------------

describe("statusToColor", () => {
  const colors = {
    primary: "cyan",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    muted: "#6b7280",
  };

  it("returns primary for running", () => {
    expect(statusToColor("running", colors)).toBe(colors.primary);
  });

  it("returns warning for waiting_effect", () => {
    expect(statusToColor("waiting_effect", colors)).toBe(colors.warning);
  });

  it("returns success for complete", () => {
    expect(statusToColor("complete", colors)).toBe(colors.success);
  });

  it("returns error for failed", () => {
    expect(statusToColor("failed", colors)).toBe(colors.error);
  });

  it("returns muted for idle", () => {
    expect(statusToColor("idle", colors)).toBe(colors.muted);
  });
});
