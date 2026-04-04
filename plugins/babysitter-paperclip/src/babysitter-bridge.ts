/**
 * CLI bridge to the babysitter SDK.
 *
 * Wraps babysitter CLI commands as typed async functions for use by the
 * Paperclip plugin worker. All operations shell out to the `babysitter` CLI
 * to maintain a clean process boundary.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  RunDetail,
  RunEvent,
  PendingEffect,
  PendingBreakpoint,
} from "./types";

const exec = promisify(execFile);

const CLI = "babysitter";

/** Execute a babysitter CLI command and return parsed JSON. */
async function runCli<T>(
  args: string[],
  options?: { cwd?: string }
): Promise<T> {
  const { stdout } = await exec(CLI, [...args, "--json"], {
    cwd: options?.cwd,
    timeout: 60_000,
  });
  return JSON.parse(stdout) as T;
}

/** Create a new babysitter run. */
export async function createRun(opts: {
  processId: string;
  entry: string;
  inputsFile: string;
  runsDir?: string;
  cwd?: string;
}): Promise<{ runId: string; runDir: string }> {
  const args = [
    "run:create",
    "--process-id",
    opts.processId,
    "--entry",
    opts.entry,
    "--inputs",
    opts.inputsFile,
  ];
  if (opts.runsDir) args.push("--runs-dir", opts.runsDir);
  return runCli(args, { cwd: opts.cwd });
}

/** Iterate a run until pending effects or completion. */
export async function iterateRun(
  runDir: string,
  options?: { cwd?: string }
): Promise<{
  status: string;
  nextActions: Array<{
    effectId: string;
    kind: string;
    label: string;
    taskId: string;
    taskDef?: Record<string, unknown>;
  }>;
  metadata: Record<string, unknown>;
}> {
  return runCli(["run:iterate", runDir], options);
}

/** Get run status. */
export async function getRunStatus(
  runDir: string,
  options?: { cwd?: string }
): Promise<{
  state: string;
  pendingByKind: Record<string, number>;
  completionProof: string | null;
}> {
  return runCli(["run:status", runDir], options);
}

/** Get run events. */
export async function getRunEvents(
  runDir: string,
  limit?: number,
  options?: { cwd?: string }
): Promise<RunEvent[]> {
  const args = ["run:events", runDir];
  if (limit) args.push("--limit", String(limit));
  return runCli(args, options);
}

/** List pending tasks. */
export async function listPendingTasks(
  runDir: string,
  options?: { cwd?: string }
): Promise<PendingEffect[]> {
  return runCli(["task:list", runDir, "--pending"], options);
}

/** Show a specific task. */
export async function showTask(
  runDir: string,
  effectId: string,
  options?: { cwd?: string }
): Promise<{ effect: PendingEffect; task: Record<string, unknown> | null }> {
  return runCli(["task:show", runDir, effectId], options);
}

/** Post a task result (approve/reject breakpoint or post effect result). */
export async function postTaskResult(
  runDir: string,
  effectId: string,
  result: {
    status: "ok" | "error";
    value: Record<string, unknown>;
  },
  options?: { cwd?: string }
): Promise<{ status: string }> {
  return runCli(
    [
      "task:post",
      runDir,
      effectId,
      "--status",
      result.status,
      "--value-inline",
      JSON.stringify(result.value),
    ],
    options
  );
}

/** Approve a breakpoint. */
export async function approveBreakpoint(
  runDir: string,
  effectId: string,
  response?: string,
  options?: { cwd?: string }
): Promise<{ status: string }> {
  return postTaskResult(
    runDir,
    effectId,
    {
      status: "ok",
      value: { approved: true, response: response ?? "Approved via Paperclip UI" },
    },
    options
  );
}

/** Reject a breakpoint. Note: uses --status ok with approved: false. */
export async function rejectBreakpoint(
  runDir: string,
  effectId: string,
  feedback: string,
  options?: { cwd?: string }
): Promise<{ status: string }> {
  return postTaskResult(
    runDir,
    effectId,
    {
      status: "ok",
      value: { approved: false, feedback },
    },
    options
  );
}

