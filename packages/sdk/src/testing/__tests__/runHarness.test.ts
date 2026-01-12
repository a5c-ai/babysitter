import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createRunDir } from "../../storage/createRunDir";
import { appendEvent } from "../../storage/journal";
import { runToCompletionWithFakeRunner } from "../runHarness";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-testing-harness-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function writeProcessFile(dir: string, filename: string) {
  const processPath = path.join(dir, filename);
  const contents = `
    const counterTask = {
      id: "counter",
      async build(args) {
        return { kind: "node", title: "counter", metadata: args };
      }
    };

    export async function process(inputs, ctx) {
      const first = await ctx.task(counterTask, { step: "first", value: inputs.value });
      const second = await ctx.task(counterTask, { step: "second", value: first.value + 1 });
      return { final: second.value };
    }
  `;
  await fs.writeFile(processPath, contents, "utf8");
  return processPath;
}

async function createHarnessRun(runId = "run-harness", initialValue = 1) {
  const processDir = path.join(tmpRoot, "processes");
  await fs.mkdir(processDir, { recursive: true });
  const processPath = await writeProcessFile(processDir, `${runId}.mjs`);

  const { runDir } = await createRunDir({
    runsRoot: tmpRoot,
    runId,
    request: "testing-harness",
    processPath,
    inputs: { value: initialValue },
  });
  await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });
  return { runDir };
}

describe("runToCompletionWithFakeRunner", () => {
  test("completes a run by faking node task results", async () => {
    const { runDir } = await createHarnessRun("run-complete", 3);

    const resolutionValues: number[] = [];
    const result = await runToCompletionWithFakeRunner({
      runDir,
      resolve(action) {
        if (action.taskId === "counter") {
          const value = (action.taskDef.metadata as { value: number }).value;
          resolutionValues.push(value);
          return { status: "ok", value: { value } };
        }
        return undefined;
      },
    });

    expect(result.status).toBe("completed");
    expect(result.output).toEqual({ final: 4 });
    expect(result.executed).toHaveLength(2);
    expect(resolutionValues).toEqual([3, 4]);
  });

  test("returns waiting status when a pending action is left unresolved", async () => {
    const { runDir } = await createHarnessRun("run-waiting", 1);

    const result = await runToCompletionWithFakeRunner({
      runDir,
      resolve(action) {
        if (action.taskDef.metadata?.step === "first") {
          return { status: "ok", value: { value: (action.taskDef.metadata as { value: number }).value } };
        }
        return undefined;
      },
    });

    expect(result.status).toBe("waiting");
    expect(result.pending).toHaveLength(1);
    expect(result.executed).toHaveLength(1);
    expect(result.pending?.[0].taskDef.metadata?.step).toBe("second");
  });

  test("enforces the max iteration safeguard", async () => {
    const { runDir } = await createHarnessRun("run-max-iterations", 2);

    await expect(
      runToCompletionWithFakeRunner({
        runDir,
        maxIterations: 1,
        resolve(action) {
          if (action.taskId === "counter") {
            return { status: "ok", value: { value: (action.taskDef.metadata as { value: number }).value } };
          }
          return undefined;
        },
      })
    ).rejects.toThrow(/maxIterations=1/);
  });
});
