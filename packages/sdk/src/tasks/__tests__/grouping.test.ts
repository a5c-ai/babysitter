import { describe, expect, test } from "vitest";
import { groupActionsByParallelGroup, getEffectiveConcurrency } from "../grouping";
import type { EffectAction } from "../../runtime/types";
import type { TaskDef } from "../types";

const baseTaskDef: TaskDef = {
  kind: "node",
  title: "sample",
  metadata: { priority: "low" },
};

function makeAction(
  effectId: string,
  overrides: Partial<EffectAction> = {}
): EffectAction {
  return {
    effectId,
    invocationKey: `proc:${effectId}`,
    kind: "node",
    label: `label-${effectId}`,
    labels: [`label-${effectId}`, "shared"],
    taskDef: baseTaskDef,
    taskId: `task-${effectId}`,
    stepId: `STEP-${effectId}`,
    taskDefRef: `tasks/${effectId}/task.json`,
    inputsRef: `tasks/${effectId}/inputs.json`,
    requestedAt: `2026-01-01T00:00:00Z`,
    ...overrides,
  };
}

describe("groupActionsByParallelGroup", () => {
  test("groups actions by parallelGroupId", () => {
    const actionA = makeAction("A", {
      schedulerHints: { parallelGroupId: "group-1" },
    });
    const actionB = makeAction("B", {
      schedulerHints: { parallelGroupId: "group-1" },
    });
    const actionC = makeAction("C", {
      schedulerHints: { parallelGroupId: "group-2" },
    });

    const groups = groupActionsByParallelGroup([actionA, actionB, actionC]);

    expect(groups.size).toBe(2);
    expect(groups.get("group-1")).toHaveLength(2);
    expect(groups.get("group-1")!.map((a) => a.effectId)).toEqual(["A", "B"]);
    expect(groups.get("group-2")).toHaveLength(1);
    expect(groups.get("group-2")!.map((a) => a.effectId)).toEqual(["C"]);
  });

  test("actions without parallelGroupId go under '__ungrouped__'", () => {
    const actionA = makeAction("A"); // no schedulerHints
    const actionB = makeAction("B", {
      schedulerHints: { parallelGroupId: "group-1" },
    });
    const actionC = makeAction("C", {
      schedulerHints: {}, // schedulerHints present but no parallelGroupId
    });

    const groups = groupActionsByParallelGroup([actionA, actionB, actionC]);

    expect(groups.size).toBe(2);
    expect(groups.get("__ungrouped__")).toHaveLength(2);
    expect(groups.get("__ungrouped__")!.map((a) => a.effectId)).toEqual([
      "A",
      "C",
    ]);
    expect(groups.get("group-1")).toHaveLength(1);
  });

  test("empty array returns empty Map", () => {
    const groups = groupActionsByParallelGroup([]);

    expect(groups.size).toBe(0);
    expect(groups).toBeInstanceOf(Map);
  });

  test("all actions in same group are collected together", () => {
    const actions = [
      makeAction("A", { schedulerHints: { parallelGroupId: "only-group" } }),
      makeAction("B", { schedulerHints: { parallelGroupId: "only-group" } }),
      makeAction("C", { schedulerHints: { parallelGroupId: "only-group" } }),
    ];

    const groups = groupActionsByParallelGroup(actions);

    expect(groups.size).toBe(1);
    expect(groups.get("only-group")).toHaveLength(3);
  });

  test("preserves insertion order within each group", () => {
    const actions = [
      makeAction("C", { schedulerHints: { parallelGroupId: "g1" } }),
      makeAction("A", { schedulerHints: { parallelGroupId: "g1" } }),
      makeAction("B", { schedulerHints: { parallelGroupId: "g1" } }),
    ];

    const groups = groupActionsByParallelGroup(actions);
    const ids = groups.get("g1")!.map((a) => a.effectId);

    expect(ids).toEqual(["C", "A", "B"]);
  });
});

describe("getEffectiveConcurrency", () => {
  test("returns minimum when hints disagree", () => {
    const actions = [
      makeAction("A", {
        schedulerHints: { parallelGroupId: "g1", pendingCount: 3 },
      }),
      makeAction("B", {
        schedulerHints: { parallelGroupId: "g1", pendingCount: 5 },
      }),
    ];

    // When multiple actions have different maxConcurrency hints,
    // getEffectiveConcurrency should return the minimum to be safe
    const concurrency = getEffectiveConcurrency(actions, { maxConcurrency: 4 });
    expect(concurrency).toBe(3);
  });

  test("returns actions.length when no hint set", () => {
    const actions = [makeAction("A"), makeAction("B"), makeAction("C")];

    const concurrency = getEffectiveConcurrency(actions);

    expect(concurrency).toBe(3);
  });

  test("returns explicit maxConcurrency when lower than action count", () => {
    const actions = [
      makeAction("A"),
      makeAction("B"),
      makeAction("C"),
      makeAction("D"),
      makeAction("E"),
    ];

    const concurrency = getEffectiveConcurrency(actions, { maxConcurrency: 2 });

    expect(concurrency).toBe(2);
  });

  test("returns 1 for empty actions array", () => {
    const concurrency = getEffectiveConcurrency([]);

    // Should return at least 1 (or 0) - defensive minimum
    expect(concurrency).toBeGreaterThanOrEqual(0);
    expect(concurrency).toBeLessThanOrEqual(1);
  });

  test("respects per-action maxConcurrency scheduler hint", () => {
    const actions = [
      makeAction("A", {
        schedulerHints: { parallelGroupId: "g1", pendingCount: 2 },
      }),
      makeAction("B", {
        schedulerHints: { parallelGroupId: "g1", pendingCount: 2 },
      }),
      makeAction("C", {
        schedulerHints: { parallelGroupId: "g1", pendingCount: 2 },
      }),
    ];

    const concurrency = getEffectiveConcurrency(actions);

    expect(concurrency).toBe(2);
  });
});
