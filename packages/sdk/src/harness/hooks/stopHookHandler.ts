/** Shared stop-hook handler: common 9-step sequence for ALL stop hooks. */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import {
  DEFAULTS,
  getReadableRunsDirs,
  resolveRunsDir,
} from "../../config";
import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import { extractPromiseTag } from "../../session/transcript";
import type { SessionState } from "../../session/types";
import {
  getCurrentTimestamp,
  updateIterationTimes,
  writeSessionFile,
} from "../../session/write";
import {
  countPendingEffectsFromJournal,
  deriveObservedRunState,
  findLastLifecycleEventType,
  isTerminalRunState,
} from "../../runtime/runLifecycleState";
import { loadJournal } from "../../storage/journal";
import type { JournalEvent } from "../../storage/types";
import { readRunMetadata } from "../../storage/runFiles";
import type { HookHandlerArgs } from "../types";
import {
  appendStopHookEvent,
  markSessionInactive,
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

interface MissingSessionRecoveryResult {
  status: "none" | "recovered" | "ambiguous" | "error";
  sessionId: string;
  filePath: string;
  message?: string;
}

interface MissingSessionRunCandidate {
  runId: string;
  runDir: string;
  runState: string;
  prompt: string;
}

interface StopHookBackoffResult {
  effectId?: string;
  fireCount?: number;
  delaySeconds?: number;
  interrupted?: boolean;
}

const DEFAULT_BACKOFF_BASE_SECONDS = 10;
const DEFAULT_BACKOFF_CAP_SECONDS = 300;
const MAX_BACKOFF_POLL_SECONDS = 1;

function parsePositiveNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function computeBackoffDelaySeconds(fireCount: number): number {
  const base = parsePositiveNumberEnv(
    "BABYSITTER_HOOK_BACKOFF_BASE",
    DEFAULT_BACKOFF_BASE_SECONDS,
  );
  const cap = parsePositiveNumberEnv(
    "BABYSITTER_HOOK_BACKOFF_CAP",
    DEFAULT_BACKOFF_CAP_SECONDS,
  );
  const delay = base * (3 ** Math.max(0, fireCount));
  return Math.min(delay, cap);
}

function countPriorStopHookFires(events: JournalEvent[], effectId: string): number {
  let latestRequestIndex = -1;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    const data = event.data as Record<string, unknown> | undefined;
    if (event.type === "EFFECT_REQUESTED" && data?.effectId === effectId) {
      latestRequestIndex = index;
      break;
    }
  }
  if (latestRequestIndex < 0) return 0;

  let count = 0;
  for (let index = latestRequestIndex + 1; index < events.length; index += 1) {
    const event = events[index];
    const data = event.data as Record<string, unknown> | undefined;
    if (
      (event.type === "EFFECT_RESOLVED" || event.type === "EFFECT_CANCELLED")
      && data?.effectId === effectId
    ) {
      return 0;
    }
    if (event.type === "STOP_HOOK_INVOKED" && data?.effectId === effectId) {
      count += 1;
    }
  }
  return count;
}

