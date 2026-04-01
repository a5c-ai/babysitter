import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { runSleepIntrinsic } from "../intrinsics/sleep";
import { runBreakpointIntrinsic } from "../intrinsics/breakpoint";
import { runOrchestratorTaskIntrinsic } from "../intrinsics/orchestratorTask";
import { EffectPendingError, EffectRequestedError } from "../exceptions";
import { buildTaskContext, createTestRun } from "./testHelpers";
import { writeTaskResult } from "../../storage/tasks";
import { appendEvent } from "../../storage/journal";
import { RESULT_SCHEMA_VERSION } from "../../tasks/serializer";
import { defineTask, resetGlobalTaskRegistry, TaskBuildContext } from "../../tasks";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-intrinsics-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("sleep intrinsic", () => {
  test("short-circuits immediately when target is in the past", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const now = new Date("2026-01-01T00:00:00.000Z");
    const context = await buildTaskContext(runDir, runId, { now: () => now });
    await expect(runSleepIntrinsic(now.toISOString(), context)).resolves.toBeUndefined();
    expect(context.replayCursor.value).toBe(0);
  });

  test("resolves pending sleep automatically after target passes", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const target = new Date("2026-01-02T08:00:00.000Z");
    const earlyContext = await buildTaskContext(runDir, runId, {
      now: () => new Date("2026-01-01T08:00:00.000Z"),
    });
    await expect(runSleepIntrinsic(target.toISOString(), earlyContext)).rejects.toThrow(EffectRequestedError);

    const lateContext = await buildTaskContext(runDir, runId, {
      now: () => new Date("2026-01-03T08:00:00.000Z"),
    });
    await expect(runSleepIntrinsic(target.toISOString(), lateContext)).resolves.toBeUndefined();
  });

  test("requests a scheduler effect with metadata for future targets", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const target = new Date("2026-01-04T10:00:00.000Z");
    const context = await buildTaskContext(runDir, runId, {
      now: () => new Date("2026-01-04T09:00:00.000Z"),
    });

    await expect(
      runSleepIntrinsic(target.toISOString(), context, { label: "wake-up" })
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.kind).toBe("sleep");
      expect(action.label).toBe("wake-up");
      expect(action.taskDef.metadata).toMatchObject({
        iso: target.toISOString(),
        targetEpochMs: target.getTime(),
      });
      expect(action.schedulerHints?.sleepUntilEpochMs).toBe(target.getTime());
      return true;
    });
  });

  test("throws EffectPendingError until the target deadline passes", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const target = new Date("2026-01-06T12:00:00.000Z");
    const firstContext = await buildTaskContext(runDir, runId, {
      now: () => new Date("2026-01-06T09:00:00.000Z"),
    });
    await expect(runSleepIntrinsic(target.toISOString(), firstContext)).rejects.toBeInstanceOf(
      EffectRequestedError
    );

    const pendingContext = await buildTaskContext(runDir, runId, {
      now: () => new Date("2026-01-06T10:00:00.000Z"),
    });
    await expect(runSleepIntrinsic(target.toISOString(), pendingContext)).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectPendingError);
      const action = (error as EffectPendingError).action;
      expect(action.kind).toBe("sleep");
      expect(action.taskDef.metadata?.targetEpochMs).toBe(target.getTime());
      expect(action.schedulerHints?.sleepUntilEpochMs).toBe(target.getTime());
      return true;
    });
  });
});

