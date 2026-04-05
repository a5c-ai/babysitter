import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createRunDir } from "../../storage/createRunDir";
import { appendEvent } from "../../storage/journal";
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
      return {
        kind: "orchestrator_task",
        title: "echo",
        metadata: {
          value: args.value,
          orchestratorTask: true,
          executionMode: "subagent",
          modelPhase: "interactive",
          parallelism: 2,
          subtaskCount: 2,
        },
        orchestratorTask: {
          payload: { value: args.value },
          executionMode: "subagent",
          modelPhase: "interactive",
          parallelism: 2,
          subtasks: [{ title: "plan" }, { title: "execute" }],
        },
      };
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
    expect(action.kind).toBe("orchestrator_task");
    expect(action.executionHints).toMatchObject({
      requestedMode: "subagent",
      effectiveMode: "subagent",
      modelPhase: "interactive",
      model: "gpt-5.3-codex-spark",
      parallelism: 2,
      subtaskCount: 2,
    });
    expect(firstIteration.metadata?.routedModelsByPhase).toEqual({
      interactive: "gpt-5.3-codex-spark",
    });
    expect(firstIteration.metadata?.pendingEffectsByMode).toEqual({
      subagent: 1,
    });

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
    expect(waitingResult.metadata?.pendingEffectsByMode).toEqual({ subagent: 1 });

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
});
