/** Shared stop-hook handler: common 9-step sequence for ALL stop hooks. */

import * as path from "node:path";
import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import { extractPromiseTag } from "../../session/transcript";
import type { SessionState } from "../../session/types";
import {
  getCurrentTimestamp,
  isIterationTooFast,
  updateIterationTimes,
  writeSessionFile,
} from "../../session/write";
import type { HookHandlerArgs } from "../types";
import {
  appendStopHookEvent,
  cleanupSession,
  createHookLogger,
  type HookLogger,
  parseHookInput,
  readStdin,
  safeStr,
} from "./utils";
import { resolveHookRunState, type HookRunStateSummary } from "./runState";
import {
  parseAssistantStopState,
  resolveStopHookRunState,
  type StopHookRunStateDetails,
} from "./stopHookContinuation";

export interface StopHookCommonResult {
  shouldContinue: boolean;
  exitCode: number;
  exitReason?: string;
  sessionId: string;
  filePath: string;
  state: SessionState;
  prompt: string;
  runStateDetails?: StopHookRunStateDetails;
  runStateSummary?: HookRunStateSummary;
  hasPromise: boolean;
  promiseValue: string | null;
  resolvedPluginRoot: string;
  runsDir: string;
  updatedTimes: number[];
  nextIteration: number;
  log: HookLogger;
}

export interface StopHookCommonOptions {
  harness: string;
  logLabel?: string;
  sessionIdFields: string[];
  resolveSessionIdFallback?: () => string | undefined;
  responseFields?: string[];
  pluginRootEnvVars?: string[];
  useDetailedRunState?: boolean;
  resolveStateDir: (args: HookHandlerArgs) => string;
}

function resolveSessionIdFromInput(
  hookInput: Record<string, unknown>,
  fields: string[],
  fallback?: () => string | undefined,
): string {
  for (const field of fields) {
    const value = safeStr(hookInput, field);
    if (value) return value;
  }
  // Try AGENT_SESSION_ID as universal fallback
  if (process.env.AGENT_SESSION_ID) {
    return process.env.AGENT_SESSION_ID;
  }
  if (fallback) {
    return fallback() ?? "";
  }
  return "";
}

