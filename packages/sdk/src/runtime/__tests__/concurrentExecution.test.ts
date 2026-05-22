import { describe, expect, test } from "vitest";
import { runParallelAll } from "../intrinsics/parallel";
import type { EffectAction, TaskDef } from "../types";
import {
  EffectRequestedError,
  ParallelPendingError,
} from "../exceptions";
import { buildParallelBatch } from "../../tasks/batching";

const taskDef: TaskDef = {
  kind: "node",
  title: "sample",
};

function makeAction(
  effectId: string,
  overrides: Partial<EffectAction> = {}
): EffectAction {
  return {
    effectId,
    invocationKey: `proc:S00000${effectId}:test`,
    kind: "node",
    label: effectId,
    labels: [effectId],
    taskDefRef: `tasks/${effectId}/task.json`,
    inputsRef: `tasks/${effectId}/inputs.json`,
    requestedAt: "2026-01-01T00:00:00Z",
    taskDef,
    ...overrides,
  };
}

describe("concurrent execution – ctx.parallel.all() with maxConcurrency", () => {
  test("ctx.parallel.all() accepts maxConcurrency option", async () => {
    // GAP-PAR-001: parallel.all() should accept an options object with maxConcurrency
    // This tests the new overload: parallel.all(thunks, { maxConcurrency: N })
    const thunks = [() => 1, () => 2, () => 3, () => 4];

    // When maxConcurrency is provided, at most N thunks run concurrently.
    // For resolved thunks the result should be the same regardless of concurrency.
    const results = await runParallelAll(thunks, { maxConcurrency: 2 });
    expect(results).toEqual([1, 2, 3, 4]);
  });

  test("maxConcurrency limits simultaneous execution", async () => {
    // Track concurrency during execution
    let currentConcurrency = 0;
    let maxObservedConcurrency = 0;

    const makeThunk = (value: number) => async () => {
      currentConcurrency++;
      maxObservedConcurrency = Math.max(
        maxObservedConcurrency,
        currentConcurrency
      );
      // Yield to event loop to allow other thunks to start if concurrency allows
      await new Promise((resolve) => setTimeout(resolve, 10));
      currentConcurrency--;
      return value;
    };

    const thunks = [makeThunk(1), makeThunk(2), makeThunk(3), makeThunk(4)];
    const results = await runParallelAll(thunks, { maxConcurrency: 2 });

    expect(results).toEqual([1, 2, 3, 4]);
    expect(maxObservedConcurrency).toBeLessThanOrEqual(2);
  });

  test("maxConcurrency of 1 executes sequentially", async () => {
    const executionOrder: number[] = [];
    const thunks = [1, 2, 3].map(
      (n) => async () => {
        executionOrder.push(n);
        await new Promise((resolve) => setTimeout(resolve, 5));
        return n;
      }
    );

    const results = await runParallelAll(thunks, { maxConcurrency: 1 });

    expect(results).toEqual([1, 2, 3]);
    expect(executionOrder).toEqual([1, 2, 3]);
  });

  test("without maxConcurrency option, all thunks run (existing behavior)", async () => {
    const thunks = [() => 10, () => 20, () => 30];
    const results = await runParallelAll(thunks);
    expect(results).toEqual([10, 20, 30]);
  });
});

