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
import { normalizeSessionStateDir } from "../../config";
import type { HookHandlerArgs } from "../types";
import {
  appendStopHookEvent,
  buildFollowupMessage,
  cleanupSession,
  createHookLogger,
  initializeSessionState,
  parseHookInput,
  readStdin,
  safeStr,
} from "../hooks/utils";
import { resolveHookRunState } from "../hooks/runState";
import { writeSessionMarker } from "../../utils/sessionMarker";

interface CursorStopHookInput {
  conversation_id?: string;
  project_dir?: string;
  last_response?: string;
  hook_event_name?: string;
  timestamp?: string;
}

interface CursorSessionStartHookInput {
  conversation_id?: string;
  project_dir?: string;
  hook_event_name?: string;
  timestamp?: string;
}

const HARNESS_NAME = "cursor";

export function resolveCursorStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  return normalizeSessionStateDir(
    args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
  );
}

export async function handleCursorStopHook(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-stop-hook");
  log.info("handleStopHook started (cursor)");

  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.warn(`stdin read error: ${message}`);
    process.stdout.write("{}\n");
    return 0;
  } finally {
    if (typeof process.stdin.unref === "function") {
      process.stdin.unref();
    }
  }

  const hookInput = parseHookInput(rawInput) as CursorStopHookInput;
  log.info("Hook input received");

  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "conversation_id") ||
    process.env.AGENT_SESSION_ID ||
    "";

  if (!sessionId) {
    log.info("No conversation_id in hook input — allowing exit");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  const stateDir = resolveCursorStateDir(args);
  const runsDir = args.runsDir || ".a5c/runs";
  const filePath = getSessionFilePath(stateDir, sessionId);

  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      process.stdout.write("{}\n");
      return 0;
    }
    sessionFile = await readSessionFile(filePath);
  } catch {
    process.stdout.write("{}\n");
    return 0;
  }

  const { state } = sessionFile;
  const prompt = sessionFile.prompt ?? "";

  if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
    if (state.runId) {
      await appendStopHookEvent(path.join(runsDir, state.runId), {
        sessionId, iteration: state.iteration, decision: "approve",
        reason: "max_iterations_reached", runState: "", pendingKinds: "", hasPromise: false,
      });
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  const now = getCurrentTimestamp();
  const updatedTimes = state.iteration >= 5
    ? updateIterationTimes(state.iterationTimes, state.lastIterationAt, now)
    : state.iterationTimes;

  if (isIterationTooFast(updatedTimes)) {
    if (state.runId) {
      await appendStopHookEvent(path.join(runsDir, state.runId), {
        sessionId, iteration: state.iteration, decision: "approve",
        reason: "iteration_too_fast", runState: "", pendingKinds: "", hasPromise: false,
      });
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  const iteration = state.iteration;
  const maxIterations = state.maxIterations;
  const runId = state.runId ?? "";
  if (runId) log.setContext("run", runId);

  const lastResponse = safeStr(hookInput as Record<string, unknown>, "last_response");
  let hasPromise = false;
  let promiseValue: string | null = null;
  if (lastResponse) {
    promiseValue = extractPromiseTag(lastResponse);
    hasPromise = promiseValue !== null;
  }

  if (!runId) {
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  const { runState, completionProof, pendingKinds, onlyBreakpointsPending } =
    await resolveHookRunState({ runId, runsDir, log });

  if (!runState) {
    await appendStopHookEvent(path.join(runsDir, runId), {
      sessionId, iteration: state.iteration, decision: "approve",
      reason: "run_state_unknown", runState, pendingKinds, hasPromise,
    });
    process.stdout.write("{}\n");
    return 0;
  }

  if (runState === "waiting" && onlyBreakpointsPending) {
    await appendStopHookEvent(path.join(runsDir, runId), {
      sessionId, iteration: state.iteration, decision: "approve",
      reason: "breakpoint_waiting", runState, pendingKinds, hasPromise,
    });
    process.stdout.write("{}\n");
    return 0;
  }

  if (hasPromise && completionProof && promiseValue === completionProof) {
    await appendStopHookEvent(path.join(runsDir, runId), {
      sessionId, iteration: state.iteration, decision: "approve",
      reason: "completion_proof_matched", runState, pendingKinds, hasPromise,
    });
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  const nextIteration = iteration + 1;
  const currentTime = getCurrentTimestamp();
  const updatedState: SessionState = {
    ...state, iteration: nextIteration,
    lastIterationAt: currentTime, iterationTimes: updatedTimes,
  };

  try { await writeSessionFile(filePath, updatedState, prompt); } catch { /* ignore */ }

  const followupMessage = buildFollowupMessage(nextIteration, runId, completionProof, runState, pendingKinds, prompt);

  await appendStopHookEvent(path.join(runsDir, runId), {
    sessionId, iteration: state.iteration, decision: "block",
    reason: "continue_loop", runState, pendingKinds, hasPromise,
  });

  if (verbose) {
    process.stderr.write(
      `[hook:run stop] Continuing via followup_message, iteration=${nextIteration} maxIterations=${maxIterations}\n`,
    );
  }

  process.stdout.write(
    JSON.stringify({ followup_message: followupMessage }, null, 2) + "\n",
  );
  return 0;
}

export async function handleCursorSessionStartHook(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-session-start-hook");

  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch {
    process.stdout.write("{}\n");
    return 0;
  } finally {
    if (typeof process.stdin.unref === "function") {
      process.stdin.unref();
    }
  }

  const hookInput = parseHookInput(rawInput) as CursorSessionStartHookInput;
  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "conversation_id") ||
    process.env.AGENT_SESSION_ID ||
    "";

  if (!sessionId) {
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  try { writeSessionMarker(HARNESS_NAME, sessionId); } catch { /* Non-fatal */ }

  const stateDir = resolveCursorStateDir(args);
  await initializeSessionState(sessionId, stateDir, { verbose });

  process.stdout.write("{}\n");
  return 0;
}
