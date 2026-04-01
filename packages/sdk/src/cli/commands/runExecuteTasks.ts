/**
 * run:execute-tasks command - Execute pending auto-runnable tasks in a run
 *
 * This command replaces the shell-based task execution logic in native-orchestrator.sh.
 * It:
 * 1. Loads the journal and builds the effect index
 * 2. Filters pending effects by kind (default "node")
 * 3. Slices to maxTasks (default 3)
 * 4. For each task: reads task.json, spawns the configured runtime, captures stdout/stderr, commits result
 * 5. Returns a summary of executed tasks
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { commitEffectResult } from "../../runtime/commitEffectResult";
import { readTaskDefinition } from "../../storage/tasks";
import type { EffectRecord } from "../../runtime/types";
import { getConfig } from "../../config/defaults";

export interface RunExecuteTasksOptions {
  runDir: string;
  maxTasks?: number; // default 3
  kind?: string; // default "node"
  timeout?: number; // default BABYSITTER_NODE_TASK_TIMEOUT
  verbose?: boolean;
  json?: boolean;
  dryRun?: boolean;
}

export interface TaskExecutionSummary {
  effectId: string;
  label: string | null;
  status: "ok" | "error";
  exitCode: number;
  durationMs: number;
  stdoutRef: string | null;
  stderrRef: string | null;
  resultRef: string | null;
  error?: { name: string; message: string };
}

export interface RunExecuteTasksResult {
  action: string; // "executed-tasks" | "none"
  count: number;
  reason: string; // "auto-runnable-tasks" | "no-pending-effects" | "no-matching-tasks" | "dry-run"
  tasks: TaskExecutionSummary[];
}

interface TaskNodeConfig {
  entry: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

interface TaskShellConfig {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

interface TaskIoConfig {
  inputJsonPath?: string;
  outputJsonPath?: string;
  stdoutPath?: string;
  stderrPath?: string;
}

function log(verbose: boolean | undefined, ...args: string[]): void {
  if (verbose) {
    console.error(`[run:execute-tasks]`, ...args);
  }
}

/**
 * Resolve a path relative to runDir unless it is already absolute.
 */
function resolveRelative(runDir: string, ref: string): string {
  if (path.isAbsolute(ref) || /^[A-Za-z]:[\\/]/.test(ref)) {
    return ref;
  }
  return path.join(runDir, ref);
}

/**
 * Make a path relative to runDir, using forward slashes.
 */
function toRunRelative(runDir: string, absolute: string): string {
  return path.relative(runDir, absolute).replace(/\\/g, "/");
}

interface SpawnTaskOptions {
  command: string;
  args?: string[];
  cwd: string;
  env: Record<string, string>;
  timeout: number;
  shell?: boolean;
}

/**
 * Spawn a child process for the given task and capture its output.
 */
function spawnTask(options: SpawnTaskOptions): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(options.command, options.args ?? [], {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: options.timeout,
      shell: options.shell ?? false,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });

    child.on("error", (err) => {
      resolve({
        exitCode: 1,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: `${Buffer.concat(stderrChunks).toString("utf8")}\n${err.message}`,
      });
    });
  });
}

async function readTaskOutputValue(outputAbs: string): Promise<unknown> {
  try {
    const outputContents = await fs.readFile(outputAbs, "utf8");
    const trimmed = outputContents.trim();
    if (trimmed.length === 0) {
      throw new Error(`Task exited successfully but wrote an empty result payload to ${outputAbs}`);
    }
    return JSON.parse(trimmed) as unknown;
  } catch (error) {
    if (error instanceof Error && error.message.includes("result payload")) {
      throw error;
    }
    throw new Error(`Task exited successfully but did not write a JSON result payload to ${outputAbs}`);
  }
}

/**
 * Execute a single task: read its definition, spawn node, commit the result.
 */
