/**
 * Compatibility surface for PhaseOrchestration helpers.
 *
 * The implementation lives under ./orchestration/ so the command stays
 * split by responsibility instead of accreting more top-level helper files.
 */

export {
  MAX_CONSECUTIVE_PROCESS_ERROR_STALLS,
  MAX_CONSECUTIVE_STALLS,
  MAX_CONSECUTIVE_TIMEOUTS,
  MAX_PROCESS_ERROR_RECOVERIES,
} from "./constants";
export {
  orchestrateIterationWithProcessLoadRetry,
  readProcessFileFingerprint,
  resolveEffect,
  resolveEffectWithRetry,
  resolveHarnessSessionIdForBinding,
} from "./effects";
export { runExternalOrchestrationPhase } from "./externalPhase";
export { runInternalOrchestrationPhase, resolveWorkspaceRunsDir } from "./internalPhase";
export { subscribeVerbosePiEvents } from "./verbose";

import type { RunOrchestrationPhaseArgs } from "./types";
import { runExternalOrchestrationPhase } from "./externalPhase";
import { runInternalOrchestrationPhase, resolveWorkspaceRunsDir } from "./internalPhase";
import {
  BabysitterRuntimeError,
  ErrorCategory,
  createApprovalAskUserQuestion,
  createAskUserQuestionResponse,
} from "../utils";
// #949: cross-harness dispatch (agent/skill) and task auto-execution (shell/node)
// are gated behind BABYSITTER_CROSS_SUBAGENTS / BABYSITTER_EXECUTE_TASKS (default
// OFF). Defense-in-depth: the gate must live at this execution seam, not only at
// the entrypoint env mutation in handleHarnessCreateRun.
import { crossSubagentsEnabled, executeTasksEnabled } from "@a5c-ai/babysitter-sdk";

async function importOptionalModule(specifier: string): Promise<unknown> {
  return import(specifier);
}

/**
 * Parse a babysitter CLI `--json` stdout payload, failing loudly (and fast)
 * when the CLI emitted a non-JSON line instead of a structured result.
 *
 * Bug #936 phase-2: when a delegated effect failed, `babysitter run:iterate`
 * (or its child) could emit a bare `Error: Effect failed` line on stdout. The
 * old code did an UNGUARDED `JSON.parse(...)`, which surfaced the cryptic
 * `Unexpected token 'E', "Error: Effect failed" is not valid JSON` and then
 * spun the iterate loop until the 80-minute orchestration timeout.
 *
 * This helper trims, attempts the parse, and on failure throws a clear
 * {@link BabysitterRuntimeError} that includes the command, the first ~500
 * chars of the raw non-JSON stdout AND stderr, so the failure is diagnosable
 * immediately instead of as a SyntaxError 80 minutes later.
 */
export function parseBabysitterCliJson(
  raw: string,
  context: { command: string; stderr?: string },
): Record<string, unknown> {
  const trimmed = (raw ?? "").trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch (error: unknown) {
    const parseMessage = error instanceof Error ? error.message : String(error);
    const stdoutSnippet = trimmed.slice(0, 500);
    const stderrSnippet = (context.stderr ?? "").trim().slice(0, 500);
    throw new BabysitterRuntimeError(
      "BabysitterCliNonJsonOutput",
      `babysitter ${context.command} did not emit valid JSON on stdout under --json `
        + `(${parseMessage}).\n--- stdout (first 500 chars) ---\n${stdoutSnippet || "<empty>"}`
        + `\n--- stderr (first 500 chars) ---\n${stderrSnippet || "<empty>"}`,
      { category: ErrorCategory.Runtime },
    );
  }
}

/**
 * execFileSync throws on non-zero exit; the error carries `stdout`/`stderr`
 * buffers. Surface BOTH so a failed iterate/create is diagnosable. The literal
 * `Error: Effect failed` line that triggered #936 lands on one of these.
 */
function describeExecFileError(err: unknown): { message: string; stdout: string; stderr: string } {
  const e = err as { message?: string; stdout?: unknown; stderr?: unknown };
  const decode = (v: unknown): string =>
    typeof v === "string" ? v : Buffer.isBuffer(v) ? v.toString("utf8") : "";
  return {
    message: err instanceof Error ? err.message : String(err),
    stdout: decode(e?.stdout),
    stderr: decode(e?.stderr),
  };
}

export async function runOrchestrationPhase(
  args: RunOrchestrationPhaseArgs,
): Promise<number> {
  const externalExitCode = await runExternalOrchestrationPhase(args);
  if (externalExitCode !== undefined) {
    return externalExitCode;
  }

  return runInternalOrchestrationPhase(args);
}

