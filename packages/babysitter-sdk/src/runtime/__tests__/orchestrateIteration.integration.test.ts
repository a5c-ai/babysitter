import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createRunDir } from "../../storage/createRunDir";
import { appendEvent, loadJournal } from "../../storage/journal";
import { orchestrateIteration } from "../orchestrateIteration";
import { commitEffectResult } from "../commitEffectResult";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-orchestrate-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

function writeProcessFile(dir: string, filename: string) {
  const filePath = path.join(dir, filename);
  const contents = `
  const echoTask = {
    id: "echo-task",
    async build(args) {
      return { kind: "node", title: "echo", metadata: args };
    }
  };

  export async function process(inputs, ctx) {
    const result = await ctx.task(echoTask, { value: inputs.value });
    return { doubled: result.value * 2 };
  }
  `;
  return fs.writeFile(filePath, contents, "utf8").then(() => filePath);
}

describe("orchestrateIteration integration", () => {
  test("runs ctx.onCleanup callbacks after successful completion", async () => {
    const processDir = path.join(tmpRoot, "processes-cleanup-success");
    const cleanupDir = path.join(tmpRoot, "scratch-success");
    await fs.mkdir(processDir, { recursive: true });
    await fs.mkdir(cleanupDir, { recursive: true });

    const processPath = path.join(processDir, "cleanup-success.mjs");
    await fs.writeFile(
      processPath,
      `
      import { promises as fs } from "fs";

      export async function process(inputs, ctx) {
        ctx.onCleanup(async () => {
          await fs.rm(inputs.cleanupDir, { recursive: true, force: true });
        });
        return { ok: true };
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-cleanup-success",
      request: "cleanup success",
      processPath,
      inputs: { cleanupDir },
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-cleanup-success" } });

    const result = await orchestrateIteration({ runDir });
    expect(result.status).toBe("completed");
    await expect(fs.stat(cleanupDir)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("does not run ctx.onCleanup callbacks while waiting for effects", async () => {
    const processDir = path.join(tmpRoot, "processes-cleanup-waiting");
    const cleanupDir = path.join(tmpRoot, "scratch-waiting");
    await fs.mkdir(processDir, { recursive: true });
    await fs.mkdir(cleanupDir, { recursive: true });

    const processPath = path.join(processDir, "cleanup-waiting.mjs");
    await fs.writeFile(
      processPath,
      `
      import { promises as fs } from "fs";

      const echoTask = {
        id: "cleanup-waiting-task",
        async build() {
          return { kind: "node", title: "cleanup waiting" };
        }
      };

      export async function process(inputs, ctx) {
        ctx.onCleanup(async () => {
          await fs.rm(inputs.cleanupDir, { recursive: true, force: true });
        });
        await ctx.task(echoTask, {});
        return { ok: true };
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-cleanup-waiting",
      request: "cleanup waiting",
      processPath,
      inputs: { cleanupDir },
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-cleanup-waiting" } });

    const waiting = await orchestrateIteration({ runDir });
    expect(waiting.status).toBe("waiting");
    await expect(fs.stat(cleanupDir)).resolves.toBeDefined();
  });

  test("allows plugin-local subprocess effects without running cleanup while waiting", async () => {
    const processDir = path.join(tmpRoot, "processes-subprocess-cleanup-waiting");
    const cleanupDir = path.join(tmpRoot, "scratch-subprocess-waiting");
    await fs.mkdir(processDir, { recursive: true });
    await fs.mkdir(cleanupDir, { recursive: true });

    const processPath = path.join(processDir, "subprocess-cleanup-waiting.mjs");
    await fs.writeFile(
      processPath,
      `
      import { promises as fs } from "fs";

      export async function process(inputs, ctx) {
        ctx.onCleanup(async () => {
          await fs.rm(inputs.cleanupDir, { recursive: true, force: true });
        });
        await ctx.subprocess({
          processPath: "./child.mjs",
          exportName: "process",
          processId: "child-process",
          prompt: "Run child process"
        });
        return { ok: true };
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-subprocess-cleanup-waiting",
      request: "subprocess cleanup waiting",
      processPath,
      inputs: { cleanupDir },
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-subprocess-cleanup-waiting" } });

    const waiting = await orchestrateIteration({ runDir, subprocessSupport: "plugin-local" });
    expect(waiting.status).toBe("waiting");
    if (waiting.status !== "waiting") {
      throw new Error("Expected waiting status");
    }
    expect(waiting.nextActions[0].kind).toBe("subprocess");
    await expect(fs.stat(cleanupDir)).resolves.toBeDefined();
  });

  test("runs ctx.onCleanup callbacks for failed and process-error terminal paths", async () => {
    const processDir = path.join(tmpRoot, "processes-cleanup-failures");
    const failedDir = path.join(tmpRoot, "scratch-failed");
    const processErrorDir = path.join(tmpRoot, "scratch-process-error");
    await fs.mkdir(processDir, { recursive: true });
    await fs.mkdir(failedDir, { recursive: true });
    await fs.mkdir(processErrorDir, { recursive: true });

    const processPath = path.join(processDir, "cleanup-failures.mjs");
    await fs.writeFile(
      processPath,
      `
      import { promises as fs } from "fs";
      import { RunFailedError } from "${path.resolve("src/runtime/exceptions.ts").replace(/\\/g, "\\\\")}";

      export async function process(inputs, ctx) {
        ctx.onCleanup(async () => {
          await fs.rm(inputs.cleanupDir, { recursive: true, force: true });
        });
        if (inputs.mode === "failed") {
          throw new RunFailedError("planned failure");
        }
        throw new Error("planned process error");
      }
      `,
      "utf8",
    );

    const failedRun = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-cleanup-failed",
      request: "cleanup failed",
      processPath,
      inputs: { cleanupDir: failedDir, mode: "failed" },
    });
    await appendEvent({ runDir: failedRun.runDir, eventType: "RUN_CREATED", event: { runId: "run-cleanup-failed" } });
    const failed = await orchestrateIteration({ runDir: failedRun.runDir });
    expect(failed.status).toBe("failed");
    await expect(fs.stat(failedDir)).rejects.toMatchObject({ code: "ENOENT" });

    const processErrorRun = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-cleanup-process-error",
      request: "cleanup process error",
      processPath,
      inputs: { cleanupDir: processErrorDir, mode: "process-error" },
    });
    await appendEvent({ runDir: processErrorRun.runDir, eventType: "RUN_CREATED", event: { runId: "run-cleanup-process-error" } });
    const processError = await orchestrateIteration({ runDir: processErrorRun.runDir });
    expect(processError.status).toBe("process-error");
    await expect(fs.stat(processErrorDir)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("reports ctx.onCleanup callback errors without masking completion", async () => {
    const processDir = path.join(tmpRoot, "processes-cleanup-error");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = path.join(processDir, "cleanup-error.mjs");
    await fs.writeFile(
      processPath,
      `
      export async function process(_inputs, ctx) {
        ctx.onCleanup(() => {
          throw new Error("cleanup exploded");
        });
        return { ok: true };
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-cleanup-error",
      request: "cleanup error",
      processPath,
      inputs: {},
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-cleanup-error" } });

    const metrics: Record<string, unknown>[] = [];
    const result = await orchestrateIteration({ runDir, logger: (entry) => metrics.push(entry) });
    expect(result.status).toBe("completed");
    expect(metrics).toContainEqual(
      expect.objectContaining({
        metric: "process.cleanup",
        status: "error",
        message: "cleanup exploded",
      }),
    );
  });

  test("waits for effects and completes after commit", async () => {
    const processDir = path.join(tmpRoot, "processes");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = await writeProcessFile(processDir, "simple.mjs");

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-orch",
      request: "integration",
      processPath,
      inputs: { value: 5 },
    });

    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-orch" } });

    const firstIteration = await orchestrateIteration({ runDir });
    expect(firstIteration.status).toBe("waiting");
    if (firstIteration.status !== "waiting") {
      throw new Error("Expected waiting status");
    }

    const action = firstIteration.nextActions[0];
    expect(action.kind).toBe("node");

    await commitEffectResult({
      runDir,
      effectId: action.effectId,
      result: {
        status: "ok",
        value: { value: 5 },
      },
    });

    const secondIteration = await orchestrateIteration({ runDir });
    expect(secondIteration.status).toBe("completed");
    if (secondIteration.status === "completed") {
      expect(secondIteration.output).toEqual({ doubled: 10 });
    }
  });

  test("journals PROCESS_RUNTIME_ERROR when process code throws after consuming a bad task result", async () => {
    const processDir = path.join(tmpRoot, "processes-process-runtime-error");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = path.join(processDir, "process-runtime-error.mjs");
    await fs.writeFile(
      processPath,
      `
      const verifyTask = {
        id: "verify-task",
        async build() {
          return { kind: "node", title: "verify" };
        }
      };

      export async function process(_inputs, ctx) {
        const verifyResult = await ctx.task(verifyTask, {});
        return { checkCount: verifyResult.checks.length };
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-process-runtime-error",
      request: "process runtime error",
      processPath,
      inputs: {},
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-process-runtime-error" } });

    const waiting = await orchestrateIteration({ runDir });
    expect(waiting.status).toBe("waiting");
    if (waiting.status !== "waiting") throw new Error("Expected waiting status");

    await commitEffectResult({
      runDir,
      effectId: waiting.nextActions[0].effectId,
      result: {
        status: "ok",
        value: { verified: true },
      },
    });

    const processError = await orchestrateIteration({ runDir });
    expect(processError.status).toBe("process-error");

    const journal = await loadJournal(runDir);
    const marker = journal.find((event) => event.type === "PROCESS_RUNTIME_ERROR");
    expect(marker).toBeDefined();
    expect(marker?.data).toMatchObject({
      runId: "run-process-runtime-error",
      processId: "process runtime error",
      recovery: {
        command: "run:recover-process-error",
        recoverable: true,
      },
    });
    expect((marker?.data.error as { message?: string }).message).toContain("length");
    expect(marker?.data.lastEffect).toMatchObject({
      effectId: waiting.nextActions[0].effectId,
      status: "resolved_ok",
    });
    expect(journal.some((event) => event.type === "RUN_FAILED")).toBe(false);
  });

  test("task effect failures stay EFFECT_RESOLVED errors instead of PROCESS_RUNTIME_ERROR", async () => {
    const processDir = path.join(tmpRoot, "processes-effect-error");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = path.join(processDir, "effect-error.mjs");
    await fs.writeFile(
      processPath,
      `
      const failingTask = {
        id: "failing-task",
        async build() {
          return { kind: "agent", title: "fails" };
        }
      };

      export async function process(_inputs, ctx) {
        await ctx.task(failingTask, {});
        return { unreachable: true };
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-effect-error",
      request: "effect error",
      processPath,
      inputs: {},
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-effect-error" } });

    const waiting = await orchestrateIteration({ runDir });
    expect(waiting.status).toBe("waiting");
    if (waiting.status !== "waiting") throw new Error("Expected waiting status");

    await commitEffectResult({
      runDir,
      effectId: waiting.nextActions[0].effectId,
      result: {
        status: "error",
        error: { message: "task failed" },
      },
    });

    const processError = await orchestrateIteration({ runDir });
    expect(processError.status).toBe("process-error");

    const journal = await loadJournal(runDir);
    expect(journal).toContainEqual(expect.objectContaining({
      type: "EFFECT_RESOLVED",
      data: expect.objectContaining({
        effectId: waiting.nextActions[0].effectId,
        status: "error",
      }),
    }));
    expect(journal.some((event) => event.type === "PROCESS_RUNTIME_ERROR")).toBe(false);
  });

  test("does not append duplicate RUN_COMPLETED when iterating an already completed run", async () => {
    const processDir = path.join(tmpRoot, "processes-completed-replay");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = await writeProcessFile(processDir, "completed-replay.mjs");

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-completed-replay",
      request: "integration",
      processPath,
      inputs: { value: 5 },
    });

    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-completed-replay" } });

    const firstIteration = await orchestrateIteration({ runDir });
    expect(firstIteration.status).toBe("waiting");
    if (firstIteration.status !== "waiting") {
      throw new Error("Expected waiting status");
    }

    await commitEffectResult({
      runDir,
      effectId: firstIteration.nextActions[0].effectId,
      result: {
        status: "ok",
        value: { value: 5 },
      },
    });

    const completion = await orchestrateIteration({ runDir });
    expect(completion.status).toBe("completed");
    if (completion.status === "completed") {
      expect(completion.output).toEqual({ doubled: 10 });
    }

    const replay = await orchestrateIteration({ runDir });
    expect(replay.status).toBe("completed");
    if (replay.status === "completed") {
      expect(replay.output).toEqual({ doubled: 10 });
    }

    const journal = await loadJournal(runDir);
    expect(journal.filter((event) => event.type === "RUN_COMPLETED")).toHaveLength(1);
  });

  test("ctx.halt records RUN_HALTED without output or RUN_COMPLETED and replays idempotently", async () => {
    const processDir = path.join(tmpRoot, "processes-halted-replay");
    await fs.mkdir(processDir, { recursive: true });
    const markerPath = path.join(tmpRoot, "halt-marker.txt");
    const processPath = path.join(processDir, "halted-replay.mjs");
    await fs.writeFile(
      processPath,
      `
      import { promises as fs } from "fs";

      export async function process(inputs, ctx) {
        await fs.appendFile(inputs.markerPath, "executed\\n");
        return ctx.halt("phase-0", { reason: "invalid-input" });
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-halted-replay",
      request: "halt replay",
      processPath,
      inputs: { markerPath },
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-halted-replay" } });

    const first = await orchestrateIteration({ runDir });
    expect(first).toMatchObject({
      status: "halted",
      reason: "phase-0",
      payload: { reason: "invalid-input" },
    });

    const replay = await orchestrateIteration({ runDir });
    expect(replay).toMatchObject({
      status: "halted",
      reason: "phase-0",
      payload: { reason: "invalid-input" },
    });

    const marker = await fs.readFile(markerPath, "utf8");
    expect(marker.trim().split("\n")).toHaveLength(1);
    await expect(fs.stat(path.join(runDir, "state", "output.json"))).rejects.toMatchObject({ code: "ENOENT" });

    const journal = await loadJournal(runDir);
    expect(journal.filter((event) => event.type === "RUN_HALTED")).toHaveLength(1);
    expect(journal.some((event) => event.type === "RUN_COMPLETED")).toBe(false);
  });

  test("legacy halt:true return records RUN_HALTED with a deprecation warning", async () => {
    const processDir = path.join(tmpRoot, "processes-legacy-halt");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = path.join(processDir, "legacy-halt.mjs");
    await fs.writeFile(
      processPath,
      `
      export async function process() {
        return { success: false, halt: true, phase: "RDD-0", error: undefined };
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-legacy-halt",
      request: "legacy halt",
      processPath,
      inputs: {},
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-legacy-halt" } });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const result = await orchestrateIteration({ runDir });
      expect(result).toMatchObject({
        status: "halted",
        reason: "RDD-0",
        payload: { success: false, halt: true, phase: "RDD-0" },
      });
      expect(String(warnSpy.mock.calls.at(-1)?.[0] ?? "")).toContain("Deprecated process return { halt: true }");
    } finally {
      warnSpy.mockRestore();
    }

    const journal = await loadJournal(runDir);
    expect(journal.filter((event) => event.type === "RUN_HALTED")).toHaveLength(1);
    expect(journal.some((event) => event.type === "RUN_COMPLETED")).toBe(false);
  });

  test("emits replay iteration metrics with logger instrumentation", async () => {
    const processDir = path.join(tmpRoot, "processes-metrics");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = await writeProcessFile(processDir, "metrics.mjs");

    const runId = "run-orch-metrics";
    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId,
      request: "integration",
      processPath,
      inputs: { value: 2 },
    });

    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });

    const metrics: Record<string, unknown>[] = [];
    const logger = (...args: any[]) => {
      const [entry] = args;
      if (entry && typeof entry === "object") {
        metrics.push(entry as Record<string, unknown>);
      }
    };

    const waitingResult = await orchestrateIteration({ runDir, logger });
    expect(waitingResult.status).toBe("waiting");
    if (waitingResult.status !== "waiting") {
      throw new Error("Expected waiting status");
    }

    await commitEffectResult({
      runDir,
      effectId: waitingResult.nextActions[0].effectId,
      result: {
        status: "ok",
        value: { value: 2 },
      },
    });

    const completion = await orchestrateIteration({ runDir, logger });
    expect(completion.status).toBe("completed");

    const replayMetrics = metrics.filter((entry) => entry.metric === "replay.iteration");
    expect(replayMetrics).toHaveLength(2);
    expect(replayMetrics.map((entry) => entry.status as string)).toEqual(["waiting", "completed"]);
    replayMetrics.forEach((entry) => expect(entry.runId as string).toBe(runId));
  });

  test("returns waiting instead of crashing when ctx.task() is not awaited", async () => {
    const processDir = path.join(tmpRoot, "processes-unawaited");
    await fs.mkdir(processDir, { recursive: true });

    // Write a process file that calls ctx.task() WITHOUT await (floating promise)
    const processPath = path.join(processDir, "unawaited.mjs");
    await fs.writeFile(
      processPath,
      `
      const echoTask = {
        id: "echo-task",
        async build(args) {
          return { kind: "node", title: "echo", metadata: args };
        }
      };

      export async function process(inputs, ctx) {
        // Deliberately NOT awaiting — this is the bug scenario
        ctx.task(echoTask, { value: inputs.value });
        return { done: true };
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-unawaited",
      request: "unawaited-test",
      processPath,
      inputs: { value: 42 },
    });

    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-unawaited" } });

    // Should return "waiting" (detecting the stray EFFECT_REQUESTED in the
    // journal) rather than crashing with an unhandled rejection or failing
    // with a journal sequence gap.
    const result = await orchestrateIteration({ runDir });
    expect(result.status).toBe("waiting");
    if (result.status === "waiting") {
      expect(result.nextActions.length).toBeGreaterThan(0);
    }
  });

  test("completes non-interactive breakpoints that append PROCESS_LOG events concurrently", async () => {
    const processDir = path.join(tmpRoot, "processes-breakpoints");
    await fs.mkdir(processDir, { recursive: true });

    const processPath = path.join(processDir, "parallel-breakpoints.mjs");
    await fs.writeFile(
      processPath,
      `
      export async function process(_inputs, ctx) {
        await Promise.all([
          ctx.breakpoint({ label: "deploy gate" }, { label: "deploy gate" }),
          ctx.breakpoint({ label: "pr gate" }, { label: "pr gate" })
        ]);
        return { ok: true };
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-non-interactive-breakpoints",
      request: "parallel breakpoint test",
      processPath,
      inputs: {},
      extraMetadata: { nonInteractive: true },
    });

    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "run-non-interactive-breakpoints" } });

    const result = await orchestrateIteration({ runDir });
    expect(result.status).toBe("completed");

    const journal = await loadJournal(runDir);
    expect(journal.map((event) => event.seq)).toEqual(journal.map((_, index) => index + 1));
    expect(journal.filter((event) => event.type === "PROCESS_LOG")).toHaveLength(2);
    expect(journal.some((event) => event.type === "RUN_FAILED")).toBe(false);
  });

  test("completes replay correctly after cwd changes when the run was created from a relative runsDir", async () => {
    const workspace = await fs.mkdtemp(path.join(tmpRoot, "relative-run-workspace-"));
    const processPath = await writeProcessFile(workspace, "relative.mjs");
    const originalCwd = process.cwd();
    process.chdir(workspace);

    try {
      const { createRun } = await import("../createRun");
      const created = await createRun({
        runsDir: path.join(".a5c", "runs"),
        runId: "run-relative-cwd",
        request: "integration",
        process: {
          processId: "relative/process",
          importPath: processPath,
        },
        inputs: { value: 7 },
      });

      expect(path.isAbsolute(created.runDir)).toBe(true);

      const firstIteration = await orchestrateIteration({ runDir: created.runDir });
      expect(firstIteration.status).toBe("waiting");
      if (firstIteration.status !== "waiting") {
        throw new Error("Expected waiting status");
      }

      await commitEffectResult({
        runDir: created.runDir,
        effectId: firstIteration.nextActions[0].effectId,
        result: {
          status: "ok",
          value: { value: 7 },
        },
      });

      process.chdir(tmpRoot);

      const secondIteration = await orchestrateIteration({ runDir: created.runDir });
      expect(secondIteration.status).toBe("completed");
      if (secondIteration.status === "completed") {
        expect(secondIteration.output).toEqual({ doubled: 14 });
      }
    } finally {
      process.chdir(originalCwd);
    }
  });
});
