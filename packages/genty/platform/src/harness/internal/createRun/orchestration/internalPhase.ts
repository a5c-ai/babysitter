import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { EffectAction } from "@a5c-ai/babysitter-sdk";
import {
  BabysitterRuntimeError,
  DIM,
  ErrorCategory,
  PARENT_PROMPT_TIMEOUT_MS,
  compressInternalHarnessPrompt,
  createAgentCoreSession,
  createReadlineAskUserQuestionUiContext,
  emitProgress,
  isIgnorablePiPromptFailure,
  promptPiWithRetry,
  resolveAgentCoreBackendForHarness,
  resolveTaskHarness,
  writeVerboseBlock,
  writeVerboseLine,
  type OrchestrationState,
  type AgentCoreSessionHandle,
} from "../utils";
import {
  buildOrchestrationSystemPrompt,
  buildOrchestrationTurnPrompt,
} from "../prompts";
import {
  MAX_CONSECUTIVE_PROCESS_ERROR_STALLS,
  MAX_CONSECUTIVE_STALLS,
  MAX_CONSECUTIVE_TIMEOUTS,
} from "./constants";
import { readProcessFileFingerprint } from "./effects";
import { createOrchestrationTools } from "./internalTools";
import { ensureRunAndMaybeBindFromProcessDefinition } from "../planProcess/runState";
import { runDelegatedHarnessTask } from "../planProcess";
import { assessRun } from "../resumeState";
import type { OrchestrationProgressSnapshot, RunOrchestrationPhaseArgs } from "./types";
import { subscribeVerbosePiEvents } from "./verbose";
import { listTasks, readTask } from "../../../../tasks";
import { addRunSummary } from "../../../../session/history";