export async function runCliOrchestration(args: RunOrchestrationPhaseArgs): Promise<number> {
  const { execFileSync } = await import("node:child_process");
  const path = await import("node:path");

  const processPath = args.processPath;
  const workspace = args.workspace ?? process.cwd();
  // Bug #936: when no explicit --runs-dir is provided, babysitter run:create
  // defaults to the GLOBAL ~/.a5c/runs, so the nested run (and its completion
  // proof) land outside <workspace>/.a5c/runs where the live-stack validator —
  // and users — look. Default to the WORKSPACE runs dir instead. An explicit
  // args.runsDir or a BABYSITTER_RUNS_DIR / repo-scope override still wins (see
  // resolveWorkspaceRunsDir's precedence). The resolver walks to the workspace's
  // repo root when present and otherwise uses the workspace itself, so a
  // non-git-repo live-stack workspace still resolves to <workspace>/.a5c/runs.
  const runsDir = resolveWorkspaceRunsDir(args.runsDir, workspace);
  const prompt = args.prompt ?? "";
  const model = args.model;

  // Resolve babysitter CLI: prefer the SDK's dist/cli/main.js over global binary
  let babysitterBin = "babysitter";
  try {
    const sdkCliPath = require.resolve("@a5c-ai/babysitter-sdk/dist/cli/main.js");
    babysitterBin = `${process.execPath} ${sdkCliPath}`;
  } catch {
    // Fall back to global babysitter binary
  }

  // Create run via CLI — pass prompt both as metadata and as process inputs
  const fsPromises = await import("node:fs/promises");
  const inputsFile = path.join(workspace, `.a5c-genty-inputs-${Date.now()}.json`);
  await fsPromises.writeFile(inputsFile, JSON.stringify({ prompt, request: prompt }));
  const createArgs = [
    "run:create",
    "--entry", `${path.resolve(processPath)}#process`,
    "--process-id", path.basename(processPath, path.extname(processPath)),
    "--prompt", prompt,
    "--inputs", inputsFile,
    "--harness", "agent-core",
    "--json",
  ];
  if (runsDir) createArgs.push("--runs-dir", runsDir);

  let runDir: string;
  const babysitterBinParts = babysitterBin.split(" ");
  const babysitterCmd = babysitterBinParts[0]!;
  const babysitterPrefix = babysitterBinParts.slice(1);
  try {
    const createResult = execFileSync(babysitterCmd, [...babysitterPrefix, ...createArgs], {
      cwd: workspace,
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env },
    });
    // #936: guarded parse — a non-JSON line (e.g. "Error: Effect failed") on
    // stdout must surface a clear error, not a cryptic SyntaxError.
    const parsed = parseBabysitterCliJson(createResult, { command: "run:create" });
    runDir = parsed.runDir as string;
    await fsPromises.unlink(inputsFile).catch(() => {});
    if (!args.json) {
      process.stderr.write(`\x1b[32mRun created:\x1b[0m ${runDir}\n`);
    }
  } catch (err) {
    await fsPromises.unlink(inputsFile).catch(() => {});
    // execFileSync throws on non-zero exit — capture stdout/stderr buffers so
    // the failure reason (not just "Command failed") is visible.
    const { message, stdout, stderr } = describeExecFileError(err);
    const detail = err instanceof BabysitterRuntimeError
      ? message
      : `${message}${stdout ? `\n--- stdout ---\n${stdout.slice(0, 500)}` : ""}${stderr ? `\n--- stderr ---\n${stderr.slice(0, 500)}` : ""}`;
    if (!args.json) {
      process.stderr.write(`\x1b[31mFailed to create run:\x1b[0m ${detail}\n`);
    }
    return 1;
  }

  // Iterate loop — cap at 20 for CLI orchestration regardless of caller
  const maxIterations = Math.min(args.maxIterations ?? 20, 20);
  let consecutiveNoEffects = 0;
  for (let i = 1; i <= maxIterations; i++) {
    process.stderr.write(`[genty-orchestration] iteration ${i}/${maxIterations} starting\n`);
    try {
      const iterArgs = [...babysitterPrefix, "run:iterate", runDir, "--json", "--iteration", String(i)];
      // #936: keep the iterate calls anchored to the same runs dir as create so
      // the run lifecycle stays in <workspace>/.a5c/runs throughout.
      if (runsDir) iterArgs.push("--runs-dir", runsDir);
      process.stderr.write(`[genty-orchestration] exec: ${babysitterCmd} ${iterArgs.join(" ")}\n`);
      let iterResult: string;
      try {
        iterResult = execFileSync(babysitterCmd, iterArgs, {
          cwd: workspace,
          encoding: "utf8",
          timeout: 120_000,
          env: { ...process.env },
        });
      } catch (execErr: unknown) {
        // #936: run:iterate exited non-zero. FAIL FAST with the captured
        // stdout/stderr (which carries the real failure, e.g. the
        // "Error: Effect failed" line) instead of letting the loop spin to
        // the 80-minute orchestration timeout. Prefer stdout for the guarded
        // JSON parse when present so a structured failure result is honored.
        const { message, stdout, stderr } = describeExecFileError(execErr);
        if (stdout.trim().length > 0) {
          iterResult = stdout;
        } else {
          throw new BabysitterRuntimeError(
            "BabysitterIterateFailed",
            `babysitter run:iterate (iteration ${i}) exited non-zero: ${message}`
              + `\n--- stderr (first 500 chars) ---\n${stderr.trim().slice(0, 500) || "<empty>"}`,
            { category: ErrorCategory.Runtime },
          );
        }
      }
      // #936: guarded parse — throws a clear BabysitterRuntimeError including
      // the raw stdout/stderr when run:iterate emits a non-JSON line.
      const parsed = parseBabysitterCliJson(iterResult, { command: `run:iterate (iteration ${i})` }) as {
        status?: string;
        reason?: string;
        nextActions?: Array<Parameters<typeof resolveAndPostEffect>[0]>;
      };
      process.stderr.write(`[genty-orchestration] iterate result: status=${parsed.status} actions=${parsed.nextActions?.length ?? 0} reason=${parsed.reason ?? 'n/a'}\n`);

      if (parsed.status === "completed") {
        if (!args.json) {
          process.stderr.write(`\x1b[32mRun completed.\x1b[0m\n`);
        }
        return 0;
      }
      if (parsed.status === "failed") {
        if (!args.json) {
          process.stderr.write(`\x1b[31mRun failed:\x1b[0m ${parsed.reason ?? "unknown"}\n`);
        }
        return 1;
      }

      // Handle pending effects
      if (parsed.nextActions?.length) {
        consecutiveNoEffects = 0;
        process.stderr.write(`[genty-orchestration] iteration ${i}: ${parsed.nextActions.length} pending effects to resolve\n`);
        for (const action of parsed.nextActions) {
          process.stderr.write(`[genty-orchestration] resolving effect ${action.effectId} (${action.kind})\n`);
          await resolveAndPostEffect(action, runDir, workspace, model, babysitterBin);
          process.stderr.write(`[genty-orchestration] effect ${action.effectId} resolved\n`);
        }
      } else if (parsed.status === "none") {
        consecutiveNoEffects++;
        if (consecutiveNoEffects >= 3) {
          if (!args.json) {
            process.stderr.write(`\x1b[31mNo pending effects for ${consecutiveNoEffects} consecutive iterations — process may not be dispatching tasks.\x1b[0m\n`);
          }
          return 1;
        }
        if (!args.json) {
          process.stderr.write(`\x1b[33mNo pending effects at iteration ${i}\x1b[0m\n`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!args.json) {
        process.stderr.write(`\x1b[31mIteration ${i} error:\x1b[0m ${msg}\n`);
      }
      return 1;
    }
  }

  if (!args.json) {
    process.stderr.write(`\x1b[31mMax iterations (${maxIterations}) reached.\x1b[0m\n`);
  }
  return 1;
}

export async function resolveAndPostEffect(
  action: { effectId: string; kind: string; taskDef?: { agent?: { prompt?: string | { instructions?: string[] } } & Record<string, unknown>; shell?: { command?: string }; title?: string } & Record<string, unknown> },
  runDir: string,
  workspace: string,
  model?: string,
  babysitterBin = "babysitter",
): Promise<void> {
  // #949: gate at the execution seam. Cross-harness dispatch (agent/skill) and
  // task auto-execution (shell/node) only run when their flags are ON. When OFF,
  // do NOT execute and do NOT post — leave the effect pending so the next
  // iteration re-emits it (mirrors resolveEffect's pending contract). genty's
  // autonomous entrypoint (handleHarnessCreateRun) opts these flags ON.
  if ((action.kind === "agent" || action.kind === "skill") && !crossSubagentsEnabled()) {
    return;
  }
  if ((action.kind === "shell" || action.kind === "node" || action.kind === "orchestrator_task") && !executeTasksEnabled()) {
    return;
  }

  const { execFileSync, execSync } = await import("node:child_process");
  const { createAgentCoreSession } = await import("../utils");
  const babysitterParts = babysitterBin.split(" ");
  const bCmd = babysitterParts[0]!;
  const bPrefix = babysitterParts.slice(1);

  // #936: track the effect outcome explicitly. A delegated agent/skill prompt
  // that fails (result.success === false) or a shell command that exits
  // non-zero MUST be posted as `--status error` with the real error — NOT
  // silently posted as ok with an error string as the value. Posting a poisoned
  // "ok" value is what produced the downstream "Error: Effect failed" line and
  // the 80-minute spin.
  let value: string;
  let postStatus: "ok" | "error" = "ok";
  let postError: string | undefined;

  const tasksMuxValue = await resolveViaTasksMuxForCli(action, workspace, model);
  if (tasksMuxValue !== undefined) {
    value = tasksMuxValue;
  } else if (action.kind === "agent" || action.kind === "skill") {
    const agentPrompt = action.taskDef?.agent?.prompt;
    const prompt = typeof agentPrompt === "string"
      ? agentPrompt
      : agentPrompt?.instructions?.join("\n")
        ?? action.taskDef?.title
        ?? "Execute this task";

    const session = createAgentCoreSession({
      workspace,
      model,
      ephemeral: true,
    });
    try {
      const result = await session.prompt(prompt);
      if (result.success === false) {
        // Delegated session failed — propagate the failure so the process can
        // handle it, instead of posting the failure text as a successful value.
        postStatus = "error";
        postError = (typeof result.output === "string" && result.output.trim().length > 0)
          ? result.output
          : `Delegated ${action.kind} effect failed (exitCode=${result.exitCode ?? "unknown"})`;
        value = JSON.stringify(result.output ?? "");
      } else {
        value = JSON.stringify(result.output ?? "");
      }
    } finally {
      session.dispose();
    }
  } else if (action.kind === "shell") {
    const command = action.taskDef?.shell?.command ?? "echo ok";
    try {
      const output = execSync(command, { cwd: workspace, encoding: "utf8", timeout: 120_000 });
      value = JSON.stringify(output);
    } catch (err: unknown) {
      // A failed shell command is a real effect failure — post it as error.
      const stderr = (err as { stderr?: string }).stderr ?? "";
      postStatus = "error";
      postError = stderr || (err instanceof Error ? err.message : "shell command failed");
      value = JSON.stringify(stderr || "shell command failed");
    }
  } else if (action.kind === "breakpoint") {
    value = JSON.stringify("approved");
  } else {
    value = JSON.stringify("ok");
  }

  // Post result
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    if (postStatus === "error") {
      // task:post --status error reads the error payload as JSON from --error
      // <file> (see handleTaskPost -> readJsonFile). Write a structured error
      // object, not a bare string, so the CLI commits a proper failure result.
      const errorFile = path.join(runDir, "tasks", action.effectId, "error.json");
      await fs.mkdir(path.dirname(errorFile), { recursive: true });
      await fs.writeFile(errorFile, JSON.stringify({ name: "Error", message: postError ?? "Effect failed" }));
      execFileSync(bCmd, [...bPrefix, "task:post", runDir, action.effectId, "--status", "error", "--error", errorFile, "--json"], {
        cwd: workspace, encoding: "utf8", timeout: 30_000, env: { ...process.env },
      });
      return;
    }
    const taskDir = path.join(runDir, "tasks", action.effectId);
    await fs.mkdir(taskDir, { recursive: true });
    await fs.writeFile(path.join(taskDir, "output.json"), value);
    execFileSync(bCmd, [...bPrefix, "task:post", runDir, action.effectId, "--status", "ok", "--value", `tasks/${action.effectId}/output.json`, "--json"], {
      cwd: workspace, encoding: "utf8", timeout: 30_000, env: { ...process.env },
    });
  } catch {
    // Best effort
  }
}