describe("breakpoint intrinsic", () => {
  test("applies labels and metadata from payload", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const requestedAt = new Date("2026-01-05T12:34:56.000Z");
    const context = await buildTaskContext(runDir, runId, { now: () => requestedAt });
    await expect(
      runBreakpointIntrinsic(
        { reason: "inspect", label: "payload-label" },
        context,
        { label: "custom-label" }
      )
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.label).toBe("custom-label");
      expect(action.kind).toBe("breakpoint");
      expect(action.taskDef.metadata).toMatchObject({
        payload: { reason: "inspect", label: "payload-label" },
        requestedAt: requestedAt.toISOString(),
        label: "custom-label",
      });
      return true;
    });
  });

  test("derives label from payload metadata when no override provided", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId);
    await expect(
      runBreakpointIntrinsic({ label: "inspect-step" }, context)
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.label).toBe("inspect-step");
      return true;
    });
  });

  test("falls back to default label when payload lacks one", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId);
    await expect(runBreakpointIntrinsic({ reason: "pause" }, context)).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.label).toBe("breakpoint");
      return true;
    });
  });

  test("returns BreakpointResult with approved:true when resolved with approval", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);

    // First call: throws EffectRequestedError to request the breakpoint effect
    const context1 = await buildTaskContext(runDir, runId);
    let effectId = "";
    let invocationKey = "";
    let taskId = "";
    await expect(
      runBreakpointIntrinsic({ reason: "review" }, context1)
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      effectId = action.effectId;
      invocationKey = action.invocationKey;
      taskId = action.taskId;
      return true;
    });

    // Post the result: write result.json and append EFFECT_RESOLVED
    const resultValue = { approved: true, response: "Looks good" };
    await writeTaskResult({
      runDir,
      effectId,
      result: {
        schemaVersion: RESULT_SCHEMA_VERSION,
        effectId,
        taskId,
        invocationKey,
        status: "ok",
        result: resultValue,
      },
    });
    const resultRef = `tasks/${effectId}/result.json`;
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: { effectId, status: "ok", resultRef },
    });

    // Second call: should resolve with BreakpointResult
    const context2 = await buildTaskContext(runDir, runId);
    const breakpointResult = await runBreakpointIntrinsic({ reason: "review" }, context2);
    expect(breakpointResult).toBeDefined();
    expect(breakpointResult.approved).toBe(true);
    expect(breakpointResult.response).toBe("Looks good");
  });

  test("returns BreakpointResult with approved:false when resolved with rejection", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);

    // First call: throws EffectRequestedError
    const context1 = await buildTaskContext(runDir, runId);
    let effectId = "";
    let invocationKey = "";
    let taskId = "";
    await expect(
      runBreakpointIntrinsic({ reason: "gate" }, context1)
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      effectId = action.effectId;
      invocationKey = action.invocationKey;
      taskId = action.taskId;
      return true;
    });

    // Post rejection result
    const resultValue = { approved: false, response: "Need changes", feedback: "Fix the UI" };
    await writeTaskResult({
      runDir,
      effectId,
      result: {
        schemaVersion: RESULT_SCHEMA_VERSION,
        effectId,
        taskId,
        invocationKey,
        status: "ok",
        result: resultValue,
      },
    });
    const resultRef = `tasks/${effectId}/result.json`;
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: { effectId, status: "ok", resultRef },
    });

    // Second call: should resolve with rejection BreakpointResult
    const context2 = await buildTaskContext(runDir, runId);
    const breakpointResult = await runBreakpointIntrinsic({ reason: "gate" }, context2);
    expect(breakpointResult).toBeDefined();
    expect(breakpointResult.approved).toBe(false);
    expect(breakpointResult.response).toBe("Need changes");
    expect(breakpointResult.feedback).toBe("Fix the UI");
  });

  test("stores expert routing in metadata", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId);
    await expect(
      runBreakpointIntrinsic({ reason: "security-check" }, context, {
        expert: "web-security",
        tags: ["security", "review"],
        strategy: "single",
      })
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.taskDef.metadata).toMatchObject({
        expert: "web-security",
        tags: ["security", "review"],
        strategy: "single",
      });
      return true;
    });
  });

  test("stores array of experts in metadata", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId);
    await expect(
      runBreakpointIntrinsic({ reason: "multi-review" }, context, {
        expert: ["web-security", "devops"],
        strategy: "collect-all",
      })
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.taskDef.metadata).toMatchObject({
        expert: ["web-security", "devops"],
        strategy: "collect-all",
      });
      return true;
    });
  });

  test("passes through without routing when no expert specified", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId);
    await expect(
      runBreakpointIntrinsic({ reason: "plain-breakpoint" }, context)
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.taskDef.metadata?.expert).toBeUndefined();
      return true;
    });
  });

  test("returns result value with extra fields from harness", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);

    // First call: throws EffectRequestedError
    const context1 = await buildTaskContext(runDir, runId);
    let effectId = "";
    let invocationKey = "";
    let taskId = "";
    await expect(
      runBreakpointIntrinsic({ reason: "confirm" }, context1)
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      effectId = action.effectId;
      invocationKey = action.invocationKey;
      taskId = action.taskId;
      return true;
    });

    // Post result with extra harness-specific fields
    const resultValue = {
      approved: true,
      option: "Accept",
      askUserQuestion: { answers: { key: "val" } },
    };
    await writeTaskResult({
      runDir,
      effectId,
      result: {
        schemaVersion: RESULT_SCHEMA_VERSION,
        effectId,
        taskId,
        invocationKey,
        status: "ok",
        result: resultValue,
      },
    });
    const resultRef = `tasks/${effectId}/result.json`;
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: { effectId, status: "ok", resultRef },
    });

    // Second call: should resolve with full result including extra fields
    const context2 = await buildTaskContext(runDir, runId);
    const breakpointResult = await runBreakpointIntrinsic({ reason: "confirm" }, context2);
    expect(breakpointResult).toBeDefined();
    expect(breakpointResult.approved).toBe(true);
    expect(breakpointResult.option).toBe("Accept");
    expect(breakpointResult.askUserQuestion).toEqual({ answers: { key: "val" } });
  });
});