async function executeOneTask(
  runDir: string,
  record: EffectRecord,
  timeout: number,
  verbose?: boolean
): Promise<TaskExecutionSummary> {
  const effectId = record.effectId;
  const label = record.label ?? null;

  log(verbose, `Executing: ${effectId}${label ? ` (${label})` : ""}`);

  // Read task.json
  const taskDef = await readTaskDefinition(runDir, effectId);
  if (!taskDef) {
    log(verbose, `Missing task definition for ${effectId}`);
    const errorPayload = {
      name: "Error",
      message: `Missing task definition for effect ${effectId}`,
    };
    await commitEffectResult({
      runDir,
      effectId,
      invocationKey: record.invocationKey,
      result: {
        status: "error",
        error: errorPayload,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      },
    });
    return {
      effectId,
      label,
      status: "error",
      exitCode: 1,
      durationMs: 0,
      stdoutRef: null,
      stderrRef: null,
      resultRef: null,
      error: errorPayload,
    };
  }

  const taskKind = String(record.kind ?? taskDef.kind ?? "").toLowerCase();

  // Extract IO config
  const ioConfig = (taskDef.io ?? {}) as Partial<TaskIoConfig>;
  const inputRef = ioConfig.inputJsonPath ?? `tasks/${effectId}/inputs.json`;
  const outputRef = ioConfig.outputJsonPath ?? `tasks/${effectId}/result.json`;
  const stdoutRef = ioConfig.stdoutPath ?? `tasks/${effectId}/stdout.log`;
  const stderrRef = ioConfig.stderrPath ?? `tasks/${effectId}/stderr.log`;

  // Resolve paths relative to runDir
  const inputAbs = resolveRelative(runDir, inputRef);
  const outputAbs = resolveRelative(runDir, outputRef);
  const stdoutAbs = resolveRelative(runDir, stdoutRef);
  const stderrAbs = resolveRelative(runDir, stderrRef);
  // Ensure directories exist
  await Promise.all([
    fs.mkdir(path.dirname(inputAbs), { recursive: true }),
    fs.mkdir(path.dirname(outputAbs), { recursive: true }),
    fs.mkdir(path.dirname(stdoutAbs), { recursive: true }),
    fs.mkdir(path.dirname(stderrAbs), { recursive: true }),
  ]);

  // Stage inputs.json
  const inputsRefField = taskDef.inputsRef as string | undefined;
  if (inputsRefField) {
    const sourceAbs = resolveRelative(runDir, inputsRefField);
    try {
      await fs.copyFile(sourceAbs, inputAbs);
    } catch {
      // If the source doesn't exist, write an empty object
      await fs.writeFile(inputAbs, "{}\n", "utf8");
    }
  } else {
    // Extract inline inputs or default to {}
    const inputs = taskDef.inputs ?? {};
    await fs.writeFile(inputAbs, JSON.stringify(inputs) + "\n", "utf8");
  }

  let spawnOptions: SpawnTaskOptions;

  if (taskKind === "node") {
    const nodeConfig = (taskDef.node ?? {}) as Partial<TaskNodeConfig>;
    const entry = nodeConfig.entry;

    if (!entry) {
      log(verbose, `Missing node.entry in task.json for ${effectId}`);
      const errorPayload = {
        name: "Error",
        message: `Missing node.entry in task definition for effect ${effectId}`,
      };
      await commitEffectResult({
        runDir,
        effectId,
        invocationKey: record.invocationKey,
        result: {
          status: "error",
          error: errorPayload,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        },
      });
      return {
        effectId,
        label,
        status: "error",
        exitCode: 1,
        durationMs: 0,
        stdoutRef: null,
        stderrRef: null,
        resultRef: null,
        error: errorPayload,
      };
    }

    spawnOptions = {
      command: "node",
      args: [resolveRelative(runDir, entry), ...(nodeConfig.args ?? [])],
      cwd: nodeConfig.cwd ? resolveRelative(runDir, nodeConfig.cwd) : runDir,
      env: {
        ...(nodeConfig.env ?? {}),
        BABYSITTER_INPUT_JSON: inputAbs,
        BABYSITTER_OUTPUT_JSON: outputAbs,
        BABYSITTER_STDOUT_PATH: stdoutAbs,
        BABYSITTER_STDERR_PATH: stderrAbs,
        BABYSITTER_EFFECT_ID: effectId,
      },
      timeout: nodeConfig.timeoutMs ?? timeout,
    };
  } else if (taskKind === "shell") {
    const shellConfig = (taskDef.shell ?? {}) as Partial<TaskShellConfig>;
    const command = shellConfig.command;

    if (!command) {
      log(verbose, `Missing shell.command in task.json for ${effectId}`);
      const errorPayload = {
        name: "Error",
        message: `Missing shell.command in task definition for effect ${effectId}`,
      };
      await commitEffectResult({
        runDir,
        effectId,
        invocationKey: record.invocationKey,
        result: {
          status: "error",
          error: errorPayload,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        },
      });
      return {
        effectId,
        label,
        status: "error",
        exitCode: 1,
        durationMs: 0,
        stdoutRef: null,
        stderrRef: null,
        resultRef: null,
        error: errorPayload,
      };
    }

    spawnOptions = {
      command,
      cwd: shellConfig.cwd ? resolveRelative(runDir, shellConfig.cwd) : runDir,
      env: {
        ...(shellConfig.env ?? {}),
        BABYSITTER_INPUT_JSON: inputAbs,
        BABYSITTER_OUTPUT_JSON: outputAbs,
        BABYSITTER_STDOUT_PATH: stdoutAbs,
        BABYSITTER_STDERR_PATH: stderrAbs,
        BABYSITTER_EFFECT_ID: effectId,
      },
      timeout: shellConfig.timeoutMs ?? timeout,
      shell: true,
    };
  } else {
    const errorPayload = {
      name: "Error",
      message: `Unsupported auto-runnable task kind "${taskKind || "unknown"}" for effect ${effectId}`,
    };
    await commitEffectResult({
      runDir,
      effectId,
      invocationKey: record.invocationKey,
      result: {
        status: "error",
        error: errorPayload,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      },
    });
    return {
      effectId,
      label,
      status: "error",
      exitCode: 1,
      durationMs: 0,
      stdoutRef: null,
      stderrRef: null,
      resultRef: null,
      error: errorPayload,
    };
  }

  // Spawn the node process
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const spawnResult = await spawnTask(spawnOptions);

  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startMs;

  // Write stdout and stderr to disk
  await fs.writeFile(stdoutAbs, spawnResult.stdout, "utf8");
  await fs.writeFile(stderrAbs, spawnResult.stderr, "utf8");

  const stdoutRelRef = toRunRelative(runDir, stdoutAbs);
  const stderrRelRef = toRunRelative(runDir, stderrAbs);

  // Commit the result
  if (spawnResult.exitCode === 0) {
    let value: unknown;
    try {
      value = await readTaskOutputValue(outputAbs);
    } catch (error) {
      const errorPayload = {
        name: error instanceof Error ? error.name : "Error",
        message: error instanceof Error ? error.message : String(error),
      };

      const committed = await commitEffectResult({
        runDir,
        effectId,
        invocationKey: record.invocationKey,
        result: {
          status: "error",
          error: errorPayload,
          stdoutRef: stdoutRelRef,
          stderrRef: stderrRelRef,
          startedAt,
          finishedAt,
        },
      });

      log(verbose, `Posted error: ${effectId} (missing result payload, ${durationMs}ms)`);

      return {
        effectId,
        label,
        status: "error",
        exitCode: 1,
        durationMs,
        stdoutRef: stdoutRelRef,
        stderrRef: stderrRelRef,
        resultRef: committed.resultRef ?? null,
        error: errorPayload,
      };
    }

    const committed = await commitEffectResult({
      runDir,
      effectId,
      invocationKey: record.invocationKey,
      result: {
        status: "ok",
        value,
        stdoutRef: stdoutRelRef,
        stderrRef: stderrRelRef,
        startedAt,
        finishedAt,
      },
    });

    log(verbose, `Posted result: ${effectId} (ok, ${durationMs}ms)`);

    return {
      effectId,
      label,
      status: "ok",
      exitCode: spawnResult.exitCode,
      durationMs,
      stdoutRef: stdoutRelRef,
      stderrRef: stderrRelRef,
      resultRef: committed.resultRef ?? null,
    };
  } else {
    const errorPayload = {
      name: "Error",
      message: `Node task exited non-zero (exitCode=${spawnResult.exitCode})`,
    };

    const committed = await commitEffectResult({
      runDir,
      effectId,
      invocationKey: record.invocationKey,
      result: {
        status: "error",
        error: errorPayload,
        stdoutRef: stdoutRelRef,
        stderrRef: stderrRelRef,
        startedAt,
        finishedAt,
      },
    });

    log(verbose, `Posted error: ${effectId} (exitCode=${spawnResult.exitCode}, ${durationMs}ms)`);

    return {
      effectId,
      label,
      status: "error",
      exitCode: spawnResult.exitCode,
      durationMs,
      stdoutRef: stdoutRelRef,
      stderrRef: stderrRelRef,
      resultRef: committed.resultRef ?? null,
      error: errorPayload,
    };
  }
}

