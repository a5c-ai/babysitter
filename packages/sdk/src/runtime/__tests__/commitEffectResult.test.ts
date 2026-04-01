import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { commitEffectResult } from "../commitEffectResult";
import { runTaskIntrinsic } from "../intrinsics/task";
import { DefinedTask } from "../types";
import { buildTaskContext, createTestRun } from "./testHelpers";
import { EffectRequestedError, RunFailedError } from "../exceptions";
import { buildEffectIndex } from "../replay/effectIndex";
import { globalTaskRegistry } from "../../tasks/registry";
import { createRunDir } from "../../storage/createRunDir";

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

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-commit-"));
});

afterEach(async () => {
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

async function requestSampleEffect() {
  const { runDir, runId } = await createTestRun(tmpRoot);
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
        effectId: error.action.effectId,
        invocationKey: error.action.invocationKey,
      };
    }
    throw error;
  }

  throw new Error("Expected EffectRequestedError");
}
