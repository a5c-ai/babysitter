import { describe, expect, it } from "vitest";
import { computeRunHealthFromEvents } from "../health";
import type { JournalEvent } from "@a5c-ai/babysitter-sdk";

function event(
  seq: number,
  type: string,
  recordedAt: string,
  data: Record<string, unknown> = {},
): JournalEvent {
  return {
    seq,
    ulid: `01TEST${seq}`,
    type,
    recordedAt,
    data,
  } as JournalEvent;
}

function t(ms: number): string {
  return new Date(Date.UTC(2026, 0, 1, 0, 0, 0, ms)).toISOString();
}

describe("computeRunHealthFromEvents latency percentiles", () => {
  it("returns zero average and percentiles when no effects resolved", () => {
    const snapshot = computeRunHealthFromEvents([]);

    expect(snapshot.metrics.avgEffectLatencyMs).toBe(0);
    expect(snapshot.metrics.p50EffectLatencyMs).toBe(0);
    expect(snapshot.metrics.p95EffectLatencyMs).toBe(0);
    expect(snapshot.metrics.p99EffectLatencyMs).toBe(0);
  });

  it("uses a single resolved effect latency for avg, p50, p95, and p99", () => {
    const snapshot = computeRunHealthFromEvents([
      event(1, "EFFECT_REQUESTED", t(0), { effectId: "e1" }),
      event(2, "EFFECT_RESOLVED", t(250), { effectId: "e1", status: "ok" }),
    ]);

    expect(snapshot.metrics.avgEffectLatencyMs).toBe(250);
    expect(snapshot.metrics.p50EffectLatencyMs).toBe(250);
    expect(snapshot.metrics.p95EffectLatencyMs).toBe(250);
    expect(snapshot.metrics.p99EffectLatencyMs).toBe(250);
  });

  it("computes deterministic nearest-rank percentiles for ordered latencies", () => {
    const snapshot = computeRunHealthFromEvents([
      event(1, "EFFECT_REQUESTED", t(0), { effectId: "e1" }),
      event(2, "EFFECT_RESOLVED", t(100), { effectId: "e1", status: "ok" }),
      event(3, "EFFECT_REQUESTED", t(1000), { effectId: "e2" }),
      event(4, "EFFECT_RESOLVED", t(1200), { effectId: "e2", status: "ok" }),
      event(5, "EFFECT_REQUESTED", t(2000), { effectId: "e3" }),
      event(6, "EFFECT_RESOLVED", t(2300), { effectId: "e3", status: "ok" }),
      event(7, "EFFECT_REQUESTED", t(3000), { effectId: "e4" }),
      event(8, "EFFECT_RESOLVED", t(3400), { effectId: "e4", status: "ok" }),
    ]);

    expect(snapshot.metrics.avgEffectLatencyMs).toBe(250);
    expect(snapshot.metrics.p50EffectLatencyMs).toBe(200);
    expect(snapshot.metrics.p95EffectLatencyMs).toBe(400);
    expect(snapshot.metrics.p99EffectLatencyMs).toBe(400);
  });

  it("sorts unordered latency samples before computing percentiles", () => {
    const snapshot = computeRunHealthFromEvents([
      event(1, "EFFECT_REQUESTED", t(3000), { effectId: "slow" }),
      event(2, "EFFECT_REQUESTED", t(0), { effectId: "fast" }),
      event(3, "EFFECT_RESOLVED", t(3400), { effectId: "slow", status: "ok" }),
      event(4, "EFFECT_RESOLVED", t(100), { effectId: "fast", status: "ok" }),
      event(5, "EFFECT_REQUESTED", t(1000), { effectId: "mid" }),
      event(6, "EFFECT_RESOLVED", t(1200), { effectId: "mid", status: "ok" }),
    ]);

    expect(snapshot.metrics.avgEffectLatencyMs).toBe(233);
    expect(snapshot.metrics.p50EffectLatencyMs).toBe(200);
    expect(snapshot.metrics.p95EffectLatencyMs).toBe(400);
    expect(snapshot.metrics.p99EffectLatencyMs).toBe(400);
  });
});
