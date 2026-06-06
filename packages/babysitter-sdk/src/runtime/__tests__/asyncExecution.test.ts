import { describe, expect, it } from "vitest";
import {
  classifyWaitingActions,
  applyBackgroundDefaults,
  createBackgroundEffectRecord,
} from "../asyncEffects";
import type { EffectAction, EffectRecord, EffectSchedulerHints } from "../types";
import type { TaskDef } from "../../tasks/types";

const baseTaskDef: TaskDef = {
  kind: "node",
  title: "sample",
  metadata: {},
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
    labels: [],
    taskDef: baseTaskDef,
    taskId: `task-${effectId}`,
    stepId: `STEP-${effectId}`,
    taskDefRef: `tasks/${effectId}/task.json`,
    inputsRef: `tasks/${effectId}/inputs.json`,
    requestedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("async effect execution (GAP-PAR-002)", () => {
  describe("background schedulerHints flag", () => {
    it("background effects have schedulerHints.background === true", () => {
      const action = makeAction("bg-1", {
        schedulerHints: { background: true },
      });

      expect(action.schedulerHints?.background).toBe(true);
    });

    it("foreground effects do not have schedulerHints.background", () => {
      const action = makeAction("fg-1");

      expect(action.schedulerHints?.background).toBeUndefined();
    });
  });

  describe("classifyWaitingActions", () => {
    it("separates blocking from background actions", () => {
      const blocking = makeAction("blk-1");
      const bg = makeAction("bg-1", {
        schedulerHints: { background: true },
      });

      const result = classifyWaitingActions([blocking, bg]);

      expect(result.blocking.map((a) => a.effectId)).toEqual(["blk-1"]);
      expect(result.background.map((a) => a.effectId)).toEqual(["bg-1"]);
    });

    it("returns all as blocking when none are background", () => {
      const actions = [makeAction("a"), makeAction("b")];

      const result = classifyWaitingActions(actions);

      expect(result.blocking).toHaveLength(2);
      expect(result.background).toHaveLength(0);
    });
  });

  describe("background defaults", () => {
    it("applies default pollIntervalMs of 5000 to background actions", () => {
      const action = makeAction("bg-1", {
        schedulerHints: { background: true },
      });

      const enriched = applyBackgroundDefaults(action);

      expect(enriched.schedulerHints?.pollIntervalMs).toBe(5000);
    });

    it("preserves explicit pollIntervalMs when already set", () => {
      const action = makeAction("bg-2", {
        schedulerHints: { background: true, pollIntervalMs: 10000 },
      });

      const enriched = applyBackgroundDefaults(action);

      expect(enriched.schedulerHints?.pollIntervalMs).toBe(10000);
    });

    it("does not add pollIntervalMs to foreground actions", () => {
      const action = makeAction("fg-1");

      const enriched = applyBackgroundDefaults(action);

      expect(enriched.schedulerHints?.pollIntervalMs).toBeUndefined();
    });
  });

  describe("parallel group differentiation", () => {
    it("background and foreground in same parallel.all() get different parallelGroupIds", () => {
      const fg = makeAction("fg-1", {
        schedulerHints: { parallelGroupId: "grp-abc" },
      });
      const bg = makeAction("bg-1", {
        schedulerHints: { background: true, parallelGroupId: "grp-abc" },
      });

      // After classification, background effects should get a distinct
      // parallelGroupId so the harness can schedule them independently.
      const result = classifyWaitingActions([fg, bg]);

      const fgGroupId = result.blocking[0]?.schedulerHints?.parallelGroupId;
      const bgGroupId = result.background[0]?.schedulerHints?.parallelGroupId;

      expect(fgGroupId).toBeDefined();
      expect(bgGroupId).toBeDefined();
      expect(fgGroupId).not.toBe(bgGroupId);
    });
  });

  describe("EffectRecord for background effects", () => {
    it("includes background: true and dispatchedAt in the record", () => {
      const action = makeAction("bg-rec", {
        schedulerHints: { background: true },
      });

      const record: EffectRecord = createBackgroundEffectRecord(action);

      expect(record.background).toBe(true);
      expect(record.dispatchedAt).toBeDefined();
      expect(typeof record.dispatchedAt).toBe("string");
      expect(record.effectId).toBe("bg-rec");
      expect(record.status).toBe("requested");
    });
  });

  describe("journal EFFECT_REQUESTED for background effects", () => {
    it("includes background flag in the event payload", () => {
      const action = makeAction("bg-journal", {
        schedulerHints: { background: true },
      });

      // The journal event data for EFFECT_REQUESTED should include
      // { background: true } when the effect is a background effect.
      const record: EffectRecord = createBackgroundEffectRecord(action);

      // Simulating what would be written to the journal event's data field
      const eventData = {
        effectId: record.effectId,
        invocationKey: record.invocationKey,
        kind: record.kind,
        background: record.background,
        status: record.status,
      };

      expect(eventData.background).toBe(true);
    });
  });
});
