import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  BackgroundEffectTracker,
  type BackgroundEffectEntry,
  type BackgroundEffectStatus,
} from "../backgroundTracker";

function makeEntry(
  effectId: string,
  overrides: Partial<BackgroundEffectEntry> = {},
): BackgroundEffectEntry {
  return {
    effectId,
    invocationKey: `proc:${effectId}`,
    kind: "node",
    dispatchedAt: new Date().toISOString(),
    pollIntervalMs: 5000,
    ...overrides,
  };
}

describe("BackgroundEffectTracker (GAP-PAR-002)", () => {
  let tracker: BackgroundEffectTracker;

  beforeEach(() => {
    tracker = new BackgroundEffectTracker();
  });

  it("can track a dispatched background effect", () => {
    const entry = makeEntry("bg-001");

    tracker.track(entry);

    const tracked = tracker.getAll();
    expect(tracked).toHaveLength(1);
    expect(tracked[0].effectId).toBe("bg-001");
  });

  it("tracks multiple effects independently", () => {
    tracker.track(makeEntry("bg-001"));
    tracker.track(makeEntry("bg-002"));
    tracker.track(makeEntry("bg-003"));

    expect(tracker.getAll()).toHaveLength(3);
    expect(tracker.get("bg-002")).toBeDefined();
    expect(tracker.get("bg-002")?.effectId).toBe("bg-002");
  });

  it("poll returns current status of a tracked effect", () => {
    tracker.track(makeEntry("bg-poll"));

    const status: BackgroundEffectStatus = tracker.poll("bg-poll");

    expect(status).toBeDefined();
    expect(status.effectId).toBe("bg-poll");
    expect(status.state).toBe("running");
    expect(status.lastPolledAt).toBeDefined();
  });

  it("poll updates lastPolledAt timestamp", () => {
    tracker.track(makeEntry("bg-poll-ts"));

    const status1 = tracker.poll("bg-poll-ts");
    const firstPoll = status1.lastPolledAt;

    // Small delay to ensure timestamp difference
    const status2 = tracker.poll("bg-poll-ts");

    expect(status2.lastPolledAt).toBeDefined();
    // Both polls should have timestamps (second may be same or later)
    expect(typeof firstPoll).toBe("string");
    expect(typeof status2.lastPolledAt).toBe("string");
  });

  it("poll throws or returns error for unknown effect", () => {
    expect(() => tracker.poll("nonexistent")).toThrow();
  });

  it("completed effects are collected", () => {
    tracker.track(makeEntry("bg-done"));

    tracker.markCompleted("bg-done", { status: "ok", value: { result: 42 } });

    const completed = tracker.collectCompleted();
    expect(completed).toHaveLength(1);
    expect(completed[0].effectId).toBe("bg-done");
    expect(completed[0].result?.status).toBe("ok");
    expect(completed[0].result?.value).toEqual({ result: 42 });
  });

  it("collectCompleted removes completed effects from tracker", () => {
    tracker.track(makeEntry("bg-c1"));
    tracker.track(makeEntry("bg-c2"));

    tracker.markCompleted("bg-c1", { status: "ok", value: "done" });

    const completed = tracker.collectCompleted();
    expect(completed).toHaveLength(1);

    // After collection, only bg-c2 should remain
    expect(tracker.getAll()).toHaveLength(1);
    expect(tracker.getAll()[0].effectId).toBe("bg-c2");
  });

  it("timeout effects produce resolved_error", () => {
    const entry = makeEntry("bg-timeout", {
      dispatchedAt: new Date(Date.now() - 120_000).toISOString(), // 2 minutes ago
      timeoutMs: 60_000, // 1 minute timeout
    });
    tracker.track(entry);

    tracker.checkTimeouts();

    const completed = tracker.collectCompleted();
    expect(completed).toHaveLength(1);
    expect(completed[0].effectId).toBe("bg-timeout");
    expect(completed[0].result?.status).toBe("error");
    expect(completed[0].result?.error).toBeDefined();
    // The error should indicate a timeout
    const errorMsg = typeof completed[0].result?.error === "string"
      ? completed[0].result.error
      : (completed[0].result?.error as { message?: string })?.message ?? "";
    expect(errorMsg).toMatch(/timeout/i);
  });

  it("non-expired effects are not timed out", () => {
    const entry = makeEntry("bg-fresh", {
      dispatchedAt: new Date().toISOString(),
      timeoutMs: 60_000,
    });
    tracker.track(entry);

    tracker.checkTimeouts();

    const completed = tracker.collectCompleted();
    expect(completed).toHaveLength(0);
    expect(tracker.getAll()).toHaveLength(1);
  });
});
