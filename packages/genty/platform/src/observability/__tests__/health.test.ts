/**
 * GAP-STATE-008: Run Health Model tests.
 *
 * Tests for computeRunHealth / computeRunHealthFromEvents which read journal
 * events and produce a RunHealthSnapshot with status, metrics, and issues.
 */

import { describe, it, expect } from "vitest";
import { computeRunHealthFromEvents } from "../health";
import type { RunHealthSnapshot, RunHealthStatus, HealthConfig } from "../types";
import type { JournalEvent } from "../../storage/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  seq: number,
  type: string,
  recordedAt: string,
  data: Record<string, unknown> = {},
): JournalEvent {
  return {
    seq,
    ulid: `ULID${seq.toString().padStart(6, "0")}`,
    filename: `${seq.toString().padStart(6, "0")}.ULID${seq.toString().padStart(6, "0")}.json`,
    path: `/fake/journal/${seq.toString().padStart(6, "0")}.json`,
    type,
    recordedAt,
    data,
  };
}

/** Shorthand ISO date helper: "2026-01-01T00:00:00Z" + offsetMs */
function t(offsetMs: number): string {
  return new Date(Date.UTC(2026, 0, 1) + offsetMs).toISOString();
}

const ONE_MINUTE = 60_000;
const FIVE_MINUTES = 300_000;
const TEN_MINUTES = 600_000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("computeRunHealthFromEvents (GAP-STATE-008)", () => {
  // ---- 1. Healthy run ----
  it("returns 'healthy' for a run with completed effects and no issues", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", t(2 * ONE_MINUTE), { effectId: "e1", status: "ok" }),
      makeEvent(4, "RUN_COMPLETED", t(3 * ONE_MINUTE)),
    ];

    const snapshot = computeRunHealthFromEvents(events);

    expect(snapshot.status).toBe("healthy" satisfies RunHealthStatus);
    expect(snapshot.issues).toHaveLength(0);
    expect(snapshot.metrics.totalEffects).toBe(1);
    expect(snapshot.metrics.resolvedEffects).toBe(1);
    expect(snapshot.metrics.failedEffects).toBe(0);
    expect(snapshot.metrics.pendingCount).toBe(0);
    expect(snapshot.computedAt).toBeDefined();
  });

  // ---- 2. Stuck run (last activity exceeds stuckThresholdMs) ----
  it("returns 'stuck' when last activity exceeds stuckThresholdMs", () => {
    const now = Date.now();
    const longAgo = new Date(now - TEN_MINUTES).toISOString();
    const events = [
      makeEvent(1, "RUN_CREATED", longAgo),
      makeEvent(2, "EFFECT_REQUESTED", longAgo, { effectId: "e1" }),
    ];

    // Default stuckThresholdMs is 300_000 (5 min). longAgo is 10 min ago.
    const snapshot = computeRunHealthFromEvents(events, { now });

    expect(snapshot.status).toBe("stuck" satisfies RunHealthStatus);
    expect(snapshot.issues.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.issues.some((i) => /stuck/i.test(i))).toBe(true);
  });

  // ---- 3. Degraded (error rate exceeds degradedErrorRate but below failedErrorRate) ----
  it("returns 'degraded' when error rate exceeds degradedErrorRate threshold", () => {
    // 2 out of 5 effects failed = 0.4 error rate, above default 0.3
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", t(2 * ONE_MINUTE), { effectId: "e1", status: "ok" }),
      makeEvent(4, "EFFECT_REQUESTED", t(3 * ONE_MINUTE), { effectId: "e2" }),
      makeEvent(5, "EFFECT_RESOLVED", t(4 * ONE_MINUTE), { effectId: "e2", status: "error" }),
      makeEvent(6, "EFFECT_REQUESTED", t(5 * ONE_MINUTE), { effectId: "e3" }),
      makeEvent(7, "EFFECT_RESOLVED", t(6 * ONE_MINUTE), { effectId: "e3", status: "ok" }),
      makeEvent(8, "EFFECT_REQUESTED", t(7 * ONE_MINUTE), { effectId: "e4" }),
      makeEvent(9, "EFFECT_RESOLVED", t(8 * ONE_MINUTE), { effectId: "e4", status: "error" }),
      makeEvent(10, "EFFECT_REQUESTED", t(9 * ONE_MINUTE), { effectId: "e5" }),
      makeEvent(11, "EFFECT_RESOLVED", t(10 * ONE_MINUTE), { effectId: "e5", status: "ok" }),
    ];

    const snapshot = computeRunHealthFromEvents(events);

    expect(snapshot.status).toBe("degraded" satisfies RunHealthStatus);
    expect(snapshot.metrics.errorRate).toBeCloseTo(0.4, 2);
    expect(snapshot.metrics.failedEffects).toBe(2);
    expect(snapshot.issues.length).toBeGreaterThanOrEqual(1);
  });

  // ---- 4. Failed when RUN_FAILED event is present ----
  it("returns 'failed' when RUN_FAILED event is present", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "RUN_FAILED", t(2 * ONE_MINUTE), { error: "Process crashed" }),
    ];

    const snapshot = computeRunHealthFromEvents(events);

    expect(snapshot.status).toBe("failed" satisfies RunHealthStatus);
    expect(snapshot.issues.some((i) => /failed/i.test(i))).toBe(true);
  });

  // ---- 5. Failed when error rate exceeds failedErrorRate ----
  it("returns 'failed' when error rate exceeds failedErrorRate threshold", () => {
    // 3 out of 4 effects failed = 0.75 error rate, above default 0.7
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", t(2 * ONE_MINUTE), { effectId: "e1", status: "error" }),
      makeEvent(4, "EFFECT_REQUESTED", t(3 * ONE_MINUTE), { effectId: "e2" }),
      makeEvent(5, "EFFECT_RESOLVED", t(4 * ONE_MINUTE), { effectId: "e2", status: "error" }),
      makeEvent(6, "EFFECT_REQUESTED", t(5 * ONE_MINUTE), { effectId: "e3" }),
      makeEvent(7, "EFFECT_RESOLVED", t(6 * ONE_MINUTE), { effectId: "e3", status: "error" }),
      makeEvent(8, "EFFECT_REQUESTED", t(7 * ONE_MINUTE), { effectId: "e4" }),
      makeEvent(9, "EFFECT_RESOLVED", t(8 * ONE_MINUTE), { effectId: "e4", status: "ok" }),
    ];

    const snapshot = computeRunHealthFromEvents(events);

    expect(snapshot.status).toBe("failed" satisfies RunHealthStatus);
    expect(snapshot.metrics.errorRate).toBeCloseTo(0.75, 2);
  });

  // ---- 6. Correctly computes avgEffectLatencyMs ----
  it("correctly computes avgEffectLatencyMs from requested-to-resolved pairs", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      // Effect 1: 1 min latency
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", t(2 * ONE_MINUTE), { effectId: "e1", status: "ok" }),
      // Effect 2: 3 min latency
      makeEvent(4, "EFFECT_REQUESTED", t(3 * ONE_MINUTE), { effectId: "e2" }),
      makeEvent(5, "EFFECT_RESOLVED", t(6 * ONE_MINUTE), { effectId: "e2", status: "ok" }),
    ];

    const snapshot = computeRunHealthFromEvents(events);

    // Average of 60_000 and 180_000 = 120_000
    expect(snapshot.metrics.avgEffectLatencyMs).toBe(120_000);
    expect(snapshot.metrics.resolvedEffects).toBe(2);
  });

  // ---- 7. Tracks oldest pending effect age ----
  it("tracks oldest pending effect age for unresolved effects", () => {
    const now = Date.now();
    const fiveMinAgo = new Date(now - FIVE_MINUTES).toISOString();
    const twoMinAgo = new Date(now - 2 * ONE_MINUTE).toISOString();
    const events = [
      makeEvent(1, "RUN_CREATED", fiveMinAgo),
      makeEvent(2, "EFFECT_REQUESTED", fiveMinAgo, { effectId: "e1" }),
      makeEvent(3, "EFFECT_REQUESTED", twoMinAgo, { effectId: "e2" }),
    ];

    const snapshot = computeRunHealthFromEvents(events, { now });

    expect(snapshot.metrics.pendingCount).toBe(2);
    // Oldest pending is ~5 min old
    expect(snapshot.metrics.oldestPendingAgeMs).toBeGreaterThanOrEqual(FIVE_MINUTES - 1000);
    expect(snapshot.metrics.oldestPendingAgeMs).toBeLessThanOrEqual(FIVE_MINUTES + 5000);
  });

  // ---- 8. Empty journal ----
  it("handles empty journal gracefully", () => {
    const snapshot = computeRunHealthFromEvents([]);

    expect(snapshot.status).toBe("healthy" satisfies RunHealthStatus);
    expect(snapshot.metrics.totalEffects).toBe(0);
    expect(snapshot.metrics.resolvedEffects).toBe(0);
    expect(snapshot.metrics.failedEffects).toBe(0);
    expect(snapshot.metrics.pendingCount).toBe(0);
    expect(snapshot.metrics.errorRate).toBe(0);
    expect(snapshot.metrics.avgEffectLatencyMs).toBe(0);
    expect(snapshot.metrics.oldestPendingAgeMs).toBe(0);
    expect(snapshot.metrics.iterationCount).toBe(0);
    expect(snapshot.metrics.lastActivityAt).toBeNull();
    expect(snapshot.issues).toHaveLength(0);
  });

  // ---- 9. Run with only RUN_CREATED event ----
  it("handles run with only RUN_CREATED event", () => {
    const events = [makeEvent(1, "RUN_CREATED", t(0))];

    const snapshot = computeRunHealthFromEvents(events);

    expect(snapshot.status).toBe("healthy" satisfies RunHealthStatus);
    expect(snapshot.metrics.totalEffects).toBe(0);
    expect(snapshot.metrics.iterationCount).toBe(0);
    expect(snapshot.metrics.lastActivityAt).toBe(t(0));
    expect(snapshot.issues).toHaveLength(0);
  });

  // ---- 10. Generates issues for each problem ----
  it("generates descriptive issues for each detected problem", () => {
    const now = Date.now();
    const longAgo = new Date(now - TEN_MINUTES).toISOString();
    const events = [
      makeEvent(1, "RUN_CREATED", longAgo),
      makeEvent(2, "EFFECT_REQUESTED", longAgo, { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", longAgo, { effectId: "e1", status: "error" }),
      makeEvent(4, "EFFECT_REQUESTED", longAgo, { effectId: "e2" }),
      // e2 is pending for 10 min, exceeding maxPendingAge (default 600_000)
    ];

    const snapshot = computeRunHealthFromEvents(events, { now });

    // Should have issues about: stuck (no activity for >5 min), high error rate, and possibly old pending
    expect(snapshot.issues.length).toBeGreaterThanOrEqual(1);
    // Each issue should be a non-empty string
    for (const issue of snapshot.issues) {
      expect(typeof issue).toBe("string");
      expect(issue.length).toBeGreaterThan(0);
    }
  });

  // ---- 11. Respects custom HealthConfig ----
  it("respects custom HealthConfig thresholds", () => {
    // With very lenient thresholds, a high error rate should still be healthy
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", t(2 * ONE_MINUTE), { effectId: "e1", status: "error" }),
      makeEvent(4, "EFFECT_REQUESTED", t(3 * ONE_MINUTE), { effectId: "e2" }),
      makeEvent(5, "EFFECT_RESOLVED", t(4 * ONE_MINUTE), { effectId: "e2", status: "ok" }),
    ];

    const lenientConfig: HealthConfig = {
      stuckThresholdMs: 999_999_999,
      degradedErrorRate: 0.9,
      failedErrorRate: 0.99,
      maxPendingAge: 999_999_999,
    };

    const snapshot = computeRunHealthFromEvents(events, { config: lenientConfig });

    // 50% error rate is below lenient 0.9 threshold
    expect(snapshot.status).toBe("healthy" satisfies RunHealthStatus);
    expect(snapshot.metrics.errorRate).toBeCloseTo(0.5, 2);
  });

  it("respects strict custom HealthConfig thresholds", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", t(2 * ONE_MINUTE), { effectId: "e1", status: "ok" }),
      makeEvent(4, "EFFECT_REQUESTED", t(3 * ONE_MINUTE), { effectId: "e2" }),
      makeEvent(5, "EFFECT_RESOLVED", t(4 * ONE_MINUTE), { effectId: "e2", status: "error" }),
    ];

    const strictConfig: HealthConfig = {
      stuckThresholdMs: 1_000,
      degradedErrorRate: 0.1,
      failedErrorRate: 0.4,
      maxPendingAge: 1_000,
    };

    const snapshot = computeRunHealthFromEvents(events, { config: strictConfig });

    // 50% error rate exceeds strict failedErrorRate of 0.4
    expect(snapshot.status).toBe("failed" satisfies RunHealthStatus);
  });

  // ---- 12. Handles multiple iterations ----
  it("counts iterations from EFFECT_REQUESTED/EFFECT_RESOLVED cycles", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1", iteration: 1 }),
      makeEvent(3, "EFFECT_RESOLVED", t(2 * ONE_MINUTE), { effectId: "e1", status: "ok" }),
      makeEvent(4, "EFFECT_REQUESTED", t(3 * ONE_MINUTE), { effectId: "e2", iteration: 2 }),
      makeEvent(5, "EFFECT_RESOLVED", t(4 * ONE_MINUTE), { effectId: "e2", status: "ok" }),
      makeEvent(6, "EFFECT_REQUESTED", t(5 * ONE_MINUTE), { effectId: "e3", iteration: 3 }),
      makeEvent(7, "EFFECT_RESOLVED", t(6 * ONE_MINUTE), { effectId: "e3", status: "ok" }),
      makeEvent(8, "RUN_COMPLETED", t(7 * ONE_MINUTE)),
    ];

    const snapshot = computeRunHealthFromEvents(events);

    expect(snapshot.metrics.iterationCount).toBe(3);
    expect(snapshot.metrics.totalEffects).toBe(3);
    expect(snapshot.metrics.resolvedEffects).toBe(3);
  });

  // ---- 13. lastActivityAt is the most recent event timestamp ----
  it("sets lastActivityAt to the most recent event timestamp", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", t(5 * ONE_MINUTE), { effectId: "e1", status: "ok" }),
    ];

    const snapshot = computeRunHealthFromEvents(events);

    expect(snapshot.metrics.lastActivityAt).toBe(t(5 * ONE_MINUTE));
  });

  // ---- 14. Snapshot shape validation ----
  it("returns a RunHealthSnapshot with all required fields", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", t(2 * ONE_MINUTE), { effectId: "e1", status: "ok" }),
    ];

    const snapshot: RunHealthSnapshot = computeRunHealthFromEvents(events);

    // Status
    expect(["healthy", "degraded", "stuck", "failed"]).toContain(snapshot.status);

    // Metrics shape
    expect(typeof snapshot.metrics.errorRate).toBe("number");
    expect(typeof snapshot.metrics.avgEffectLatencyMs).toBe("number");
    expect(typeof snapshot.metrics.pendingCount).toBe("number");
    expect(typeof snapshot.metrics.oldestPendingAgeMs).toBe("number");
    expect(typeof snapshot.metrics.iterationCount).toBe("number");
    expect(typeof snapshot.metrics.totalEffects).toBe("number");
    expect(typeof snapshot.metrics.resolvedEffects).toBe("number");
    expect(typeof snapshot.metrics.failedEffects).toBe("number");

    // Issues
    expect(Array.isArray(snapshot.issues)).toBe(true);

    // computedAt
    expect(typeof snapshot.computedAt).toBe("string");
  });

  // ---- 15. Pending effect exceeding maxPendingAge generates issue ----
  it("generates issue when pending effect exceeds maxPendingAge", () => {
    const now = Date.now();
    const elevenMinAgo = new Date(now - 11 * ONE_MINUTE).toISOString();
    const events = [
      makeEvent(1, "RUN_CREATED", elevenMinAgo),
      makeEvent(2, "EFFECT_REQUESTED", elevenMinAgo, { effectId: "e1" }),
    ];

    const snapshot = computeRunHealthFromEvents(events, { now });

    // Default maxPendingAge is 600_000 (10 min). Effect is 11 min old.
    expect(snapshot.issues.some((i) => /pending/i.test(i) || /age/i.test(i))).toBe(true);
  });

  // ---- 16. Mixed resolved and pending effects ----
  it("correctly handles mix of resolved and pending effects", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", t(0)),
      makeEvent(2, "EFFECT_REQUESTED", t(ONE_MINUTE), { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", t(2 * ONE_MINUTE), { effectId: "e1", status: "ok" }),
      makeEvent(4, "EFFECT_REQUESTED", t(3 * ONE_MINUTE), { effectId: "e2" }),
      makeEvent(5, "EFFECT_RESOLVED", t(4 * ONE_MINUTE), { effectId: "e2", status: "ok" }),
      makeEvent(6, "EFFECT_REQUESTED", t(5 * ONE_MINUTE), { effectId: "e3" }),
      // e3 remains pending
    ];

    const snapshot = computeRunHealthFromEvents(events);

    expect(snapshot.metrics.totalEffects).toBe(3);
    expect(snapshot.metrics.resolvedEffects).toBe(2);
    expect(snapshot.metrics.pendingCount).toBe(1);
  });
});
