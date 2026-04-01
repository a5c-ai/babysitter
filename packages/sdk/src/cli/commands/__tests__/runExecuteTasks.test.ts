import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createRunDir } from "../../../storage/createRunDir";
import { appendEvent } from "../../../storage/journal";
import { writeTaskDefinition, readTaskResult } from "../../../storage/tasks";
import { buildEffectIndex } from "../../../runtime/replay/effectIndex";
import { runExecuteTasks } from "../runExecuteTasks";
import { TASK_SCHEMA_VERSION } from "../../../tasks/serializer";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-run-execute-tasks-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("runExecuteTasks", () => {
  test("fails shell tasks that exit zero without writing a result payload", async () => {
    const runId = "run-shell-task";
    const effectId = "01TESTSHELLTASK00000000000001";
    const invocationKey = "generated-process:S000001:shell-task";
    const taskId = "shell-task";

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId,
      request: "run shell task",
      processPath: "./process.js",
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });

    await writeTaskDefinition(runDir, effectId, {
      schemaVersion: TASK_SCHEMA_VERSION,
      effectId,
      taskId,
      invocationKey,
      stepId: "S000001",
      kind: "shell",
      shell: {
        command: `node -e "process.stdout.write('shell ok')"`,
      },
    });
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId,
        invocationKey,
        invocationHash: "hash-shell-task",
        stepId: "S000001",
        taskId,
        kind: "shell",
        label: "shell-task",
        taskDefRef: `tasks/${effectId}/task.json`,
      },
    });

    const result = await runExecuteTasks({
      runDir,
      kind: "shell",
      maxTasks: 1,
    });

    expect(result).toMatchObject({
      action: "executed-tasks",
      count: 1,
      reason: "auto-runnable-tasks",
      tasks: [
        {
          effectId,
          status: "error",
          exitCode: 1,
        },
      ],
    });

    const stored = await readTaskResult(runDir, effectId);
    expect(stored?.status).toBe("error");
    expect(stored?.error?.message).toContain("did not write a JSON result payload");

    const stdoutPath = path.join(runDir, "tasks", effectId, "stdout.log");
    await expect(fs.readFile(stdoutPath, "utf8")).resolves.toBe("shell ok");

    const effectIndex = await buildEffectIndex({ runDir });
    expect(effectIndex.getByEffectId(effectId)).toMatchObject({
      status: "resolved_error",
      resultRef: `tasks/${effectId}/result.json`,
      stdoutRef: `tasks/${effectId}/stdout.log`,
      stderrRef: `tasks/${effectId}/stderr.log`,
    });
  });
});
