import * as path from "node:path";
import { existsSync } from "node:fs";
import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import type { SessionState } from "../../session/types";
import {
  deleteSessionFile,
  getCurrentTimestamp,
  isIterationTooFast,
  updateIterationTimes,
  writeSessionFile,
} from "../../session/write";
import { normalizeSessionStateDir } from "../../config";
import type { HookHandlerArgs } from "../types";
import {
  appendStopHookEvent,
  cleanupSession,
  createHookLogger,
  parseHookInput,
  readStdin,
  resolveCurrentSessionIdFromEnv,
  safeStr,
  type ClaudeCodeStopHookInput,
} from "./shared";
import {
  buildStopHookContinuation,
  parseAssistantStopState,
  resolveStopHookRunState,
} from "./stopHookState";
import { collapseDoubledA5cRuns } from "../../cli/resolveInputPath";

export async function handleClaudeCodeStopHook(args: HookHandlerArgs): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-stop-hook");
  log.info("handleHookRunStop started");

  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.warn(`stdin read error: ${msg}`);
    if (verbose) {
      process.stderr.write(`[hook:run stop] stdin read error: ${msg}\n`);
    }
    process.stdout.write("{}\n");
    return 0;
  }

  const hookInput = parseHookInput(rawInput) as ClaudeCodeStopHookInput;
  log.info("Hook input received");

  let sessionId = safeStr(hookInput as Record<string, unknown>, "session_id");
  if (!sessionId) {
    log.info("No session ID in hook input — allowing exit");
    if (verbose) {
      process.stderr.write("[hook:run stop] No session ID in hook input\n");
    }
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  const pluginRoot = args.pluginRoot || process.env.CLAUDE_PLUGIN_ROOT || "";
  const resolvedPluginRoot = pluginRoot ? path.resolve(pluginRoot) : "";
  const stateDir = normalizeSessionStateDir(
    args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
  );
  if (!stateDir) {
    log.warn("Cannot determine state directory — allowing exit");
    if (verbose) {
      process.stderr.write("[hook:run stop] Cannot determine state directory\n");
    }
    process.stdout.write("{}\n");
    return 0;
  }

  const runsDir = collapseDoubledA5cRuns(path.resolve(args.runsDir || ".a5c/runs"));
  let filePath = getSessionFilePath(stateDir, sessionId);
  log.info(`Checking session file at: ${filePath}`);

  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      const envSessionId = resolveCurrentSessionIdFromEnv();
      if (envSessionId && envSessionId !== sessionId) {
        log.info(`Payload session ${sessionId} is stale; current env session is ${envSessionId} — retrying lookup`);
        const retryPath = getSessionFilePath(stateDir, envSessionId);
        if (await sessionFileExists(retryPath)) {
          filePath = retryPath;
          sessionId = envSessionId;
          log.setContext("session", sessionId);
          log.info(`Found session file for env session: ${filePath}`);
        } else {
          log.info(`No active loop found for payload session ${sessionId} or env session ${envSessionId} — allowing exit`);
          if (verbose) {
            process.stderr.write(
              `[hook:run stop] No active loop found for session ${sessionId} or ${envSessionId}\n`,
            );
          }
          process.stdout.write("{}\n");
          return 0;
        }
      } else {
        log.info(`No active loop found for session ${sessionId} — allowing exit`);
        if (verbose) {
          process.stderr.write(`[hook:run stop] No active loop found for session ${sessionId}\n`);
        }
        process.stdout.write("{}\n");
        return 0;
      }
    }
    sessionFile = await readSessionFile(filePath);
  } catch {
    log.warn(`Session file read error at ${filePath} — allowing exit`);
    process.stdout.write("{}\n");
    return 0;
  }

  const { state } = sessionFile;
  const prompt = sessionFile.prompt ?? "";

  if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
    if (verbose) {
      process.stderr.write(`[hook:run stop] Max iterations (${state.maxIterations}) reached\n`);
    }
    if (state.runId) {
      await appendStopHookEvent(state.runDir?.trim() || path.join(runsDir, state.runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "max_iterations_reached",
        runState: "",
        pendingKinds: "",
        hasPromise: false,
      });
    }
    await cleanupSession(filePath, deleteSessionFile);
    process.stdout.write("{}\n");
    return 0;
  }

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
    if (state.runId) {
      await appendStopHookEvent(state.runDir?.trim() || path.join(runsDir, state.runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "iteration_too_fast",
        runState: "",
        pendingKinds: "",
        hasPromise: false,
      });
    }
    await cleanupSession(filePath, deleteSessionFile);
    process.stdout.write("{}\n");
    return 0;
  }

  const runId = state.runId ?? "";
  const boundRunDir = state.runDir?.trim() || undefined;
  if (runId) {
    log.setContext("run", runId);
  }

  const { hasPromise, promiseValue } = parseAssistantStopState(
    hookInput as Record<string, unknown>,
    log,
  );

  if (!runId) {
    log.info("No run associated with session — allowing exit");
    if (verbose) {
      process.stderr.write(
        `[hook:run stop] No run associated with session ${sessionId} — allowing exit\n`,
      );
    }
    await cleanupSession(filePath, deleteSessionFile);
    process.stdout.write("{}\n");
    return 0;
  }

  const runStateDetails = await resolveStopHookRunState({
    runId,
    runsDir,
    preferredRunDir: boundRunDir,
    log,
  });
  const {
    runState,
    completionProof,
    pendingKinds,
    onlyBreakpointsPending,
    entrypointImportPath,
    runDir,
    lookupError,
  } = runStateDetails;
  const runEventDir = runDir || boundRunDir || path.join(runsDir, runId);

  log.info(`Run state: ${runState || "unknown"}`);
  if (completionProof) {
    log.info("Completion proof available");
  }

  if (!runState) {
    const errorMessage =
      lookupError ??
      `Run ${runId} could not be resolved during the stop hook. Stored runDir=${boundRunDir ?? "(none)"} runsDir=${runsDir}`;
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
    });
    process.stdout.write("{}\n");
    return 1;
  }

  if (runState === "waiting" && onlyBreakpointsPending) {
    log.info(`Run waiting on breakpoints only (${pendingKinds}) — allowing exit`);
    if (verbose) {
      process.stderr.write(
        "[hook:run stop] Run waiting on breakpoint(s) — allowing exit for human resolution\n",
      );
    }
    await appendStopHookEvent(runEventDir, {
      sessionId,
      iteration: state.iteration,
      decision: "approve",
      reason: "breakpoint_waiting",
      runState,
      pendingKinds,
      hasPromise,
    });
    process.stdout.write("{}\n");
    return 0;
  }

  if (hasPromise) {
    log.info("Detected valid promise tag");
  }
  if (completionProof && hasPromise && promiseValue === completionProof) {
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
    });
    await cleanupSession(filePath, deleteSessionFile);
    process.stdout.write("{}\n");
    return 0;
  }

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

  const { reason, systemMessage } = await buildStopHookContinuation({
    nextIteration,
    maxIterations: state.maxIterations,
    runState,
    pendingKinds,
    completionProof,
    prompt,
    resolvedPluginRoot,
    runId,
    runsDir: path.dirname(runDir),
    entrypointImportPath,
  });

  const output = { decision: "block", reason, systemMessage };
  await appendStopHookEvent(runEventDir, {
    sessionId,
    iteration: state.iteration,
    decision: "block",
    reason: "continue_loop",
    runState,
    pendingKinds,
    hasPromise,
  });

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
  log.info(`Decision: block (iteration=${nextIteration}, maxIterations=${state.maxIterations})`);
  if (verbose) {
    process.stderr.write(
      `[hook:run stop] Blocking stop, iteration=${nextIteration} maxIterations=${state.maxIterations}\n`,
    );
  }

  if (!existsSync(runDir)) {
    log.warn(`Resolved run directory missing during stop hook: ${runDir}`);
  }

  return 0;
}