describe("orchestrator task intrinsic", () => {
  test("sets orchestrator hint metadata and label", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId);
    await expect(runOrchestratorTaskIntrinsic({ op: "sync" }, context)).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.kind).toBe("orchestrator_task");
      expect(action.label).toBe("orchestrator-task");
      expect(action.taskDef.metadata).toMatchObject({
        payload: { op: "sync" },
        orchestratorTask: true,
      });
      return true;
    });
  });

  test("supports custom orchestrator labels while preserving metadata", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId);
    const payload = { op: "sync-custom" };
    await expect(
      runOrchestratorTaskIntrinsic(payload, context, { label: "orchestrator-custom" })
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.label).toBe("orchestrator-custom");
      expect(action.taskDef.metadata).toMatchObject({
        payload,
        orchestratorTask: true,
      });
      return true;
    });
  });
});

describe("TaskDef execution hints", () => {
  beforeEach(() => {
    resetGlobalTaskRegistry();
  });

  test("TaskDef accepts execution hints", async () => {
    const task = defineTask("exec-hints-test", () => ({
      kind: "node",
      title: "task with execution hints",
      execution: {
        harness: "pi",
        model: "claude-opus-4-6",
        permissions: ["file:read"],
      },
    }));

    const fakeCtx: TaskBuildContext = {
      effectId: "effect-1",
      invocationKey: "invocation-1",
      taskId: "exec-hints-test",
      runId: "run-1",
      runDir: "/runs/run-1",
      taskDir: "/runs/run-1/tasks/effect-1",
      tasksDir: "/runs/run-1/tasks",
      labels: [],
      createBlobRef: async () => "blob",
      toTaskRelativePath: (p: string) => p,
    };

    const taskDef = await task.build({}, fakeCtx);
    expect(taskDef.execution).toBeDefined();
    expect(taskDef.execution?.harness).toBe("pi");
    expect(taskDef.execution?.model).toBe("claude-opus-4-6");
    expect(taskDef.execution?.permissions).toEqual(["file:read"]);
  });
});