export async function runInternalOrchestrationPhase(
  args: RunOrchestrationPhaseArgs,
): Promise<number> {
  const state: OrchestrationState = {
    runId: args.existingRunId,
    runDir: args.existingRunDir,
    sessionBound: args.existingSessionBound,
    iteration: 0,
    pendingActions: new Map(),
    pendingEffectResults: new Map(),
  };
  let orchestrationSession: AgentCoreSessionHandle | null = null;
  const activePiSessions = new Set<AgentCoreSessionHandle>();
  const writeVerbose = (message: string): void => {
    writeVerboseLine(args.verbose, args.json, message, args.outputMode);
  };
  const writeVerboseData = (label: string, value: unknown, maxChars?: number): void => {
    writeVerboseBlock(args.verbose, args.json, label, value, maxChars, args.outputMode);
  };

  const registerPiSession = (session: AgentCoreSessionHandle): AgentCoreSessionHandle => {
    activePiSessions.add(session);
    return session;
  };
  const shutdownPiSession = async (session: AgentCoreSessionHandle | null | undefined): Promise<void> => {
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

  const describePendingActions = () => Array.from(state.pendingActions.values()).map((action) => ({
    effectId: action.effectId,
    kind: action.kind,
    title: action.taskDef?.title,
    harness: resolveTaskHarness(action, args.selectedHarnessName, args.discovered),
  }));
  const ensureTerminalResult = (): number | null => {
    if (state.lastIterationResult?.status === "completed") return 0;
    if (state.lastIterationResult?.status === "failed") return 1;
    return null;
  };
  const captureProgressSnapshot = (): OrchestrationProgressSnapshot => ({
    runId: state.runId,
    runDir: state.runDir,
    sessionBound: Boolean(state.sessionBound),
    iteration: state.iteration,
    pendingActionIds: Array.from(state.pendingActions.keys()).sort().join(","),
    pendingResultIds: Array.from(state.pendingEffectResults.keys()).sort().join(","),
    lastStatus: state.lastIterationResult?.status,
    hasAskUserQuestionResponse: Boolean(state.lastAskUserQuestionResponse),
    finished: Boolean(state.finished),
    processFileFingerprint: readProcessFileFingerprint(args.processPath),
  });
  const orchestrationStateAdvanced = (before: OrchestrationProgressSnapshot): boolean => {
    const after = captureProgressSnapshot();
    return Object.keys(after).some((key) =>
      after[key as keyof OrchestrationProgressSnapshot]
      !== before[key as keyof OrchestrationProgressSnapshot]);
  };
  const protectedRunEntries = new Set<string>();
  let runSummaryRecorded = false;
  const recordRunSummary = async (status: string, outcome: string): Promise<void> => {
    const stateFile = state.sessionBound?.stateFile;
    const sessionId = state.sessionBound?.sessionId;
    if (runSummaryRecorded || !stateFile || !sessionId || !state.runId) {
      return;
    }
    const recordedAt = new Date().toISOString();
    await addRunSummary(path.dirname(stateFile), sessionId, {
      runId: state.runId,
      processId: path.basename(args.processPath, path.extname(args.processPath)),
      status,
      startedAt: recordedAt,
      completedAt: recordedAt,
      outcome,
    });
    runSummaryRecorded = true;
  };
  const snapshotProtectedRunEntries = async (): Promise<void> => {
    if (!args.runsDir) {
      return;
    }
    let entries: string[] = [];
    try {
      entries = await fs.readdir(args.runsDir);
    } catch {
      return;
    }
    for (const entry of entries) {
      protectedRunEntries.add(entry);
    }
  };
  const cleanupUnexpectedRunSiblings = async (): Promise<void> => {
    if (!args.runsDir || !state.runId) {
      return;
    }
    let entries: string[] = [];
    try {
      entries = await fs.readdir(args.runsDir);
    } catch {
      return;
    }
    const removed: string[] = [];
    for (const entry of entries) {
      if (entry === state.runId || protectedRunEntries.has(entry)) {
        continue;
      }
      try {
        const target = path.join(args.runsDir, entry);
        const stat = await fs.stat(target);
        if (!stat.isDirectory()) {
          continue;
        }
        await fs.rm(target, { recursive: true, force: true });
        removed.push(entry);
      } catch {
        // Best-effort cleanup only; don't derail the orchestration loop.
      }
    }
    if (removed.length > 0) {
      writeVerboseData("phaseOrchestration host cleaned stray run dirs", {
        runId: state.runId,
        removed,
      });
    }
  };

  const syncStateFromRunArtifacts = async (): Promise<{
    runStatus: string | null;
    synchronized: boolean;
  }> => {
    if (!state.runDir) {
      return { runStatus: null, synchronized: false };
    }
    const before = captureProgressSnapshot();
    const assessed = await assessRun(state.runDir).catch(() => null);
    if (!assessed) {
      return { runStatus: null, synchronized: false };
    }

    const pendingTasks = await listTasks(state.runDir, { status: "requested" }).catch(() => []);
    state.runId = assessed.run.runId;
    state.pendingActions.clear();
    for (const task of pendingTasks) {
      const detail = await readTask(state.runDir, task.effectId).catch(() => null);
      if (!detail) {
        continue;
      }
      const definition = detail.definition as Record<string, unknown>;
      const io = typeof definition.io === "object" && definition.io !== null
        ? definition.io as Record<string, unknown>
        : undefined;
      const action: EffectAction = {
        effectId: task.effectId,
        invocationKey: String(definition.invocationKey ?? task.effectId),
        kind: task.kind,
        label: task.title,
        labels: task.labels,
        taskDef: detail.definition as unknown as EffectAction["taskDef"],
        taskId: task.taskId,
        stepId: typeof definition.stepId === "string" ? definition.stepId : undefined,
        taskDefRef: `tasks/${task.effectId}/task.json`,
        inputsRef: typeof io?.inputJsonPath === "string" ? String(io.inputJsonPath) : undefined,
        requestedAt: task.requestedAt,
      };
      state.pendingActions.set(task.effectId, action);
    }

    if (assessed.run.status === "completed") {
      state.lastIterationResult = { status: "completed", output: undefined };
    } else if (assessed.run.status === "failed") {
      state.lastIterationResult = {
        status: "failed",
        error: { message: "Run failed" },
      };
    } else if (state.pendingActions.size > 0) {
      state.lastIterationResult = {
        status: "waiting",
        nextActions: Array.from(state.pendingActions.values()),
      };
    }

    const synchronized = orchestrationStateAdvanced(before);
    if (synchronized) {
      writeVerboseData("phaseOrchestration synced run state", {
        runStatus: assessed.run.status,
        pendingEffects: Array.from(state.pendingActions.keys()),
        journalLength: assessed.journalLength,
        lastEvent: assessed.lastEvent,
      });
    }
    return { runStatus: assessed.run.status, synchronized };
  };

  const { mergedTools, iterateTool, taskPostTool, finishTool, invokeTool } = createOrchestrationTools({
    phaseArgs: args,
    state,
    describePendingActions,
    writeVerbose,
    writeVerboseData,
  });

  const ensureBoundRunContext = async (): Promise<void> => {
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
      phaseSession: orchestrationSession,
      state,
    });
    if (runState.createdRun) {
      emitProgress(
        { phase: "2", status: "run-created", runId: runState.runId, runDir: runState.runDir },
        args.json,
        args.verbose,
        args.outputMode,
      );
      writeVerboseData("phaseOrchestration host run state", runState);
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
  };

  const promptOrchestrationAgent = async (
    message: string,
    label = "phaseOrchestration",
  ): Promise<void> => {
    if (!orchestrationSession) {
      throw new BabysitterRuntimeError(
        "OrchestrationSessionMissing",
        "The orchestration PI session has not been created.",
        { category: ErrorCategory.Runtime },
      );
    }
    if (!args.json && args.verbose && args.outputMode !== "tui") {
      process.stderr.write(`\n${DIM}[${label}] agent turn\n`);
    }
    writeVerboseData(`${label} prompt`, message);
    const progressSnapshot = captureProgressSnapshot();
    let result: { success: boolean; output: string };
    try {
      result = await promptPiWithRetry({
        session: orchestrationSession,
        message: compressInternalHarnessPrompt(message, args.compressionConfig, "agent"),
        timeout: PARENT_PROMPT_TIMEOUT_MS,
        label,
        writeVerbose,
        writeVerboseData,
      });
    } catch (err: unknown) {
      const isTimeout = err instanceof BabysitterRuntimeError
        && (err.name === "PiTimeoutError" || err.message.includes("timed out"));
      if (!isTimeout) {
        throw err;
      }
      result = {
        success: false,
        output: `Pi prompt timed out: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
    if (!result.success) {
      writeVerboseData(`${label} agent failure output`, result.output);
      if (!orchestrationStateAdvanced(progressSnapshot)) {
        throw new BabysitterRuntimeError("OrchestrationAgentFailed", result.output, {
          category: ErrorCategory.External,
        });
      }
      if (
        state.lastIterationResult?.status !== "process-error" &&
        !isIgnorablePiPromptFailure(result.output)
      ) {
        throw new BabysitterRuntimeError("OrchestrationAgentFailed", result.output, {
          category: ErrorCategory.External,
        });
      }
      return;
    }
    writeVerbose(`[phaseOrchestration agent] ${summarizeAgentText(result.output)}`);
  };

  orchestrationSession = registerPiSession(createAgentCoreSession({
    workspace: args.workspace,
    model: args.model,
    backend: resolveAgentCoreBackendForHarness(args.selectedHarnessName),
    toolsMode: "coding",
    customTools: mergedTools,
    uiContext: args.interactive && args.rl
      ? createReadlineAskUserQuestionUiContext(args.rl)
      : undefined,
    appendSystemPrompt: [
      buildOrchestrationSystemPrompt(
        args.selectedHarnessName,
        args.promptContext,
        args.interactive,
        args.invocationCommand === "call",
      ),
    ],
    ephemeral: true,
  }));

  emitProgress(
    { phase: "2", status: "started", harness: args.selectedHarnessName },
    args.json,
    args.verbose,
    args.outputMode,
  );

  let unsubscribe: (() => void) | null = null;
  try {
    await orchestrationSession.initialize();
    if (!args.json && args.verbose && args.outputMode !== "tui") {
      unsubscribe = subscribeVerbosePiEvents(orchestrationSession, "orchestrator", args);
    }
    await ensureBoundRunContext();
    if (!state.runId || !state.runDir) {
      throw new BabysitterRuntimeError(
        "RunNotCreated",
        "The orchestration session could not establish a run before iteration.",
        { category: ErrorCategory.Runtime },
      );
    }
    await snapshotProtectedRunEntries();

    let consecutiveTimeouts = 0;
    let consecutiveStalls = 0;
    let consecutiveProcessErrorStalls = 0;
    while (state.iteration < args.maxIterations) {
      const observed = await syncStateFromRunArtifacts();
      const terminal = ensureTerminalResult();
      if (terminal !== null) {
        break;
      }
      if (
        (
          state.lastIterationResult?.status === "waiting"
          && state.pendingActions.size === 0
        )
        || observed.runStatus === "created"
        || observed.runStatus === "in-progress"
      ) {
        writeVerbose(
          observed.runStatus === "created"
            ? "[phaseOrchestration host] bootstrapping the freshly created run"
            : "[phaseOrchestration host] all pending effects were posted; auto-advancing the run",
        );
        await invokeTool(iterateTool, "babysitter_run_iterate");
        if (ensureTerminalResult() !== null) {
          break;
        }
        consecutiveTimeouts = 0;
        consecutiveStalls = 0;
        consecutiveProcessErrorStalls = 0;
        continue;
      }
      // Auto-execute effects in the host — models struggle with the babysitter tool protocol.
      // Handle shell effects via child_process, all other non-breakpoint effects via delegation.
      if (state.pendingActions.size > 0) {
        let effectsResolved = 0;
        for (const [effectId, action] of state.pendingActions) {
          if (action.kind === 'breakpoint') continue;
          if (action.kind === 'shell') {
            const shell = (action as any).shell ?? (action as any).taskDef?.shell;
            if (!shell?.command) continue;
            writeVerbose(`[phaseOrchestration host] auto-executing shell effect ${effectId}: ${shell.command} ${(shell.args || []).slice(0, 2).join(' ')}`);
            try {
              const { execFileSync } = await import('node:child_process');
              const stdout = execFileSync(shell.command, shell.args || [], {
                cwd: args.workspace,
                timeout: shell.timeout || 30_000,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
              });
              await invokeTool(taskPostTool, 'babysitter_task_post_result', {
                effectId,
                status: 'ok',
                valueText: stdout,
              });
              effectsResolved++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              writeVerbose(`[phaseOrchestration host] shell effect ${effectId} failed: ${msg}`);
              await invokeTool(taskPostTool, 'babysitter_task_post_result', {
                effectId,
                status: 'error',
                valueText: msg,
              });
              effectsResolved++;
            }
          } else {
            const agentSpec = (action as any).agent ?? (action as any).taskDef?.agent;
            const prompt = typeof agentSpec?.prompt === 'string'
              ? agentSpec.prompt
              : JSON.stringify(agentSpec?.prompt ?? (action as any).title ?? (action as any).label ?? 'Execute this task');
            writeVerbose(`[phaseOrchestration host] auto-delegating ${action.kind} effect ${effectId}: ${((action as any).title ?? (action as any).label ?? '').slice(0, 80)}`);
            try {
              const delegated = await runDelegatedHarnessTask({
                task: prompt,
                workspace: args.workspace,
                model: args.model,
                timeout: 180_000,
              });
              await invokeTool(taskPostTool, 'babysitter_task_post_result', {
                effectId,
                status: 'ok',
                valueJson: typeof delegated === 'string' ? delegated : JSON.stringify(delegated),
              });
              effectsResolved++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              writeVerbose(`[phaseOrchestration host] ${action.kind} effect ${effectId} failed: ${msg}`);
              await invokeTool(taskPostTool, 'babysitter_task_post_result', {
                effectId,
                status: 'error',
                valueText: msg,
              });
              effectsResolved++;
            }
          }
        }
        if (effectsResolved > 0) {
          const totalPending = state.pendingActions.size;
          writeVerbose(`[phaseOrchestration host] auto-resolved ${effectsResolved} effects (${totalPending} still pending)`);
          consecutiveStalls = 0;
          // If all effects resolved, auto-advance the run without prompting the model.
          if (totalPending === 0) {
            writeVerbose('[phaseOrchestration host] all effects auto-resolved — auto-advancing run');
            await invokeTool(iterateTool, "babysitter_run_iterate");
            if (ensureTerminalResult() !== null) break;
            consecutiveTimeouts = 0;
            consecutiveProcessErrorStalls = 0;
          }
          continue;
        }
      }

      const progressBeforeTurn = captureProgressSnapshot();
      try {
        await promptOrchestrationAgent(
          buildOrchestrationTurnPrompt({
            processPath: path.resolve(args.processPath),
            userPrompt: args.prompt,
            planningConversationSummary: args.planningConversationSummary,
            maxIterations: args.maxIterations,
            currentIteration: state.iteration,
            runId: state.runId,
            runDir: state.runDir,
            lastStatus: state.lastIterationResult?.status,
            lastError: state.lastIterationResult?.status === "process-error"
              ? extractIterationError(state.lastIterationResult.error)
              : undefined,
            pendingEffects: describePendingActions(),
          }),
          `phaseOrchestration iteration ${state.iteration + 1}`,
        );
      } catch (err: unknown) {
        const isTimeoutFailure = err instanceof BabysitterRuntimeError
          && err.name === "OrchestrationAgentFailed"
          && (err.message.includes("timed out") || err.message.includes("PiTimeoutError"));
        if (!isTimeoutFailure) {
          throw err;
        }
        consecutiveTimeouts += 1;
        if (consecutiveTimeouts >= MAX_CONSECUTIVE_TIMEOUTS) {
          throw new BabysitterRuntimeError(
            "OrchestrationAgentTimedOut",
            `Pi prompt timed out ${consecutiveTimeouts} consecutive times — aborting orchestration.`,
            { category: ErrorCategory.External },
          );
        }
        continue;
      }

      await cleanupUnexpectedRunSiblings();
      if (ensureTerminalResult() !== null) {
        break;
      }
      if (!orchestrationStateAdvanced(progressBeforeTurn)) {
        await syncStateFromRunArtifacts();
      }
      if (orchestrationStateAdvanced(progressBeforeTurn)) {
        consecutiveTimeouts = 0;
        consecutiveStalls = 0;
        consecutiveProcessErrorStalls = 0;
        continue;
      }
      if (state.lastIterationResult?.status === "process-error") {
        consecutiveProcessErrorStalls += 1;
        if (consecutiveProcessErrorStalls >= MAX_CONSECUTIVE_PROCESS_ERROR_STALLS) {
          throw new BabysitterRuntimeError(
            "OrchestrationAgentStalled",
            `The orchestration agent did not retry the run or repair the process after ${consecutiveProcessErrorStalls} consecutive recovery prompts.`,
            { category: ErrorCategory.Runtime },
          );
        }
        continue;
      }
      consecutiveStalls += 1;
      if (consecutiveStalls >= MAX_CONSECUTIVE_STALLS) {
        throw new BabysitterRuntimeError(
          "OrchestrationAgentStalled",
          `The orchestration agent did not advance the run or resolve pending effects for ${consecutiveStalls} consecutive turns.`,
          { category: ErrorCategory.Runtime },
        );
      }
    }

    if (state.lastIterationResult?.status === "completed" || state.lastIterationResult?.status === "failed") {
      await recordRunSummary(
        state.lastIterationResult.status,
        state.lastIterationResult.status === "completed"
          ? `Run ${state.runId} completed after ${state.iteration} iterations.`
          : `Run ${state.runId} failed after ${state.iteration} iterations.`,
      );
      if (!state.finished) {
        await invokeTool(finishTool, "babysitter_finish_orchestration", {
          summary: state.lastIterationResult.status === "completed"
            ? `Run ${state.runId} completed after ${state.iteration} iterations.`
            : `Run ${state.runId} failed after ${state.iteration} iterations.`,
        });
      }
    }

    const terminalResult = ensureTerminalResult();
    if (terminalResult !== null) {
      return terminalResult;
    }
    await recordRunSummary(
      "failed",
      `Max iterations (${args.maxIterations}) reached without completion.`,
    );
    return 1;
  } catch (error: unknown) {
    await recordRunSummary(
      "failed",
      error instanceof Error ? error.message : String(error),
    );
    writeVerboseData(
      "phaseOrchestration error",
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
      args.outputMode,
    );
    return 1;
  } finally {
    unsubscribe?.();
    await Promise.allSettled(Array.from(activePiSessions).map((session) => shutdownPiSession(session)));
  }
}

function summarizeAgentText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "(no summary emitted)";
  }
  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}

function extractIterationError(error: unknown): string {
  return typeof error === "object" && error !== null && "message" in error
    ? String((error as Record<string, unknown>).message)
    : String(error);
}
