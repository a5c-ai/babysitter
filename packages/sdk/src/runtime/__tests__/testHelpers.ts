import { createRunDir } from "../../storage/createRunDir";
import { appendEvent } from "../../storage/journal";
import { buildEffectIndex } from "../replay/effectIndex";
import { ReplayCursor } from "../replay/replayCursor";
import { TaskIntrinsicContext } from "../intrinsics/task";

export interface TestRunInfo {
  runDir: string;
  runId: string;
}

export async function createTestRun(tmpRoot: string, runId = `run-${Date.now()}`): Promise<TestRunInfo> {
  const { runDir } = await createRunDir({
    runsRoot: tmpRoot,
    runId,
    request: "runtime-test",
    processPath: "./process.js",
  });
  await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });
  return { runDir, runId };
}

export interface BuildTaskContextOptions {
  now?: () => Date;
  processId?: string;
  logger?: (...args: any[]) => void;
  subprocessSupport?: "disabled" | "babysitter-agent";
}

export async function buildTaskContext(
  runDir: string,
  runId: string,
  options?: BuildTaskContextOptions
): Promise<TaskIntrinsicContext> {
  const effectIndex = await buildEffectIndex({ runDir });
  const replayCursor = new ReplayCursor();
  return {
    runId,
    runDir,
    processId: options?.processId ?? "demo-process",
    effectIndex,
    replayCursor,
    now: options?.now ?? (() => new Date()),
    logger: options?.logger,
    subprocessSupport: options?.subprocessSupport,
  };
}
