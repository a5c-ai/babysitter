import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import type { SessionState } from "../../session/types";
import {
  getCurrentTimestamp,
  writeSessionFile,
} from "../../session/write";
import { normalizeSessionStateDir } from "../../config";
import type { HookHandlerArgs } from "../types";
import {
  cleanupSession,
  createHookLogger,
  initializeSessionState,
  parseHookInput,
  readStdin,
  safeStr,
} from "../hooks/utils";
import { resolveHookRunState } from "../hooks/runState";

export function resolveOpenCodeStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  return normalizeSessionStateDir(args.stateDir ?? process.env.BABYSITTER_STATE_DIR);
}

export function resolveOpenCodeSessionId(parsed: {
  sessionId?: string;
}): string | undefined {
  if (parsed.sessionId) {
    return parsed.sessionId;
  }
  if (process.env.AGENT_SESSION_ID) {
    return process.env.AGENT_SESSION_ID;
  }
  if (process.env.OPENCODE_SESSION_ID) {
    return process.env.OPENCODE_SESSION_ID;
  }
  return undefined;
}

export async function handleOpenCodeStopHook(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-opencode-stop-hook");
  log.info("handleStopHook started (opencode)");

  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch {
    rawInput = "";
  } finally {
    if (typeof process.stdin.unref === "function") {
      process.stdin.unref();
    }
  }

  const hookInput = parseHookInput(rawInput);
  const sessionId =
    safeStr(hookInput, "session_id") ||
    process.env.AGENT_SESSION_ID ||
    process.env.OPENCODE_SESSION_ID ||
    "";

  if (!sessionId) {
    log.info("No session ID — allowing exit");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  const stateDir = resolveOpenCodeStateDir(args);
  const runsDir = args.runsDir || ".a5c/runs";
  const filePath = getSessionFilePath(stateDir, sessionId);

  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      log.info("No active session — allowing exit");
      process.stdout.write("{}\n");
      return 0;
    }
    sessionFile = await readSessionFile(filePath);
  } catch {
    log.warn("Session file read error — allowing exit");
    process.stdout.write("{}\n");
    return 0;
  }

  const { state } = sessionFile;
  const runId = state.runId ?? "";

  if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
    if (verbose) {
      process.stderr.write(
        `[hook:run stop] Max iterations (${state.maxIterations}) reached\n`,
      );
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  if (!runId) {
    log.info("No run associated with session — allowing exit");
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("run", runId);

  const { runState, pendingKinds } = await resolveHookRunState({ runId, runsDir, log });

  log.info(`Run state: ${runState || "unknown"}`);
  if (runState === "completed" || runState === "failed" || !runState) {
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  const nextIteration = state.iteration + 1;
  const currentTime = getCurrentTimestamp();
  const updatedState: SessionState = {
    ...state,
    iteration: nextIteration,
    lastIterationAt: currentTime,
  };

  try {
    await writeSessionFile(filePath, updatedState, sessionFile.prompt ?? "");
  } catch {
    log.warn("Failed to update session state");
  }

  const output = {
    decision: "block",
    reason: pendingKinds
      ? `Babysitter iteration ${nextIteration} | Waiting on: ${pendingKinds}. Call 'babysitter run:iterate .a5c/runs/${runId} --json'.`
      : `Babysitter iteration ${nextIteration} | Continue orchestration: call 'babysitter run:iterate .a5c/runs/${runId} --json'.`,
  };

  log.info(`Decision: block (iteration=${nextIteration})`);
  if (verbose) {
    process.stderr.write(`[hook:run stop] Blocking, iteration=${nextIteration}\n`);
  }

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
  return 0;
}

export async function handleOpenCodeSessionStartHook(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-opencode-session-start-hook");
  log.info("handleSessionStartHook started (opencode)");

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

  const hookInput = parseHookInput(rawInput);
  const sessionId =
    safeStr(hookInput, "session_id") ||
    process.env.AGENT_SESSION_ID ||
    process.env.OPENCODE_SESSION_ID ||
    "";

  if (!sessionId) {
    log.info("No session ID — skipping state file creation");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  const stateDir = resolveOpenCodeStateDir(args);
  log.info(`Resolved stateDir: ${stateDir}`);

  await initializeSessionState(sessionId, stateDir, { verbose, log });

  process.stdout.write("{}\n");
  return 0;
}
