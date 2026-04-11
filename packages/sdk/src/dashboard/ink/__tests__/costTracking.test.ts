/**
 * costTracking.test.ts
 *
 * Tests for cost tracking pure functions in helpers.ts:
 * formatCostRate, estimateRemainingCost, formatCostSummary.
 */

import { describe, it, expect } from "vitest";
import {
  formatCostRate,
  estimateRemainingCost,
  formatCostSummary,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// formatCostRate
// ---------------------------------------------------------------------------

describe("formatCostRate", () => {
  it("computes cost per minute", () => {
    // $0.60 over 2 minutes = $0.30/min
    expect(formatCostRate(0.6, 120_000)).toBe("$0.3000/min");
  });

  it("returns $0.0000/min for zero elapsed", () => {
    expect(formatCostRate(1.0, 0)).toBe("$0.0000/min");
  });

  it("returns $0.0000/min for zero cost", () => {
    expect(formatCostRate(0, 60_000)).toBe("$0.0000/min");
  });

  it("formats rates >= $1/min with 2 decimals", () => {
    // $2.00 over 1 minute = $2.00/min
    expect(formatCostRate(2.0, 60_000)).toBe("$2.00/min");
  });

  it("handles negative elapsed gracefully", () => {
    expect(formatCostRate(1.0, -1000)).toBe("$0.0000/min");
  });
});

// ---------------------------------------------------------------------------
// estimateRemainingCost
// ---------------------------------------------------------------------------

describe("estimateRemainingCost", () => {
  it("extrapolates remaining cost from current rate and progress", () => {
    // $1.00 spent, 50% complete → $1.00 remaining
    const result = estimateRemainingCost(1.0, 0.5);
    expect(result).toBeCloseTo(1.0, 2);
  });

  it("returns 0 when progress is 100%", () => {
    expect(estimateRemainingCost(1.0, 1.0)).toBe(0);
  });

  it("returns 0 when cost is 0", () => {
    expect(estimateRemainingCost(0, 0.5)).toBe(0);
  });

  it("returns 0 when progress is 0 (no data to extrapolate)", () => {
    expect(estimateRemainingCost(1.0, 0)).toBe(0);
  });

  it("handles 75% progress correctly", () => {
    // $3.00 spent at 75% → total projected $4.00 → $1.00 remaining
    const result = estimateRemainingCost(3.0, 0.75);
    expect(result).toBeCloseTo(1.0, 2);
  });

  it("clamps progress to [0, 1]", () => {
    // Progress > 1 should be treated as 1.0 (complete)
    expect(estimateRemainingCost(1.0, 1.5)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatCostSummary
// ---------------------------------------------------------------------------

describe("formatCostSummary", () => {
  it("returns a structured cost summary", () => {
    const result = formatCostSummary({
      currentCost: 0.5,
      elapsedMs: 120_000,
      progress: 0.5,
    });
    expect(result.currentCost).toBe("$0.5000");
    expect(result.rate).toContain("/min");
    expect(result.estimatedTotal).toBeDefined();
    expect(result.estimatedRemaining).toBeDefined();
  });

  it("handles zero progress", () => {
    const result = formatCostSummary({
      currentCost: 0.1,
      elapsedMs: 60_000,
      progress: 0,
    });
    expect(result.currentCost).toBe("$0.1000");
    expect(result.estimatedRemaining).toBe("$0.0000");
  });

  it("handles complete progress", () => {
    const result = formatCostSummary({
      currentCost: 2.5,
      elapsedMs: 300_000,
      progress: 1.0,
    });
    expect(result.currentCost).toBe("$2.50");
    expect(result.estimatedRemaining).toBe("$0.0000");
  });
});