function isEffectStillPending(events: JournalEvent[], effectId: string): boolean {
  let pending = false;
  for (const event of events) {
    const data = event.data as Record<string, unknown> | undefined;
    if (event.type === "RUN_COMPLETED" || event.type === "RUN_HALTED" || event.type === "RUN_FAILED") {
      pending = false;
    }
    if (event.type === "EFFECT_REQUESTED" && data?.effectId === effectId) {
      pending = true;
    }
    if (
      (event.type === "EFFECT_RESOLVED" || event.type === "EFFECT_CANCELLED")
      && data?.effectId === effectId
    ) {
      pending = false;
    }
  }
  return pending;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function applyStopHookBackoff(args: {
  runDir: string;
  effectId?: string;
  runState: string;
  log: HookLogger;
}): Promise<StopHookBackoffResult> {
  if (args.runState !== "waiting" || !args.effectId) {
    return {};
  }

  let events: JournalEvent[];
  try {
    events = await loadJournal(args.runDir);
  } catch {
    return { effectId: args.effectId };
  }

  const lastLifecycleEventType = findLastLifecycleEventType(events);
  if (lastLifecycleEventType === "RUN_COMPLETED" || lastLifecycleEventType === "RUN_HALTED" || lastLifecycleEventType === "RUN_FAILED") {
    return {};
  }

  const fireCount = countPriorStopHookFires(events, args.effectId);
  const plannedDelaySeconds = computeBackoffDelaySeconds(fireCount);
  const startedAt = Date.now();
  let interrupted = false;

  while ((Date.now() - startedAt) / 1000 < plannedDelaySeconds) {
    const remainingMs = plannedDelaySeconds * 1000 - (Date.now() - startedAt);
    const pollSeconds = Math.min(MAX_BACKOFF_POLL_SECONDS, Math.max(0.001, plannedDelaySeconds / 10));
    await sleep(Math.min(pollSeconds * 1000, Math.max(0, remainingMs)));
    try {
      const latestEvents = await loadJournal(args.runDir);
      if (!isEffectStillPending(latestEvents, args.effectId)) {
        interrupted = true;
        break;
      }
    } catch {
      break;
    }
  }

  const actualDelaySeconds = Math.min(
    plannedDelaySeconds,
    Math.max(0, (Date.now() - startedAt) / 1000),
  );
  args.log.info(
    `Stop-hook backoff applied for effect ${args.effectId}: planned=${plannedDelaySeconds}s actual=${actualDelaySeconds}s count=${fireCount}`,
  );
  return {
    effectId: args.effectId,
    fireCount,
    delaySeconds: interrupted ? actualDelaySeconds : plannedDelaySeconds,
    interrupted,
  };
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

async function findMissingSessionRunCandidates(
  args: {
    sessionId: string;
    runsDir: string;
    harness: string;
  },
): Promise<MissingSessionRunCandidate[]> {
  const roots = getReadableRunsDirs({ override: args.runsDir });
  const candidates: MissingSessionRunCandidate[] = [];

  for (const root of roots) {
    let entries: Array<{ name: string; isDirectory(): boolean }>;
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const runDir = path.join(root, entry.name);
      let metadata: Awaited<ReturnType<typeof readRunMetadata>>;
      try {
        metadata = await readRunMetadata(runDir);
      } catch {
        continue;
      }

      let journal;
      try {
        journal = await loadJournal(runDir);
      } catch {
        continue;
      }

      const matchesSession = journal.some((event) => {
        const data = event.data as Record<string, unknown> | undefined;
        const eventSessionId = typeof data?.sessionId === "string" ? data.sessionId : "";
        if (eventSessionId !== args.sessionId) return false;
        const eventHarness = typeof data?.harness === "string" ? data.harness : "";
        return !eventHarness || eventHarness === args.harness;
      });
      if (!matchesSession) continue;

      const runState = deriveObservedRunState(journal, countPendingEffectsFromJournal(journal));
      if (isTerminalRunState(runState)) continue;

      candidates.push({
        runId: metadata.runId || entry.name,
        runDir,
        runState,
        prompt: typeof metadata.prompt === "string" ? metadata.prompt : "",
      });
    }
  }

  return candidates;
}

async function recoverMissingSessionFile(
  args: {
    sessionId: string;
    stateDir: string;
    runsDir: string;
    harness: string;
    log: HookLogger;
  },
): Promise<MissingSessionRecoveryResult> {
  const filePath = getSessionFilePath(args.stateDir, args.sessionId);
  const candidates = await findMissingSessionRunCandidates({
    sessionId: args.sessionId,
    runsDir: args.runsDir,
    harness: args.harness,
  });

  if (candidates.length === 0) {
    return { status: "none", sessionId: args.sessionId, filePath };
  }

  if (candidates.length > 1) {
    const runIds = candidates.map((candidate) => candidate.runId).join(", ");
    return {
      status: "ambiguous",
      sessionId: args.sessionId,
      filePath,
      message: `Multiple active runs found for missing session ${args.sessionId}: ${runIds}`,
    };
  }

  const candidate = candidates[0];
  const nowTs = getCurrentTimestamp();
  const recoveredState: SessionState = {
    active: true,
    iteration: 1,
    maxIterations: DEFAULTS.maxIterations,
    runId: candidate.runId,
    runDir: candidate.runDir,
    runIds: [candidate.runId],
    startedAt: nowTs,
    lastIterationAt: nowTs,
    iterationTimes: [],
    metadata: {
      recoveredFromMissingSessionFile: "true",
      missingSessionRecoveredAt: nowTs,
      missingSessionRecoverySource: "stop-hook",
      missingSessionRecoveryRunState: candidate.runState,
    },
  };

  try {
    await writeSessionFile(filePath, recoveredState, candidate.prompt);
    args.log.info(`Recovered missing session state file for run ${candidate.runId}: ${filePath}`);
    return { status: "recovered", sessionId: args.sessionId, filePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      sessionId: args.sessionId,
      filePath,
      message: `Failed to recover missing session ${args.sessionId}: ${message}`,
    };
  }
}

async function recoverFirstMissingSession(
  args: {
    sessionIds: string[];
    stateDir: string;
    runsDir: string;
    harness: string;
    log: HookLogger;
  },
): Promise<MissingSessionRecoveryResult> {
  let firstNone: MissingSessionRecoveryResult | undefined;
  for (const sessionId of args.sessionIds) {
    const result = await recoverMissingSessionFile({
      sessionId,
      stateDir: args.stateDir,
      runsDir: args.runsDir,
      harness: args.harness,
      log: args.log,
    });
    if (result.status === "recovered" || result.status === "ambiguous" || result.status === "error") {
      return result;
    }
    firstNone ??= result;
  }
  return firstNone ?? {
    status: "none",
    sessionId: args.sessionIds[0] ?? "",
    filePath: "",
  };
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
  const runsDir = path.resolve(args.runsDir || resolveRunsDir());
  let activeSessionId = sessionId;
  let filePath = getSessionFilePath(stateDir, activeSessionId);
  log.info(`Checking session file at: ${filePath}`);
  // Load session state (with env fallback retry)
  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      // Retry with AGENT_SESSION_ID if the input session is stale
      const envSessionId = process.env.AGENT_SESSION_ID;
      if (envSessionId && envSessionId !== activeSessionId) {
        log.info(`Payload session ${activeSessionId} is stale; env session is ${envSessionId} — retrying lookup`);
        const retryPath = getSessionFilePath(stateDir, envSessionId);
        if (await sessionFileExists(retryPath)) {
          filePath = retryPath;
          activeSessionId = envSessionId;
          log.setContext("session", activeSessionId);
          log.info(`Found session file for env session: ${filePath}`);
        } else {
          const recovery = await recoverFirstMissingSession({
            sessionIds: [activeSessionId, envSessionId],
            stateDir,
            runsDir,
            harness: options.harness,
            log,
          });
          if (recovery.status === "recovered") {
            activeSessionId = recovery.sessionId;
            filePath = recovery.filePath;
            log.setContext("session", activeSessionId);
          } else if (recovery.status === "ambiguous" || recovery.status === "error") {
            const message = recovery.message ?? `Unable to recover missing session ${activeSessionId}`;
            log.error(message);
            process.stderr.write(`[hook:run stop] ${message}\n`);
            process.stdout.write("{}\n");
            return makeExit(log, 1, "missing_session_recovery_failed");
          } else {
            log.info(`No active loop found for session ${activeSessionId} or env session ${envSessionId} — allowing exit`);
            if (verbose) {
              process.stderr.write(`[hook:run stop] No active loop for session ${activeSessionId} or ${envSessionId}\n`);
            }
            process.stdout.write("{}\n");
            return makeExit(log, 0, "no_session_file");
          }
        }
      } else {
        const recovery = await recoverFirstMissingSession({
          sessionIds: [activeSessionId],
          stateDir,
          runsDir,
          harness: options.harness,
          log,
        });
        if (recovery.status === "recovered") {
          activeSessionId = recovery.sessionId;
          filePath = recovery.filePath;
          log.setContext("session", activeSessionId);
        } else if (recovery.status === "ambiguous" || recovery.status === "error") {
          const message = recovery.message ?? `Unable to recover missing session ${activeSessionId}`;
          log.error(message);
          process.stderr.write(`[hook:run stop] ${message}\n`);
          process.stdout.write("{}\n");
          return makeExit(log, 1, "missing_session_recovery_failed");
        } else {
          log.info(`No active loop found for session ${activeSessionId} — allowing exit`);
          if (verbose) {
            process.stderr.write(`[hook:run stop] No active loop for session ${activeSessionId}\n`);
          }
          process.stdout.write("{}\n");
          return makeExit(log, 0, "no_session_file");
        }
      }
    }
    sessionFile = await readSessionFile(filePath);
  } catch {
    log.warn(`Session file read error at ${filePath} — allowing exit`);
    process.stdout.write("{}\n");
    return makeExit(log, 0, "session_read_error");
  }
  const { state } = sessionFile;
  const prompt = sessionFile.prompt ?? "";
  if (!state.active) {
    log.info("Session is inactive — allowing exit");
    process.stdout.write("{}\n");
    return makeExit(log, 0, "session_inactive", { sessionId: activeSessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }
  // Check max iterations
  if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
    if (verbose) {
      process.stderr.write(`[hook:run stop] Max iterations (${state.maxIterations}) reached\n`);
    }
    const runId = state.runId ?? "";
    if (runId) {
      const eventDir = state.runDir?.trim() || path.join(runsDir, runId);
      await appendStopHookEvent(eventDir, {
        sessionId: activeSessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "max_iterations_reached",
        runState: "",
        pendingKinds: "",
        hasPromise: false,
      }, options.harness);
    }
    await markSessionInactive(filePath, state, prompt, "max_iterations_reached");
    process.stdout.write("{}\n");
    return makeExit(log, 0, "max_iterations_reached", { sessionId: activeSessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }
  // Check iteration speed
  const now = getCurrentTimestamp();
  const updatedTimes =
    state.iteration >= 5
      ? updateIterationTimes(state.iterationTimes, state.lastIterationAt, now)
      : state.iterationTimes;

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
      process.stderr.write(`[hook:run stop] No run for session ${activeSessionId}\n`);
    }
    await markSessionInactive(filePath, state, prompt, "no_run_id");
    process.stdout.write("{}\n");
    return makeExit(log, 0, "no_run_id", { sessionId: activeSessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }

  // Resolve run state
  let runStateDetails: StopHookRunStateDetails | undefined;
  let runStateSummary: HookRunStateSummary | undefined;
  let runState = "";
  let completionProof = "";
  let pendingKinds = "";
  let onlyBreakpointsPending = false;
  let currentPendingEffectId: string | undefined;

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
    currentPendingEffectId = runStateDetails.currentPendingEffectId;
  } else {
    runStateSummary = await resolveHookRunState({ runId, runsDir, log });
    runState = runStateSummary.runState;
    completionProof = runStateSummary.completionProof;
    pendingKinds = runStateSummary.pendingKinds;
    onlyBreakpointsPending = runStateSummary.onlyBreakpointsPending;
    currentPendingEffectId = runStateSummary.currentPendingEffectId;
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
      sessionId: activeSessionId,
      iteration: state.iteration,
      decision: "approve",
      reason: "run_state_unknown",
      runState,
      pendingKinds,
      hasPromise,
    }, options.harness);
    process.stdout.write("{}\n");
    return makeExit(log, options.useDetailedRunState ? 1 : 0, "run_state_unknown", { sessionId: activeSessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }

  if (runState === "waiting" && onlyBreakpointsPending) {
    log.info(`Run waiting on breakpoints only (${pendingKinds}) — allowing exit`);
    if (verbose) {
      process.stderr.write("[hook:run stop] Run waiting on breakpoint(s) — allowing exit\n");
    }
    await appendStopHookEvent(runEventDir, {
      sessionId: activeSessionId,
      iteration: state.iteration,
      decision: "approve",
      reason: "breakpoint_waiting",
      runState,
      pendingKinds,
      hasPromise,
    }, options.harness);
    process.stdout.write("{}\n");
    return makeExit(log, 0, "breakpoint_waiting", { sessionId: activeSessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
  }

  if (hasPromise && completionProof && promiseValue === completionProof) {
    log.info("Promise matches completion proof — allowing exit");
    if (verbose) {
      process.stderr.write("[hook:run stop] Valid promise tag detected - run complete\n");
    }
    await appendStopHookEvent(runEventDir, {
      sessionId: activeSessionId,
      iteration: state.iteration,
      decision: "approve",
      reason: "completion_proof_matched",
      runState,
      pendingKinds,
      hasPromise,
    }, options.harness);
    await markSessionInactive(filePath, state, prompt, "completion_proof_matched");
    process.stdout.write("{}\n");
    return makeExit(log, 0, "completion_proof_matched", { sessionId: activeSessionId, filePath, state, prompt, resolvedPluginRoot, runsDir });
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

  const backoff = await applyStopHookBackoff({
    runDir: runEventDir,
    effectId: currentPendingEffectId,
    runState,
    log,
  });

  await appendStopHookEvent(runEventDir, {
    sessionId: activeSessionId,
    iteration: state.iteration,
    decision: "block",
    reason: "continue_loop",
    runState,
    pendingKinds,
    hasPromise,
    effectId: backoff.effectId,
    hookBackoffFireCount: backoff.fireCount,
    hookBackoffDelaySeconds: backoff.delaySeconds,
    hookBackoffInterrupted: backoff.interrupted,
  }, options.harness);

  return { shouldContinue: true, exitCode: 0, sessionId: activeSessionId, filePath, state: updatedState,
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


