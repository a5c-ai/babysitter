import path from "path";
import { readTaskDefinition } from "../storage/tasks";
import { TaskDef } from "../tasks/types";
import { hydrateCliNodeTaskEnv } from "../runner/env";
import { RunNodeTaskOptions, RunNodeTaskResult, commitNodeResult, runNodeTask } from "../runner/nodeRunner";
import { CommitEffectResultArtifacts, ProcessLogger } from "../runtime/types";
import { callRuntimeHook } from "../runtime/hooks/runtime";

export interface CliRunNodeTaskOptions extends Omit<RunNodeTaskOptions, "task" | "hydration" | "baseEnv"> {
  task?: TaskDef;
  baseEnv?: NodeJS.ProcessEnv;
  invocationKey?: string;
  logger?: ProcessLogger;
}

export interface CliRunNodeTaskResult extends RunNodeTaskResult {
  hydratedKeys: string[];
  missingKeys: string[];
  committed?: CommitEffectResultArtifacts;
}

export async function runNodeTaskFromCli(options: CliRunNodeTaskOptions): Promise<CliRunNodeTaskResult> {
  const task = options.task ?? (await loadTaskDefinition(options.runDir, options.effectId));
  const hydration = hydrateCliNodeTaskEnv(task, {
    cleanEnv: options.cleanEnv,
    envOverrides: options.envOverrides,
    baseEnv: options.baseEnv ?? process.env,
  });

  const runId = extractRunIdFromPath(options.runDir);
  const taskStartTime = Date.now();

  // Compute project root for hook calls (parent of .a5c dir where plugins/ is located)
  // runDir is like: /path/to/project/.a5c/runs/<runId>
  // So we need 3 levels up: runs -> .a5c -> project
  const projectRoot = path.dirname(path.dirname(path.dirname(options.runDir)));

  // Call on-task-start hook
  await callRuntimeHook(
    "on-task-start",
    {
      runId,
      effectId: options.effectId,
      taskId: extractInvocationKey(task) || options.effectId,
      kind: "node",
    },
    {
      cwd: projectRoot,
      logger: options.logger,
    }
  );

  const result = await runNodeTask({
    ...options,
    task,
    hydration,
  });
  let committed: CommitEffectResultArtifacts | undefined;
  if (!options.dryRun) {
    committed = await commitNodeResult({
      runDir: options.runDir,
      effectId: options.effectId,
      invocationKey: options.invocationKey ?? extractInvocationKey(task),
      logger: options.logger,
      result,
    });
  }

  // Call on-task-complete hook
  await callRuntimeHook(
    "on-task-complete",
    {
      runId,
      effectId: options.effectId,
      taskId: extractInvocationKey(task) || options.effectId,
      status: result.exitCode === 0 ? "ok" : "error",
      duration: Date.now() - taskStartTime,
    },
    {
      cwd: projectRoot,
      logger: options.logger,
    }
  );

  return {
    ...result,
    hydratedKeys: hydration.hydratedKeys,
    missingKeys: hydration.missingKeys,
    committed,
  };
}

async function loadTaskDefinition(runDir: string, effectId: string): Promise<TaskDef> {
  const def = await readTaskDefinition(runDir, effectId);
  if (!def) {
    throw new Error(`Task definition for effect ${effectId} is missing`);
  }
  return def as TaskDef;
}

function extractInvocationKey(task: TaskDef): string | undefined {
  const raw = (task as Record<string, unknown>)?.invocationKey;
  return typeof raw === "string" && raw.trim().length > 0 ? raw : undefined;
}

function extractRunIdFromPath(runDir: string): string {
  // Extract runId from path like .a5c/runs/<runId> or absolute path ending with runId
  const normalized = path.normalize(runDir);
  const parts = normalized.split(path.sep);
  // Get the last non-empty part
  return parts[parts.length - 1] || "unknown";
}
