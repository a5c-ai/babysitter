/**
 * GAP-ROUTE-002: Effect Scheduler tests.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  EffectScheduler,
  comparePriority,
  type EffectPriority,
  type ScheduledEffect,
} from "../scheduling";

// ---------------------------------------------------------------------------
// comparePriority
// ---------------------------------------------------------------------------

describe("comparePriority", () => {
  it("critical > high > normal > low", () => {
    expect(comparePriority("critical", "high")).toBeGreaterThan(0);
    expect(comparePriority("high", "normal")).toBeGreaterThan(0);
    expect(comparePriority("normal", "low")).toBeGreaterThan(0);
  });

  it("returns 0 for equal priorities", () => {
    expect(comparePriority("normal", "normal")).toBe(0);
    expect(comparePriority("critical", "critical")).toBe(0);
  });

  it("returns negative when first is lower", () => {
    expect(comparePriority("low", "critical")).toBeLessThan(0);
    expect(comparePriority("normal", "high")).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// EffectScheduler
// ---------------------------------------------------------------------------

describe("EffectScheduler", () => {
  let scheduler: EffectScheduler<string>;

  beforeEach(() => {
    scheduler = new EffectScheduler<string>();
  });

  // ---- enqueue ----

  it("enqueues effects with correct fields", () => {
    const entry = scheduler.enqueue("e1", "payload-1", "high");
    expect(entry.id).toBe("e1");
    expect(entry.payload).toBe("payload-1");
    expect(entry.priority).toBe("high" satisfies EffectPriority);
    expect(entry.enqueuedAt).toBeDefined();
  });

  it("defaults to normal priority", () => {
    const entry = scheduler.enqueue("e1", "payload-1");
    expect(entry.priority).toBe("normal");
  });

  it("maintains priority order in the queue", () => {
    scheduler.enqueue("low-1", "l", "low");
    scheduler.enqueue("critical-1", "c", "critical");
    scheduler.enqueue("normal-1", "n", "normal");
    scheduler.enqueue("high-1", "h", "high");

    const all = scheduler.getAll();
    expect(all[0]!.priority).toBe("critical");
    expect(all[1]!.priority).toBe("high");
    expect(all[2]!.priority).toBe("normal");
    expect(all[3]!.priority).toBe("low");
  });

  it("preserves FIFO within same priority", () => {
    scheduler.enqueue("n1", "first", "normal");
    scheduler.enqueue("n2", "second", "normal");
    scheduler.enqueue("n3", "third", "normal");

    const d1 = scheduler.dequeue();
    const d2 = scheduler.dequeue();
    const d3 = scheduler.dequeue();
    expect(d1!.id).toBe("n1");
    expect(d2!.id).toBe("n2");
    expect(d3!.id).toBe("n3");
  });

  // ---- dequeue ----

  it("dequeues highest-priority effect first", () => {
    scheduler.enqueue("low-1", "l", "low");
    scheduler.enqueue("critical-1", "c", "critical");
    scheduler.enqueue("normal-1", "n", "normal");

    const first = scheduler.dequeue();
    expect(first!.id).toBe("critical-1");
    expect(first!.priority).toBe("critical");

    const second = scheduler.dequeue();
    expect(second!.id).toBe("normal-1");

    const third = scheduler.dequeue();
    expect(third!.id).toBe("low-1");
  });

  it("returns undefined when queue is empty", () => {
    expect(scheduler.dequeue()).toBeUndefined();
  });

  it("removes the dequeued effect from the queue", () => {
    scheduler.enqueue("e1", "p", "normal");
    expect(scheduler.size).toBe(1);
    scheduler.dequeue();
    expect(scheduler.size).toBe(0);
  });

  // ---- peek ----

  it("returns the highest-priority effect without removing it", () => {
    scheduler.enqueue("e1", "p", "high");
    scheduler.enqueue("e2", "p", "critical");

    const peeked = scheduler.peek();
    expect(peeked!.id).toBe("e2");
    expect(scheduler.size).toBe(2); // Not removed
  });

  it("returns undefined when queue is empty", () => {
    expect(scheduler.peek()).toBeUndefined();
  });

  // ---- getAll ----

  it("returns all effects in priority order", () => {
    scheduler.enqueue("e1", "p", "low");
    scheduler.enqueue("e2", "p", "high");
    scheduler.enqueue("e3", "p", "normal");

    const all = scheduler.getAll();
    expect(all).toHaveLength(3);
    expect(all[0]!.id).toBe("e2"); // high
    expect(all[1]!.id).toBe("e3"); // normal
    expect(all[2]!.id).toBe("e1"); // low
  });

  it("returns a copy of the queue", () => {
    scheduler.enqueue("e1", "p", "normal");
    const all = scheduler.getAll();
    (all as Array<ScheduledEffect<string>>).pop();
    expect(scheduler.size).toBe(1);
  });

  // ---- getByPriority ----

  it("filters effects by priority", () => {
    scheduler.enqueue("e1", "p", "low");
    scheduler.enqueue("e2", "p", "high");
    scheduler.enqueue("e3", "p", "high");
    scheduler.enqueue("e4", "p", "normal");

    const highEffects = scheduler.getByPriority("high");
    expect(highEffects).toHaveLength(2);
    expect(highEffects.every((e) => e.priority === "high")).toBe(true);
  });

  it("returns empty array for priority with no effects", () => {
    scheduler.enqueue("e1", "p", "low");
    expect(scheduler.getByPriority("critical")).toHaveLength(0);
  });

  // ---- remove ----

  it("removes an effect by id", () => {
    scheduler.enqueue("e1", "p", "normal");
    scheduler.enqueue("e2", "p", "high");

    expect(scheduler.remove("e1")).toBe(true);
    expect(scheduler.size).toBe(1);
    expect(scheduler.peek()!.id).toBe("e2");
  });

  it("returns false for non-existent id", () => {
    expect(scheduler.remove("unknown")).toBe(false);
  });

  // ---- size / isEmpty ----

  it("reports correct size", () => {
    expect(scheduler.size).toBe(0);
    expect(scheduler.isEmpty).toBe(true);

    scheduler.enqueue("e1", "p", "normal");
    expect(scheduler.size).toBe(1);
    expect(scheduler.isEmpty).toBe(false);

    scheduler.enqueue("e2", "p", "high");
    expect(scheduler.size).toBe(2);
  });

  // ---- clear ----

  it("clears all effects", () => {
    scheduler.enqueue("e1", "p", "normal");
    scheduler.enqueue("e2", "p", "high");
    scheduler.clear();
    expect(scheduler.size).toBe(0);
    expect(scheduler.isEmpty).toBe(true);
  });

  // ---- mixed priority insertion order ----

  it("handles interleaved priority insertions correctly", () => {
    scheduler.enqueue("n1", "payload", "normal");
    scheduler.enqueue("c1", "payload", "critical");
    scheduler.enqueue("l1", "payload", "low");
    scheduler.enqueue("h1", "payload", "high");
    scheduler.enqueue("c2", "payload", "critical");
    scheduler.enqueue("n2", "payload", "normal");

    const ids: string[] = [];
    while (!scheduler.isEmpty) {
      ids.push(scheduler.dequeue()!.id);
    }

    // critical first (FIFO within), then high, then normal (FIFO within), then low
    expect(ids).toEqual(["c1", "c2", "h1", "n1", "n2", "l1"]);
  });
});
