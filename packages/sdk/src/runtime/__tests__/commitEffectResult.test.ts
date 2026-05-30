import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import * as runtimeHooks from "../hooks/runtime";
import { commitEffectResult } from "../commitEffectResult";
import { runTaskIntrinsic } from "../intrinsics/task";
import { DefinedTask } from "../types";
import { buildTaskContext, createTestRun } from "./testHelpers";
import { EffectRequestedError, RunFailedError } from "../exceptions";
import { buildEffectIndex } from "../replay/effectIndex";
import { globalTaskRegistry } from "../../tasks/registry";
import { createRunDir } from "../../storage/createRunDir";
import { readStateCache } from "../replay/stateCache";
import { readTaskDefinition, readTaskResult } from "../../storage/tasks";
import { BABYSITTER_SDK_VERSION } from "../../sdkVersion";

let tmpRoot: string;

const sampleTask: DefinedTask<{ value: number }, { doubled: number }> = {
  id: "commit-test-task",
  async build(args) {
    return {
      kind: "node",
      title: "commit-test",
      metadata: args,
    };
  },
};

const shellSchemaTask: DefinedTask<{
  outputSchema?: Record<string, unknown> | false | null;
}, { verified?: boolean; checks?: unknown[] }> = {
  id: "commit-shell-schema-task",
  async build(args) {
    return {
      kind: "shell",
      title: "commit-shell-schema",
      ...(args.outputSchema !== undefined ? { outputSchema: args.outputSchema } : {}),
    };
  },
};

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-commit-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("commitEffectResult", () => {
  test("rejects duplicate commits for the same effect", async () => {
    const effect = await requestSampleEffect();

    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        result: { status: "ok", value: { doubled: 4 } },
      })
    ).resolves.toMatchObject({ resultRef: expect.any(String) });
    const resolvedRecord = globalTaskRegistry.get(effect.effectId);
    expect(resolvedRecord?.status).toBe("resolved_ok");
    expect(typeof resolvedRecord?.resolvedAt).toBe("string");

    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        result: { status: "ok", value: { doubled: 4 } },
      })
    ).rejects.toThrow(RunFailedError);
  });

  test("rejects commits for unknown effect ids and emits rejection metrics", async () => {
    const loggerEntries: Array<Record<string, unknown>> = [];
    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "missing-run",
      request: "missing-effect",
      processPath: "./process.js",
    });
    await expect(
      commitEffectResult({
        runDir,
        effectId: "01ABC",
        logger: (entry) => loggerEntries.push(entry),
        result: { status: "ok", value: {} },
      })
    ).rejects.toThrow(RunFailedError);

    expect(loggerEntries).toHaveLength(1);
    expect(loggerEntries[0]).toMatchObject({
      metric: "commit.effect",
      status: "rejected",
      reason: "unknown_effect",
    });
  });

  test("validates invocation keys when provided", async () => {
    const effect = await requestSampleEffect();
    const metrics: Record<string, unknown>[] = [];
    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        invocationKey: "proc:bad",
        logger: (entry) => metrics.push(entry),
        result: { status: "ok", value: { doubled: 2 } },
      })
    ).rejects.toThrow(RunFailedError);

    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        invocationKey: effect.invocationKey,
        logger: (entry) => metrics.push(entry),
        result: { status: "ok", value: { doubled: 2 } },
      })
    ).resolves.toMatchObject({ resultRef: expect.any(String) });

    expect(metrics[0]).toMatchObject({
      metric: "commit.effect",
      status: "rejected",
      reason: "invocation_mismatch",
      providedInvocationKey: "proc:bad",
    });
    expect(metrics[1]).toMatchObject({
      metric: "commit.effect",
      status: "ok",
      effectId: effect.effectId,
    });
  });

  test("requires matching error payloads", async () => {
    const effect = await requestSampleEffect();
    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        result: { status: "ok" },
      })
    ).rejects.toThrow(RunFailedError);

    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        result: { status: "error" },
      })
    ).rejects.toThrow(RunFailedError);

    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        result: { status: "ok", value: { doubled: 1 }, error: new Error("nope") },
      })
    ).rejects.toThrow(RunFailedError);
  });

  test("writes stdout/stderr artifacts and reports metrics", async () => {
    const effect = await requestSampleEffect();
    const metrics: Record<string, unknown>[] = [];

    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        invocationKey: effect.invocationKey,
        logger: (entry) => metrics.push(entry),
        result: {
          status: "ok",
          value: { doubled: 10 },
          stdout: "out-value",
          stderr: "err-value",
        },
      })
    ).resolves.toMatchObject({ resultRef: expect.any(String) });

    const stdoutPath = path.join(effect.runDir, "tasks", effect.effectId, "stdout.log");
    const stderrPath = path.join(effect.runDir, "tasks", effect.effectId, "stderr.log");
    await expect(fs.readFile(stdoutPath, "utf8")).resolves.toBe("out-value");
    await expect(fs.readFile(stderrPath, "utf8")).resolves.toBe("err-value");

    const index = await buildEffectIndex({ runDir: effect.runDir });
    const record = index.getByEffectId(effect.effectId);
    expect(record?.stdoutRef).toMatch(/stdout\.log$/);
    expect(record?.stderrRef).toMatch(/stderr\.log$/);

    const registryRecord = globalTaskRegistry.get(effect.effectId);
    expect(registryRecord).toMatchObject({
      status: "resolved_ok",
      stdoutRef: record?.stdoutRef,
      stderrRef: record?.stderrRef,
      resultRef: record?.resultRef,
    });
    expect(typeof registryRecord?.resolvedAt).toBe("string");

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      metric: "commit.effect",
      status: "ok",
      hasStdout: true,
      hasStderr: true,
      invocationKey: effect.invocationKey,
    });
  });

  test("stamps task definition and task result envelopes with the SDK version", async () => {
    const effect = await requestSampleEffect();
    const taskDef = await readTaskDefinition(effect.runDir, effect.effectId);
    expect(taskDef?.sdkVersion).toBe(BABYSITTER_SDK_VERSION);

    await commitEffectResult({
      runDir: effect.runDir,
      effectId: effect.effectId,
      result: {
        status: "ok",
        value: { doubled: 4 },
      },
    });

    const taskResult = await readTaskResult(effect.runDir, effect.effectId);
    expect(taskResult?.sdkVersion).toBe(BABYSITTER_SDK_VERSION);
  });

  test("rejects shell ok results that do not satisfy outputSchema before mutating run state", async () => {
    const effect = await requestShellSchemaEffect({
      type: "object",
      required: ["verified", "checks"],
      properties: {
        verified: { type: "boolean" },
        checks: { type: "array" },
      },
    });
    const hookSpy = vi.spyOn(runtimeHooks, "callRuntimeHook");
    const metrics: Record<string, unknown>[] = [];

    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        logger: (entry) => metrics.push(entry),
        result: {
          status: "ok",
          value: { verified: true },
        },
      }),
    ).rejects.toMatchObject({
      name: "RunFailedError",
      details: {
        reason: "validation_error",
        effectId: effect.effectId,
        taskId: "commit-shell-schema-task",
        kind: "shell",
        errors: expect.arrayContaining(["Missing required field: checks"]),
      },
    });

    await expect(fs.stat(path.join(effect.runDir, "tasks", effect.effectId, "result.json"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    const index = await buildEffectIndex({ runDir: effect.runDir });
    expect(index.getByEffectId(effect.effectId)?.status).toBe("requested");
    expect(globalTaskRegistry.get(effect.effectId)?.status).not.toBe("resolved_ok");
    expect(await readStateCache(effect.runDir)).toBeNull();
    expect(hookSpy).not.toHaveBeenCalled();
    expect(metrics[0]).toMatchObject({
      metric: "commit.effect",
      status: "rejected",
      reason: "validation_error",
      effectId: effect.effectId,
      taskId: "commit-shell-schema-task",
      kind: "shell",
      errors: ["Missing required field: checks"],
    });
  });

  test("commits valid shell ok results that satisfy outputSchema", async () => {
    const outputSchema = {
      type: "object",
      required: ["verified", "checks"],
      properties: {
        verified: { type: "boolean" },
        checks: { type: "array" },
      },
    };
    const effect = await requestShellSchemaEffect(outputSchema);

    await commitEffectResult({
      runDir: effect.runDir,
      effectId: effect.effectId,
      result: {
        status: "ok",
        value: { verified: true, checks: [] },
      },
    });

    const index = await buildEffectIndex({ runDir: effect.runDir });
    expect(index.getByEffectId(effect.effectId)?.status).toBe("resolved_ok");
    await expect(readTaskResult(effect.runDir, effect.effectId)).resolves.toMatchObject({
      status: "ok",
      value: { verified: true, checks: [] },
    });

    const replayContext = await buildTaskContext(effect.runDir, effect.runId);
    const replayed = await runTaskIntrinsic({
      task: shellSchemaTask,
      args: { outputSchema },
      context: replayContext,
    });
    expect(replayed).toEqual({ verified: true, checks: [] });
  });

  test("preserves shell compatibility when outputSchema is absent or false", async () => {
    const withoutSchema = await requestShellSchemaEffect();
    await expect(
      commitEffectResult({
        runDir: withoutSchema.runDir,
        effectId: withoutSchema.effectId,
        result: { status: "ok", value: { verified: true } },
      }),
    ).resolves.toMatchObject({ resultRef: expect.any(String) });

    const disabledSchema = await requestShellSchemaEffect(false);
    await expect(
      commitEffectResult({
        runDir: disabledSchema.runDir,
        effectId: disabledSchema.effectId,
        result: { status: "ok", value: { verified: true } },
      }),
    ).resolves.toMatchObject({ resultRef: expect.any(String) });
  });

  test("emits task.completed runtime hook with task and run metadata before resolving", async () => {
    const effect = await requestSampleEffect("run-completed-hook");
    const hookSpy = vi.spyOn(runtimeHooks, "callRuntimeHook").mockResolvedValue({
      hookType: "task.completed",
      success: true,
      executedHooks: [],
    });

    await commitEffectResult({
      runDir: effect.runDir,
      effectId: effect.effectId,
      result: {
        status: "ok",
        value: { doubled: 4 },
      },
    });

    expect(hookSpy).toHaveBeenCalledWith(
      "task.completed",
      expect.objectContaining({
        runId: "run-completed-hook",
        task_id: effect.effectId,
        task_kind: "node",
        task_status: "ok",
        task_result: { doubled: 4 },
        taskId: "commit-test-task",
        effectId: effect.effectId,
        kind: "node",
        status: "ok",
        result: { doubled: 4 },
      }),
      expect.objectContaining({ cwd: effect.runDir }),
    );
  });

  test("honors blocking task.completed runtime hook decisions", async () => {
    const effect = await requestSampleEffect("run-completed-blocked");
    vi.spyOn(runtimeHooks, "callRuntimeHook").mockResolvedValue({
      hookType: "task.completed",
      success: true,
      output: { decision: "deny", reason: "completion blocked" },
      executedHooks: [],
    });

    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        result: {
          status: "ok",
          value: { doubled: 4 },
        },
      }),
    ).rejects.toThrow(/completion blocked/);
  });

  test("refreshes the state cache after resolving an effect", async () => {
    const effect = await requestSampleEffect();

    await commitEffectResult({
      runDir: effect.runDir,
      effectId: effect.effectId,
      result: {
        status: "ok",
        value: { doubled: 4 },
      },
    });

    const stateCache = await readStateCache(effect.runDir);
    expect(stateCache).not.toBeNull();
    expect(stateCache?.sdkVersion).toBe(BABYSITTER_SDK_VERSION);
    expect(stateCache?.rebuildReason).toBe("post_effect_resolution");
    expect(stateCache?.journalHead?.seq).toBe(3);
    expect(stateCache?.effectsByInvocation[effect.invocationKey]).toMatchObject({
      effectId: effect.effectId,
      invocationKey: effect.invocationKey,
      status: "resolved_ok",
    });
    expect(stateCache?.pendingEffectsByKind).toEqual({});
  });

  test("reports non-empty run work directories after resolving an effect", async () => {
    const effect = await requestSampleEffect();
    const workDir = path.join(effect.runDir, "work", "leftover");
    await fs.mkdir(workDir, { recursive: true });
    await fs.writeFile(path.join(workDir, "artifact.txt"), "large clone placeholder", "utf8");

    const metrics: Record<string, unknown>[] = [];
    await commitEffectResult({
      runDir: effect.runDir,
      effectId: effect.effectId,
      logger: (entry) => metrics.push(entry),
      result: {
        status: "ok",
        value: { doubled: 4 },
      },
    });

    expect(metrics).toContainEqual(
      expect.objectContaining({
        metric: "run.workdir_leak",
        runDir: effect.runDir,
        workDir: path.join(effect.runDir, "work"),
        entryCount: 1,
      }),
    );
    await expect(fs.stat(workDir)).resolves.toBeDefined();
  });

  test("does not report absent or empty run work directories after resolving an effect", async () => {
    const absent = await requestSampleEffect();
    const absentMetrics: Record<string, unknown>[] = [];
    await commitEffectResult({
      runDir: absent.runDir,
      effectId: absent.effectId,
      logger: (entry) => absentMetrics.push(entry),
      result: { status: "ok", value: { doubled: 4 } },
    });
    expect(absentMetrics.some((entry) => entry.metric === "run.workdir_leak")).toBe(false);

    const empty = await requestSampleEffect();
    await fs.mkdir(path.join(empty.runDir, "work"), { recursive: true });
    const emptyMetrics: Record<string, unknown>[] = [];
    await commitEffectResult({
      runDir: empty.runDir,
      effectId: empty.effectId,
      logger: (entry) => emptyMetrics.push(entry),
      result: { status: "ok", value: { doubled: 4 } },
    });
    expect(emptyMetrics.some((entry) => entry.metric === "run.workdir_leak")).toBe(false);
  });

  test("reports non-empty run work directories after cancelling an effect", async () => {
    const mod = await import("../commitEffectResult");
    const commitEffectCancellation = (mod as Record<string, unknown>).commitEffectCancellation as (options: {
      runDir: string;
      effectId: string;
      reason?: string;
      logger?: (...args: any[]) => void;
    }) => Promise<{ resultRef: string }>;
    const effect = await requestSampleEffect();
    await fs.mkdir(path.join(effect.runDir, "work", "leftover"), { recursive: true });

    const metrics: Record<string, unknown>[] = [];
    await commitEffectCancellation({
      runDir: effect.runDir,
      effectId: effect.effectId,
      reason: "stale",
      logger: (entry) => metrics.push(entry),
    });

    expect(metrics).toContainEqual(
      expect.objectContaining({
        metric: "run.workdir_leak",
        phase: "effect-cancelled",
        entryCount: 1,
      }),
    );
  });

  test("logs rejection metrics when payload validation fails", async () => {
    const effect = await requestSampleEffect();
    const metrics: Record<string, unknown>[] = [];

    await expect(
      commitEffectResult({
        runDir: effect.runDir,
        effectId: effect.effectId,
        logger: (entry) => metrics.push(entry),
        result: {
          status: "ok",
          value: { doubled: 1 },
          stderr: 42 as any,
        },
      })
    ).rejects.toThrow(RunFailedError);

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      metric: "commit.effect",
      status: "rejected",
      reason: "invalid_payload",
      effectId: effect.effectId,
    });
    expect(metrics[0].message).toContain("stderr must be a string");
  });
});

