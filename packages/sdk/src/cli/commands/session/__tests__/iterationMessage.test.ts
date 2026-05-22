import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appendEvent } from "../../../../storage/journal";
import { createRunDir } from "../../../../storage/createRunDir";
import { handleSessionIterationMessage } from "../iterationMessage";

describe("handleSessionIterationMessage", () => {
  let runsRoot: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    runsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-session-iter-msg-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(runsRoot, { recursive: true, force: true });
  });

  async function createRun(runId: string) {
    const { runDir } = await createRunDir({
      runsRoot,
      runId,
      request: "test",
      processPath: "./process.js",
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });
    return runDir;
  }

  it("requires iteration", async () => {
    const exitCode = await handleSessionIterationMessage({
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(1);
    const output = JSON.parse(String(errorSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.error).toBe("MISSING_ITERATION");
  });

  it("reports waiting runs with pending kinds", async () => {
    const runDir = await createRun("run-waiting");
    const taskDir = path.join(runDir, "tasks", "effect-1");
    await fs.mkdir(taskDir, { recursive: true });
    await fs.writeFile(path.join(taskDir, "task.json"), JSON.stringify({ kind: "node" }), "utf8");
    await fs.writeFile(path.join(taskDir, "inputs.json"), JSON.stringify({ ok: true }), "utf8");
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "effect-1",
        invocationKey: "effect-1:inv",
        stepId: "step-1",
        taskId: "task/node",
        kind: "node",
        label: "build",
        taskDefRef: "tasks/effect-1/task.json",
        inputsRef: "tasks/effect-1/inputs.json",
      },
    });

    const exitCode = await handleSessionIterationMessage({
      runId: "run-waiting",
      iteration: 2,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.runState).toBe("waiting");
    expect(output.pendingKinds).toBe("node");
  });

  it("reports completed runs with a completion proof", async () => {
    const runDir = await createRun("run-complete");
    await appendEvent({
      runDir,
      eventType: "RUN_COMPLETED",
      event: { outputRef: "state/output.json" },
    });

    const exitCode = await handleSessionIterationMessage({
      runId: "run-complete",
      iteration: 3,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.runState).toBe("completed");
    expect(output.completionProof).toBeTruthy();
  });

  it("keeps waiting state when pending work exists after a completion event", async () => {
    const runDir = await createRun("run-premature-complete");
    const taskDir = path.join(runDir, "tasks", "effect-2");
    await fs.mkdir(taskDir, { recursive: true });
    await fs.writeFile(path.join(taskDir, "task.json"), JSON.stringify({ kind: "agent" }), "utf8");
    await fs.writeFile(path.join(taskDir, "inputs.json"), JSON.stringify({ ok: true }), "utf8");
    await appendEvent({
      runDir,
      eventType: "RUN_COMPLETED",
      event: { outputRef: "state/output.json" },
    });
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "effect-2",
        invocationKey: "effect-2:inv",
        stepId: "step-2",
        taskId: "task/agent",
        kind: "agent",
        label: "follow-up",
        taskDefRef: "tasks/effect-2/task.json",
        inputsRef: "tasks/effect-2/inputs.json",
      },
    });

    const exitCode = await handleSessionIterationMessage({
      runId: "run-premature-complete",
      iteration: 4,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.runState).toBe("waiting");
    expect(output.pendingKinds).toBe("agent");
    expect(output.completionProof).toBeNull();
  });
});
