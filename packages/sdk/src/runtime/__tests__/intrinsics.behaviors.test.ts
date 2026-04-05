import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { runSleepIntrinsic } from "../intrinsics/sleep";
import { runBreakpointIntrinsic } from "../intrinsics/breakpoint";
import { runOrchestratorTaskIntrinsic } from "../intrinsics/orchestratorTask";
import { EffectPendingError, EffectRequestedError } from "../exceptions";
import { buildTaskContext, createTestRun } from "./testHelpers";

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

  test("captures subagent routing hints and subtask metadata", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId);
    const subtasks = [{ title: "plan" }, { title: "execute" }];
    await expect(
      runOrchestratorTaskIntrinsic(
        { op: "fanout" },
        context,
        { executionMode: "subagent", modelPhase: "interactive", parallelism: 2, subtasks }
      )
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(EffectRequestedError);
      const action = (error as EffectRequestedError).action;
      expect(action.taskDef.orchestratorTask).toMatchObject({
        executionMode: "subagent",
        modelPhase: "interactive",
        parallelism: 2,
        subtasks,
      });
      expect(action.taskDef.metadata).toMatchObject({
        executionMode: "subagent",
        modelPhase: "interactive",
        parallelism: 2,
        subtaskCount: 2,
      });
      return true;
    });
  });
});
