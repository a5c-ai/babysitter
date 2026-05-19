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

describe("key option on ctx.task()", () => {
  test("key prevents cursor advancement", async () => {
    const { runDir, runId } = await createRun("run-sk-no-advance");
    const context = await buildContext(runDir, runId);

    expect(context.replayCursor.value).toBe(0);

    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 1 },
        invokeOptions: { key: "my-key" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
    }

    // Cursor must NOT have advanced because key was provided
    expect(context.replayCursor.value).toBe(0);
  });

  test("key produces same invocationKey across calls", async () => {
    const { runDir, runId } = await createRun("run-sk-same-key");
    const context = await buildContext(runDir, runId);

    let firstInvocationKey: string | undefined;

    // First call: creates a new effect (EffectRequestedError)
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 2 },
        invokeOptions: { key: "my-key" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      firstInvocationKey = (error as EffectRequestedError).action.invocationKey;
    }
    expect(firstInvocationKey).toBeDefined();

    // Second call with same key: should hit the index (EffectPendingError)
    let secondInvocationKey: string | undefined;
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 2 },
        invokeOptions: { key: "my-key" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectPendingError);
      secondInvocationKey = (error as EffectPendingError).action.invocationKey;
    }
    expect(secondInvocationKey).toBeDefined();

    // Both calls must produce the same invocationKey
    expect(firstInvocationKey).toBe(secondInvocationKey);

    // Cursor should still be at 0 - neither call advanced it.
    expect(context.replayCursor.value).toBe(0);
  });

  test("without explicit key, cursor advances for legacy stepId compatibility", async () => {
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

    // Without key the cursor advances so old stepId-only runs can still replay.
    expect(context.replayCursor.value).toBe(1);
  });

  test("key and derived-key calls can coexist", async () => {
    const { runDir, runId } = await createRun("run-sk-coexist");
    const context = await buildContext(runDir, runId);

    let stableInvocationKey: string | undefined;
    let normalInvocationKey: string | undefined;

    // First call: explicit key (should NOT advance cursor)
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 10 },
        invokeOptions: { key: "key-a" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      stableInvocationKey = (error as EffectRequestedError).action.invocationKey;
    }
    expect(context.replayCursor.value).toBe(0);

    // Second call: no explicit key, different task (WILL advance cursor).
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
    // Only the non-keyed call advanced the cursor.
    expect(context.replayCursor.value).toBe(1);

    // Both effects should have different invocationKeys
    expect(stableInvocationKey).toBeDefined();
    expect(normalInvocationKey).toBeDefined();
    expect(stableInvocationKey).not.toBe(normalInvocationKey);
  });

  test("two different keys produce different effects", async () => {
    const { runDir, runId } = await createRun("run-sk-diff-keys");
    const context = await buildContext(runDir, runId);

    let effectIdA: string | undefined;
    let effectIdB: string | undefined;

    // First call with key='key-a'
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 20 },
        invokeOptions: { key: "key-a" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      effectIdA = (error as EffectRequestedError).action.effectId;
    }

    // Second call with key='key-b'
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 21 },
        invokeOptions: { key: "key-b" },
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

    // Cursor should still be at 0 - neither explicit-key call advances it.
    expect(context.replayCursor.value).toBe(0);
  });

  test("derived key idx distinguishes repeated same-task calls in loops", async () => {
    const { runDir, runId } = await createRun("run-derived-loop-idx");
    const context = await buildContext(runDir, runId);

    const invocationKeys: string[] = [];
    for (const value of [1, 2]) {
      try {
        await runTaskIntrinsic({
          task: sampleTask,
          args: { value },
          invokeOptions: { label: "loop" },
          context,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(EffectRequestedError);
        invocationKeys.push((error as EffectRequestedError).action.invocationKey);
      }
    }

    expect(invocationKeys).toHaveLength(2);
    expect(invocationKeys[0]).not.toBe(invocationKeys[1]);
  });

  test("legacy stableKey alias still works", async () => {
    const { runDir, runId } = await createRun("run-sk-alias");
    const context = await buildContext(runDir, runId);

    let firstInvocationKey: string | undefined;
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 30 },
        invokeOptions: { stableKey: "legacy-key" },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      firstInvocationKey = (error as EffectRequestedError).action.invocationKey;
    }

    await expect(
      runTaskIntrinsic({
        task: sampleTask,
        args: { value: 31 },
        invokeOptions: { stableKey: "legacy-key" },
        context,
      })
    ).rejects.toMatchObject({
      action: {
        invocationKey: firstInvocationKey,
      },
    });
  });
});
