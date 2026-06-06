import { describe, expect, it } from "vitest";
import { partitionByBackground } from "../partitioning";
import type { EffectAction } from "../../runtime/types";
import type { TaskDef } from "../types";

const baseTaskDef: TaskDef = {
  kind: "node",
  title: "sample",
  metadata: { priority: "low" },
};

function makeAction(
  effectId: string,
  overrides: Partial<EffectAction> = {},
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

describe("partitionByBackground", () => {
  it("correctly splits mixed foreground/background actions", () => {
    const fg1 = makeAction("fg1");
    const bg1 = makeAction("bg1", {
      schedulerHints: { background: true },
    });
    const fg2 = makeAction("fg2");
    const bg2 = makeAction("bg2", {
      schedulerHints: { background: true },
    });

    const { foreground, background } = partitionByBackground([fg1, bg1, fg2, bg2]);

    expect(foreground.map((a) => a.effectId)).toEqual(["fg1", "fg2"]);
    expect(background.map((a) => a.effectId)).toEqual(["bg1", "bg2"]);
  });

  it("returns empty background array when all actions are foreground", () => {
    const actions = [makeAction("a"), makeAction("b"), makeAction("c")];

    const { foreground, background } = partitionByBackground(actions);

    expect(foreground).toHaveLength(3);
    expect(background).toHaveLength(0);
  });

  it("returns empty foreground array when all actions are background", () => {
    const actions = [
      makeAction("x", { schedulerHints: { background: true } }),
      makeAction("y", { schedulerHints: { background: true } }),
    ];

    const { foreground, background } = partitionByBackground(actions);

    expect(foreground).toHaveLength(0);
    expect(background).toHaveLength(2);
  });

  it("returns two empty arrays for empty input", () => {
    const { foreground, background } = partitionByBackground([]);

    expect(foreground).toEqual([]);
    expect(background).toEqual([]);
  });

  it("preserves order within each partition", () => {
    const actions = [
      makeAction("fg-1"),
      makeAction("bg-1", { schedulerHints: { background: true } }),
      makeAction("fg-2"),
      makeAction("bg-2", { schedulerHints: { background: true } }),
      makeAction("fg-3"),
      makeAction("bg-3", { schedulerHints: { background: true } }),
    ];

    const { foreground, background } = partitionByBackground(actions);

    expect(foreground.map((a) => a.effectId)).toEqual(["fg-1", "fg-2", "fg-3"]);
    expect(background.map((a) => a.effectId)).toEqual(["bg-1", "bg-2", "bg-3"]);
  });
});
