import { afterEach, beforeEach, describe, expect, test } from "vitest";
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
