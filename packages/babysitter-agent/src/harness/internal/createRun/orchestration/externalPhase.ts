import * as path from "node:path";
import {
  commitEffectResult,
} from "@a5c-ai/babysitter-sdk";
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
} from "../utils";
import { MAX_PROCESS_ERROR_RECOVERIES } from "./constants";
import { orchestrateIterationWithProcessLoadRetry, resolveEffectWithRetry } from "./effects";
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
        for (const action of result.nextActions) {
          await resolveExternalAction({
            action,
            args,
            state,
            registerPiSession,
            shutdownPiSession,
          });
        }
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
      emitProgress(
        {
          phase: "2",
          status: "failed",
          iteration: state.iteration,
          runStatus: "failed",
          error: extractErrorMessage(result.error),
        },
        args.json,
        args.verbose,
        args.outputMode,
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
      args.outputMode,
    );
    return 1;
  } finally {
    await Promise.allSettled(Array.from(activePiSessions).map((session) => shutdownPiSession(session)));
  }
}

async function resolveExternalAction(args: {
  action: EffectAction;
  args: RunOrchestrationPhaseArgs;
  state: OrchestrationState;
  registerPiSession: (session: ReturnType<typeof createAgentCoreSession>) => ReturnType<typeof createAgentCoreSession>;
  shutdownPiSession: (
    session: ReturnType<typeof createAgentCoreSession> | null | undefined,
  ) => Promise<void>;
}): Promise<void> {
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
        `worker:${args.action.effectId.slice(-8)}`,
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
        `worker:${args.action.effectId.slice(-8)}`,
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
        `worker:${args.action.effectId.slice(-8)}`,
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
    await commitEffectResult({
      runDir: args.state.runDir!,
      effectId: args.action.effectId,
      invocationKey: args.action.invocationKey,
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
        effectId: args.action.effectId,
        effectKind: args.action.kind,
        effectTitle: args.action.taskDef?.title,
        effectStatus: effectResult.status,
        elapsedMs: Date.now() - effectStartTime,
        error: effectResult.status === "error"
          ? extractErrorMessage(effectResult.error)
          : undefined,
        output: args.action.kind === "shell"
          ? (effectResult.stdout ?? (typeof effectResult.value === "string" ? effectResult.value : undefined))?.slice(-1500)
          : typeof effectResult.value === "string"
            ? effectResult.value.slice(0, 300)
            : undefined,
      },
      args.args.json,
      args.args.verbose,
      args.args.outputMode,
    );
  } finally {
    workerUnsub?.();
    await args.shutdownPiSession(workerSession);
  }
}

// Extracted to externalPhaseHelpers.ts