export async function handleStopHookCommon(
  args: HookHandlerArgs,
  options: StopHookCommonOptions,
): Promise<StopHookCommonResult> {
  const { verbose } = args;
  const log = createHookLogger(options.logLabel ?? `babysitter-${options.harness}-stop-hook`);
  log.info(`handleStopHook started (${options.harness})`);

  // Read stdin
  let rawInput: string;
  if (args.stdinPayload !== undefined) {
    rawInput = args.stdinPayload;
  } else {
    try {
      rawInput = await readStdin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn(`stdin read error: ${msg}`);
      if (verbose) {
        process.stderr.write(`[hook:run stop] stdin read error: ${msg}\n`);
      }
      process.stdout.write("{}\n");
      return makeExit(log, 0, "stdin_error");
    } finally {
      if (typeof process.stdin.unref === "function") {
        process.stdin.unref();
      }
    }
  }

  const hookInput = parseHookInput(rawInput);
  log.info("Hook input received");

  // Get sessionId
  const sessionId = resolveSessionIdFromInput(
    hookInput,
    options.sessionIdFields,
    options.resolveSessionIdFallback,
  );

  if (!sessionId) {
    log.info("No session ID — allowing exit");
    if (verbose) {
      process.stderr.write("[hook:run stop] No session ID in hook input\n");
    }
    process.stdout.write("{}\n");
    return makeExit(log, 0, "no_session_id");
  }

  log.setContext("session", sessionId);
  const pluginRoot = args.pluginRoot
    || resolvePluginRootFromEnv(options.pluginRootEnvVars ?? [])
    || "";
  const resolvedPluginRoot = pluginRoot ? path.resolve(pluginRoot) : "";
  const stateDir = options.resolveStateDir(args);
  if (!stateDir) {
    log.warn("Cannot determine state directory — allowing exit");
    if (verbose) {
      process.stderr.write("[hook:run stop] Cannot determine state directory\n");
    }
    process.stdout.write("{}\n");
    return makeExit(log, 0, "no_state_dir");
  }

  const runsDir = path.resolve(args.runsDir || ".a5c/runs");
  const filePath = getSessionFilePath(stateDir, sessionId);
  log.info(`Checking session file at: ${filePath}`);

  // Load session state
  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      log.info(`No active loop found for session ${sessionId} — allowing exit`);
      if (verbose) {
        process.stderr.write(`[hook:run stop] No active loop for session ${sessionId}\n`);
      }
      process.stdout.write("{}\n");
      return makeExit(log, 0, "no_session_file");
    }
    sessionFile = await readSessionFile(filePath);
  } catch {
    log.warn(`Session file read error at ${filePath} — allowing exit`);
    process.stdout.write("{}\n");
    return makeExit(log, 0, "session_read_error");
  }

  const { state } = sessionFile;
  const prompt = sessionFile.prompt ?? "";

  // Check max iterations
  if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
    if (verbose) {
      process.stderr.write(`[hook:run stop] Max iterations (${state.maxIterations}) reached\n`);
    }
    const runId = state.runId ?? "";
    if (runId) {
      const eventDir = state.runDir?.trim() || path.join(runsDir, runId);
      await appendStopHookEvent(eventDir, {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "max_iterations_reached",
        runState: "",
        pendingKinds: "",
        hasPromise: false,
      }, options.harness);
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return makeExit(log, 0, "max_iterations_reached", { sessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }

  // Check iteration speed
  const now = getCurrentTimestamp();
  const updatedTimes =
    state.iteration >= 5
      ? updateIterationTimes(state.iterationTimes, state.lastIterationAt, now)
      : state.iterationTimes;

  if (isIterationTooFast(updatedTimes)) {
    if (verbose) {
      const avg = updatedTimes.reduce((a, b) => a + b, 0) / updatedTimes.length;
      process.stderr.write(`[hook:run stop] Iteration too fast (avg ${avg}s)\n`);
    }
    const runId = state.runId ?? "";
    if (runId) {
      const eventDir = state.runDir?.trim() || path.join(runsDir, runId);
      await appendStopHookEvent(eventDir, {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "iteration_too_fast",
        runState: "",
        pendingKinds: "",
        hasPromise: false,
      }, options.harness);
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return makeExit(log, 0, "iteration_too_fast", { sessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }

  // Extract promise from response
  const runId = state.runId ?? "";
  const boundRunDir = state.runDir?.trim() || undefined;
  if (runId) log.setContext("run", runId);

  let hasPromise = false;
  let promiseValue: string | null = null;

  if (options.useDetailedRunState) {
    const assistantState = parseAssistantStopState(hookInput, log);
    hasPromise = assistantState.hasPromise;
    promiseValue = assistantState.promiseValue;
  } else {
    const responseFields = options.responseFields ?? ["last_response", "prompt_response"];
    for (const field of responseFields) {
      const text = safeStr(hookInput, field);
      if (text) {
        promiseValue = extractPromiseTag(text);
        hasPromise = promiseValue !== null;
        if (hasPromise) break;
      }
    }
  }

  // No runId → exit
  if (!runId) {
    log.info("No run associated with session — allowing exit");
    if (verbose) {
      process.stderr.write(`[hook:run stop] No run for session ${sessionId}\n`);
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return makeExit(log, 0, "no_run_id", { sessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }

  // Resolve run state
  let runStateDetails: StopHookRunStateDetails | undefined;
  let runStateSummary: HookRunStateSummary | undefined;
  let runState = "";
  let completionProof = "";
  let pendingKinds = "";
  let onlyBreakpointsPending = false;

  if (options.useDetailedRunState) {
    runStateDetails = await resolveStopHookRunState({
      runId,
      runsDir,
      preferredRunDir: boundRunDir,
      log,
    });
    runState = runStateDetails.runState;
    completionProof = runStateDetails.completionProof;
    pendingKinds = runStateDetails.pendingKinds;
    onlyBreakpointsPending = runStateDetails.onlyBreakpointsPending;
  } else {
    runStateSummary = await resolveHookRunState({ runId, runsDir, log });
    runState = runStateSummary.runState;
    completionProof = runStateSummary.completionProof;
    pendingKinds = runStateSummary.pendingKinds;
    onlyBreakpointsPending = runStateSummary.onlyBreakpointsPending;
  }

  const runEventDir = runStateDetails?.runDir || boundRunDir || path.join(runsDir, runId);

  log.info(`Run state: ${runState || "unknown"}`);
  if (completionProof) log.info("Completion proof available");
  // Check terminal conditions
  if (!runState) {
    const errorMessage = runStateDetails?.lookupError ??
      `Run ${runId} could not be resolved during the stop hook.`;
    log.error(errorMessage);
    process.stderr.write(`[hook:run stop] ${errorMessage}\n`);
    await appendStopHookEvent(runEventDir, {
      sessionId,
      iteration: state.iteration,
      decision: "approve",
      reason: "run_state_unknown",
      runState,
      pendingKinds,
      hasPromise,
    }, options.harness);
    process.stdout.write("{}\n");
    return makeExit(log, options.useDetailedRunState ? 1 : 0, "run_state_unknown", { sessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }

  if (runState === "waiting" && onlyBreakpointsPending) {
    log.info(`Run waiting on breakpoints only (${pendingKinds}) — allowing exit`);
    if (verbose) {
      process.stderr.write("[hook:run stop] Run waiting on breakpoint(s) — allowing exit\n");
    }
    await appendStopHookEvent(runEventDir, {
      sessionId,
      iteration: state.iteration,
      decision: "approve",
      reason: "breakpoint_waiting",
      runState,
      pendingKinds,
      hasPromise,
    }, options.harness);
    process.stdout.write("{}\n");
    return makeExit(log, 0, "breakpoint_waiting", { sessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }

  if (hasPromise && completionProof && promiseValue === completionProof) {
    log.info("Promise matches completion proof — allowing exit");
    if (verbose) {
      process.stderr.write("[hook:run stop] Valid promise tag detected - run complete\n");
    }
    await appendStopHookEvent(runEventDir, {
      sessionId,
      iteration: state.iteration,
      decision: "approve",
      reason: "completion_proof_matched",
      runState,
      pendingKinds,
      hasPromise,
    }, options.harness);
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return makeExit(log, 0, "completion_proof_matched", { sessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }

  // Should continue → update session and return
  const nextIteration = state.iteration + 1;
  const currentTime = getCurrentTimestamp();
  const updatedState: SessionState = {
    ...state,
    iteration: nextIteration,
    lastIterationAt: currentTime,
    iterationTimes: updatedTimes,
  };

  try {
    await writeSessionFile(filePath, updatedState, prompt);
  } catch {
    if (verbose) {
      process.stderr.write("[hook:run stop] Failed to update session state\n");
    }
  }

  await appendStopHookEvent(runEventDir, {
    sessionId,
    iteration: state.iteration,
    decision: "block",
    reason: "continue_loop",
    runState,
    pendingKinds,
    hasPromise,
  }, options.harness);

  return { shouldContinue: true, exitCode: 0, sessionId, filePath, state: updatedState,
    prompt, runStateDetails, runStateSummary, hasPromise, promiseValue, resolvedPluginRoot,
    runsDir, updatedTimes, nextIteration, log };
}

function resolvePluginRootFromEnv(envVars: string[]): string | undefined {
  for (const v of envVars) { if (process.env[v]) return process.env[v]; }
  return process.env.AGENT_PLUGIN_ROOT;
}

function makeExit(log: HookLogger, exitCode: number, reason: string, extra?: Partial<StopHookCommonResult>): StopHookCommonResult {
  return {
    shouldContinue: false, exitCode, exitReason: reason,
    sessionId: "", filePath: "", state: {} as SessionState, prompt: "",
    hasPromise: false, promiseValue: null, resolvedPluginRoot: "", runsDir: "",
    updatedTimes: [], nextIteration: 0, log, ...extra,
  };
}
