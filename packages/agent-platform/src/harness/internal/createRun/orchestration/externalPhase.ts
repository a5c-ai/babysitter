import * as path from "node:path";
import {
  buildEffectIndex,
  commitEffectResult,
} from "@a5c-ai/babysitter-sdk";
import { DEFAULT_COMPACTION_CONFIG } from "../../../../compression/compaction";
import { computeEffectCosts } from "../../../../cost/effectCost";
import { addRunSummary } from "../../../../session/history";
import {
  BabysitterRuntimeError,
  ErrorCategory,
  buildPiWorkerSessionOptions,
  createAgentCoreSession,
  createStreamingProgressCallbacks,
  emitProgress,
  isInternalHarness,
  resolveOutputMode,
  resolveTaskHarness,
  shouldUseExternalHarness,
  writeVerboseBlock,
  writeVerboseLine,
  type EffectAction,
  type OrchestrationState,
  type ResolveEffectResult,
} from "../utils";
import { MAX_PROCESS_ERROR_RECOVERIES } from "./constants";

/** Max characters of shell output tail included in progress events. */
const MAX_SHELL_OUTPUT_TAIL_CHARS = 1500;
/** Max characters of non-shell output head included in progress events. */
const MAX_NON_SHELL_OUTPUT_HEAD_CHARS = 300;
import {
  applyPostEffectOrchestrationOverlays,
  orchestrateIterationWithProcessLoadRetry,
  resolveEffectWithRetry,
} from "./effects";
import {
  dispatchEffectActions,
  harnessSupportsConcurrentEffects,
} from "./dispatch";
import { ensureRunAndMaybeBindFromProcessDefinition } from "../planProcess/runState";
import { subscribeVerbosePiEvents } from "./verbose";
import type { RunOrchestrationPhaseArgs } from "./types";
import { extractErrorMessage, extractErrorStack, recoverExternalProcessError } from "./externalPhaseHelpers";

