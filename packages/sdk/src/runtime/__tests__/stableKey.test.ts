import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createRunDir } from "../../storage/createRunDir";
import { appendEvent } from "../../storage/journal";
import { buildEffectIndex } from "../replay/effectIndex";
import { ReplayCursor } from "../replay/replayCursor";
import { runTaskIntrinsic } from "../intrinsics/task";
import {
  EffectPendingError,
  EffectRequestedError,
} from "../exceptions";
import { DefinedTask } from "../types";
import { TaskIntrinsicContext } from "../intrinsics/task";

const sampleTask: DefinedTask<{ value: number }, number> = {
  id: "sample-task",
  build: async (args) => ({
    kind: "node",
    title: "sample",
    metadata: args,
  }),
};

const otherTask: DefinedTask<{ msg: string }, string> = {
  id: "other-task",
  build: async (args) => ({
    kind: "node",
    title: "other",
    metadata: args,
  }),
};

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-stablekey-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function createRun(runId = "run-stablekey") {
  const { runDir } = await createRunDir({
    runsRoot: tmpRoot,
    runId,
    request: "stablekey-test",
    processPath: "./process.js",
  });
  await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });
  return { runDir, runId };
}

async function buildContext(runDir: string, runId: string): Promise<TaskIntrinsicContext> {
  const effectIndex = await buildEffectIndex({ runDir });
  const replayCursor = new ReplayCursor();
  return {
    runId,
    runDir,
    processId: "demo-process",
    effectIndex,
    replayCursor,
    now: () => new Date(),
  };
}

describe("stableKey option on ctx.task()", () => {
  test("stableKey prevents cursor advancement", async () => {
    const { runDir, runId } = await createRun("run-sk-no-advance");
    const context = await buildContext(runDir, runId);

    expect(context.replayCursor.value).toBe(0);

    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 1 },
        invokeOptions: { stableKey: "my-key" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
    }

    // Cursor must NOT have advanced because stableKey was provided
    expect(context.replayCursor.value).toBe(0);
  });

  test("stableKey produces same invocationKey across calls", async () => {
    const { runDir, runId } = await createRun("run-sk-same-key");
    const context = await buildContext(runDir, runId);

    let firstInvocationKey: string | undefined;

    // First call: creates a new effect (EffectRequestedError)
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 2 },
        invokeOptions: { stableKey: "my-key" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      firstInvocationKey = (error as EffectRequestedError).action.invocationKey;
    }
    expect(firstInvocationKey).toBeDefined();

    // Second call with same stableKey: should hit the index (EffectPendingError)
    let secondInvocationKey: string | undefined;
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 2 },
        invokeOptions: { stableKey: "my-key" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectPendingError);
      secondInvocationKey = (error as EffectPendingError).action.invocationKey;
    }
    expect(secondInvocationKey).toBeDefined();

    // Both calls must produce the same invocationKey
    expect(firstInvocationKey).toBe(secondInvocationKey);

    // Cursor should still be at 0 — neither call advanced it
    expect(context.replayCursor.value).toBe(0);
  });

  test("without stableKey, cursor advances normally (regression guard)", async () => {
    const { runDir, runId } = await createRun("run-sk-regression");
    const context = await buildContext(runDir, runId);

    expect(context.replayCursor.value).toBe(0);

    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 3 },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
    }

    // Without stableKey the cursor MUST advance
    expect(context.replayCursor.value).toBe(1);
  });

  test("stableKey and normal calls can coexist", async () => {
    const { runDir, runId } = await createRun("run-sk-coexist");
    const context = await buildContext(runDir, runId);

    let stableInvocationKey: string | undefined;
    let normalInvocationKey: string | undefined;

    // First call: stableKey (should NOT advance cursor)
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 10 },
        invokeOptions: { stableKey: "key-a" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      stableInvocationKey = (error as EffectRequestedError).action.invocationKey;
    }
    expect(context.replayCursor.value).toBe(0);

    // Second call: no stableKey, different task (WILL advance cursor)
    try {
      await runTaskIntrinsic({
        task: otherTask,
        args: { msg: "hello" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      normalInvocationKey = (error as EffectRequestedError).action.invocationKey;
    }
    // Only the non-stableKey call advanced the cursor
    expect(context.replayCursor.value).toBe(1);

    // Both effects should have different invocationKeys
    expect(stableInvocationKey).toBeDefined();
    expect(normalInvocationKey).toBeDefined();
    expect(stableInvocationKey).not.toBe(normalInvocationKey);
  });

  test("two different stableKeys produce different effects", async () => {
    const { runDir, runId } = await createRun("run-sk-diff-keys");
    const context = await buildContext(runDir, runId);

    let effectIdA: string | undefined;
    let effectIdB: string | undefined;

    // First call with stableKey='key-a'
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 20 },
        invokeOptions: { stableKey: "key-a" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      effectIdA = (error as EffectRequestedError).action.effectId;
    }

    // Second call with stableKey='key-b'
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 21 },
        invokeOptions: { stableKey: "key-b" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      effectIdB = (error as EffectRequestedError).action.effectId;
    }

    // Should have two distinct effect IDs
    expect(effectIdA).toBeDefined();
    expect(effectIdB).toBeDefined();
    expect(effectIdA).not.toBe(effectIdB);

    // Cursor should still be at 0 — neither stableKey call advances it
    expect(context.replayCursor.value).toBe(0);
  });
});