export async function runExecuteTasks(options: RunExecuteTasksOptions): Promise<RunExecuteTasksResult> {
  const {
    runDir,
    verbose,
    dryRun,
  } = options;
  const maxTasks = options.maxTasks ?? 3;
  const kind = options.kind ?? "node";
  const config = getConfig();
  const timeout = options.timeout ?? config.nodeTaskTimeout;

  log(verbose, `Scanning for pending ${kind} tasks in ${runDir} (maxTasks=${maxTasks})`);

  // Build the effect index from journal
  const effectIndex = await buildEffectIndex({ runDir });
  const pendingEffects = effectIndex.listPendingEffects();

  if (pendingEffects.length === 0) {
    log(verbose, "No pending effects found");
    return {
      action: "none",
      count: 0,
      reason: "no-pending-effects",
      tasks: [],
    };
  }

  // Filter by kind
  const matchingEffects = pendingEffects.filter(
    (record) => record.kind?.toLowerCase() === kind.toLowerCase()
  );

  if (matchingEffects.length === 0) {
    log(verbose, `No pending effects matching kind="${kind}"`);
    return {
      action: "none",
      count: 0,
      reason: "no-matching-tasks",
      tasks: [],
    };
  }

  // Slice to maxTasks
  const tasksToExecute = matchingEffects.slice(0, maxTasks);

  log(verbose, `Found ${matchingEffects.length} matching tasks, executing ${tasksToExecute.length}`);

  if (dryRun) {
    const dryRunTasks: TaskExecutionSummary[] = tasksToExecute.map((record) => ({
      effectId: record.effectId,
      label: record.label ?? null,
      status: "ok" as const,
      exitCode: 0,
      durationMs: 0,
      stdoutRef: null,
      stderrRef: null,
      resultRef: null,
    }));
    return {
      action: "none",
      count: tasksToExecute.length,
      reason: "dry-run",
      tasks: dryRunTasks,
    };
  }

  // Execute tasks sequentially
  const taskSummaries: TaskExecutionSummary[] = [];
  for (const record of tasksToExecute) {
    const summary = await executeOneTask(runDir, record, timeout, verbose);
    taskSummaries.push(summary);
  }

  return {
    action: "executed-tasks",
    count: taskSummaries.length,
    reason: "auto-runnable-tasks",
    tasks: taskSummaries,
  };
}
