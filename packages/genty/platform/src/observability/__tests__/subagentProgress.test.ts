/**
 * GAP-SUBOBS-002: Subagent Progress Tracker tests.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  SubagentProgressTracker,
  type SubagentProgressEntry,
  type SubagentStatus,
} from "../subagentProgress";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SubagentProgressTracker", () => {
  let tracker: SubagentProgressTracker;

  beforeEach(() => {
    tracker = new SubagentProgressTracker();
  });

  // ---- start ----

  it("starts a new subagent with running status", () => {
    const entry = tracker.start("sa-1", "Build component");
    expect(entry.id).toBe("sa-1");
    expect(entry.label).toBe("Build component");
    expect(entry.status).toBe("running" satisfies SubagentStatus);
    expect(entry.startedAt).toBeDefined();
    expect(entry.finishedAt).toBeNull();
    expect(entry.durationMs).toBeNull();
    expect(entry.tokensUsed).toBe(0);
  });

  it("tracks multiple subagents independently", () => {
    tracker.start("sa-1", "Task A");
    tracker.start("sa-2", "Task B");
    expect(tracker.getAll()).toHaveLength(2);
  });

  // ---- update ----

  it("updates status to completed and sets timing", () => {
    tracker.start("sa-1", "Build component");
    const updated = tracker.update("sa-1", { status: "completed" });
    expect(updated).toBeDefined();
    expect(updated!.status).toBe("completed");
    expect(updated!.finishedAt).not.toBeNull();
    expect(typeof updated!.durationMs).toBe("number");
    expect(updated!.durationMs!).toBeGreaterThanOrEqual(0);
  });

  it("updates status to failed and sets timing", () => {
    tracker.start("sa-1", "Build component");
    const updated = tracker.update("sa-1", { status: "failed" });
    expect(updated).toBeDefined();
    expect(updated!.status).toBe("failed");
    expect(updated!.finishedAt).not.toBeNull();
  });

  it("updates token count", () => {
    tracker.start("sa-1", "Build component");
    const updated = tracker.update("sa-1", { tokensUsed: 5_000 });
    expect(updated!.tokensUsed).toBe(5_000);
  });

  it("updates message", () => {
    tracker.start("sa-1", "Build component");
    const updated = tracker.update("sa-1", { message: "50% complete" });
    expect(updated!.message).toBe("50% complete");
  });

  it("returns undefined when updating non-existent id", () => {
    const result = tracker.update("non-existent", { status: "completed" });
    expect(result).toBeUndefined();
  });

  it("allows partial updates", () => {
    tracker.start("sa-1", "Build component");
    tracker.update("sa-1", { tokensUsed: 1_000 });
    tracker.update("sa-1", { message: "in progress" });
    const entry = tracker.get("sa-1");
    expect(entry!.tokensUsed).toBe(1_000);
    expect(entry!.message).toBe("in progress");
    expect(entry!.status).toBe("running");
  });

  // ---- getAll ----

  it("returns all tracked entries", () => {
    tracker.start("sa-1", "Task A");
    tracker.start("sa-2", "Task B");
    tracker.start("sa-3", "Task C");
    const all = tracker.getAll();
    expect(all).toHaveLength(3);
    expect(all.map((e) => e.id)).toEqual(expect.arrayContaining(["sa-1", "sa-2", "sa-3"]));
  });

  it("returns empty array when no entries exist", () => {
    expect(tracker.getAll()).toHaveLength(0);
  });

  // ---- getActive ----

  it("returns only running and pending entries", () => {
    tracker.start("sa-1", "Task A");
    tracker.start("sa-2", "Task B");
    tracker.start("sa-3", "Task C");
    tracker.update("sa-2", { status: "completed" });

    const active = tracker.getActive();
    expect(active).toHaveLength(2);
    expect(active.map((e) => e.id)).toEqual(expect.arrayContaining(["sa-1", "sa-3"]));
  });

  it("returns empty when all entries are completed", () => {
    tracker.start("sa-1", "Task A");
    tracker.update("sa-1", { status: "completed" });
    expect(tracker.getActive()).toHaveLength(0);
  });

  // ---- getCompleted ----

  it("returns only completed and failed entries", () => {
    tracker.start("sa-1", "Task A");
    tracker.start("sa-2", "Task B");
    tracker.start("sa-3", "Task C");
    tracker.update("sa-1", { status: "completed" });
    tracker.update("sa-3", { status: "failed" });

    const completed = tracker.getCompleted();
    expect(completed).toHaveLength(2);
    expect(completed.map((e) => e.id)).toEqual(expect.arrayContaining(["sa-1", "sa-3"]));
  });

  // ---- get ----

  it("retrieves a specific entry by id", () => {
    tracker.start("sa-1", "Task A");
    const entry = tracker.get("sa-1");
    expect(entry).toBeDefined();
    expect(entry!.id).toBe("sa-1");
  });

  it("returns undefined for unknown id", () => {
    expect(tracker.get("unknown")).toBeUndefined();
  });

  // ---- clear ----

  it("removes all entries", () => {
    tracker.start("sa-1", "Task A");
    tracker.start("sa-2", "Task B");
    tracker.clear();
    expect(tracker.getAll()).toHaveLength(0);
  });

  // ---- immutability of getAll results ----

  it("returns a copy from getAll (mutations do not affect tracker)", () => {
    tracker.start("sa-1", "Task A");
    const all = tracker.getAll();
    all.pop();
    expect(tracker.getAll()).toHaveLength(1);
  });
});
