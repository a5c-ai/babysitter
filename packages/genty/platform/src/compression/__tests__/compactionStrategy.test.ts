/**
 * GAP-PERF-002: Compaction Strategy tests.
 */

import { describe, it, expect } from "vitest";
import {
  getCompressionTarget,
  shouldAutoCompact,
  type CompactionStrategyLevel,
  type CompactionMetrics,
} from "../compactionStrategy";

// ---------------------------------------------------------------------------
// getCompressionTarget
// ---------------------------------------------------------------------------

describe("getCompressionTarget", () => {
  it("returns 0.3 for aggressive strategy", () => {
    expect(getCompressionTarget("aggressive")).toBe(0.3);
  });

  it("returns 0.5 for balanced strategy", () => {
    expect(getCompressionTarget("balanced")).toBe(0.5);
  });

  it("returns 0.7 for conservative strategy", () => {
    expect(getCompressionTarget("conservative")).toBe(0.7);
  });

  it("aggressive < balanced < conservative", () => {
    const aggressive = getCompressionTarget("aggressive");
    const balanced = getCompressionTarget("balanced");
    const conservative = getCompressionTarget("conservative");
    expect(aggressive).toBeLessThan(balanced);
    expect(balanced).toBeLessThan(conservative);
  });
});

// ---------------------------------------------------------------------------
// shouldAutoCompact
// ---------------------------------------------------------------------------

describe("shouldAutoCompact", () => {
  // -- Aggressive strategy thresholds: messageCount=20, tokenEstimate=40_000 --

  it("triggers for aggressive when message count exceeds threshold", () => {
    expect(shouldAutoCompact(20, 0, "aggressive")).toBe(true);
    expect(shouldAutoCompact(25, 0, "aggressive")).toBe(true);
  });

  it("triggers for aggressive when token estimate exceeds threshold", () => {
    expect(shouldAutoCompact(0, 40_000, "aggressive")).toBe(true);
    expect(shouldAutoCompact(0, 50_000, "aggressive")).toBe(true);
  });

  it("does not trigger for aggressive below both thresholds", () => {
    expect(shouldAutoCompact(10, 20_000, "aggressive")).toBe(false);
    expect(shouldAutoCompact(19, 39_999, "aggressive")).toBe(false);
  });

  // -- Balanced strategy thresholds: messageCount=50, tokenEstimate=80_000 --

  it("triggers for balanced when message count exceeds threshold", () => {
    expect(shouldAutoCompact(50, 0, "balanced")).toBe(true);
  });

  it("triggers for balanced when token estimate exceeds threshold", () => {
    expect(shouldAutoCompact(0, 80_000, "balanced")).toBe(true);
  });

  it("does not trigger for balanced below both thresholds", () => {
    expect(shouldAutoCompact(30, 50_000, "balanced")).toBe(false);
  });

  // -- Conservative strategy thresholds: messageCount=100, tokenEstimate=120_000 --

  it("triggers for conservative when message count exceeds threshold", () => {
    expect(shouldAutoCompact(100, 0, "conservative")).toBe(true);
  });

  it("triggers for conservative when token estimate exceeds threshold", () => {
    expect(shouldAutoCompact(0, 120_000, "conservative")).toBe(true);
  });

  it("does not trigger for conservative below both thresholds", () => {
    expect(shouldAutoCompact(50, 100_000, "conservative")).toBe(false);
  });

  // -- Edge cases --

  it("aggressive triggers earlier than balanced and conservative", () => {
    // At 25 messages and 0 tokens: aggressive triggers, others don't
    expect(shouldAutoCompact(25, 0, "aggressive")).toBe(true);
    expect(shouldAutoCompact(25, 0, "balanced")).toBe(false);
    expect(shouldAutoCompact(25, 0, "conservative")).toBe(false);
  });

  it("triggers when exactly at threshold boundary", () => {
    expect(shouldAutoCompact(20, 0, "aggressive")).toBe(true);
    expect(shouldAutoCompact(0, 40_000, "aggressive")).toBe(true);
  });

  it("handles zero values", () => {
    expect(shouldAutoCompact(0, 0, "aggressive")).toBe(false);
    expect(shouldAutoCompact(0, 0, "balanced")).toBe(false);
    expect(shouldAutoCompact(0, 0, "conservative")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CompactionMetrics type validation
// ---------------------------------------------------------------------------

describe("CompactionMetrics", () => {
  it("satisfies the type shape", () => {
    const metrics: CompactionMetrics = {
      inputTokens: 10_000,
      outputTokens: 5_000,
      compressionRatio: 0.5,
      durationMs: 150,
    };
    expect(metrics.inputTokens).toBe(10_000);
    expect(metrics.outputTokens).toBe(5_000);
    expect(metrics.compressionRatio).toBe(0.5);
    expect(metrics.durationMs).toBe(150);
  });
});
