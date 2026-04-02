/**
 * Phase 2: Bound orchestration loop.
 *
 * Drives the babysitter run orchestration — creating the run, binding to a
 * harness session, iterating effects, and resolving them through PI workers
 * or external harness CLIs.
 */

import * as path from "node:path";
import * as readline from "node:readline";
import { Type } from "@sinclair/typebox";
import { invokeHarness } from "../../harness/invoker";
import { createAgenticToolDefinitions } from "../../harness/agenticTools";
import { getAdapterByName } from "../../harness";
import { createRun } from "../../runtime/createRun";
import { orchestrateIteration } from "../../runtime/orchestrateIteration";
import { commitEffectResult } from "../../runtime/commitEffectResult";
import {
  buildOrchestrationSystemPrompt,
  buildOrchestrationBootstrapPrompt,
  buildOrchestrationTurnPrompt,
} from "./harnessPrompts";
import {
  buildAgentPrompt,
  coerceAgentResultValue,
  execShellEffect,
} from "./harnessPhase1";
import {
  // Types
  type OrchestrationState,
  type ToolResultShape,
  type AskUserQuestionToolContext,
  type DelegationConfig,
  type EffectRetryConfig,
  type ResolveEffectResult,
  type CompressionConfig,
  type HarnessDiscoveryResult,
  type PiSessionEvent,
  type AskUserQuestionRequest,
  type AskUserQuestionResponse,
  type HarnessPromptContext as SessionCreatePromptContext,
  type EffectAction,
  type IterationResult,
  // Constants
  DIM,
  RESET,
  BOLD,
  YELLOW,
  DEFAULT_EFFECT_RETRY_CONFIG,
  PI_DEFAULT_PROMPT_TIMEOUT_MS,
  PI_WORKER_TIMEOUT_MS,
  ASK_USER_QUESTION_SCHEMA,
  // Functions
  writeVerboseLine,
  writeVerboseBlock,
  emitProgress,
  compressInternalHarnessPrompt,
  formatToolResult,
  askUserQuestionViaTool,
  resolveTaskHarness,
  isInternalHarness,
  shouldUseExternalHarness,
  shellQuoteArg,
  readStringMetadata,
  isProcessModuleLoadFailure,
  isIgnorablePiPromptFailure,
  promptPiWithRetry,
  buildPiWorkerSessionOptions,
  // Re-exports
  BabysitterRuntimeError,
  ErrorCategory,
  createPiSession,
  PiSessionHandle,
  createReadlineAskUserQuestionUiContext,
  createApprovalAskUserQuestion,
  createAskUserQuestionResponse,
} from "./harnessUtils";

// ── Constants ────────────────────────────────────────────────────────

const PROCESS_MODULE_LOAD_RETRY_DELAYS_MS = process.env.VITEST
  ? [0, 0]
  : [100, 250, 500];

/**
 * Maximum number of consecutive Pi prompt timeouts before the orchestration
 * run is failed.  A single timeout is recoverable — the loop simply continues
 * — but repeated timeouts indicate a persistent infrastructure issue.
 */
export const MAX_CONSECUTIVE_TIMEOUTS = 3;

// For tests
const EFFECT_RETRY_DELAYS_OVERRIDE = process.env.VITEST ? [0, 0, 0] : undefined;

// ── Effect Resolution ────────────────────────────────────────────────

export async function resolveEffect(
  action: EffectAction,
  harnessName: string,
  options: {
    workspace?: string;
    model?: string;
    interactive?: boolean;
    compressionConfig?: CompressionConfig | null;
  },
  piSession?: PiSessionHandle | null,
  discovered?: HarnessDiscoveryResult[],
  rl?: readline.Interface | null,
  json?: boolean,
  askUserQuestionHandler?: ((params: unknown) => Promise<unknown>) | null,
): Promise<ResolveEffectResult> {
  const kind = action.kind;

  if (kind === "node" || kind === "orchestrator_task") {
    const meta = action.taskDef?.metadata as Record<string, unknown> | undefined;
    const metaPrompt = typeof meta?.prompt === "string" ? meta.prompt : undefined;
    const prompt =
      metaPrompt ??
      action.taskDef?.title ??
      `Execute task ${action.taskId ?? action.effectId}`;
    const effectivePrompt = compressInternalHarnessPrompt(
      prompt,
      options.compressionConfig,
      "skill",
    );

    const taskHarness = discovered
      ? resolveTaskHarness(action, harnessName, discovered)
      : harnessName;

    if (isInternalHarness(taskHarness) && piSession) {
      const piResult = await promptPiWithRetry({
        session: piSession,
        message: effectivePrompt,
        timeout: PI_WORKER_TIMEOUT_MS,
        label: `effect ${action.effectId}`,
      });
      return {
        status: piResult.success ? "ok" : "error",
        value: piResult.success ? piResult.output : undefined,
        error: piResult.success ? undefined : new Error(piResult.output),
        stdout: piResult.output,
      };
    }

    const result = await invokeHarness(taskHarness, {
      prompt: effectivePrompt,
      workspace: options.workspace,
      model: options.model,
    });

    return {
      status: result.success ? "ok" : "error",
      value: result.success ? result.output : undefined,
      error: result.success ? undefined : new Error(result.output),
      stdout: result.output,
    };
  }

  if (kind === "shell") {
    const shellDef = action.taskDef?.shell as Record<string, unknown> | undefined;
    const shellMeta = action.taskDef?.metadata as Record<string, unknown> | undefined;
    const command = typeof shellDef?.command === "string"
      ? shellDef.command
      : typeof shellMeta?.command === "string"
        ? shellMeta.command
        : "echo";
    const shellArgs = Array.isArray(shellDef?.args)
      ? (shellDef.args as string[]).filter((arg): arg is string => typeof arg === "string")
      : Array.isArray(shellMeta?.args)
        ? (shellMeta.args as string[]).filter((arg): arg is string => typeof arg === "string")
      : [];
    const cwd = typeof shellDef?.cwd === "string"
      ? shellDef.cwd
      : typeof shellMeta?.cwd === "string"
        ? shellMeta.cwd
        : options.workspace;
    if (piSession) {
      const bashCommand = [command, ...shellArgs.map(shellQuoteArg)].join(" ");
      const bashResult = await piSession.executeBash(bashCommand);
      return {
        status: bashResult.exitCode === 0 ? "ok" : "error",
        value: bashResult.exitCode === 0 ? bashResult.output : undefined,
        error: bashResult.exitCode === 0
          ? undefined
          : new Error(`Shell command exited with code ${bashResult.exitCode ?? "null"}: ${bashResult.output}`),
        stdout: bashResult.output,
      };
    }
    const shellResult = await execShellEffect(command, shellArgs, cwd);
    return {
      status: shellResult.exitCode === 0 ? "ok" : "error",
      value: shellResult.exitCode === 0 ? shellResult.stdout : undefined,
      error: shellResult.exitCode === 0
        ? undefined
        : new Error(`Shell command exited with code ${shellResult.exitCode}: ${shellResult.stderr}`),
      stdout: shellResult.stdout,
      stderr: shellResult.stderr,
    };
  }

  if (kind === "breakpoint") {
    const bpQuestion =
      (action.taskDef as Record<string, unknown>)?.question as string | undefined ??
      action.taskDef?.title ??
      "Breakpoint reached. Continue?";
    const approvalPrompt = createApprovalAskUserQuestion(bpQuestion);
    const approvalKey = approvalPrompt.questions[0]?.header ?? "Decision";

    if (options.interactive && rl) {
      if (!json) {
        process.stderr.write(`\n${YELLOW}${BOLD}BREAKPOINT${RESET} ${bpQuestion}\n`);
      }
      const { promptAskUserQuestionWithReadline: promptWithReadline } = await import("../../interaction");
      const response = await promptWithReadline(rl, approvalPrompt);
      const option = response.answers[approvalKey] ?? "Reject";
      return {
        status: "ok",
        value: {
          approved: option === "Approve",
          option,
          askUserQuestion: response,
        },
      };
    }

    if (options.interactive && !rl && askUserQuestionHandler) {
      const response = await askUserQuestionHandler(approvalPrompt) as AskUserQuestionResponse;
      const option = response.answers[approvalKey] ?? "Reject";
      return {
        status: "ok",
        value: {
          approved: option === "Approve",
          option,
          askUserQuestion: response,
        },
      };
    }

    const response = createAskUserQuestionResponse(approvalPrompt, {
      [approvalKey]: "Approve",
    });
    return {
      status: "ok",
      value: {
        approved: true,
        option: "Approve",
        askUserQuestion: response,
      },
    };
  }

  if (kind === "sleep") {
    const targetMs = action.taskDef?.sleep?.targetEpochMs;
    if (typeof targetMs === "number") {
      const delay = Math.max(0, targetMs - Date.now());
      if (delay > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }
    return { status: "ok", value: { sleptUntil: new Date().toISOString() } };
  }

  if (kind === "agent") {
    const textPrompt = compressInternalHarnessPrompt(
      buildAgentPrompt(action.taskDef as unknown as Record<string, unknown>),
      options.compressionConfig,
      "agent",
    );
    const taskHarness = discovered
      ? resolveTaskHarness(action, harnessName, discovered)
      : harnessName;

    const explicitCliRequested =
      taskHarness !== harnessName && !isInternalHarness(taskHarness);

    if (explicitCliRequested) {
      const result = await invokeHarness(taskHarness, {
        prompt: textPrompt,
        workspace: options.workspace,
        model: options.model,
      });
      return {
        status: result.success ? "ok" : "error",
        value: result.success ? result.output : undefined,
        error: result.success ? undefined : new Error(result.output),
        stdout: result.output,
      };
    }

    if (piSession) {
      const piResult = await promptPiWithRetry({
        session: piSession,
        message: textPrompt,
        timeout: PI_WORKER_TIMEOUT_MS,
        label: `effect ${action.effectId}`,
      });
      const parsedValue = piResult.success
        ? coerceAgentResultValue(action.taskDef as unknown as Record<string, unknown>, piResult.output)
        : undefined;
      return {
        status: piResult.success ? "ok" : "error",
        value: parsedValue,
        error: piResult.success ? undefined : new Error(piResult.output),
        stdout: piResult.output,
      };
    }

    const result = await invokeHarness(taskHarness, {
      prompt: textPrompt,
      workspace: options.workspace,
      model: options.model,
    });
    const parsedValue = result.success
      ? coerceAgentResultValue(action.taskDef as unknown as Record<string, unknown>, result.output)
      : undefined;
    return {
      status: result.success ? "ok" : "error",
      value: parsedValue,
      error: result.success ? undefined : new Error(result.output),
      stdout: result.output,
    };
  }

  const fallbackPrompt =
    action.taskDef?.title ?? `Handle effect ${action.effectId} (kind: ${kind})`;
  const effectiveFallbackPrompt = compressInternalHarnessPrompt(
    fallbackPrompt,
    options.compressionConfig,
    "skill",
  );
  const result = await invokeHarness(harnessName, {
    prompt: effectiveFallbackPrompt,
    workspace: options.workspace,
    model: options.model,
  });
  return {
    status: result.success ? "ok" : "error",
    value: result.success ? result.output : undefined,
    error: result.success ? undefined : new Error(result.output),
    stdout: result.output,
  };
}

// ── Retry Utilities ──────────────────────────────────────────────────

function isRetryableEffectError(error: unknown): boolean {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused") ||
    lower.includes("epipe") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("server had an error") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("please retry") ||
    lower.includes("killed") ||
    lower.includes("signal")
  );
}

