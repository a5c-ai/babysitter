import { describe, expect, test } from "vitest";
import { runParallelAll } from "../intrinsics/parallel";
import { EffectAction, TaskDef } from "../types";
import { EffectPendingError, EffectRequestedError, ParallelPendingError } from "../exceptions";
import { buildParallelBatch } from "../../tasks/batching";

const taskDef: TaskDef = {
  kind: "node",
  title: "sample",
};

function makeAction(effectId: string): EffectAction {
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
  };
}

describe("runParallelAll – input validation", () => {
  test("throws descriptive error when a Promise is passed instead of a thunk", async () => {
    const promise = Promise.resolve(42);
    // Common mistake: [ctx.task(...)] instead of [() => ctx.task(...)]
    const thunks = [promise] as unknown as Array<() => number>;

    await expect(runParallelAll(thunks)).rejects.toThrow(/thunk/i);
    await expect(runParallelAll(thunks)).rejects.toThrow(/\(\) =>/);
  });

  test("throws descriptive error when a plain value is passed instead of a thunk", async () => {
    const thunks = [42] as unknown as Array<() => number>;

    await expect(runParallelAll(thunks)).rejects.toThrow(/thunk/i);
    await expect(runParallelAll(thunks)).rejects.toThrow(/\(\) =>/);
  });

  test("accepts valid thunk arrays and resolves normally", async () => {
    const thunks = [() => 1, () => Promise.resolve(2), async () => 3];
    const results = await runParallelAll(thunks);
    expect(results).toEqual([1, 2, 3]);
  });
});

describe("runParallelAll", () => {
  test("aggregates pending actions without duplicates", async () => {
    const actionA = makeAction("A");
    const actionB = makeAction("B");
    const actionC = makeAction("C");

    const thunks = [
      async () => {
        throw new EffectRequestedError(actionA);
      },
      async () => 1,
      async () => {
        throw new EffectPendingError(actionB);
      },
      async () => {
        throw new ParallelPendingError(buildParallelBatch([actionB, actionC]));
      },
    ];

    await expect(runParallelAll(thunks)).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(ParallelPendingError);
      const pending = (error as ParallelPendingError).batch.actions;
      expect(pending).toHaveLength(3);
      const groupIds = new Set(pending.map((action) => action.schedulerHints?.parallelGroupId));
      expect(groupIds.size).toBe(1);
      expect(pending.map((action) => action.effectId)).toEqual([
        actionA.effectId,
        actionB.effectId,
        actionC.effectId,
      ]);
      const summaries = (error as ParallelPendingError).batch.summaries;
      expect(summaries).toHaveLength(3);
      expect(summaries[0]).toMatchObject({
        effectId: actionA.effectId,
        invocationKey: actionA.invocationKey,
        taskDefRef: actionA.taskDefRef,
        inputsRef: actionA.inputsRef,
        labels: actionA.labels,
      });
      expect((error as ParallelPendingError).details).toMatchObject({
        payload: { effects: summaries },
        effects: pending,
      });
      return true;
    });
  });
});