describe("commitEffectCancellation", () => {
  test("commitEffectCancellation function exists as a named export", async () => {
    const mod = await import("../commitEffectResult");
    expect((mod as Record<string, unknown>).commitEffectCancellation).toBeDefined();
    expect(typeof (mod as Record<string, unknown>).commitEffectCancellation).toBe("function");
  });

  test("appends EFFECT_CANCELLED event", async () => {
    const mod = await import("../commitEffectResult");
    const commitEffectCancellation = (mod as Record<string, unknown>).commitEffectCancellation as (options: {
      runDir: string;
      effectId: string;
      reason?: string;
    }) => Promise<{ resultRef: string }>;

    const effect = await requestSampleEffect();

    await commitEffectCancellation({
      runDir: effect.runDir,
      effectId: effect.effectId,
      reason: "no longer needed",
    });

    const { buildEffectIndex: buildIdx } = await import("../replay/effectIndex");
    const index = await buildIdx({ runDir: effect.runDir });
    const record = index.getByEffectId(effect.effectId);
    expect(record?.status).toBe("cancelled");
  });

  test("writes result.json with cancelled status", async () => {
    const mod = await import("../commitEffectResult");
    const commitEffectCancellation = (mod as Record<string, unknown>).commitEffectCancellation as (options: {
      runDir: string;
      effectId: string;
      reason?: string;
    }) => Promise<{ resultRef: string }>;

    const effect = await requestSampleEffect();

    const result = await commitEffectCancellation({
      runDir: effect.runDir,
      effectId: effect.effectId,
      reason: "superseded by newer task",
    });

    expect(result.resultRef).toBeDefined();
    const { readTaskResult } = await import("../../storage/tasks");
    const taskResult = await readTaskResult(effect.runDir, effect.effectId);
    expect(taskResult).toMatchObject({
      status: "cancelled",
      reason: "superseded by newer task",
    });
  });

  test("refreshes the state cache after cancelling an effect", async () => {
    const mod = await import("../commitEffectResult");
    const commitEffectCancellation = (mod as Record<string, unknown>).commitEffectCancellation as (options: {
      runDir: string;
      effectId: string;
      reason?: string;
    }) => Promise<{ resultRef: string }>;

    const effect = await requestSampleEffect();

    await commitEffectCancellation({
      runDir: effect.runDir,
      effectId: effect.effectId,
      reason: "superseded",
    });

    const stateCache = await readStateCache(effect.runDir);
    expect(stateCache).not.toBeNull();
    expect(stateCache?.rebuildReason).toBe("post_effect_cancellation");
    expect(stateCache?.journalHead?.seq).toBe(3);
    expect(stateCache?.effectsByInvocation[effect.invocationKey]).toMatchObject({
      effectId: effect.effectId,
      invocationKey: effect.invocationKey,
      status: "cancelled",
    });
    expect(stateCache?.pendingEffectsByKind).toEqual({});
  });

  test("rejects cancellation of non-requested effects", async () => {
    const mod = await import("../commitEffectResult");
    const commitEffectCancellation = (mod as Record<string, unknown>).commitEffectCancellation as (options: {
      runDir: string;
      effectId: string;
      reason?: string;
    }) => Promise<{ resultRef: string }>;

    const { runDir } = await createTestRun(tmpRoot);

    await expect(
      commitEffectCancellation({
        runDir,
        effectId: "non-existent-effect",
        reason: "nope",
      })
    ).rejects.toThrow(RunFailedError);
  });

  test("accepts optional reason", async () => {
    const mod = await import("../commitEffectResult");
    const commitEffectCancellation = (mod as Record<string, unknown>).commitEffectCancellation as (options: {
      runDir: string;
      effectId: string;
      reason?: string;
    }) => Promise<{ resultRef: string }>;

    const effect = await requestSampleEffect();

    // Should work without a reason
    await expect(
      commitEffectCancellation({
        runDir: effect.runDir,
        effectId: effect.effectId,
      })
    ).resolves.toBeDefined();
  });
});

async function requestSampleEffect(runIdOverride?: string) {
  const { runDir, runId } = await createTestRun(tmpRoot, runIdOverride);
  const context = await buildTaskContext(runDir, runId);

  try {
    await runTaskIntrinsic({
      task: sampleTask,
      args: { value: 2 },
      context,
    });
  } catch (error) {
    if (error instanceof EffectRequestedError) {
      return {
        runDir,
        runId,
        effectId: error.action.effectId,
        invocationKey: error.action.invocationKey,
      };
    }
    throw error;
  }

  throw new Error("Expected EffectRequestedError");
}

async function requestShellSchemaEffect(outputSchema?: Record<string, unknown> | false | null) {
  const { runDir, runId } = await createTestRun(tmpRoot);
  const context = await buildTaskContext(runDir, runId);

  try {
    await runTaskIntrinsic({
      task: shellSchemaTask,
      args: { outputSchema },
      context,
    });
  } catch (error) {
    if (error instanceof EffectRequestedError) {
      return {
        runDir,
        runId,
        effectId: error.action.effectId,
        invocationKey: error.action.invocationKey,
      };
    }
    throw error;
  }

  throw new Error("Expected EffectRequestedError");
}