async function resolveEffectWithRetry(
  action: EffectAction,
  harnessName: string,
  options: {
    workspace?: string;
    model?: string;
    interactive?: boolean;
    compressionConfig?: CompressionConfig | null;
    retryConfig?: Partial<EffectRetryConfig>;
  },
  piSession?: PiSessionHandle | null,
  discovered?: HarnessDiscoveryResult[],
  rl?: readline.Interface | null,
  json?: boolean,
  // For recreating Pi session on retry
  piSessionFactory?: () => PiSessionHandle,
  disposePiSession?: (session: PiSessionHandle) => Promise<void>,
  askUserQuestionHandler?: ((params: unknown) => Promise<unknown>) | null,
): Promise<ResolveEffectResult> {
  const config = { ...DEFAULT_EFFECT_RETRY_CONFIG, ...options.retryConfig };

  // Read per-effect overrides from task metadata
  const metadata = action.taskDef?.metadata as
    | Record<string, unknown>
    | undefined;
  if (typeof metadata?.maxRetries === "number") {
    config.maxRetries = metadata.maxRetries;
  }
  if (metadata?.noRetry === true) {
    config.maxRetries = 0;
  }

  // Non-retryable kinds
  if (config.nonRetryableKinds.includes(action.kind)) {
    return resolveEffect(
      action,
      harnessName,
      options,
      piSession,
      discovered,
      rl,
      json,
      askUserQuestionHandler,
    );
  }

  let lastResult: ResolveEffectResult | undefined;
  let currentPiSession = piSession;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      lastResult = await resolveEffect(
        action,
        harnessName,
        options,
        currentPiSession,
        discovered,
        rl,
        json,
        askUserQuestionHandler,
      );

      // Success — return immediately
      if (lastResult.status === "ok") {
        return lastResult;
      }

      // Effect returned error status — check if retryable
      const errorMsg =
        lastResult.error instanceof Error
          ? lastResult.error.message
          : String(lastResult.error ?? "");

      if (attempt >= config.maxRetries || !isRetryableEffectError(errorMsg)) {
        return lastResult;
      }
    } catch (error: unknown) {
      if (attempt >= config.maxRetries || !isRetryableEffectError(error)) {
        return {
          status: "error",
          error: error instanceof Error ? error : new Error(String(error)),
          stderr: error instanceof Error ? error.message : String(error),
        };
      }
      lastResult = {
        status: "error" as const,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }

    // Compute delay with jitter
    const testDelays = EFFECT_RETRY_DELAYS_OVERRIDE;
    const baseDelay = testDelays
      ? (testDelays[attempt] ?? 0)
      : Math.min(
          config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelayMs,
        );
    const jitter = testDelays ? 0 : baseDelay * 0.2 * (Math.random() * 2 - 1);
    const delay = Math.max(0, Math.round(baseDelay + jitter));

    // Dispose and recreate Pi session if applicable
    if (currentPiSession && piSessionFactory) {
      if (disposePiSession) {
        await disposePiSession(currentPiSession);
      } else {
        currentPiSession.dispose();
      }
      currentPiSession = piSessionFactory();
    }

    if (delay > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }

  return lastResult!;
}

// ── Orchestration Iteration with Retry ───────────────────────────────

