import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createRunDir } from "../../storage/createRunDir";
import { appendEvent } from "../../storage/journal";
import { orchestrateIteration } from "../orchestrateIteration";
import type { EffectAction } from "../types";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-effect-actions-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("EffectAction contract", () => {
  test("waiting results expose scheduler hints, refs, and metadata", async () => {
    const processDir = path.join(tmpRoot, "processes");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = path.join(processDir, "parallelSleep.mjs");
    const sleepIso = "2099-01-01T00:00:00.000Z";

    await fs.writeFile(
      processPath,
      `
      const alpha = {
        id: "alpha-task",
        async build(args) {
          return { kind: "node", title: "alpha", labels: ["alpha"], metadata: args };
        }
      };
      const beta = {
        id: "beta-task",
        async build(args) {
          return { kind: "node", title: "beta", metadata: args };
        }
      };

      export async function process(inputs, ctx) {
        await ctx.parallel.all([
          async () => ctx.task(alpha, { value: inputs.value }),
          async () => ctx.task(beta, { value: inputs.value * 2 }),
          async () => ctx.sleepUntil(inputs.sleepUntil, { label: "sleep-thunk" }),
        ]);
        return "unreachable";
      }
    `,
      "utf8"
    );

    const runId = "run-effect-actions";
    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId,
      request: "contract",
      processPath,
      inputs: { value: 5, sleepUntil: sleepIso },
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });

    const iteration = await orchestrateIteration({ runDir });
    expect(iteration.status).toBe("waiting");
    if (iteration.status !== "waiting") {
      throw new Error("Expected waiting iteration");
    }

    const actions = iteration.nextActions;
    expect(actions).toHaveLength(3);
    actions.forEach((action) => {
      expect(action.taskDefRef).toBeTruthy();
      expect(action.schedulerHints?.pendingCount).toBe(actions.length);
    });

    const parallelGroupIds = new Set(actions.map((action) => action.schedulerHints?.parallelGroupId));
    expect(parallelGroupIds.size).toBe(1);

    const sleepAction = actions.find((action) => action.kind === "sleep");
    expect(sleepAction?.schedulerHints?.sleepUntilEpochMs).toBe(Date.parse(sleepIso));

    const sanitized = sanitizeActions(actions);
    expect(sanitized).toMatchFileSnapshot("__snapshots__/effectActions.waiting.json");
  });
});

function sanitizeActions(actions: EffectAction[]) {
  const parallelMapping = new Map<string, string>();
  let groupCounter = 1;

  const mapParallelId = (value?: string) => {
    if (!value) return undefined;
    if (!parallelMapping.has(value)) {
      parallelMapping.set(value, `group-${groupCounter++}`);
    }
    return parallelMapping.get(value);
  };

  return actions.map((action, index) => {
    const schedulerHints = action.schedulerHints
      ? {
          pendingCount: action.schedulerHints.pendingCount,
          sleepUntilEpochMs: action.schedulerHints.sleepUntilEpochMs,
          parallelGroupId: mapParallelId(action.schedulerHints.parallelGroupId),
        }
      : undefined;

    return {
      slot: index,
      kind: action.kind,
      label: action.label,
      taskId: action.taskId,
      stepId: action.stepId,
      refs: {
        taskDefRef: scrubRef(action.taskDefRef, action.effectId, index),
        inputsRef: scrubRef(action.inputsRef, action.effectId, index),
      },
      schedulerHints,
      taskDef: {
        kind: action.taskDef.kind,
        title: action.taskDef.title,
        metadataKeys: action.taskDef.metadata ? Object.keys(action.taskDef.metadata).sort() : [],
      },
    };
  });
}

function scrubRef(ref: string | undefined, effectId: string, index: number) {
  if (!ref) return ref;
  return ref.replace(effectId, `effect-${index}`);
}
