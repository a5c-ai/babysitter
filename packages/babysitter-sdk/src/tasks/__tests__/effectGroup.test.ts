import { describe, expect, it } from "vitest";
import { buildEffectGroup, mergeEffectGroups } from "../effectGroup";
import type { EffectAction } from "../../runtime/types";
import type { TaskDef } from "../types";

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

describe("buildEffectGroup", () => {
  it("assigns effectGroupId to all actions", () => {
    const actions = [makeAction("A1"), makeAction("A2"), makeAction("A3")];
    const group = buildEffectGroup(actions, { persistent: false });

    expect(group.effectGroupId).toBeDefined();
    expect(typeof group.effectGroupId).toBe("string");
    expect(group.effectGroupId.length).toBeGreaterThan(0);

    for (const action of group.actions) {
      expect(action.schedulerHints?.effectGroupId).toBe(group.effectGroupId);
    }
  });

  it("deduplicates by effectId", () => {
    const a1 = makeAction("A1");
    const a2 = makeAction("A2");

    const group = buildEffectGroup([a1, a2, a1, a2, a1], { persistent: false });

    expect(group.actions).toHaveLength(2);
    expect(group.actions.map((a) => a.effectId)).toEqual(["A1", "A2"]);
  });

  it("assigns coordinator role to first action when persistent", () => {
    const actions = [makeAction("C1"), makeAction("C2"), makeAction("C3")];
    const group = buildEffectGroup(actions, { persistent: true });

    expect(group.actions[0].schedulerHints?.groupRole).toBe("coordinator");
  });

  it("assigns worker role to non-coordinator actions when persistent", () => {
    const actions = [makeAction("W1"), makeAction("W2"), makeAction("W3")];
    const group = buildEffectGroup(actions, { persistent: true });

    expect(group.actions[0].schedulerHints?.groupRole).toBe("coordinator");
    for (const action of group.actions.slice(1)) {
      expect(action.schedulerHints?.groupRole).toBe("worker");
    }
  });

  it("does not assign roles when not persistent", () => {
    const actions = [makeAction("NP1"), makeAction("NP2")];
    const group = buildEffectGroup(actions, { persistent: false });

    for (const action of group.actions) {
      expect(action.schedulerHints?.groupRole).toBeUndefined();
    }
  });

  it("returns empty actions for empty input", () => {
    const group = buildEffectGroup([], { persistent: false });

    expect(group.actions).toHaveLength(0);
    expect(group.effectGroupId).toBeDefined();
  });

  it("preserves existing schedulerHints on actions", () => {
    const action = makeAction("P1", {
      schedulerHints: { pendingCount: 5, parallelGroupId: "existing-pg" },
    });
    const group = buildEffectGroup([action], { persistent: false });

    expect(group.actions[0].schedulerHints?.pendingCount).toBe(5);
    expect(group.actions[0].schedulerHints?.effectGroupId).toBe(group.effectGroupId);
  });
});

describe("mergeEffectGroups", () => {
  it("preserves original effectGroupId per action", () => {
    const group1 = buildEffectGroup([makeAction("M1"), makeAction("M2")], { persistent: false });
    const group2 = buildEffectGroup([makeAction("M3"), makeAction("M4")], { persistent: false });

    const merged = mergeEffectGroups([group1, group2]);

    // Actions from group1 keep group1's effectGroupId
    const m1Action = merged.actions.find((a) => a.effectId === "M1");
    const m2Action = merged.actions.find((a) => a.effectId === "M2");
    expect(m1Action?.schedulerHints?.effectGroupId).toBe(group1.effectGroupId);
    expect(m2Action?.schedulerHints?.effectGroupId).toBe(group1.effectGroupId);

    // Actions from group2 keep group2's effectGroupId
    const m3Action = merged.actions.find((a) => a.effectId === "M3");
    const m4Action = merged.actions.find((a) => a.effectId === "M4");
    expect(m3Action?.schedulerHints?.effectGroupId).toBe(group2.effectGroupId);
    expect(m4Action?.schedulerHints?.effectGroupId).toBe(group2.effectGroupId);
  });

  it("deduplicates across groups by effectId", () => {
    const sharedAction = makeAction("SHARED");
    const group1 = buildEffectGroup([sharedAction, makeAction("G1A")], { persistent: false });
    const group2 = buildEffectGroup([sharedAction, makeAction("G2A")], { persistent: false });

    const merged = mergeEffectGroups([group1, group2]);

    const sharedActions = merged.actions.filter((a) => a.effectId === "SHARED");
    expect(sharedActions).toHaveLength(1);
  });

  it("returns all unique actions from multiple groups", () => {
    const group1 = buildEffectGroup([makeAction("U1")], { persistent: false });
    const group2 = buildEffectGroup([makeAction("U2")], { persistent: false });
    const group3 = buildEffectGroup([makeAction("U3")], { persistent: false });

    const merged = mergeEffectGroups([group1, group2, group3]);

    expect(merged.actions).toHaveLength(3);
    expect(merged.actions.map((a) => a.effectId)).toEqual(
      expect.arrayContaining(["U1", "U2", "U3"])
    );
  });

  it("handles empty groups array", () => {
    const merged = mergeEffectGroups([]);

    expect(merged.actions).toHaveLength(0);
  });
});