export async function runExternalOrchestrationPhase(args: RunOrchestrationPhaseArgs): Promise<number | undefined> {
  if (!shouldUseExternalHarness(args.selectedHarnessName)) {
    return undefined;
  }
  const state: OrchestrationState = {
    runId: args.existingRunId,
    runDir: args.existingRunDir,
    sessionBound: args.existingSessionBound,
    iteration: 0,
    pendingActions: new Map(),
    pendingEffectResults: new Map(),
  };
  const activePiSessions = new Set<ReturnType<typeof createAgentCoreSession>>();
  const writeVerbose = (message: string): void => {
    writeVerboseLine(args.verbose, args.json, message, args.outputMode);
  };
  const writeVerboseData = (label: string, value: unknown, maxChars?: number): void => {
    writeVerboseBlock(args.verbose, args.json, label, value, maxChars, args.outputMode);
  };
  const registerPiSession = (session: ReturnType<typeof createAgentCoreSession>) => {
    activePiSessions.add(session);
    return session;
  };
  const shutdownPiSession = async (
    session: ReturnType<typeof createAgentCoreSession> | null | undefined,
  ): Promise<void> => {
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
  emitProgress(
    { phase: "2", status: "started", harness: args.selectedHarnessName },
    args.json,
    args.verbose,
    args.outputMode,
  );
  writeVerbose(
    `[phaseOrchestration host setup] harness=${args.selectedHarnessName} workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} processPath=${path.resolve(args.processPath)}`,
  );
  try {
    if (state.runId && state.runDir) {
      emitProgress(
        { phase: "2", status: "resuming", runId: state.runId, runDir: state.runDir },
        args.json,
        args.verbose,
        args.outputMode,
      );
    }
    const runState = await ensureRunAndMaybeBindFromProcessDefinition({
      processPath: args.processPath,
      prompt: args.prompt ?? "",
      workspace: args.workspace,
      runsDir: args.runsDir,
      selectedHarnessName: args.selectedHarnessName,
      maxIterations: args.maxIterations,
      interactive: args.interactive,
      verbose: args.verbose,
      json: args.json,
      state,
      requireBoundSession: false,
    });
    if (runState.createdRun) {
      emitProgress(
        { phase: "2", status: "run-created", runId: runState.runId, runDir: runState.runDir },
        args.json,
        args.verbose,
        args.outputMode,
      );
    }
    if (runState.boundSession && runState.sessionBound) {
      emitProgress(
        {
          phase: "2",
          status: "bound",
          runId: runState.runId,
          runDir: runState.runDir,
          harness: runState.sessionBound.harness,
          sessionId: runState.sessionBound.sessionId,
          error: runState.sessionBound.error,
        },
        args.json,
        args.verbose,
        args.outputMode,
      );
    }
    if (!state.runDir) {
      throw new BabysitterRuntimeError(
        "RunNotCreated",
        "The orchestration session could not establish a run before iteration.",
        { category: ErrorCategory.Runtime },
      );
    }
    let consecutiveProcessErrors = 0;
    const runStartTime = Date.now();
    while (state.iteration < args.maxIterations) {
      state.iteration += 1;
      emitProgress(
        {
          phase: "2",
          status: "iteration-start",
          iteration: state.iteration,
          elapsedMs: Date.now() - runStartTime,
        },
        args.json,
        args.verbose,
        args.outputMode,
      );
      const result = await orchestrateIterationWithProcessLoadRetry({
        runDir: state.runDir,
        writeVerbose,
        writeVerboseData,
      });
      state.lastIterationResult = result;
      if (result.status === "waiting") {
        consecutiveProcessErrors = 0;
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
          args.outputMode,
        );
        const iterationStartTime = Date.now();
        await dispatchEffectActions({
          actions: result.nextActions,
          concurrentEffects: harnessSupportsConcurrentEffects(
            args.selectedHarnessName,
            args.discovered,
          ),
          resolveAction: (action) => resolveExternalAction({
            action,
            args,
            state,
            registerPiSession,
            shutdownPiSession,
          }),
          commitAction: async ({ action, result: effectResult, startedAt, finishedAt }) => {
            await commitEffectResult({
              runDir: state.runDir!,
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
            const stateDir = state.sessionBound?.stateFile
              ? path.dirname(state.sessionBound.stateFile)
              : undefined;
            const costResult = await buildEffectIndex({ runDir: state.runDir! })
              .then(computeEffectCosts)
              .catch(() => undefined);
            const overlays = await applyPostEffectOrchestrationOverlays({
              runId: state.runId,
              runDir: state.runDir,
              runsDir: args.runsDir ?? path.dirname(state.runDir!),
              stateDir,
              sessionId: state.sessionBound?.sessionId,
              effectCost: costResult && costResult.effects.length > 0
                ? {
                  totalCostUsd: costResult.totalCostUsd,
                  inputTokens: costResult.effects.reduce((sum, effect) => sum + effect.inputTokens, 0),
                  outputTokens: costResult.effects.reduce((sum, effect) => sum + effect.outputTokens, 0),
                }
                : undefined,
              estimatedStateTokens: Math.ceil(JSON.stringify({
                iteration: state.iteration,
                lastEffect: action.effectId,
                output: effectResult.stdout ?? effectResult.stderr ?? effectResult.value,
              }).length / 4),
              compactionConfig: DEFAULT_COMPACTION_CONFIG,
              effectSummary: {
                effectId: action.effectId,
                taskId: action.taskId,
                kind: action.kind,
                title: action.taskDef?.title,
                status: effectResult.status,
              },
            });
            if (overlays.budgetEnforcement?.paused) {
              const error = overlays.budgetEnforcement.pauseReason ?? "Session cost budget pause requested";
              emitProgress(
                {
                  phase: "2",
                  status: "failed",
                  iteration: state.iteration,
                  runStatus: "failed",
                  error,
                },
                args.json,
                args.verbose,
                args.outputMode,
              );
              throw new BabysitterRuntimeError(
                "SessionBudgetPaused",
                error,
                { category: ErrorCategory.Runtime },
              );
            }
          },
        });
        emitProgress(
          {
            phase: "2",
            status: "iteration-summary",
            iteration: state.iteration,
            effectsResolved: result.nextActions.length,
            elapsedMs: Date.now() - iterationStartTime,
          },
          args.json,
          args.verbose,
          args.outputMode,
        );
        continue;
      }
      if (result.status === "completed") {
        await recordExternalRunSummary(state, args, "completed", "Run completed");
        emitProgress(
          { phase: "2", status: "completed", iteration: state.iteration, runStatus: "completed" },
          args.json,
          args.verbose,
          args.outputMode,
        );
        return 0;
      }
      if (result.status === "process-error") {
        consecutiveProcessErrors += 1;
        const errorMessage = extractErrorMessage(result.error);
        emitProgress(
          {
            phase: "2",
            status: "process-error-recovery",
            iteration: state.iteration,
            runStatus: "recovering",
            attempt: consecutiveProcessErrors,
            maxAttempts: MAX_PROCESS_ERROR_RECOVERIES,
            error: errorMessage,
          },
          args.json,
          args.verbose,
          args.outputMode,
        );
        if (consecutiveProcessErrors > MAX_PROCESS_ERROR_RECOVERIES) {
          emitProgress(
            {
              phase: "2",
              status: "failed",
              iteration: state.iteration,
              runStatus: "failed",
              error: `Process error recovery exhausted after ${MAX_PROCESS_ERROR_RECOVERIES} attempts. Last error: ${errorMessage}`,
            },
            args.json,
            args.verbose,
            args.outputMode,
          );
          return 1;
        }
        await recoverExternalProcessError({
          args,
          errorMessage,
          errorStack: extractErrorStack(result.error),
          registerPiSession,
          shutdownPiSession,
        });
        state.iteration -= 1;
        continue;
      }
      const errorMessage = result.status === "halted"
        ? result.reason
        : "error" in result
          ? extractErrorMessage(result.error)
          : "unknown error";
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
        args.outputMode,
      );
      await recordExternalRunSummary(state, args, "failed", errorMessage);
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
      args.outputMode,
    );
    await recordExternalRunSummary(state, args, "failed", `Max iterations (${args.maxIterations}) reached without completion`);
    return 1;
  } finally {
    await Promise.allSettled(Array.from(activePiSessions).map((session) => shutdownPiSession(session)));
  }
}

async function recordExternalRunSummary(
  state: OrchestrationState,
  args: RunOrchestrationPhaseArgs,
  status: string,
  outcome: string,
): Promise<void> {
  const stateFile = state.sessionBound?.stateFile;
  const sessionId = state.sessionBound?.sessionId;
  if (!stateFile || !sessionId || !state.runId) {
    return;
  }
  await addRunSummary(path.dirname(stateFile), sessionId, {
    runId: state.runId,
    processId: path.basename(args.processPath, path.extname(args.processPath)),
    status,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    outcome,
  });
}

async function resolveExternalAction(args: {
  action: EffectAction;
  args: RunOrchestrationPhaseArgs;
  state: OrchestrationState;
  registerPiSession: (session: ReturnType<typeof createAgentCoreSession>) => ReturnType<typeof createAgentCoreSession>;
  shutdownPiSession: (
    session: ReturnType<typeof createAgentCoreSession> | null | undefined,
  ) => Promise<void>;
}): Promise<ResolveEffectResult> {
  const taskHarness = resolveTaskHarness(
    args.action,
    args.args.selectedHarnessName,
    args.args.discovered,
  );
  const shouldUseHostPiWorker = (
    args.args.selectedHarnessName === "pi" &&
    taskHarness === args.args.selectedHarnessName &&
    !args.state.sessionBound
  );
  emitProgress(
    {
      phase: "2",
      status: "effect-start",
      effectId: args.action.effectId,
      effectKind: args.action.kind,
      effectTitle: args.action.taskDef?.title,
      effectHarness: taskHarness,
      iteration: args.state.iteration,
    },
    args.args.json,
    args.args.verbose,
    args.args.outputMode,
  );
  let workerSession: ReturnType<typeof createAgentCoreSession> | null = null;
  let workerUnsub: (() => void) | null = null;
  if (
    args.action.kind === "shell" ||
    isInternalHarness(taskHarness) ||
    shouldUseHostPiWorker
  ) {
    if (isInternalHarness(taskHarness) || args.action.kind === "shell") {
      workerSession = args.registerPiSession(createAgentCoreSession(buildPiWorkerSessionOptions({
        action: args.action,
        workspace: args.args.workspace,
        model: args.args.model,
      })));
      workerUnsub = subscribeVerbosePiEvents(
        workerSession,
        `worker:${args.action.effectId.slice(-8) /* last 8 chars of ULID for human-readable label */}`,
        args.args,
      );
    } else if (shouldUseHostPiWorker) {
      workerSession = args.registerPiSession(createAgentCoreSession(buildPiWorkerSessionOptions({
        action: args.action,
        workspace: args.args.workspace,
        model: args.args.model,
      })));
      workerUnsub = subscribeVerbosePiEvents(
        workerSession,
        `worker:${args.action.effectId.slice(-8) /* last 8 chars of ULID for human-readable label */}`,
        args.args,
      );
    }
  }
  const piSessionFactory = workerSession
    ? () => {
      const nextSession = args.registerPiSession(createAgentCoreSession(buildPiWorkerSessionOptions({
        action: args.action,
        workspace: args.args.workspace,
        model: args.args.model,
      })));
      workerUnsub?.();
      workerUnsub = subscribeVerbosePiEvents(
        nextSession,
        `worker:${args.action.effectId.slice(-8) /* last 8 chars of ULID for human-readable label */}`,
        args.args,
      );
      return nextSession;
    }
    : undefined;
  try {
    const effectStartTime = Date.now();
    const streamingCallbacks = createStreamingProgressCallbacks(
      resolveOutputMode(args.args.json, args.args.outputMode),
      taskHarness,
    );
    const effectResult = await resolveEffectWithRetry(
      args.action,
      args.args.selectedHarnessName,
      {
        workspace: args.args.workspace,
        model: args.args.model,
        interactive: args.args.interactive,
        compressionConfig: args.args.compressionConfig,
        streaming: streamingCallbacks,
        runsDir: args.args.runsDir,
        runId: args.state.runId,
        runDir: args.state.runDir,
        sessionId: args.state.sessionBound?.sessionId,
        maxIterations: args.args.maxIterations,
        verbose: args.args.verbose,
        outputMode: args.args.outputMode,
      },
      workerSession,
      args.args.discovered,
      args.args.rl,
      args.args.json,
      piSessionFactory,
      args.shutdownPiSession,
    );
    emitProgress(
      {
        phase: "2",
        status: "effect",
        effectId: args.action.effectId,
        effectKind: args.action.kind,
        effectTitle: args.action.taskDef?.title,
        effectStatus: effectResult.status,
        elapsedMs: Date.now() - effectStartTime,
        error: effectResult.status === "error"
          ? extractErrorMessage(effectResult.error)
          : undefined,
        output: args.action.kind === "shell"
          ? (effectResult.stdout ?? (typeof effectResult.value === "string" ? effectResult.value : undefined))?.slice(-MAX_SHELL_OUTPUT_TAIL_CHARS)
          : typeof effectResult.value === "string"
            ? effectResult.value.slice(0, MAX_NON_SHELL_OUTPUT_HEAD_CHARS)
            : undefined,
      },
      args.args.json,
      args.args.verbose,
      args.args.outputMode,
    );
    return effectResult;
  } finally {
    workerUnsub?.();
    await args.shutdownPiSession(workerSession);
  }
}

// Extracted to externalPhaseHelpers.ts
