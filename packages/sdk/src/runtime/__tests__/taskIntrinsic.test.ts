import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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
  RunFailedError,
} from "../exceptions";
import { commitEffectResult } from "../commitEffectResult";
import { DefinedTask } from "../types";
import { TaskIntrinsicContext } from "../intrinsics/task";
import { globalTaskRegistry } from "../../tasks/registry";

const sampleTask: DefinedTask<{ value: number }, number> = {
  id: "sample-task",
  build: async (args) => ({
    kind: "node",
    title: "sample",
    metadata: args,
  }),
};

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-runtime-task-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function createRun(runId = "run-task") {
  const { runDir } = await createRunDir({
    runsRoot: tmpRoot,
    runId,
    request: "task-test",
    processPath: "./process.js",
  });
  await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });
  return { runDir, runId };
}

async function buildContext(runDir: string, runId: string): Promise<TaskIntrinsicContext> {
  const effectIndex = await buildEffectIndex({ runDir });
  const replayCursor = new ReplayCursor();
  const context: TaskIntrinsicContext = {
    runId,
    runDir,
    processId: "demo-process",
    effectIndex,
    replayCursor,
    now: () => new Date(),
  };
  return context;
}

describe("runTaskIntrinsic", () => {
  test("requests new effect, then short-circuits after resolution", async () => {
    const { runDir, runId } = await createRun();
    const context = await buildContext(runDir, runId);

    let requestedEffectId: string | undefined;

    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 2 },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      requestedEffectId = (error as EffectRequestedError).action.effectId;
    }

    const pendingContext = await buildContext(runDir, runId);
    await expect(
      runTaskIntrinsic({
        task: sampleTask,
        args: { value: 2 },
        context: pendingContext,
      })
    ).rejects.toThrow(EffectPendingError);

    expect(requestedEffectId).toBeDefined();

    await commitEffectResult({
      runDir,
      effectId: requestedEffectId!,
      result: { status: "ok", value: 4 },
    });

    const replayCtx = await buildContext(runDir, runId);

    await expect(
      runTaskIntrinsic({
        task: sampleTask,
        args: { value: 2 },
        context: replayCtx,
      })
    ).resolves.toBe(4);
  });

  test("throws when task result missing from disk", async () => {
    const { runDir, runId } = await createRun("run-missing-result");
    const context = await buildContext(runDir, runId);

    let effectId = "";
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 1 },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      effectId = (error as EffectRequestedError).action.effectId;
    }

    expect(effectId).not.toEqual("");

    await commitEffectResult({
      runDir,
      effectId,
      result: { status: "ok", value: 1 },
    });
    // Delete the stored result to simulate corruption.
    await fs.rm(path.join(runDir, "tasks", effectId, "result.json"));

    const replayCtx = await buildContext(runDir, runId);

  await expect(
      runTaskIntrinsic({
        task: sampleTask,
        args: { value: 1 },
        context: replayCtx,
      })
    ).rejects.toThrow(RunFailedError);
  });

  test("replays blob-spilled task results", async () => {
    const { runDir, runId } = await createRun("run-large-result");
    const context = await buildContext(runDir, runId);

    let effectId = "";
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 3 },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      effectId = (error as EffectRequestedError).action.effectId;
    }

    const largeValue = { data: "z".repeat(1024 * 1024 + 128) };
    await commitEffectResult({
      runDir,
      effectId,
      result: { status: "ok", value: largeValue },
    });

    const replayCtx = await buildContext(runDir, runId);
    await expect(
      runTaskIntrinsic({
        task: sampleTask,
        args: { value: 3 },
        context: replayCtx,
      })
    ).resolves.toEqual(largeValue);
  });

  test("throws when a resolved ok effect is missing its result payload", async () => {
    const { runDir, runId } = await createRun("run-undefined-result");
    const context = await buildContext(runDir, runId);

    let effectId = "";
    let invocationKey = "";
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 5 },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      effectId = (error as EffectRequestedError).action.effectId;
      invocationKey = (error as EffectRequestedError).action.invocationKey;
    }

    await fs.writeFile(
      path.join(runDir, "tasks", effectId, "result.json"),
      JSON.stringify(
        {
          schemaVersion: "2026.01.results-v1",
          effectId,
          taskId: sampleTask.id,
          invocationKey,
          status: "ok",
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId,
        status: "ok",
        resultRef: `tasks/${effectId}/result.json`,
      },
    });

    const replayCtx = await buildContext(runDir, runId);
    await expect(
      runTaskIntrinsic({
        task: sampleTask,
        args: { value: 5 },
        context: replayCtx,
      })
    ).rejects.toThrow(RunFailedError);
  });

  test("returns success:false shell result without throwing", async () => {
    const { runDir, runId } = await createRun("run-shell-fail");
    const context = await buildContext(runDir, runId);

    let effectId = "";
    try {
      await runTaskIntrinsic({
        task: sampleTask,
        args: { value: 7 },
        context,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EffectRequestedError);
      effectId = (error as EffectRequestedError).action.effectId;
    }

    // Simulate a shell task that failed but was posted as ok with structured failure value
    const failureValue = {
      success: false,
      exitCode: 1,
      stdout: "",
      stderr: "SyntaxError: Invalid regular expression",
      error: "Shell command exited with code 1: SyntaxError: Invalid regular expression",
    };
    await commitEffectResult({
      runDir,
      effectId,
      result: { status: "ok", value: failureValue },
    });

    const replayCtx = await buildContext(runDir, runId);
    // The process gets the failure value back instead of the run crashing
    await expect(
      runTaskIntrinsic({
        task: sampleTask,
        args: { value: 7 },
        context: replayCtx,
      })
    ).resolves.toEqual(failureValue);
  });

  test("provides TaskBuildContext metadata and records registry entries", async () => {
    const { runDir, runId } = await createRun("run-task-ctx");
    const context = await buildContext(runDir, runId);
    const buildSpy = vi.fn(async (_args, ctx) => {
      expect(ctx.taskId).toBe("ctx-task");
      expect(ctx.runDir).toBe(runDir);
      expect(ctx.runId).toBe(runId);
      expect(ctx.label).toBe("ctx-label");
      expect(ctx.labels).toEqual(["ctx-label"]);
      ctx.labels.push("builder-label");
      expect(ctx.labels).toEqual(["ctx-label", "builder-label"]);
      expect(ctx.tasksDir).toBe(path.join(runDir, "tasks"));
      expect(ctx.taskDir).toBe(path.join(runDir, "tasks", ctx.effectId));
      const blobRef = await ctx.createBlobRef("payload", { foo: "bar" });
      expect(blobRef).toMatch(new RegExp(`^tasks/${ctx.effectId}/blobs/payload-[0-9a-f]{64}\\.json$`));
      const relPath = ctx.toTaskRelativePath("artifacts/output.log");
      expect(relPath).toBe(`tasks/${ctx.effectId}/artifacts/output.log`);
      return {
        kind: "node",
        title: "ctx task",
        metadata: { ctx: true },
        labels: ["task-label", "ctx-label"],
      };
    });

    const definedTask: DefinedTask<{ value: number }, number> = {
      id: "ctx-task",
      build: buildSpy,
    };

    let capturedError: unknown;
    try {
      await runTaskIntrinsic({
        task: definedTask,
        args: { value: 11 },
        invokeOptions: { label: "  ctx-label  " },
        context,
      });
    } catch (error) {
      capturedError = error;
    }
    expect(capturedError).toBeInstanceOf(EffectRequestedError);
    const effectId = (capturedError as EffectRequestedError).action.effectId;
    expect(buildSpy).toHaveBeenCalledTimes(1);

    const registryRecord = globalTaskRegistry.get(effectId);
    expect(registryRecord).toMatchObject({
      effectId,
      taskId: definedTask.id,
      invocationKey: (capturedError as EffectRequestedError).action.invocationKey,
      kind: "node",
      label: "ctx-label",
      labels: ["ctx-label", "builder-label", "task-label"],
      status: "pending",
      taskDefRef: `tasks/${effectId}/task.json`,
    });
    expect(registryRecord?.inputsRef).toBeUndefined();
    expect(typeof registryRecord?.requestedAt).toBe("string");

    const refreshedIndex = await buildEffectIndex({ runDir });
    const indexed = refreshedIndex.getByEffectId(effectId);
    expect(indexed).toMatchObject({
      taskDefRef: `tasks/${effectId}/task.json`,
      labels: ["ctx-label", "builder-label", "task-label"],
    });
    expect(indexed?.inputsRef).toBeUndefined();
  });
});