async function orchestrateIterationWithProcessLoadRetry(args: {
  runDir: string;
  writeVerbose?: (message: string) => void;
  writeVerboseData?: (label: string, value: unknown, maxChars?: number) => void;
}): Promise<IterationResult> {
  let attempt = 0;

  for (;;) {
    try {
      return await orchestrateIteration({ runDir: args.runDir });
    } catch (error: unknown) {
      if (!isProcessModuleLoadFailure(error) || attempt >= PROCESS_MODULE_LOAD_RETRY_DELAYS_MS.length) {
        throw error;
      }

      const delayMs = PROCESS_MODULE_LOAD_RETRY_DELAYS_MS[attempt] ?? 0;
      attempt += 1;
      args.writeVerbose?.(
        `[phase2 retry] process module load failed for ${args.runDir}; retrying iteration import (attempt ${attempt}/${PROCESS_MODULE_LOAD_RETRY_DELAYS_MS.length}) after ${delayMs}ms`,
      );
      args.writeVerboseData?.(
        "phase2 retry cause",
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
              cause:
                error.cause instanceof Error
                  ? {
                      name: error.cause.name,
                      message: error.cause.message,
                      stack: error.cause.stack,
                    }
                  : error.cause,
            }
          : error,
      );

      if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}

// ── Explicit Tool Result Parsing ─────────────────────────────────────

function parseExplicitToolResultValue(args: {
  valueJson?: string;
  valueText?: string;
}): unknown {
  if (typeof args.valueJson === "string" && args.valueJson.trim().length > 0) {
    try {
      return JSON.parse(args.valueJson);
    } catch (error: unknown) {
      throw new BabysitterRuntimeError(
        "InvalidToolResultValueJson",
        error instanceof Error
          ? `valueJson is not valid JSON: ${error.message}`
          : "valueJson is not valid JSON",
        { category: ErrorCategory.Validation },
      );
    }
  }

  if (typeof args.valueText === "string") {
    return args.valueText;
  }

  return undefined;
}

function hasExplicitToolResultValue(args: {
  valueJson?: string;
  valueText?: string;
}): boolean {
  return args.valueJson !== undefined || args.valueText !== undefined;
}

// ── Main Phase 2 Entry Point ─────────────────────────────────────────

export async function runOrchestrationPhase(args: {
  processPath: string;
  prompt?: string;
  workspace?: string;
  model?: string;
  runsDir: string;
  maxIterations: number;
  json: boolean;
  verbose: boolean;
  interactive: boolean;
  rl: readline.Interface | null;
  selectedHarnessName: string;
  discovered: HarnessDiscoveryResult[];
  compressionConfig: CompressionConfig | null;
  promptContext: SessionCreatePromptContext;
  existingRunId?: string;
  existingRunDir?: string;
}): Promise<number> {
  const processId = path.basename(args.processPath, path.extname(args.processPath));
  const state: OrchestrationState = {
    iteration: 0,
    pendingActions: new Map(),
    pendingEffectResults: new Map(),
  };

  let orchestrationSession: PiSessionHandle | null = null;
  const activePiSessions = new Set<PiSessionHandle>();
  const writeVerbose = (message: string): void => {
    writeVerboseLine(args.verbose, args.json, message);
  };
  const writeVerboseData = (label: string, value: unknown, maxChars?: number): void => {
    writeVerboseBlock(args.verbose, args.json, label, value, maxChars);
  };
  const registerPiSession = (session: PiSessionHandle): PiSessionHandle => {
    activePiSessions.add(session);
    return session;
  };
  const shutdownPiSession = async (session: PiSessionHandle | null | undefined): Promise<void> => {
    if (!session) {
      return;
    }
    activePiSessions.delete(session);
    const maybeAbort = session as unknown as { abort?: () => Promise<void> };
    if (typeof maybeAbort.abort === "function") {
      await maybeAbort.abort().catch(() => undefined);
    }
    session.dispose();
  };
  const signalExitCode = (signal: NodeJS.Signals): number => {
    switch (signal) {
      case "SIGINT":
        return 130;
      case "SIGTERM":
        return 143;
      case "SIGBREAK":
        return 149;
      default:
        return 1;
    }
  };
  const shutdownSignals: NodeJS.Signals[] = process.platform === "win32"
    ? ["SIGINT", "SIGTERM", "SIGBREAK"]
    : ["SIGINT", "SIGTERM"];
  let shutdownRequested = false;
  const removeShutdownHandlers = (): void => {
    for (const signal of shutdownSignals) {
      process.off(signal, shutdownHandlers[signal]);
    }
  };
  const shutdownHandlers = Object.fromEntries(
    shutdownSignals.map((signal) => [
      signal,
      () => {
        if (shutdownRequested) {
          return;
        }
        shutdownRequested = true;
        removeShutdownHandlers();
        writeVerbose(
          `[phase2 shutdown] received ${signal}; aborting ${activePiSessions.size} active internal PI session(s)`,
        );
        const cleanup = Promise.allSettled(
          Array.from(activePiSessions).map((session) => shutdownPiSession(session)),
        );
        void Promise.race([
          cleanup,
          new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
        ]).finally(() => {
          process.exit(signalExitCode(signal));
        });
      },
    ]),
  ) as Record<NodeJS.Signals, () => void>;
  for (const signal of shutdownSignals) {
    process.on(signal, shutdownHandlers[signal]);
  }

  try {
  if (shouldUseExternalHarness(args.selectedHarnessName)) {
    emitProgress(
      { phase: "2", status: "started", harness: args.selectedHarnessName },
      args.json,
      args.verbose,
    );

    writeVerbose(
      `[phase2 host setup] harness=${args.selectedHarnessName} workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} processPath=${path.resolve(args.processPath)}`,
    );

    if (args.existingRunId && args.existingRunDir) {
      // Resume path: use existing run
      state.runId = args.existingRunId;
      state.runDir = args.existingRunDir;
      emitProgress(
        { phase: "2", status: "resuming", runId: args.existingRunId, runDir: args.existingRunDir },
        args.json,
        args.verbose,
      );
    } else {
      // Create new run
      const created = await createRun({
        runsDir: args.runsDir,
        harness: args.selectedHarnessName,
        process: {
          processId,
          importPath: path.resolve(args.processPath),
        },
        prompt: args.prompt,
        inputs: args.prompt ? { prompt: args.prompt } : undefined,
        ...(args.interactive === false ? { metadata: { nonInteractive: true } } : {}),
      });
      state.runId = created.runId;
      state.runDir = created.runDir;
      emitProgress(
        {
          phase: "2",
          status: "run-created",
          runId: created.runId,
          runDir: created.runDir,
        },
        args.json,
        args.verbose,
      );
      writeVerboseData("phase2 host run_create result", created);
    }

    const adapter = getAdapterByName(args.selectedHarnessName);
    if (!adapter) {
      throw new BabysitterRuntimeError(
        "HarnessAdapterMissing",
        `No harness adapter is registered for ${args.selectedHarnessName}.`,
        { category: ErrorCategory.Configuration },
      );
    }
    const sessionId = adapter.resolveSessionId({}) || process.env.CODEX_THREAD_ID || process.env.CODEX_SESSION_ID;
    if (!sessionId) {
      throw new BabysitterRuntimeError(
        "MissingHarnessSessionId",
        `Cannot resolve a session ID for harness ${args.selectedHarnessName}.`,
        { category: ErrorCategory.Configuration },
      );
    }
    state.sessionBound = await adapter.bindSession({
      sessionId,
      runId: state.runId,
      runDir: state.runDir,
      pluginRoot: adapter.resolvePluginRoot({}),
      stateDir: path.resolve(args.workspace ?? process.cwd(), ".a5c"),
      runsDir: args.runsDir,
      maxIterations: args.maxIterations,
      prompt: args.prompt ?? "",
      verbose: args.verbose,
      json: args.json,
    });
    if (state.sessionBound.fatal) {
      throw new BabysitterRuntimeError(
        "SessionBindFatal",
        state.sessionBound.error ?? "Session binding failed fatally.",
        { category: ErrorCategory.External },
      );
    }
    emitProgress(
      {
        phase: "2",
        status: "bound",
        runId: state.runId,
        runDir: state.runDir,
        harness: state.sessionBound.harness,
        sessionId: state.sessionBound.sessionId,
        error: state.sessionBound.error,
      },
      args.json,
      args.verbose,
    );
    writeVerboseData("phase2 host bind result", state.sessionBound);

    while (state.iteration < args.maxIterations) {
      state.iteration += 1;
      const result = await orchestrateIterationWithProcessLoadRetry({
        runDir: state.runDir,
        writeVerbose,
        writeVerboseData,
      });
      state.lastIterationResult = result;
      writeVerboseData("phase2 host iterate result", {
        iteration: state.iteration,
        status: result.status,
        nextActions: result.status === "waiting" ? result.nextActions : undefined,
        output: result.status === "completed" ? result.output : undefined,
        error: result.status === "failed" ? result.error : undefined,
      });

      if (result.status === "waiting") {
        emitProgress(
          {
            phase: "2",
            status: "iteration",
            iteration: state.iteration,
            runStatus: "waiting",
            pendingEffects: result.nextActions.length,
          },
          args.json,
          args.verbose,
        );

        for (const action of result.nextActions) {
          const taskHarness = resolveTaskHarness(action, args.selectedHarnessName, args.discovered);
          let workerSession: PiSessionHandle | null = null;
          if (action.kind === "shell" || isInternalHarness(taskHarness)) {
            workerSession = registerPiSession(createPiSession(buildPiWorkerSessionOptions({
              action,
              workspace: args.workspace,
              model: args.model,
            })));
          }
          const piSessionFactory = (action.kind === "shell" || isInternalHarness(taskHarness))
            ? () => registerPiSession(createPiSession(buildPiWorkerSessionOptions({
                action,
                workspace: args.workspace,
                model: args.model,
              })))
            : undefined;
          try {
            const effectResult = await resolveEffectWithRetry(
              action,
              args.selectedHarnessName,
              {
                workspace: args.workspace,
                model: args.model,
                interactive: args.interactive,
                compressionConfig: args.compressionConfig,
              },
              workerSession,
              args.discovered,
              args.rl,
              args.json,
              piSessionFactory,
              shutdownPiSession,
            );
            await commitEffectResult({
              runDir: state.runDir,
              effectId: action.effectId,
              invocationKey: action.invocationKey,
              result: {
                status: effectResult.status,
                value: effectResult.value,
                error: effectResult.error,
                stdout: effectResult.stdout,
                stderr: effectResult.stderr,
                startedAt: new Date().toISOString(),
                finishedAt: new Date().toISOString(),
              },
            });
            emitProgress(
              {
                phase: "2",
                status: "effect",
                effectId: action.effectId,
                effectKind: action.kind,
                effectTitle: action.taskDef?.title,
                effectStatus: effectResult.status,
                error: effectResult.status === "error"
                  ? (effectResult.error instanceof Error
                    ? effectResult.error.message
                    : String(effectResult.error))
                  : undefined,
                output: typeof effectResult.value === "string"
                  ? effectResult.value.slice(0, 200)
                  : undefined,
              },
              args.json,
              args.verbose,
            );
          } finally {
            await shutdownPiSession(workerSession);
          }
        }
        continue;
      }

      if (result.status === "completed") {
        emitProgress(
          {
            phase: "2",
            status: "completed",
            iteration: state.iteration,
            runStatus: "completed",
          },
          args.json,
          args.verbose,
        );
        return 0;
      }

      emitProgress(
        {
          phase: "2",
          status: "failed",
          iteration: state.iteration,
          runStatus: "failed",
          error: result.error instanceof Error
            ? result.error.message
            : typeof result.error === "object" && result.error !== null && "message" in result.error
              ? String((result.error as Record<string, unknown>).message)
              : String(result.error),
        },
        args.json,
        args.verbose,
      );
      return 1;
    }

    emitProgress(
      {
        phase: "2",
        status: "failed",
        iteration: state.iteration,
        runStatus: "failed",
        error: `Max iterations (${args.maxIterations}) reached without completion`,
      },
      args.json,
      args.verbose,
    );
    return 1;
  }

  const summarizeAgentText = (text: string): string => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) {
      return "(no summary emitted)";
    }
    return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
  };

  const describePendingActions = (): Array<{
    effectId: string;
    kind: string;
    title?: string;
    harness?: string;
  }> => Array.from(state.pendingActions.values()).map((action) => ({
    effectId: action.effectId,
    kind: action.kind,
    title: action.taskDef?.title,
    harness: resolveTaskHarness(action, args.selectedHarnessName, args.discovered),
  }));

  const ensureTerminalResult = (): number | null => {
    if (state.lastIterationResult?.status === "completed") {
      return 0;
    }
    if (state.lastIterationResult?.status === "failed") {
      return 1;
    }
    return null;
  };

  const captureOrchestrationProgressSnapshot = () => ({
    runId: state.runId,
    runDir: state.runDir,
    sessionBound: Boolean(state.sessionBound),
    iteration: state.iteration,
    pendingActionIds: Array.from(state.pendingActions.keys()).sort().join(","),
    pendingResultIds: Array.from(state.pendingEffectResults.keys()).sort().join(","),
    lastStatus: state.lastIterationResult?.status,
    hasAskUserQuestionResponse: Boolean(state.lastAskUserQuestionResponse),
    finished: Boolean(state.finished),
  });

  const orchestrationStateAdvanced = (
    before: ReturnType<typeof captureOrchestrationProgressSnapshot>,
  ): boolean => {
    const after = captureOrchestrationProgressSnapshot();
    return (
      after.runId !== before.runId ||
      after.runDir !== before.runDir ||
      after.sessionBound !== before.sessionBound ||
      after.iteration !== before.iteration ||
      after.pendingActionIds !== before.pendingActionIds ||
      after.pendingResultIds !== before.pendingResultIds ||
      after.lastStatus !== before.lastStatus ||
      after.hasAskUserQuestionResponse !== before.hasAskUserQuestionResponse ||
      after.finished !== before.finished
    );
  };

  const customTools: unknown[] = [
    {
      name: "AskUserQuestion",
      label: "Ask User Question",
      description: "Ask the user one to four structured questions and receive structured answers.",
      promptSnippet: "Use this for breakpoint approvals and required user clarification.",
      parameters: ASK_USER_QUESTION_SCHEMA,
      execute: async (
        _toolCallId: string,
        params: AskUserQuestionRequest,
        _signal?: AbortSignal,
        _onUpdate?: unknown,
        toolContext?: AskUserQuestionToolContext,
      ): Promise<ToolResultShape> => {
        writeVerboseData("phase2 tool AskUserQuestion request", params);
        const response = await askUserQuestionViaTool(
          params,
          args.interactive,
          args.rl,
          toolContext,
        );
        state.lastAskUserQuestionResponse = response;
        writeVerboseData("phase2 tool AskUserQuestion response", response);
        return formatToolResult(response, "AskUserQuestion completed.");
      },
    },
    {
      name: "babysitter_run_create",
      label: "Babysitter Run Create",
      description: "Create the babysitter run for the current process definition.",
      parameters: Type.Object({
        prompt: Type.Optional(Type.String()),
      }),
      execute: async (
        _toolCallId: string,
        params: { prompt?: string },
      ): Promise<ToolResultShape> => {
        writeVerboseData("phase2 tool babysitter_run_create request", params);
        if (state.runId && state.runDir) {
          writeVerboseData("phase2 tool babysitter_run_create result", { runId: state.runId, runDir: state.runDir });
          return formatToolResult({ runId: state.runId, runDir: state.runDir }, "Run already exists.");
        }
        const effectivePrompt = args.prompt ?? params.prompt;
        const result = await createRun({
          runsDir: args.runsDir,
          harness: args.selectedHarnessName,
          process: {
            processId,
            importPath: path.resolve(args.processPath),
          },
          prompt: effectivePrompt,
          inputs: effectivePrompt
            ? { prompt: effectivePrompt }
            : undefined,
          ...(args.interactive === false ? { metadata: { nonInteractive: true } } : {}),
        });
        state.runId = result.runId;
        state.runDir = result.runDir;
        emitProgress(
          {
            phase: "2",
            status: "run-created",
            runId: result.runId,
            runDir: result.runDir,
          },
          args.json,
          args.verbose,
        );
        writeVerboseData("phase2 tool babysitter_run_create result", result);
        return formatToolResult(result, "Run created.");
      },
    },
    {
      name: "babysitter_bind_session",
      label: "Babysitter Bind Session",
      description: "Bind the orchestration run to the current harness session.",
      parameters: Type.Object({}),
      execute: async (): Promise<ToolResultShape> => {
        writeVerbose("[phase2 tool babysitter_bind_session request]");
        if (!state.runId || !state.runDir) {
          throw new BabysitterRuntimeError(
            "RunNotCreated",
            "Create the run before binding the orchestration session.",
            { category: ErrorCategory.Validation },
          );
        }
        if (state.sessionBound) {
          return formatToolResult(state.sessionBound, "Session is already bound.");
        }
        const adapter = getAdapterByName(args.selectedHarnessName);
        if (!adapter) {
          throw new BabysitterRuntimeError(
            "HarnessAdapterMissing",
            `No harness adapter is registered for ${args.selectedHarnessName}.`,
            { category: ErrorCategory.Configuration },
          );
        }
        if (
          isInternalHarness(args.selectedHarnessName) &&
          orchestrationSession?.sessionId
        ) {
          process.env.PI_SESSION_ID = process.env.PI_SESSION_ID || orchestrationSession.sessionId;
          process.env.OMP_SESSION_ID = process.env.OMP_SESSION_ID || orchestrationSession.sessionId;
        }
        const sessionId = adapter.resolveSessionId({}) || orchestrationSession?.sessionId;
        if (!sessionId) {
          throw new BabysitterRuntimeError(
            "MissingHarnessSessionId",
            `Cannot resolve a session ID for harness ${args.selectedHarnessName}.`,
            { category: ErrorCategory.Configuration },
          );
        }
        state.sessionBound = await adapter.bindSession({
          sessionId,
          runId: state.runId,
          runDir: state.runDir,
          pluginRoot: adapter.resolvePluginRoot({}),
          stateDir: path.resolve(args.workspace ?? process.cwd(), ".a5c"),
          runsDir: args.runsDir,
          maxIterations: args.maxIterations,
          prompt: args.prompt ?? "",
          verbose: args.verbose,
          json: args.json,
        });
        if (state.sessionBound.fatal) {
          throw new BabysitterRuntimeError(
            "SessionBindFatal",
            state.sessionBound.error ?? "Session binding failed fatally.",
            { category: ErrorCategory.External },
          );
        }
        emitProgress(
          {
            phase: "2",
            status: "bound",
            runId: state.runId,
            runDir: state.runDir,
            harness: state.sessionBound.harness,
            sessionId: state.sessionBound.sessionId,
            error: state.sessionBound.error,
          },
          args.json,
          args.verbose,
        );
        writeVerboseData("phase2 tool babysitter_bind_session result", state.sessionBound);
        return formatToolResult(state.sessionBound, "Session bound.");
      },
    },
    {
      name: "babysitter_run_iterate",
      label: "Babysitter Run Iterate",
      description: "Run the next orchestration iteration and return pending effects or a terminal result.",
      parameters: Type.Object({}),
      execute: async (): Promise<ToolResultShape> => {
        writeVerbose(
          `[phase2 tool babysitter_run_iterate request] runDir=${state.runDir ?? "(missing)"} nextIteration=${state.iteration + 1}`,
        );
        if (!state.runDir) {
          throw new BabysitterRuntimeError(
            "RunNotCreated",
            "Create the run before iterating it.",
            { category: ErrorCategory.Validation },
          );
        }
        if (state.iteration >= args.maxIterations) {
          state.lastIterationResult = {
            status: "failed",
            error: { message: `Max iterations (${args.maxIterations}) reached without completion` },
          };
          emitProgress(
            {
              phase: "2",
              status: "failed",
              iteration: state.iteration,
              runStatus: "failed",
              error: `Max iterations (${args.maxIterations}) reached without completion`,
            },
            args.json,
            args.verbose,
          );
          return formatToolResult(state.lastIterationResult, "Iteration limit reached.");
        }

        state.iteration += 1;
        state.pendingActions.clear();
        state.pendingEffectResults.clear();
        const result = await orchestrateIterationWithProcessLoadRetry({
          runDir: state.runDir,
          writeVerbose,
          writeVerboseData,
        });
        state.lastIterationResult = result;
        writeVerboseData("phase2 tool babysitter_run_iterate result", {
          iteration: state.iteration,
          status: result.status,
          nextActions: result.status === "waiting" ? result.nextActions : undefined,
          output: result.status === "completed" ? result.output : undefined,
          error: result.status === "failed" ? result.error : undefined,
        });

        if (result.status === "waiting") {
          for (const action of result.nextActions) {
            state.pendingActions.set(action.effectId, action);
          }
          emitProgress(
            {
              phase: "2",
              status: "iteration",
              iteration: state.iteration,
              runStatus: "waiting",
              pendingEffects: result.nextActions.length,
            },
            args.json,
            args.verbose,
          );
        } else if (result.status === "completed") {
          emitProgress(
            {
              phase: "2",
              status: "completed",
              iteration: state.iteration,
              runStatus: "completed",
            },
            args.json,
            args.verbose,
          );
        } else {
          const errorMessage =
            result.error instanceof Error
              ? result.error.message
              : typeof result.error === "object" &&
                  result.error !== null &&
                  "message" in result.error
                ? String((result.error as Record<string, unknown>).message)
                : String(result.error);
          emitProgress(
            {
              phase: "2",
              status: "failed",
              iteration: state.iteration,
              runStatus: "failed",
              error: errorMessage,
            },
            args.json,
            args.verbose,
          );
        }

        return formatToolResult(
          {
            iteration: state.iteration,
            ...result,
          },
          "Iteration completed.",
        );
      },
    },
    {
      name: "babysitter_run_shell_effect",
      label: "Babysitter Run Shell Effect",
      description: "Run a pending shell effect through an internal PI worker session that respects task metadata, and stage the result for task posting.",
      parameters: Type.Object({
        effectId: Type.String(),
      }),
      execute: async (
        _toolCallId: string,
        params: { effectId: string },
      ): Promise<ToolResultShape> => {
        writeVerboseData("phase2 tool babysitter_run_shell_effect request", params);
        const action = state.pendingActions.get(params.effectId);
        if (!action) {
          throw new BabysitterRuntimeError(
            "PendingEffectNotFound",
            `No pending effect found for ${params.effectId}.`,
            { category: ErrorCategory.Validation },
          );
        }
        if (action.kind !== "shell") {
          return formatToolResult(
            {
              effectId: params.effectId,
              kind: action.kind,
              message: "Use babysitter_dispatch_effect_harness for non-shell effects.",
            },
            "This tool is only for shell effects.",
          );
        }

        const workerSessionOptions = buildPiWorkerSessionOptions({
          action,
          workspace: args.workspace,
          model: args.model,
          customTools: phase2AgenticTools,
        });
        writeVerboseData("phase2 worker session options", workerSessionOptions);
        const workerSession = registerPiSession(createPiSession(workerSessionOptions));
        const piSessionFactory = () => registerPiSession(createPiSession(buildPiWorkerSessionOptions({
          action,
          workspace: args.workspace,
          model: args.model,
          customTools: phase2AgenticTools,
        })));
        try {
          const effectResult = await resolveEffectWithRetry(
            action,
            "pi",
            {
              workspace: args.workspace,
              model: args.model,
              interactive: false,
              compressionConfig: args.compressionConfig,
            },
            workerSession,
            args.discovered,
            null,
            args.json,
            piSessionFactory,
            shutdownPiSession,
          );
          state.pendingEffectResults.set(params.effectId, effectResult);
          writeVerboseData("phase2 tool babysitter_run_shell_effect result", {
            effectId: params.effectId,
            effectResult,
          });
          return formatToolResult(
            { effectId: params.effectId, effectResult },
            "Shell effect executed on the internal PI worker and staged for task posting.",
          );
        } finally {
          // Note: if piSessionFactory was used for retries, the last recreated
          // session is disposed inside resolveEffectWithRetry on the next retry
          // or returned as currentPiSession. The original workerSession may have
          // been disposed during retry. This dispose is a safety net.
          await shutdownPiSession(workerSession);
        }
      },
    },
    {
      name: "babysitter_dispatch_effect_harness",
      label: "Babysitter Dispatch Effect Harness",
      description: "Dispatch a pending non-shell effect through an internal or external harness wrapper and stage the result for task posting.",
      parameters: Type.Object({
        effectId: Type.String(),
        harness: Type.Optional(Type.String()),
        model: Type.Optional(Type.String()),
        timeout: Type.Optional(Type.Number()),
        skills: Type.Optional(Type.Array(Type.String())),
        subagentName: Type.Optional(Type.String()),
        toolsMode: Type.Optional(Type.Union([
          Type.Literal("default"),
          Type.Literal("coding"),
          Type.Literal("readonly"),
        ])),
        thinkingLevel: Type.Optional(Type.Union([
          Type.Literal("none"),
          Type.Literal("low"),
          Type.Literal("medium"),
          Type.Literal("high"),
        ])),
        bashSandbox: Type.Optional(Type.Union([
          Type.Literal("auto"),
          Type.Literal("secure"),
          Type.Literal("local"),
        ])),
      }),
      execute: async (
        _toolCallId: string,
        params: {
          effectId: string;
          harness?: string;
          model?: string;
          timeout?: number;
          skills?: string[];
          subagentName?: string;
          toolsMode?: "default" | "coding" | "readonly";
          thinkingLevel?: "none" | "low" | "medium" | "high";
          bashSandbox?: "auto" | "secure" | "local";
        },
      ): Promise<ToolResultShape> => {
        writeVerboseData("phase2 tool babysitter_dispatch_effect_harness request", params);
        const action = state.pendingActions.get(params.effectId);
        if (!action) {
          throw new BabysitterRuntimeError(
            "PendingEffectNotFound",
            `No pending effect found for ${params.effectId}.`,
            { category: ErrorCategory.Validation },
          );
        }
        if (action.kind === "breakpoint") {
          return formatToolResult(
            {
              effectId: params.effectId,
              kind: action.kind,
              message: "Use AskUserQuestion followed by babysitter_task_post_result for breakpoint effects.",
            },
            "Breakpoint effects require explicit AskUserQuestion handling.",
          );
        }
        const requestedHarness = typeof params.harness === "string" && params.harness.trim().length > 0
          ? params.harness.trim()
          : undefined;

        // Build delegation config from tool params, falling back to task metadata
        const taskMetadata = action.taskDef?.metadata as Record<string, unknown> | undefined;
        const delegationConfig: DelegationConfig = {
          model: params.model ?? readStringMetadata(taskMetadata, "model"),
          timeout: params.timeout ?? (typeof taskMetadata?.timeout === "number" ? taskMetadata.timeout : undefined),
          toolsMode: params.toolsMode
            ?? readStringMetadata(taskMetadata, "toolsMode") as DelegationConfig["toolsMode"],
          thinkingLevel: params.thinkingLevel
            ?? readStringMetadata(taskMetadata, "thinkingLevel") as DelegationConfig["thinkingLevel"],
          bashSandbox: params.bashSandbox
            ?? readStringMetadata(taskMetadata, "bashSandbox") as DelegationConfig["bashSandbox"],
          skills: params.skills ?? (Array.isArray(taskMetadata?.skills) ? taskMetadata.skills as string[] : undefined),
          subagentName: params.subagentName ?? readStringMetadata(taskMetadata, "subagentName"),
        };

        // Effective model for invokeHarness calls (delegationConfig > args.model)
        const effectiveModel = delegationConfig.model ?? args.model;

        if (action.kind === "shell") {
          const workerSessionOptions = buildPiWorkerSessionOptions({
            action,
            workspace: args.workspace,
            model: args.model,
            customTools: phase2AgenticTools,
            delegationConfig,
          });
          writeVerboseData("phase2 worker session options", workerSessionOptions);
          const workerSession = registerPiSession(createPiSession(workerSessionOptions));
          const shellPiSessionFactory = () => registerPiSession(createPiSession(buildPiWorkerSessionOptions({
            action,
            workspace: args.workspace,
            model: args.model,
            customTools: phase2AgenticTools,
            delegationConfig,
          })));
          try {
            const effectResult = await resolveEffectWithRetry(
              action,
              requestedHarness ?? "pi",
              {
                workspace: args.workspace,
                model: effectiveModel,
                interactive: false,
                compressionConfig: args.compressionConfig,
              },
              workerSession,
              args.discovered,
              null,
              args.json,
              shellPiSessionFactory,
              shutdownPiSession,
            );
            state.pendingEffectResults.set(params.effectId, effectResult);
            writeVerboseData("phase2 tool babysitter_dispatch_effect_harness result", {
              effectId: params.effectId,
              selectedHarness: "pi",
              effectResult,
            });
            return formatToolResult(
              { effectId: params.effectId, selectedHarness: "pi", effectResult },
              "Shell effect executed on the internal PI worker and staged for task posting.",
            );
          } finally {
            await shutdownPiSession(workerSession);
          }
        }

        const taskHarness = requestedHarness ?? resolveTaskHarness(action, args.selectedHarnessName, args.discovered);
        writeVerboseData("phase2 effect execution plan", {
          effectId: params.effectId,
          kind: action.kind,
          title: action.taskDef?.title,
          resolvedHarness: taskHarness,
          selectedHarness: args.selectedHarnessName,
          metadata: (action.taskDef?.metadata as Record<string, unknown> | undefined) ?? undefined,
          delegationConfig,
        });
        let workerSession: PiSessionHandle | null = null;
        const dispatchPiSessionFactory = isInternalHarness(taskHarness)
          ? () => registerPiSession(createPiSession(buildPiWorkerSessionOptions({
              action,
              workspace: args.workspace,
              model: args.model,
              customTools: phase2AgenticTools,
              delegationConfig,
            })))
          : undefined;
        if (isInternalHarness(taskHarness)) {
          workerSession = registerPiSession(createPiSession(buildPiWorkerSessionOptions({
            action,
            workspace: args.workspace,
            model: args.model,
            customTools: phase2AgenticTools,
            delegationConfig,
          })));
          writeVerboseData("phase2 worker session options", buildPiWorkerSessionOptions({
            action,
            workspace: args.workspace,
            model: args.model,
            customTools: phase2AgenticTools,
            delegationConfig,
          }));
        }

        try {
          const effectResult = await resolveEffectWithRetry(
            action,
            taskHarness,
            {
              workspace: args.workspace,
              model: effectiveModel,
              interactive: false,
              compressionConfig: args.compressionConfig,
            },
            workerSession,
            args.discovered,
            null,
            args.json,
            dispatchPiSessionFactory,
            shutdownPiSession,
          );
          state.pendingEffectResults.set(params.effectId, effectResult);
          writeVerboseData("phase2 tool babysitter_dispatch_effect_harness result", {
            effectId: params.effectId,
            selectedHarness: taskHarness,
            effectResult,
          });
          return formatToolResult(
            { effectId: params.effectId, selectedHarness: taskHarness, effectResult },
            "Effect dispatched through the selected harness and staged for task posting.",
          );
        } finally {
          await shutdownPiSession(workerSession);
        }
      },
    },
    {
      name: "babysitter_task_post_result",
      label: "Babysitter Task Post Result",
      description: "Persist a staged result, or post an explicit effect result payload after you fulfilled the work yourself.",
      parameters: Type.Object({
        effectId: Type.String(),
        status: Type.Optional(Type.Union([Type.Literal("ok"), Type.Literal("error")])),
        valueText: Type.Optional(Type.String()),
        valueJson: Type.Optional(Type.String()),
        error: Type.Optional(Type.String()),
        stdout: Type.Optional(Type.String()),
        stderr: Type.Optional(Type.String()),
      }),
      execute: async (
        _toolCallId: string,
        params: {
          effectId: string;
          status?: "ok" | "error";
          valueText?: string;
          valueJson?: string;
          error?: string;
          stdout?: string;
          stderr?: string;
        },
      ): Promise<ToolResultShape> => {
        writeVerboseData("phase2 tool babysitter_task_post_result request", params);
        if (!state.runDir) {
          throw new BabysitterRuntimeError(
            "RunNotCreated",
            "Create the run before posting task results.",
            { category: ErrorCategory.Validation },
          );
        }
        const action = state.pendingActions.get(params.effectId);
        if (!action) {
          throw new BabysitterRuntimeError(
            "PendingEffectNotFound",
            `No pending effect found for ${params.effectId}.`,
            { category: ErrorCategory.Validation },
          );
        }

        const startedAt = new Date().toISOString();
        let effectResult = state.pendingEffectResults.get(params.effectId);

        if (params.status) {
          const explicitValueProvided = hasExplicitToolResultValue({
            valueJson: params.valueJson,
            valueText: params.valueText,
          });
          const explicitValue = explicitValueProvided
            ? parseExplicitToolResultValue({
                valueJson: params.valueJson,
                valueText: params.valueText,
              })
            : undefined;
          const hasExplicitPayload =
            explicitValueProvided ||
            params.error !== undefined ||
            params.stdout !== undefined ||
            params.stderr !== undefined;

          if (!effectResult || hasExplicitPayload) {
            const nextValue = explicitValueProvided ? explicitValue : effectResult?.value;
            if (params.status === "ok" && nextValue === undefined) {
              throw new BabysitterRuntimeError(
                "EffectResultValueMissing",
                `Explicit ok result for ${params.effectId} is missing a value payload.`,
                { category: ErrorCategory.Validation },
              );
            }
            effectResult = {
              status: params.status,
              value: nextValue,
              error: params.status === "error"
                ? new Error(
                    params.error ??
                    (effectResult?.error instanceof Error ? effectResult.error.message : "Effect failed"),
                  )
                : undefined,
              stdout: params.stdout ?? effectResult?.stdout,
              stderr: params.stderr ?? effectResult?.stderr,
            };
          } else if (params.status !== effectResult.status) {
            effectResult = {
              ...effectResult,
              status: params.status,
              error: params.status === "error"
                ? new Error(
                    params.error ??
                    (effectResult.error instanceof Error
                      ? effectResult.error.message
                      : "Effect failed"),
                  )
                : undefined,
            };
          }
        }

        if (!effectResult && action.kind === "breakpoint") {
          if (args.interactive && !state.lastAskUserQuestionResponse) {
            throw new BabysitterRuntimeError(
              "InteractiveBreakpointDecisionMissing",
              "Interactive breakpoint results require AskUserQuestion before babysitter_task_post_result.",
              { category: ErrorCategory.Runtime },
            );
          }
          const question =
            (action.taskDef as Record<string, unknown>)?.question as string | undefined ??
            action.taskDef?.title ??
            "Breakpoint reached. Continue?";
          const defaultResponse = createAskUserQuestionResponse(
            createApprovalAskUserQuestion(question),
            { Decision: "Approve" },
          );
          const askResponse = state.lastAskUserQuestionResponse ?? defaultResponse;
          const option = askResponse.answers.Decision ?? "Approve";
          effectResult = {
            status: "ok",
            value: {
              approved: option === "Approve",
              option,
              askUserQuestion: askResponse,
            },
          };
        }

        if (!effectResult) {
          throw new BabysitterRuntimeError(
            "EffectResultMissing",
            `No staged effect result exists for ${params.effectId}.`,
            { category: ErrorCategory.Runtime },
          );
        }

        const finishedAt = new Date().toISOString();
        await commitEffectResult({
          runDir: state.runDir,
          effectId: action.effectId,
          invocationKey: action.invocationKey,
          result: {
            status: effectResult.status,
            value: effectResult.value,
            error: effectResult.error,
            stdout: effectResult.stdout,
            stderr: effectResult.stderr,
            startedAt,
            finishedAt,
          },
        });
        writeVerboseData("phase2 tool babysitter_task_post_result result", {
          effectId: params.effectId,
          status: effectResult.status,
          startedAt,
          finishedAt,
          valuePreview: effectResult.value,
          error: effectResult.error,
        });

        emitProgress(
          {
            phase: "2",
            status: "effect",
            effectId: action.effectId,
            effectKind: action.kind,
            effectTitle: action.taskDef?.title,
            effectStatus: effectResult.status,
            error: effectResult.status === "error"
              ? (effectResult.error instanceof Error
                ? effectResult.error.message
                : String(effectResult.error))
              : undefined,
            output: typeof effectResult.value === "string"
              ? effectResult.value.slice(0, 200)
              : undefined,
          },
          args.json,
          args.verbose,
        );

        state.pendingActions.delete(params.effectId);
        state.pendingEffectResults.delete(params.effectId);
        if (action.kind === "breakpoint") {
          state.lastAskUserQuestionResponse = undefined;
        }

        return formatToolResult(
          {
            effectId: params.effectId,
            status: effectResult.status,
          },
          "Task result posted.",
        );
      },
    },
    {
      name: "babysitter_finish_orchestration",
      label: "Finish Orchestration",
      description: "Report that the orchestration phase has reached a terminal state.",
      parameters: Type.Object({
        summary: Type.Optional(Type.String()),
      }),
      execute: (
        _toolCallId: string,
        params: { summary?: string },
      ): ToolResultShape => {
        writeVerboseData("phase2 tool babysitter_finish_orchestration", params);
        state.finished = { summary: params.summary };
        return formatToolResult(state.finished, "Orchestration finish recorded.");
      },
    },
  ];

  const phase2AgenticTools = createAgenticToolDefinitions({
    workspace: args.workspace ?? process.cwd(),
    interactive: args.interactive ?? false,
    askUserQuestionHandler: async (params: unknown) => {
      return askUserQuestionViaTool(
        params as AskUserQuestionRequest,
        args.interactive,
        args.rl,
        undefined,
      );
    },
  });
  const mergedPhase2Tools: unknown[] = [...customTools, ...phase2AgenticTools];

  const tools = mergedPhase2Tools as Array<{
    name: string;
    execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<ToolResultShape> | ToolResultShape;
  }>;
  const getTool = (name: string) => tools.find((tool) => tool.name === name);
  const finishTool = getTool("babysitter_finish_orchestration");

  const invokeTool = async (
    tool: { execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<ToolResultShape> | ToolResultShape } | undefined,
    name: string,
    params: Record<string, unknown> = {},
  ): Promise<ToolResultShape> => {
    if (!tool?.execute) {
      throw new BabysitterRuntimeError(
        "MissingSessionCreateTool",
        `Required orchestration tool is unavailable: ${name}`,
        { category: ErrorCategory.Internal },
      );
    }
    writeVerboseData(`phase2 host invoke ${name} request`, params);
    const result = tool.execute(`host-${name}`, params);
    const resolved = await Promise.resolve(result);
    writeVerboseData(`phase2 host invoke ${name} result`, resolved);
    return resolved;
  };

  const promptOrchestrationAgent = async (
    message: string,
    options?: { label?: string },
  ): Promise<void> => {
    if (!orchestrationSession) {
      throw new BabysitterRuntimeError(
        "OrchestrationSessionMissing",
        "The orchestration PI session has not been created.",
        { category: ErrorCategory.Runtime },
      );
    }

    if (!args.json && args.verbose) {
      const label = options?.label ?? "phase2";
      process.stderr.write(`\n${DIM}[${label}] agent turn${RESET}\n`);
    }
    writeVerboseData(`${options?.label ?? "phase2"} prompt`, message);
    const progressSnapshot = captureOrchestrationProgressSnapshot();

    let result: { success: boolean; output: string };
    try {
      result = await promptPiWithRetry({
        session: orchestrationSession,
        message: compressInternalHarnessPrompt(
          message,
          args.compressionConfig,
          "agent",
        ),
        timeout: PI_DEFAULT_PROMPT_TIMEOUT_MS,
        label: options?.label ?? "phase2",
        writeVerbose,
        writeVerboseData,
      });
    } catch (err: unknown) {
      const isTimeout =
        err instanceof BabysitterRuntimeError &&
        (err.name === "PiTimeoutError" || err.message.includes("timed out"));
      if (isTimeout) {
        writeVerbose(
          `[phase2] Pi prompt timed out, returning failure result for graceful recovery`,
        );
        result = {
          success: false,
          output: `Pi prompt timed out: ${err instanceof Error ? err.message : String(err)}`,
        };
      } else {
        throw err;
      }
    }

    if (!result.success) {
      writeVerboseData(`${options?.label ?? "phase2"} agent failure output`, result.output);
      if (!orchestrationStateAdvanced(progressSnapshot)) {
        throw new BabysitterRuntimeError(
          "OrchestrationAgentFailed",
          result.output,
          { category: ErrorCategory.External },
        );
      }
      if (!isIgnorablePiPromptFailure(result.output)) {
        throw new BabysitterRuntimeError(
          "OrchestrationAgentFailed",
          result.output,
          { category: ErrorCategory.External },
        );
      }
      writeVerbose(
        `[phase2 recovery] continuing after a late PI prompt failure because orchestration state advanced: ${result.output}`,
      );
      return;
    }

    writeVerbose(
      `[phase2 agent] ${summarizeAgentText(result.output)}`,
    );
  };

  const completeBootstrapAgentically = async (): Promise<void> => {
    const bootstrapPrompts = [
      {
        label: "phase2 bootstrap",
        message: buildOrchestrationBootstrapPrompt(
          path.resolve(args.processPath),
          args.prompt,
          args.maxIterations,
        ),
      },
      {
        label: "phase2 bootstrap recovery",
        message: [
          "Complete the babysitter orchestration bootstrap.",
          "",
          `Process path: ${path.resolve(args.processPath)}`,
          `User prompt: ${args.prompt ?? ""}`,
          `Maximum iterations: ${args.maxIterations}`,
          `Run id: ${state.runId ?? "(not created)"}`,
          `Run dir: ${state.runDir ?? "(not created)"}`,
          `Session bound: ${state.sessionBound ? "yes" : "no"}`,
          "",
          !state.runId || !state.runDir
            ? "Create the run now."
            : "Do not create another run.",
          !state.sessionBound
            ? "Bind the session now."
            : "The session is already bound.",
          "Do not iterate the run yet.",
          "End with a short plain-text summary.",
        ].join("\n"),
      },
    ] as const;

    for (const attempt of bootstrapPrompts) {
      const bootstrapSnapshot = captureOrchestrationProgressSnapshot();
      await promptOrchestrationAgent(attempt.message, { label: attempt.label });
      if (state.runId && state.runDir && state.sessionBound) {
        return;
      }
      if (!orchestrationStateAdvanced(bootstrapSnapshot)) {
        break;
      }
    }

    throw new BabysitterRuntimeError(
      "OrchestrationBootstrapIncomplete",
      "The orchestration agent did not create and bind the run during bootstrap.",
      { category: ErrorCategory.Runtime },
    );
  };

  orchestrationSession = registerPiSession(createPiSession({
    workspace: args.workspace,
    model: args.model,
    toolsMode: "coding",
    customTools: mergedPhase2Tools,
    uiContext: args.interactive && args.rl
      ? createReadlineAskUserQuestionUiContext(args.rl)
      : undefined,
    appendSystemPrompt: [buildOrchestrationSystemPrompt(args.selectedHarnessName, args.promptContext, args.interactive)],
    ephemeral: true,
  }));

  writeVerbose(
    `[phase2 setup] harness=${args.selectedHarnessName} workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} processPath=${path.resolve(args.processPath)}`,
  );
  writeVerboseData(
    "phase2 tools",
    (mergedPhase2Tools as Array<{ name?: string; label?: string }>).map((tool) => ({
      name: tool.name,
      label: tool.label,
    })),
  );
  writeVerboseData(
    "phase2 system prompt",
    buildOrchestrationSystemPrompt(args.selectedHarnessName, args.promptContext, args.interactive),
  );

  emitProgress(
    { phase: "2", status: "started", harness: args.selectedHarnessName },
    args.json,
    args.verbose,
  );

  let unsubscribe: (() => void) | null = null;
  try {
    await orchestrationSession.initialize();
    if (!args.json && args.verbose) {
      unsubscribe = orchestrationSession.subscribe((event: PiSessionEvent) => {
        if (event.type === "text_delta") {
          const text = (event as { text?: string }).text;
          if (text) process.stderr.write(text);
        }
      });
    }

    await completeBootstrapAgentically();

    if (!state.runId || !state.runDir) {
      throw new BabysitterRuntimeError(
        "RunNotCreated",
        "The orchestration session could not establish a run after bootstrap.",
        { category: ErrorCategory.Runtime },
      );
    }

    let consecutiveTimeouts = 0;
    while (state.iteration < args.maxIterations) {
      const terminal = ensureTerminalResult();
      if (terminal !== null) {
        break;
      }

      const progressBeforeTurn = captureOrchestrationProgressSnapshot();
      try {
        await promptOrchestrationAgent(
          buildOrchestrationTurnPrompt({
            processPath: path.resolve(args.processPath),
            userPrompt: args.prompt,
            maxIterations: args.maxIterations,
            currentIteration: state.iteration,
            runId: state.runId,
            runDir: state.runDir,
            lastStatus: state.lastIterationResult?.status,
            pendingEffects: describePendingActions(),
          }),
          { label: `phase2 iteration ${state.iteration + 1}` },
        );
      } catch (err: unknown) {
        // Timeout-related OrchestrationAgentFailed errors are recoverable
        // unless they happen too many times in a row.
        const isTimeoutFailure =
          err instanceof BabysitterRuntimeError &&
          err.name === "OrchestrationAgentFailed" &&
          (err.message.includes("timed out") || err.message.includes("PiTimeoutError"));

        if (isTimeoutFailure) {
          consecutiveTimeouts += 1;
          writeVerbose(
            `[phase2] Pi prompt timeout (${consecutiveTimeouts}/${MAX_CONSECUTIVE_TIMEOUTS} consecutive)`,
          );
          if (consecutiveTimeouts >= MAX_CONSECUTIVE_TIMEOUTS) {
            throw new BabysitterRuntimeError(
              "OrchestrationAgentTimedOut",
              `Pi prompt timed out ${consecutiveTimeouts} consecutive times — aborting orchestration.`,
              { category: ErrorCategory.External },
            );
          }
          continue;
        }
        throw err;
      }

      if (ensureTerminalResult() !== null) {
        break;
      }

      // Reset consecutive timeout counter when progress is made.
      if (orchestrationStateAdvanced(progressBeforeTurn)) {
        consecutiveTimeouts = 0;
      } else {
        throw new BabysitterRuntimeError(
          "OrchestrationAgentStalled",
          "The orchestration agent did not advance the run or resolve pending effects in this turn.",
          { category: ErrorCategory.Runtime },
        );
      }
    }

    if (state.lastIterationResult?.status !== "completed" && state.lastIterationResult?.status !== "failed") {
      state.lastIterationResult = {
        status: "failed",
        error: { message: `Max iterations (${args.maxIterations}) reached without completion` },
      };
      emitProgress(
        {
          phase: "2",
          status: "failed",
          runId: state.runId,
          runDir: state.runDir,
          iteration: state.iteration,
          runStatus: "failed",
          error: `Max iterations (${args.maxIterations}) reached without completion`,
        },
        args.json,
        args.verbose,
      );
    }

    if (
      !state.finished &&
      (state.lastIterationResult?.status === "completed" || state.lastIterationResult?.status === "failed")
    ) {
      await invokeTool(
        finishTool,
        "babysitter_finish_orchestration",
        {
          summary: state.lastIterationResult.status === "completed"
            ? `Run ${state.runId} completed after ${state.iteration} iterations.`
            : `Run ${state.runId} failed after ${state.iteration} iterations.`,
        },
      );
    }

    const exitCode = ensureTerminalResult();
    if (exitCode !== null) {
      return exitCode;
    }

    throw new BabysitterRuntimeError(
      "OrchestrationIncomplete",
      "The orchestration phase ended without a terminal run state.",
      { category: ErrorCategory.Runtime },
    );
  } catch (error: unknown) {
    writeVerboseData(
      "phase2 error",
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            runId: state.runId,
            runDir: state.runDir,
            iteration: state.iteration,
            pendingEffects: describePendingActions(),
            lastIterationResult: state.lastIterationResult,
          }
        : error,
    );
    emitProgress(
      {
        phase: "2",
        status: "failed",
        runId: state.runId,
        runDir: state.runDir,
        iteration: state.iteration,
        error: error instanceof Error ? error.message : String(error),
      },
      args.json,
      args.verbose,
    );
    return 1;
  } finally {
    if (unsubscribe) unsubscribe();
    if (!args.json && args.verbose) process.stderr.write("\n");
  }
  } finally {
    removeShutdownHandlers();
    await Promise.allSettled(
      Array.from(activePiSessions).map((session) => shutdownPiSession(session)),
    );
  }
}