/**
 * Extract pending breakpoints from a run with full metadata.
 *
 * This reads the task.json for each breakpoint effect to get the full payload
 * including question, options, expert routing, tags, and strategy. This is the
 * same metadata that the underlying harness (Claude Code, OpenClaw) uses to
 * present breakpoints to users.
 *
 * The breakpoint lifecycle:
 *   1. Process calls ctx.breakpoint(payload) in SDK
 *   2. SDK writes task.json with kind:"breakpoint" + metadata.payload
 *   3. run:iterate returns "waiting" with the breakpoint as a pending action
 *   4. Underlying harness stop hook detects only-breakpoints-pending → allows exit
 *   5. Paperclip polls run:status, sees pending breakpoint
 *   6. Paperclip reads task.json metadata, surfaces in UI
 *   7. User approves/rejects in Paperclip UI
 *   8. Paperclip posts via task:post --status ok (ALWAYS ok, even for rejection)
 *   9. Next run:iterate resolves the cached breakpoint result
 */
export async function getPendingBreakpoints(
  runDir: string,
  options?: { cwd?: string }
): Promise<PendingBreakpoint[]> {
  const tasks = await listPendingTasks(runDir, options);
  const breakpoints: PendingBreakpoint[] = [];

  for (const t of tasks) {
    if (t.kind !== "breakpoint") continue;

    // Try to get full task metadata including question/options
    let question: string | undefined;
    let taskOptions: string[] | undefined;
    let expert: string | string[] | undefined;
    let tags: string[] | undefined;
    let strategy: string | undefined;
    let previousFeedback: string | undefined;
    let attempt: number | undefined;

    try {
      const detail = await showTask(runDir, t.effectId, options);
      const task = detail.task as Record<string, unknown> | null;
      if (task) {
        const metadata = task.metadata as Record<string, unknown> | undefined;
        const payload = metadata?.payload as Record<string, unknown> | undefined;
        if (payload) {
          question = (payload.question ?? payload.title) as string | undefined;
          taskOptions = payload.options as string[] | undefined;
          expert = payload.expert as string | string[] | undefined;
          tags = payload.tags as string[] | undefined;
          strategy = payload.strategy as string | undefined;
          previousFeedback = payload.previousFeedback as string | undefined;
          attempt = payload.attempt as number | undefined;
        }
      }
    } catch {
      // Task metadata unavailable - use basic info
    }

    breakpoints.push({
      effectId: t.effectId,
      title: question ?? t.label,
      question,
      options: taskOptions,
      expert,
      tags,
      strategy: strategy as PendingBreakpoint["strategy"],
      previousFeedback,
      attempt,
      requestedAt: t.requestedAt,
    });
  }

  return breakpoints;
}

/**
 * Check if a run has ONLY breakpoints pending (no other effect types).
 *
 * This mirrors the check in the Claude Code stop hook (claudeCode.ts:578-598):
 * when only breakpoints are pending, the harness allows exit because human
 * action is required. This is the signal that Paperclip should surface
 * breakpoints in the UI.
 */
export async function hasOnlyBreakpointsPending(
  runDir: string,
  options?: { cwd?: string }
): Promise<{ onlyBreakpoints: boolean; breakpointCount: number; otherCount: number }> {
  const status = await getRunStatus(runDir, options);
  const pending = status.pendingByKind;
  const breakpointCount = pending.breakpoint ?? 0;
  const otherCount = Object.entries(pending)
    .filter(([k]) => k !== "breakpoint")
    .reduce((sum, [, v]) => sum + v, 0);

  return {
    onlyBreakpoints: breakpointCount > 0 && otherCount === 0,
    breakpointCount,
    otherCount,
  };
}

/**
 * Install the babysitter plugin for a specific harness.
 * Delegates to `babysitter harness:install-plugin <name>`.
 */
export async function installHarnessPlugin(
  harnessName: string,
  options?: { cwd?: string }
): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout } = await exec(
      CLI,
      ["harness:install-plugin", harnessName, "--json"],
      { cwd: options?.cwd, timeout: 120_000 }
    );
    return { success: true, output: stdout };
  } catch (err) {
    return {
      success: false,
      output: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Discover available harnesses and their plugin status.
 */
export async function discoverHarnesses(
  options?: { cwd?: string }
): Promise<Array<{ name: string; available: boolean; pluginInstalled?: boolean }>> {
  try {
    return await runCli(["harness:discover"], options);
  } catch {
    return [];
  }
}

/** Build the run directory path from a runs dir and run ID. */
export function buildRunDir(runsDir: string, runId: string): string {
  return `${runsDir}/${runId}`;
}
