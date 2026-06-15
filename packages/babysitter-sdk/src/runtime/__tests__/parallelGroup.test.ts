import { describe, expect, it, vi } from "vitest";
import { runParallelGroup, runParallelFanOut } from "../intrinsics/parallelGroup";
import type { EffectAction } from "../types";
import type { TaskDef } from "../../tasks/types";
import { EffectRequestedError, ParallelPendingError } from "../exceptions";

const baseTaskDef: TaskDef = {
  kind: "node",
  title: "sample",
  metadata: { priority: "low" },
};

function makeAction(effectId: string, overrides: Partial<EffectAction> = {}): EffectAction {
  return {
    effectId,
    invocationKey: `proc:${effectId}`,
    kind: "node",
    label: `label-${effectId}`,
    labels: [`label-${effectId}`],
    taskDef: baseTaskDef,
    taskId: `task-${effectId}`,
    stepId: `STEP-${effectId}`,
    taskDefRef: `tasks/${effectId}/task.json`,
    inputsRef: `tasks/${effectId}/inputs.json`,
    requestedAt: `2026-01-01T00:00:00Z`,
    ...overrides,
  };
}

/**
 * Helper: creates a thunk that throws EffectRequestedError (simulates unresolved effect).
 */
function pendingThunk(effectId: string): () => Promise<never> {
  return () => {
    throw new EffectRequestedError(makeAction(effectId));
  };
}

/**
 * Helper: creates a thunk that returns a resolved value (simulates cached replay).
 */
function resolvedThunk<T>(value: T): () => Promise<T> {
  return () => Promise.resolve(value);
}

describe("parallel.group()", () => {
  it("dispatches with effectGroupId set on all pending actions", async () => {
    const thunks = [pendingThunk("G1"), pendingThunk("G2"), pendingThunk("G3")];

    try {
      await runParallelGroup(thunks, { groupLabel: "test-group" });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ParallelPendingError);
      const pending = (error as ParallelPendingError).batch.actions;

      // All actions must share the same effectGroupId
      const groupIds = new Set(pending.map((a) => a.schedulerHints?.effectGroupId));
      expect(groupIds.size).toBe(1);
      const [groupId] = groupIds;
      expect(groupId).toBeDefined();
      expect(typeof groupId).toBe("string");
    }
  });

  it("with preferredHarness string sets it on all actions", async () => {
    const thunks = [pendingThunk("H1"), pendingThunk("H2")];

    try {
      await runParallelGroup(thunks, {
        groupLabel: "harness-test",
        preferredHarness: "claude-code",
      });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ParallelPendingError);
      const pending = (error as ParallelPendingError).batch.actions;

      for (const action of pending) {
        expect(action.schedulerHints?.preferredHarness).toBe("claude-code");
      }
    }
  });

  it("with array of harnesses distributes round-robin", async () => {
    const thunks = [
      pendingThunk("RR1"),
      pendingThunk("RR2"),
      pendingThunk("RR3"),
      pendingThunk("RR4"),
      pendingThunk("RR5"),
    ];

    try {
      await runParallelGroup(thunks, {
        groupLabel: "round-robin-test",
        preferredHarness: ["claude-code", "codex", "pi"],
      });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ParallelPendingError);
      const pending = (error as ParallelPendingError).batch.actions;

      // Round-robin: claude-code, codex, pi, claude-code, codex
      expect(pending[0].schedulerHints?.preferredHarness).toBe("claude-code");
      expect(pending[1].schedulerHints?.preferredHarness).toBe("codex");
      expect(pending[2].schedulerHints?.preferredHarness).toBe("pi");
      expect(pending[3].schedulerHints?.preferredHarness).toBe("claude-code");
      expect(pending[4].schedulerHints?.preferredHarness).toBe("codex");
    }
  });

  it("empty thunks array returns empty array", async () => {
    const result = await runParallelGroup([], { groupLabel: "empty" });
    expect(result).toEqual([]);
  });

  it("persistent group with all resolved returns cached results", async () => {
    const thunks = [resolvedThunk("res-a"), resolvedThunk("res-b"), resolvedThunk("res-c")];

    const result = await runParallelGroup(thunks, {
      groupLabel: "all-resolved",
      persistent: true,
    });

    expect(result).toEqual(["res-a", "res-b", "res-c"]);
  });

  it("mixes resolved and pending effects correctly", async () => {
    const thunks = [resolvedThunk("done"), pendingThunk("P1"), resolvedThunk("also-done"), pendingThunk("P2")];

    try {
      await runParallelGroup(thunks, { groupLabel: "mixed" });
      expect.unreachable("should have thrown due to pending effects");
    } catch (error) {
      expect(error).toBeInstanceOf(ParallelPendingError);
      const pending = (error as ParallelPendingError).batch.actions;
      expect(pending.map((a) => a.effectId)).toEqual(expect.arrayContaining(["P1", "P2"]));
    }
  });
});

describe("parallel.fanOut()", () => {
  it("maps items to effects with shared groupId", async () => {
    const items = ["alpha", "beta", "gamma"];
    const fn = (item: string) => {
      throw new EffectRequestedError(makeAction(`fan-${item}`));
    };

    try {
      await runParallelFanOut(items, fn, { groupLabel: "fan-out-test" });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ParallelPendingError);
      const pending = (error as ParallelPendingError).batch.actions;

      expect(pending).toHaveLength(3);
      // All should share a single effectGroupId
      const groupIds = new Set(pending.map((a) => a.schedulerHints?.effectGroupId));
      expect(groupIds.size).toBe(1);
      expect(pending.map((a) => a.effectId)).toEqual(
        expect.arrayContaining(["fan-alpha", "fan-beta", "fan-gamma"])
      );
    }
  });

  it("empty items array returns empty array", async () => {
    const result = await runParallelFanOut([], (_item: string) => Promise.resolve("x"), {
      groupLabel: "empty-fan",
    });
    expect(result).toEqual([]);
  });

  it("returns resolved values when all effects are cached", async () => {
    const items = [1, 2, 3];
    const fn = (item: number) => Promise.resolve(item * 10);

    const result = await runParallelFanOut(items, fn, { groupLabel: "cached-fan" });
    expect(result).toEqual([10, 20, 30]);
  });

  it("propagates non-effect errors", async () => {
    const items = ["ok", "fail"];
    const fn = (item: string) => {
      if (item === "fail") throw new Error("deliberate failure");
      return Promise.resolve(item);
    };

    await expect(
      runParallelFanOut(items, fn, { groupLabel: "error-fan" })
    ).rejects.toThrow("deliberate failure");
  });
});
