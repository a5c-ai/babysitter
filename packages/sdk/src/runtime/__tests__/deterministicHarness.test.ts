import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import {
  createDeterministicRunHarness,
  captureRunSnapshot,
  type RunSnapshot,
} from "../../testing";
import { runToCompletionWithFakeRunner, type FakeActionResolver } from "../../testing/runHarness";
import type { EffectAction } from "../types";

const PROCESS_FILENAME = "deterministic-harness.mjs";

describe("deterministic testing harness", () => {
  let fixtureRoot: string;

  beforeEach(async () => {
    fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-deterministic-"));
  });

  afterEach(async () => {
    await fs.rm(fixtureRoot, { recursive: true, force: true });
  });

  test("replays seeded runs with identical journal/state snapshots through a resume flow", async () => {
    const processPath = await writeResumeProcess(fixtureRoot);
    const first = await executeDeterministicRun(processPath, "det-harness");
    const second = await executeDeterministicRun(processPath, "det-harness");

    expect(first.snapshot).toEqual(second.snapshot);
    expect(first.invocationKeys).toEqual(second.invocationKeys);
    expect(first.journalInvocationKey).toBe(first.invocationKeys[0]);
    expect(second.journalInvocationKey).toBe(second.invocationKeys[0]);
  });
});

interface RunArtifacts {
  snapshot: RunSnapshot;
  invocationKeys: string[];
  journalInvocationKey: string;
}

async function executeDeterministicRun(processPath: string, runId: string): Promise<RunArtifacts> {
  const harness = await createDeterministicRunHarness({
    processPath,
    runId,
    inputs: { start: 2, increment: 3 },
  });
  try {
    await expect(
      runToCompletionWithFakeRunner({
        runDir: harness.runDir,
        resolve: createFailingResolver(),
        clock: harness.clock,
        ulids: harness.ulids,
      })
    ).rejects.toThrow(/resolver failed before commit/i);

    const waitingSnapshot = await captureRunSnapshot(harness.runDir);
    const firstRequest = waitingSnapshot.journal.find((event) => event.type === "EFFECT_REQUESTED");
    const journalInvocationKey = String(firstRequest?.data?.invocationKey ?? "");
    expect(journalInvocationKey).toMatch(/^.+$/);

    const completion = await runToCompletionWithFakeRunner({
      runDir: harness.runDir,
      resolve: createTaskResolver(),
      clock: harness.clock,
      ulids: harness.ulids,
    });

    expect(completion.status).toBe("completed");
    expect(completion.executed).toHaveLength(2);
    expect(completion.executed[0]?.action.invocationKey).toBe(journalInvocationKey);

    const snapshot = await captureRunSnapshot(harness.runDir);
    const invocationKeys = completion.executed.map((entry) => entry.action.invocationKey);
    return {
      snapshot,
      invocationKeys,
      journalInvocationKey,
    };
  } finally {
    await harness.cleanup();
  }
}

async function writeResumeProcess(root: string) {
  const processPath = path.join(root, PROCESS_FILENAME);
  const contents = `
    const deterministicTask = {
      id: "deterministic-counter",
      async build(args) {
        return {
          kind: "node",
          title: \`resume \${args.step}\`,
          metadata: args,
        };
      },
    };

    export async function process(inputs, ctx) {
      const first = await ctx.task(deterministicTask, { step: "alpha", value: inputs.start });
      const second = await ctx.task(deterministicTask, { step: "beta", value: first.value + inputs.increment });
      return { final: second.value };
    }
  `;
  await fs.writeFile(processPath, contents, "utf8");
  return processPath;
}

function createFailingResolver(): FakeActionResolver {
  let thrown = false;
  return async function failingResolver(action: EffectAction) {
    if (!thrown && action.taskId === "deterministic-counter") {
      thrown = true;
      throw new Error("resolver failed before commit");
    }
    return undefined;
  };
}

function createTaskResolver(): FakeActionResolver {
  return function resolve(action: EffectAction) {
    if (action.taskId === "deterministic-counter") {
      const value = (action.taskDef.metadata as { value: number }).value;
      return { status: "ok", value: { value } };
    }
    return undefined;
  };
}
