import { describe, expect, test } from "vitest";
import { createDeterministicRunHarness } from "../deterministic";
import { runToCompletionWithFakeRunner } from "../runHarness";

function buildUlidSequence(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const suffix = index.toString().padStart(4, "0");
    return `01HDETSEED000000000000${suffix}`;
  });
}

describe("runToCompletionWithFakeRunner", () => {
  test("completes a run by faking node task results", async () => {
    const seeds = buildUlidSequence(32);
    const harness = await createCounterHarness("run-complete", 3, seeds);
    try {
      const resolutionValues: number[] = [];
      const result = await runToCompletionWithFakeRunner({
        runDir: harness.runDir,
        clock: harness.clock,
        ulids: harness.ulids,
        resolve(action) {
          if (action.taskId === "counter") {
            const value = (action.taskDef.metadata as { value: number }).value;
            resolutionValues.push(value);
            return { status: "ok", value: { value } };
          }
          return undefined;
        },
      });

      expect(result.status).toBe("completed");
      expect(result.output).toEqual({ final: 4 });
      expect(result.executed).toHaveLength(2);
      expect(resolutionValues).toEqual([3, 4]);
      expect(result.executed.map((entry) => entry.action.effectId)).toEqual([seeds[1], seeds[4]]);
      const logEffectIds = result.executionLog.flatMap((iteration) => iteration.executed.map((entry) => entry.effectId));
      expect(logEffectIds).toEqual([seeds[1], seeds[4]]);
      expect(result.executionLog[result.executionLog.length - 1]?.status).toBe("completed");
    } finally {
      await harness.cleanup();
    }
  });

  test("returns waiting status when a pending action is left unresolved", async () => {
    const seeds = buildUlidSequence(24);
    const harness = await createCounterHarness("run-waiting", 1, seeds);
    try {
      const result = await runToCompletionWithFakeRunner({
        runDir: harness.runDir,
        clock: harness.clock,
        ulids: harness.ulids,
        resolve(action) {
          if (action.taskDef.metadata?.step === "first") {
            const value = (action.taskDef.metadata as { value: number }).value;
            return { status: "ok", value: { value } };
          }
          return undefined;
        },
      });

      expect(result.status).toBe("waiting");
      expect(result.pending).toHaveLength(1);
      expect(result.executed).toHaveLength(1);
      expect(result.pending?.[0].taskDef.metadata?.step).toBe("second");
      expect(result.executed[0]?.action.effectId).toBe(seeds[1]);
      expect(result.executionLog[0]?.executed[0]?.effectId).toBe(seeds[1]);
      expect(result.executionLog[result.executionLog.length - 1]?.pending[0]?.effectId).toBe(
        result.pending?.[0].effectId
      );
    } finally {
      await harness.cleanup();
    }
  });

  test("enforces the max iteration safeguard", async () => {
    const harness = await createCounterHarness("run-max-iterations", 2);
    try {
      await expect(
        runToCompletionWithFakeRunner({
          runDir: harness.runDir,
          clock: harness.clock,
          ulids: harness.ulids,
          maxIterations: 1,
          resolve(action) {
            if (action.taskId === "counter") {
              const value = (action.taskDef.metadata as { value: number }).value;
              return { status: "ok", value: { value } };
            }
            return undefined;
          },
        })
      ).rejects.toThrow(/maxIterations=1/);
    } finally {
      await harness.cleanup();
    }
  });
});

async function createCounterHarness(runId: string, initialValue: number, ulidPreset?: string[]) {
  return createDeterministicRunHarness({
    runId,
    processSource: `
      const counterTask = {
        id: "counter",
        async build(args) {
          return { kind: "node", title: "counter", metadata: args };
        }
      };

      export async function process(inputs, ctx) {
        const first = await ctx.task(counterTask, { step: "first", value: inputs.value });
        const second = await ctx.task(counterTask, { step: "second", value: first.value + 1 });
        return { final: second.value };
      }
    `,
    inputs: { value: initialValue },
    ulids: ulidPreset ? { preset: ulidPreset } : undefined,
  });
}
