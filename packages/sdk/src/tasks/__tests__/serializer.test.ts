import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  RESULT_SCHEMA_VERSION,
  TASK_SCHEMA_VERSION,
  serializeAndWriteTaskDefinition,
  serializeAndWriteTaskResult,
} from "../serializer";

const EFFECT_ID = "01HQA4SERIALZR";

describe("task serializer", () => {
  let runDir: string;

  beforeEach(async () => {
    runDir = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-serializer-"));
  });

  afterEach(async () => {
    await fs.rm(runDir, { recursive: true, force: true });
  });

  it("writes task.json with schema metadata and inline inputs", async () => {
    const { taskRef, inputsRef, serialized } = await serializeAndWriteTaskDefinition({
      runDir,
      effectId: EFFECT_ID,
      taskId: "inline-input-task",
      invocationKey: "proc:step-001",
      stepId: "step-001",
      task: {
        kind: "node",
        title: "Serialize Inline",
        metadata: { foo: "bar" },
      },
      inputs: { hello: "world" },
    });

    expect(taskRef).toBe(`tasks/${EFFECT_ID}/task.json`);
    expect(inputsRef).toBeUndefined();
    expect(serialized.schemaVersion).toBe(TASK_SCHEMA_VERSION);
    expect(serialized.inputs).toEqual({ hello: "world" });

    const onDisk = JSON.parse(await fs.readFile(path.join(runDir, taskRef), "utf8"));
    expect(onDisk.effectId).toBe(EFFECT_ID);
    expect(onDisk.schemaVersion).toBe(TASK_SCHEMA_VERSION);
    expect(onDisk.inputs).toEqual({ hello: "world" });
  });

  it("spills large inputs to blobs and returns refs", async () => {
    const bigPayload = { data: "x".repeat(1024 * 1024 + 512) };
    const { inputsRef, serialized } = await serializeAndWriteTaskDefinition({
      runDir,
      effectId: EFFECT_ID,
      taskId: "blobbed-input-task",
      invocationKey: "proc:step-002",
      stepId: "step-002",
      task: { kind: "breakpoint" },
      inputs: bigPayload,
    });

    expect(serialized.inputs).toBeUndefined();
    expect(inputsRef).toMatch(/tasks\/01HQA4SERIALZR\/blobs\/inputs-[0-9a-f]+\.json$/);
    const absoluteRef = path.join(runDir, inputsRef!);
    const blob = JSON.parse(await fs.readFile(absoluteRef, "utf8"));
    expect(blob).toEqual(bigPayload);
  });

  it("preserves agent task payloads needed by external harness mappers", async () => {
    const { serialized } = await serializeAndWriteTaskDefinition({
      runDir,
      effectId: EFFECT_ID,
      taskId: "agent-task",
      invocationKey: "proc:step-002b",
      stepId: "step-002b",
      task: {
        kind: "agent",
        title: "Create alpha artifact",
        agent: {
          role: "CI filesystem validation agent",
          task: "Create codex-artifacts/alpha.txt in the current workspace.",
          context: {
            requiredContents: "alpha-run-ok",
            requiredPath: "codex-artifacts/alpha.txt",
          },
          instructions: [
            "Create the file if it does not exist.",
            "Write exactly the required contents followed by a trailing newline.",
          ],
          outputFormat: "plain text",
        },
      },
      inputs: { contents: "alpha-run-ok" },
    });

    expect(serialized.kind).toBe("agent");
    expect(serialized.title).toBe("Create alpha artifact");
    expect(serialized.agent).toMatchObject({
      role: "CI filesystem validation agent",
      task: "Create codex-artifacts/alpha.txt in the current workspace.",
      outputFormat: "plain text",
    });
    expect(serialized.agent).toHaveProperty("context.requiredPath", "codex-artifacts/alpha.txt");
  });

  it("serializes task results, spilling large payloads and emitting stdout/stderr refs", async () => {
    const hugeResult = { payload: "z".repeat(1024 * 1024 + 256) };
    const { resultRef, stdoutRef, stderrRef, serialized } = await serializeAndWriteTaskResult({
      runDir,
      effectId: EFFECT_ID,
      taskId: "result-task",
      invocationKey: "proc:step-003",
      payload: {
        status: "ok",
        result: hugeResult,
        stdout: "hello stdout",
        stderr: "hello stderr",
      },
    });

    expect(resultRef).toBe(`tasks/${EFFECT_ID}/result.json`);
    expect(stdoutRef).toBe(`tasks/${EFFECT_ID}/stdout.log`);
    expect(stderrRef).toBe(`tasks/${EFFECT_ID}/stderr.log`);

    const serializedResult = JSON.parse(await fs.readFile(path.join(runDir, resultRef), "utf8"));
    expect(serializedResult.schemaVersion).toBe(RESULT_SCHEMA_VERSION);
    expect(serializedResult.result).toBeUndefined();
    expect(serializedResult.resultRef).toMatch(/blobs\/result-[0-9a-f]+\.json$/);

    const blobContents = JSON.parse(await fs.readFile(path.join(runDir, serializedResult.resultRef), "utf8"));
    expect(blobContents).toEqual(hugeResult);
  });
});