async function resolveViaTasksMuxForCli(
  action: { kind: string; taskDef?: { agent?: { prompt?: string | { instructions?: string[] } } & Record<string, unknown>; title?: string } & Record<string, unknown>; taskId?: string; effectId: string; labels?: string[] },
  workspace: string,
  model?: string,
): Promise<string | undefined> {
  if (action.kind !== "agent" && action.kind !== "breakpoint") {
    return undefined;
  }

  let adapter: {
    routeTask?: (task: unknown, context?: unknown) => {
      responderType: string;
      responder?: { adapter?: string; model?: string; id?: string };
      unavailable?: boolean;
      reason?: string;
    };
    AgentMuxResponderBackend?: new (config?: Record<string, unknown>) => {
      submitBreakpoint(params: unknown): Promise<{
        answers: Array<{ text: string; responderId: string; responderName: string }>;
      }>;
    };
  };
  try {
    adapter = await importOptionalModule("@a5c-ai/tasks-adapter") as typeof adapter;
  } catch {
    return undefined;
  }

  if (typeof adapter.routeTask !== "function") {
    return undefined;
  }

  const decision = adapter.routeTask(action.taskDef);
  if (decision.responderType === "internal" || decision.responderType === "human") {
    if (decision.responderType === "human") {
      return JSON.stringify(buildCliBreakpointValue(action));
    }
    return undefined;
  }
  if (decision.responderType === "tracker") {
    if (!decision.unavailable) return undefined;
    return JSON.stringify({
      success: false,
      routedThrough: "tasks-adapter",
      responderType: "tracker",
      error: decision.reason ?? "ExternalTrackerBackend unavailable",
    });
  }
  if (decision.responderType !== "agent") {
    return undefined;
  }
  const fallbackToInternal = shouldFallbackExternalAgentToInternal(action.taskDef);
  if (typeof adapter.AgentMuxResponderBackend !== "function") {
    if (fallbackToInternal) return undefined;
    throw new Error("tasks-adapter AgentMuxResponderBackend is unavailable");
  }

  const prompt = buildCliAgentPrompt(action.taskDef);
  let breakpoint: { answers: Array<{ text: string; responderId: string; responderName: string }> };
  try {
    const backend = new adapter.AgentMuxResponderBackend({
      adapter: decision.responder?.adapter ?? decision.responder?.id,
      model: decision.responder?.model ?? model,
      cwd: workspace,
    });
    breakpoint = await backend.submitBreakpoint({
      text: prompt,
      context: {
        description: action.taskDef?.title ?? action.taskId ?? action.effectId,
        codeSnippets: [],
        fileReferences: [],
        tags: action.labels ?? [],
      },
      routing: {
        strategy: "single",
        targetResponders: decision.responder?.id ? [decision.responder.id] : [],
        timeoutMs: readExternalAgentTimeoutMs(action.taskDef) ?? 300_000,
        presentToUser: false,
        responderType: "agent",
        adapter: decision.responder?.adapter ?? decision.responder?.id,
        model: decision.responder?.model ?? model,
      },
    });
  } catch (err) {
    if (fallbackToInternal) return undefined;
    throw err;
  }
  return JSON.stringify(breakpoint.answers[0]?.text ?? "");
}

