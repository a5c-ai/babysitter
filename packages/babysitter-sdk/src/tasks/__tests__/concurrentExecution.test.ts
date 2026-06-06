import { describe, expect, test } from "vitest";
import type { EffectAction } from "../../runtime/types";
import {
  buildEffectExecutionWaves,
  hasConcurrentEffectsCapability,
  mapWithConcurrency,
} from "../concurrentExecution";

function action(effectId: string, group?: string, maxConcurrency?: number): EffectAction {
  return {
    effectId,
    invocationKey: `proc:${effectId}`,
    kind: "node",
    taskDef: { kind: "node", title: effectId },
    schedulerHints: group
      ? { parallelGroupId: group, ...(maxConcurrency ? { maxConcurrency } : {}) }
      : undefined,
  };
}

describe("buildEffectExecutionWaves", () => {
  test("keeps every action sequential when concurrent-effects is disabled", () => {
    const waves = buildEffectExecutionWaves([action("a", "g"), action("b", "g")]);

    expect(waves).toHaveLength(2);
    expect(waves.map((wave) => wave.concurrent)).toEqual([false, false]);
    expect(waves.map((wave) => wave.actions.map((entry) => entry.effectId))).toEqual([["a"], ["b"]]);
  });

  test("groups adjacent explicit parallel groups when concurrent-effects is enabled", () => {
    const waves = buildEffectExecutionWaves(
      [action("a"), action("b", "g", 2), action("c", "g", 2), action("d")],
      { concurrentEffects: true },
    );

    expect(waves.map((wave) => wave.actions.map((entry) => entry.effectId))).toEqual([
      ["a"],
      ["b", "c"],
      ["d"],
    ]);
    expect(waves[1]?.concurrent).toBe(true);
    expect(waves[1]?.maxConcurrency).toBe(2);
  });

  test("sequential executionStrategy splits a parallel group", () => {
    const sequential = action("b", "g");
    sequential.schedulerHints = { ...sequential.schedulerHints, executionStrategy: "sequential" };

    const waves = buildEffectExecutionWaves(
      [action("a", "g"), sequential, action("c", "g")],
      { concurrentEffects: true },
    );

    expect(waves.map((wave) => wave.actions.map((entry) => entry.effectId))).toEqual([
      ["a"],
      ["b"],
      ["c"],
    ]);
  });
});

describe("mapWithConcurrency", () => {
  test("limits active workers and preserves result order", async () => {
    let active = 0;
    let maxActive = 0;
    const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return value * 2;
    });

    expect(maxActive).toBeLessThanOrEqual(2);
    expect(results.map((result) => result.value)).toEqual([2, 4, 6, 8]);
  });

  test("records rejected workers without failing fast", async () => {
    const results = await mapWithConcurrency([1, 2, 3], 3, async (value) => {
      if (value === 2) throw new Error("boom");
      return value;
    });

    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
  });
});

describe("hasConcurrentEffectsCapability", () => {
  test("detects concurrent-effects", () => {
    expect(hasConcurrentEffectsCapability(["programmatic", "concurrent-effects"])).toBe(true);
    expect(hasConcurrentEffectsCapability(["programmatic"])).toBe(false);
  });
});