describe("concurrent execution – parallelGroupId assignment", () => {
  test("actions from parallel.all() share same parallelGroupId", async () => {
    const actionA = makeAction("A");
    const actionB = makeAction("B");
    const actionC = makeAction("C");

    const thunks = [
      async () => {
        throw new EffectRequestedError(actionA);
      },
      async () => {
        throw new EffectRequestedError(actionB);
      },
      async () => {
        throw new EffectRequestedError(actionC);
      },
    ];

    try {
      await runParallelAll(thunks);
      expect.unreachable("should have thrown ParallelPendingError");
    } catch (err) {
      expect(err).toBeInstanceOf(ParallelPendingError);
      const pending = (err as ParallelPendingError).batch.actions;
      expect(pending).toHaveLength(3);

      // All actions in the same parallel.all() call should share a parallelGroupId
      const groupIds = pending.map(
        (a) => a.schedulerHints?.parallelGroupId
      );
      const uniqueGroupIds = new Set(groupIds);
      expect(uniqueGroupIds.size).toBe(1);
      expect(groupIds[0]).toBeDefined();
      expect(typeof groupIds[0]).toBe("string");
    }
  });

  test("single effect gets no parallelGroupId", async () => {
    // When only one action is pending, no parallelGroupId should be assigned
    // (it's not part of a parallel group)
    const actionA = makeAction("A");

    const thunks = [
      async () => {
        throw new EffectRequestedError(actionA);
      },
    ];

    try {
      await runParallelAll(thunks);
      expect.unreachable("should have thrown ParallelPendingError");
    } catch (err) {
      expect(err).toBeInstanceOf(ParallelPendingError);
      const pending = (err as ParallelPendingError).batch.actions;
      expect(pending).toHaveLength(1);

      // Single action should NOT have a parallelGroupId
      expect(
        pending[0].schedulerHints?.parallelGroupId
      ).toBeUndefined();
    }
  });

  test("nested parallel.all() calls get distinct parallelGroupIds", async () => {
    // Simulate two separate parallel batches that get merged
    const actionA = makeAction("A");
    const actionB = makeAction("B");
    const actionC = makeAction("C");
    const actionD = makeAction("D");

    // Build two separate batches (as if from nested parallel.all() calls)
    const innerBatch1 = buildParallelBatch([actionA, actionB]);
    const innerBatch2 = buildParallelBatch([actionC, actionD]);

    // Each batch should have its own parallelGroupId
    const group1 = innerBatch1.actions[0].schedulerHints?.parallelGroupId;
    const group2 = innerBatch2.actions[0].schedulerHints?.parallelGroupId;

    expect(group1).toBeDefined();
    expect(group2).toBeDefined();
    expect(group1).not.toBe(group2);

    // All actions within each batch should share the same group
    for (const action of innerBatch1.actions) {
      expect(action.schedulerHints?.parallelGroupId).toBe(group1);
    }
    for (const action of innerBatch2.actions) {
      expect(action.schedulerHints?.parallelGroupId).toBe(group2);
    }
  });

  test("maxConcurrency hint is propagated to schedulerHints on pending actions", async () => {
    const actionA = makeAction("A");
    const actionB = makeAction("B");

    const thunks = [
      async () => {
        throw new EffectRequestedError(actionA);
      },
      async () => {
        throw new EffectRequestedError(actionB);
      },
    ];

    try {
      await runParallelAll(thunks, { maxConcurrency: 3 });
      expect.unreachable("should have thrown ParallelPendingError");
    } catch (err) {
      expect(err).toBeInstanceOf(ParallelPendingError);
      const pending = (err as ParallelPendingError).batch.actions;

      // Each action should carry the maxConcurrency hint in schedulerHints
      for (const action of pending) {
        expect(action.schedulerHints?.maxConcurrency).toBe(3);
      }
    }
  });

  test("executionStrategy hint is propagated when set", async () => {
    const actionA = makeAction("A");
    const actionB = makeAction("B");

    const thunks = [
      async () => {
        throw new EffectRequestedError(actionA);
      },
      async () => {
        throw new EffectRequestedError(actionB);
      },
    ];

    try {
      await runParallelAll(thunks, {
        maxConcurrency: 2,
        executionStrategy: "concurrent",
      });
      expect.unreachable("should have thrown ParallelPendingError");
    } catch (err) {
      expect(err).toBeInstanceOf(ParallelPendingError);
      const pending = (err as ParallelPendingError).batch.actions;

      for (const action of pending) {
        expect(action.schedulerHints?.executionStrategy).toBe("concurrent");
      }
    }
  });
});