function buildCliBreakpointValue(
  action: { taskDef?: { title?: string } & Record<string, unknown>; taskId?: string; effectId: string },
): Record<string, unknown> {
  const question = (action.taskDef as Record<string, unknown> | undefined)?.question as string | undefined
    ?? action.taskDef?.title
    ?? action.taskId
    ?? action.effectId;
  const approvalPrompt = createApprovalAskUserQuestion(question);
  const approvalKey = approvalPrompt.questions[0]?.header ?? "Decision";
  const response = createAskUserQuestionResponse(approvalPrompt, { [approvalKey]: "Approve" });
  return {
    approved: true,
    option: "Approve",
    askUserQuestion: response,
  };
}

function buildCliAgentPrompt(taskDef: { agent?: { prompt?: string | { instructions?: string[] } }; title?: string } | undefined): string {
  const agentPrompt = taskDef?.agent?.prompt;
  return typeof agentPrompt === "string"
    ? agentPrompt
    : agentPrompt?.instructions?.join("\n")
      ?? taskDef?.title
      ?? "Execute this task";
}

function shouldFallbackExternalAgentToInternal(taskDef: Record<string, unknown> | undefined): boolean {
  const agent = isPlainRecord(taskDef?.agent) ? taskDef.agent : {};
  const metadata = isPlainRecord(taskDef?.metadata) ? taskDef.metadata : {};
  return agent.fallbackToInternal === true
    || metadata.fallbackToInternal === true
    || agent.fallbackType === "internal"
    || metadata.fallbackType === "internal";
}

function readExternalAgentTimeoutMs(taskDef: Record<string, unknown> | undefined): number | undefined {
  const agent = isPlainRecord(taskDef?.agent) ? taskDef.agent : {};
  return typeof agent.timeoutMs === "number" ? agent.timeoutMs : undefined;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
