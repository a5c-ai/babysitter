import { describe, expect, test } from "vitest";

import type { EffectAction } from "../types";
import { groupActionsByParallelGroup, getEffectiveConcurrency } from "../../tasks/grouping";
import { partitionByBackground } from "../../tasks/partitioning";
import { buildEffectGroup, mergeEffectGroups } from "../../tasks/effectGroup";
import { classifyWaitingActions, applyBackgroundDefaults, createBackgroundEffectRecord } from "../asyncEffects";
import { EffectGroupRegistry, EffectGroupStatus } from "../effectGroupRegistry";
import { BackgroundEffectTracker } from "../../harness/backgroundTracker";

/** Helper to create a minimal EffectAction for testing. */
function makeAction(
  id: string,
  overrides?: Partial<EffectAction>
): EffectAction {
  return {
    effectId: id,
    invocationKey: `inv-${id}`,
    kind: "node",
    taskDef: { kind: "node", title: `Task ${id}` },
    requestedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("GAP-PAR integration: groupActionsByParallelGroup + partitionByBackground", () => {
  test("groups actions by parallelGroupId then partitions each group into foreground/background", () => {
    const actions: EffectAction[] = [
      makeAction("a1", { schedulerHints: { parallelGroupId: "g1" } }),
      makeAction("a2", { schedulerHints: { parallelGroupId: "g1", background: true } }),
      makeAction("a3", { schedulerHints: { parallelGroupId: "g2", background: true } }),
      makeAction("a4", { schedulerHints: { parallelGroupId: "g2" } }),
      makeAction("a5"), // ungrouped, foreground
      makeAction("a6", { schedulerHints: { background: true } }), // ungrouped, background
    ];

    const groups = groupActionsByParallelGroup(actions);

    expect(groups.size).toBe(3); // g1, g2, __ungrouped__
    expect(groups.get("g1")!.length).toBe(2);
    expect(groups.get("g2")!.length).toBe(2);

    // Partition each group
    const g1Part = partitionByBackground(groups.get("g1")!);
    expect(g1Part.foreground.map((a) => a.effectId)).toEqual(["a1"]);
    expect(g1Part.background.map((a) => a.effectId)).toEqual(["a2"]);

    const g2Part = partitionByBackground(groups.get("g2")!);
    expect(g2Part.foreground.map((a) => a.effectId)).toEqual(["a4"]);
    expect(g2Part.background.map((a) => a.effectId)).toEqual(["a3"]);

    const ungrouped = groups.get("__ungrouped__")!;
    const ungroupedPart = partitionByBackground(ungrouped);
    expect(ungroupedPart.foreground.map((a) => a.effectId)).toEqual(["a5"]);
    expect(ungroupedPart.background.map((a) => a.effectId)).toEqual(["a6"]);
  });

  test("all-foreground group has empty background partition", () => {
    const actions: EffectAction[] = [
      makeAction("x1", { schedulerHints: { parallelGroupId: "only-fg" } }),
      makeAction("x2", { schedulerHints: { parallelGroupId: "only-fg" } }),
    ];

    const groups = groupActionsByParallelGroup(actions);
    const part = partitionByBackground(groups.get("only-fg")!);
    expect(part.foreground.length).toBe(2);
    expect(part.background.length).toBe(0);
  });
});

describe("GAP-PAR integration: buildEffectGroup + classifyWaitingActions", () => {
  test("builds a persistent group then classifies its actions correctly", () => {
    const actions: EffectAction[] = [
      makeAction("e1"), // foreground coordinator
      makeAction("e2", { schedulerHints: { background: true } }), // background worker
      makeAction("e3"), // foreground worker
    ];

    const group = buildEffectGroup(actions, { persistent: true });

    // All actions should now share an effectGroupId
    const groupIds = new Set(group.actions.map((a) => a.schedulerHints!.effectGroupId));
    expect(groupIds.size).toBe(1);

    // First action should be coordinator, rest workers
    expect(group.actions[0].schedulerHints!.groupRole).toBe("coordinator");
    expect(group.actions[1].schedulerHints!.groupRole).toBe("worker");
    expect(group.actions[2].schedulerHints!.groupRole).toBe("worker");

    // Background hint should be preserved through buildEffectGroup
    expect(group.actions[1].schedulerHints!.background).toBe(true);

    // Classify the group's actions
    const classified = classifyWaitingActions(group.actions);
    expect(classified.blocking.map((a) => a.effectId)).toEqual(["e1", "e3"]);
    expect(classified.background.map((a) => a.effectId)).toEqual(["e2"]);
  });

  test("classifyWaitingActions reassigns parallelGroupId for background actions sharing foreground group", () => {
    const sharedGroupId = "shared-pg";
    const actions: EffectAction[] = [
      makeAction("f1", { schedulerHints: { parallelGroupId: sharedGroupId } }),
      makeAction("f2", { schedulerHints: { parallelGroupId: sharedGroupId, background: true } }),
    ];

    const group = buildEffectGroup(actions, { persistent: false });
    const classified = classifyWaitingActions(group.actions);

    // The background action should get a suffixed parallelGroupId
    const bgAction = classified.background[0];
    expect(bgAction.schedulerHints!.parallelGroupId).toBe(`${sharedGroupId}:bg`);

    // The foreground action keeps the original
    const fgAction = classified.blocking[0];
    expect(fgAction.schedulerHints!.parallelGroupId).toBe(sharedGroupId);
  });
});

describe("GAP-PAR integration: BackgroundEffectTracker + partitionByBackground", () => {
  test("partitions actions then tracks background effects and polls them", () => {
    const actions: EffectAction[] = [
      makeAction("bg1", { schedulerHints: { background: true, pollIntervalMs: 3000 } }),
      makeAction("bg2", { schedulerHints: { background: true, pollIntervalMs: 5000 } }),
      makeAction("fg1"),
    ];

    const { foreground, background } = partitionByBackground(actions);
    expect(foreground.length).toBe(1);
    expect(background.length).toBe(2);

    const tracker = new BackgroundEffectTracker();

    // Track each background action
    for (const action of background) {
      tracker.track({
        effectId: action.effectId,
        invocationKey: action.invocationKey,
        kind: action.kind,
        dispatchedAt: new Date().toISOString(),
        pollIntervalMs: action.schedulerHints!.pollIntervalMs!,
      });
    }

    expect(tracker.getAll().length).toBe(2);

    // Poll one
    const status = tracker.poll("bg1");
    expect(status.state).toBe("running");

    // Mark one completed and collect
    tracker.markCompleted("bg1", { status: "ok", value: { result: 42 } });
    const completed = tracker.collectCompleted();
    expect(completed.length).toBe(1);
    expect(completed[0].effectId).toBe("bg1");
    expect(completed[0].result!.value).toEqual({ result: 42 });

    // bg1 removed, bg2 still tracked
    expect(tracker.getAll().length).toBe(1);
    expect(tracker.get("bg2")).toBeDefined();
    expect(tracker.get("bg1")).toBeUndefined();
  });

  test("applyBackgroundDefaults sets pollIntervalMs when missing", () => {
    const action = makeAction("d1", { schedulerHints: { background: true } });
    const withDefaults = applyBackgroundDefaults(action);
    expect(withDefaults.schedulerHints!.pollIntervalMs).toBe(5000);
  });

  test("applyBackgroundDefaults does not override existing pollIntervalMs", () => {
    const action = makeAction("d2", { schedulerHints: { background: true, pollIntervalMs: 1000 } });
    const withDefaults = applyBackgroundDefaults(action);
    expect(withDefaults.schedulerHints!.pollIntervalMs).toBe(1000);
  });

  test("applyBackgroundDefaults is a no-op for foreground actions", () => {
    const action = makeAction("d3");
    const result = applyBackgroundDefaults(action);
    expect(result).toBe(action); // same reference, no modification
  });
});

describe("GAP-PAR integration: EffectGroupRegistry + buildEffectGroup", () => {
  test("creates a registry group, adds members from buildEffectGroup, resolves, and verifies completion", () => {
    const actions: EffectAction[] = [
      makeAction("r1"),
      makeAction("r2"),
      makeAction("r3"),
    ];

    const group = buildEffectGroup(actions, { persistent: true });
    const registry = new EffectGroupRegistry();

    // Create a registry entry
    const coordinatorId = group.actions[0].effectId;
    const groupId = registry.createGroup({
      label: "test-group",
      persistent: true,
      createdAt: new Date().toISOString(),
      coordinatorEffectId: coordinatorId,
    });

    // Add each action as a member
    for (const action of group.actions) {
      registry.addMember(groupId, {
        effectId: action.effectId,
        role: action.schedulerHints!.groupRole!,
      });
    }

    expect(registry.getMembers(groupId).length).toBe(3);
    expect(registry.getGroup(groupId)!.status).toBe(EffectGroupStatus.Active);

    // Resolve two of three
    registry.markResolved(groupId, "r1");
    registry.markResolved(groupId, "r2");
    expect(registry.getResolvedCount(groupId)).toBe(2);
    expect(registry.getGroup(groupId)!.status).toBe(EffectGroupStatus.Active);

    // Record a checkpoint
    registry.recordCheckpoint(groupId, {
      timestamp: new Date().toISOString(),
      reason: "progress check",
    });
    const checkpoints = registry.getCheckpoints(groupId);
    expect(checkpoints.length).toBe(1);
    expect(checkpoints[0].resolvedCount).toBe(2);
    expect(checkpoints[0].totalCount).toBe(3);

    // Resolve last member -> group completes
    registry.markResolved(groupId, "r3");
    expect(registry.getGroup(groupId)!.status).toBe(EffectGroupStatus.Completed);
    expect(registry.getResolvedCount(groupId)).toBe(3);
  });

  test("markFailed on coordinator fails the group", () => {
    const group = buildEffectGroup([makeAction("c1"), makeAction("c2")], { persistent: true });
    const registry = new EffectGroupRegistry();

    const groupId = registry.createGroup({
      label: "fail-test",
      persistent: true,
      createdAt: new Date().toISOString(),
      coordinatorEffectId: "c1",
    });

    for (const action of group.actions) {
      registry.addMember(groupId, {
        effectId: action.effectId,
        role: action.schedulerHints!.groupRole!,
      });
    }

    registry.markFailed(groupId, "c1", {
      reason: "coordinator crashed",
      timestamp: new Date().toISOString(),
    });

    expect(registry.getGroup(groupId)!.status).toBe(EffectGroupStatus.Failed);
    expect(registry.getGroup(groupId)!.failureReason).toBe("coordinator crashed");
  });
});

describe("GAP-PAR integration: mergeEffectGroups + groupActionsByParallelGroup", () => {
  test("merges two groups then re-groups by parallelGroupId", () => {
    const groupA = buildEffectGroup(
      [
        makeAction("m1", { schedulerHints: { parallelGroupId: "pg-alpha" } }),
        makeAction("m2", { schedulerHints: { parallelGroupId: "pg-beta" } }),
      ],
      { persistent: false }
    );

    const groupB = buildEffectGroup(
      [
        makeAction("m3", { schedulerHints: { parallelGroupId: "pg-alpha" } }),
        makeAction("m4", { schedulerHints: { parallelGroupId: "pg-beta" } }),
      ],
      { persistent: false }
    );

    const merged = mergeEffectGroups([groupA, groupB]);
    expect(merged.actions.length).toBe(4);

    // Each action retains its parallelGroupId (set before buildEffectGroup overlaid effectGroupId)
    const reGrouped = groupActionsByParallelGroup(merged.actions);
    expect(reGrouped.get("pg-alpha")!.map((a) => a.effectId)).toEqual(["m1", "m3"]);
    expect(reGrouped.get("pg-beta")!.map((a) => a.effectId)).toEqual(["m2", "m4"]);
  });

  test("mergeEffectGroups deduplicates by effectId", () => {
    const shared = makeAction("dup1", { schedulerHints: { parallelGroupId: "pg-x" } });

    const g1 = buildEffectGroup([shared, makeAction("u1")], { persistent: false });
    const g2 = buildEffectGroup([shared, makeAction("u2")], { persistent: false });

    const merged = mergeEffectGroups([g1, g2]);
    // dup1 appears once, u1 once, u2 once
    const ids = merged.actions.map((a) => a.effectId);
    expect(ids).toEqual(["dup1", "u1", "u2"]);
  });
});

describe("GAP-PAR integration: full pipeline", () => {
  test("build group -> partition -> classify -> apply defaults -> track background -> verify registry", () => {
    // Step 1: Build an effect group with mixed foreground/background actions
    const actions: EffectAction[] = [
      makeAction("p1", { schedulerHints: { parallelGroupId: "pipeline-pg" } }),
      makeAction("p2", { schedulerHints: { parallelGroupId: "pipeline-pg", background: true } }),
      makeAction("p3", { schedulerHints: { background: true } }),
      makeAction("p4"),
    ];

    const group = buildEffectGroup(actions, { persistent: true });
    expect(group.actions.length).toBe(4);

    // All actions share the same effectGroupId
    const effectGroupId = group.actions[0].schedulerHints!.effectGroupId!;
    for (const a of group.actions) {
      expect(a.schedulerHints!.effectGroupId).toBe(effectGroupId);
    }

    // Step 2: Partition by background
    const { foreground, background } = partitionByBackground(group.actions);
    expect(foreground.map((a) => a.effectId)).toEqual(["p1", "p4"]);
    expect(background.map((a) => a.effectId)).toEqual(["p2", "p3"]);

    // Step 3: Classify waiting actions (reassigns shared parallelGroupIds for bg)
    const classified = classifyWaitingActions(group.actions);
    expect(classified.blocking.length).toBe(2);
    expect(classified.background.length).toBe(2);

    // p2 shares parallelGroupId "pipeline-pg" with foreground p1, so it gets reassigned
    const p2Classified = classified.background.find((a) => a.effectId === "p2")!;
    expect(p2Classified.schedulerHints!.parallelGroupId).toBe("pipeline-pg:bg");

    // p3 has no parallelGroupId conflict, keeps original (undefined)
    const p3Classified = classified.background.find((a) => a.effectId === "p3")!;
    expect(p3Classified.schedulerHints!.parallelGroupId).toBeUndefined();

    // Step 4: Apply background defaults and track
    const tracker = new BackgroundEffectTracker();
    for (const bgAction of classified.background) {
      const withDefaults = applyBackgroundDefaults(bgAction);
      expect(withDefaults.schedulerHints!.pollIntervalMs).toBeDefined();

      const record = createBackgroundEffectRecord(withDefaults);
      expect(record.background).toBe(true);
      expect(record.dispatchedAt).toBeDefined();

      tracker.track({
        effectId: withDefaults.effectId,
        invocationKey: withDefaults.invocationKey,
        kind: withDefaults.kind,
        dispatchedAt: record.dispatchedAt!,
        pollIntervalMs: withDefaults.schedulerHints!.pollIntervalMs!,
      });
    }

    expect(tracker.getAll().length).toBe(2);

    // Step 5: Set up the registry
    const registry = new EffectGroupRegistry();
    const registryGroupId = registry.createGroup({
      label: "full-pipeline-group",
      persistent: true,
      createdAt: new Date().toISOString(),
      coordinatorEffectId: group.actions[0].effectId,
    });

    for (const a of group.actions) {
      registry.addMember(registryGroupId, {
        effectId: a.effectId,
        role: a.schedulerHints!.groupRole!,
      });
    }

    expect(registry.getMembers(registryGroupId).length).toBe(4);
    expect(registry.getGroup(registryGroupId)!.status).toBe(EffectGroupStatus.Active);

    // Step 6: Simulate resolution of all effects
    // Resolve foreground effects
    for (const fgAction of classified.blocking) {
      registry.markResolved(registryGroupId, fgAction.effectId);
    }
    expect(registry.getResolvedCount(registryGroupId)).toBe(2);
    expect(registry.getGroup(registryGroupId)!.status).toBe(EffectGroupStatus.Active);

    // Resolve background effects via tracker -> registry
    for (const bgAction of classified.background) {
      tracker.markCompleted(bgAction.effectId, { status: "ok", value: "done" });
      registry.markResolved(registryGroupId, bgAction.effectId);
    }

    const completed = tracker.collectCompleted();
    expect(completed.length).toBe(2);
    expect(tracker.getAll().length).toBe(0);

    // Registry group should now be completed
    expect(registry.getResolvedCount(registryGroupId)).toBe(4);
    expect(registry.getGroup(registryGroupId)!.status).toBe(EffectGroupStatus.Completed);

    // Record a final checkpoint
    registry.recordCheckpoint(registryGroupId, {
      timestamp: new Date().toISOString(),
      reason: "pipeline complete",
    });
    const checkpoints = registry.getCheckpoints(registryGroupId);
    expect(checkpoints.length).toBe(1);
    expect(checkpoints[0].resolvedCount).toBe(4);
    expect(checkpoints[0].totalCount).toBe(4);
  });
});
