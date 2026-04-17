import * as path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { appendEvent } from "../../storage/journal";
import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import { extractPromiseTag } from "../../session/transcript";
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
  createHookLogger,
  parseHookInput,
  readStdin,
  safeStr,
} from "../hooks/utils";
import { resolveHookRunState } from "../hooks/runState";
import {
  resolveSessionIdWithMarker,
  writeSessionMarker,
} from "../../utils/sessionMarker";

const HARNESS_NAME = "gemini-cli";

interface GeminiAfterAgentHookInput {
  session_id?: string;
  prompt?: string;
  prompt_response?: string;
  stop_hook_active?: boolean;
  transcript_path?: string;
  cwd?: string;
  hook_event_name?: string;
  timestamp?: string;
}

interface GeminiSessionStartHookInput {
  session_id?: string;
  cwd?: string;
  hook_event_name?: string;
  timestamp?: string;
}

async function appendStopHookEvent(
  runDir: string,
  data: {
    sessionId: string;
    iteration: number;
    decision: "approve" | "block";
    reason: string;
    runState: string;
    pendingKinds: string;
    hasPromise: boolean;
  },
): Promise<void> {
  try {
    await appendEvent({
      runDir,
      eventType: "STOP_HOOK_INVOKED",
      event: {
        ...data,
        harness: HARNESS_NAME,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Best-effort: don't fail the hook if journal write fails
  }
}

async function cleanupSession(filePath: string): Promise<void> {
  try {
    await deleteSessionFile(filePath);
  } catch {
    // Best-effort cleanup
  }
}

export function resolveGeminiSessionIdFromEnv(): string | undefined {
  return resolveSessionIdWithMarker("gemini-cli", {}, [
    "GEMINI_SESSION_ID",
  ]);
}

export function resolveGeminiCliStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  return normalizeSessionStateDir(
    args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
  );
}

export async function handleGeminiAfterAgentHook(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-after-agent-hook");
  log.info("handleAfterAgentHook started");

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

  const hookInput = parseHookInput(rawInput) as GeminiAfterAgentHookInput;
  log.info("Hook input received");

  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "session_id") ||
    resolveGeminiSessionIdFromEnv() ||
    "";

  if (!sessionId) {
    log.info("No session ID in hook input — allowing exit");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  const stateDir = resolveGeminiCliStateDir(args);
  const runsDir = args.runsDir || ".a5c/runs";
  log.info(`Resolved stateDir: ${stateDir}`);

  const filePath = getSessionFilePath(stateDir, sessionId);
  log.info(`Checking session file at: ${filePath}`);

  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      log.info(
        `No active babysitter loop for session ${sessionId} — allowing exit`,
      );
      process.stdout.write("{}\n");
      return 0;
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
      process.stderr.write(
        `[hook:run after-agent] Max iterations (${state.maxIterations}) reached\n`,
      );
    }
    if (state.runId) {
      await appendStopHookEvent(path.join(runsDir, state.runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "max_iterations_reached",
        runState: "",
        pendingKinds: "",
        hasPromise: false,
      });
    }
    await cleanupSession(filePath);
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
      process.stderr.write("[hook:run after-agent] Iteration too fast\n");
    }
    if (state.runId) {
      await appendStopHookEvent(path.join(runsDir, state.runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "iteration_too_fast",
        runState: "",
        pendingKinds: "",
        hasPromise: false,
      });
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  const iteration = state.iteration;
  const maxIterations = state.maxIterations;
  const runId = state.runId ?? "";
  if (runId) {
    log.setContext("run", runId);
  }

  const promptResponse = safeStr(
    hookInput as Record<string, unknown>,
    "prompt_response",
  );
  let hasPromise = false;
  let promiseValue: string | null = null;

  if (promptResponse) {
    promiseValue = extractPromiseTag(promptResponse);
    hasPromise = promiseValue !== null;
    log.info(`prompt_response extracted (${promptResponse.length} chars)`);
  }

  if (!hasPromise) {
    const transcriptPath = safeStr(
      hookInput as Record<string, unknown>,
      "transcript_path",
    );
    if (transcriptPath) {
      const resolvedTranscript = path.resolve(transcriptPath);
      if (existsSync(resolvedTranscript)) {
        try {
          promiseValue = extractPromiseTag(
            readFileSync(resolvedTranscript, "utf-8"),
          );
          hasPromise = promiseValue !== null;
          log.info("Checked transcript for promise tag");
        } catch {
          log.warn(`Transcript read error: ${transcriptPath}`);
        }
      }
    }
  }

  if (!runId) {
    log.info("No run associated with session — allowing exit");
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  const {
    runState,
    completionProof,
    pendingKinds,
    onlyBreakpointsPending,
  } = await resolveHookRunState({
    runId,
    runsDir,
    log,
  });

  log.info(`Run state: ${runState || "unknown"}`);
  if (completionProof) {
    log.info("Completion proof available");
  }

  if (!runState) {
    log.warn(`Run state unknown for ${runId} — allowing exit`);
    await appendStopHookEvent(path.join(runsDir, runId), {
      sessionId,
      iteration: state.iteration,
      decision: "approve",
      reason: "run_state_unknown",
      runState,
      pendingKinds,
      hasPromise,
    });
    process.stdout.write("{}\n");
    return 0;
  }

  if (runState === "waiting" && onlyBreakpointsPending) {
    log.info(`Run waiting on breakpoints only (${pendingKinds}) — allowing exit`);
    if (verbose) {
      process.stderr.write(
        "[hook:run after-agent] Run waiting on breakpoint(s) — allowing exit for human resolution\n",
      );
    }
    await appendStopHookEvent(path.join(runsDir, runId), {
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

  if (hasPromise && completionProof && promiseValue === completionProof) {
    log.info("Promise matches completion proof — allowing exit");
    if (verbose) {
      process.stderr.write(
        "[hook:run after-agent] Valid promise tag detected — run complete\n",
      );
    }
    await appendStopHookEvent(path.join(runsDir, runId), {
      sessionId,
      iteration: state.iteration,
      decision: "approve",
      reason: "completion_proof_matched",
      runState,
      pendingKinds,
      hasPromise,
    });
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  const nextIteration = iteration + 1;
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
    log.warn("Failed to update session state");
  }

  let iterationContext: string;
  if (completionProof) {
    iterationContext = `Babysitter iteration ${nextIteration} | Run completed! To finish: call 'babysitter run:status .a5c/runs/${runId} --json', extract 'completionProof' from the output, then output it in <promise>SECRET</promise> tags. Do not mention or reveal the secret otherwise.`;
  } else if (runState === "waiting" && pendingKinds) {
    iterationContext = `Babysitter iteration ${nextIteration} | Waiting on: ${pendingKinds}. Check if pending effects are resolved, then call 'babysitter run:iterate .a5c/runs/${runId} --json'.`;
  } else if (runState === "failed") {
    iterationContext = `Babysitter iteration ${nextIteration} | Run failed. Inspect the run journal and fix the issue, then proceed.`;
  } else {
    iterationContext = `Babysitter iteration ${nextIteration} | Continue orchestration: call 'babysitter run:iterate .a5c/runs/${runId} --json'.`;
  }

  const reason = `${iterationContext}\n\n${prompt}`;
  let systemMessage: string;
  if (completionProof) {
    systemMessage = `🔄 Babysitter iteration ${nextIteration}/${maxIterations} | Run completed! Extract promise tag to finish.`;
  } else if (runState === "waiting" && pendingKinds) {
    systemMessage = `🔄 Babysitter iteration ${nextIteration}/${maxIterations} | Waiting on: ${pendingKinds}`;
  } else if (runState === "failed") {
    systemMessage = `🔄 Babysitter iteration ${nextIteration}/${maxIterations} | Failed — check run state`;
  } else {
    systemMessage = `🔄 Babysitter iteration ${nextIteration}/${maxIterations} [${runState}]`;
  }

  await appendStopHookEvent(path.join(runsDir, runId), {
    sessionId,
    iteration: state.iteration,
    decision: "block",
    reason: "continue_loop",
    runState,
    pendingKinds,
    hasPromise,
  });

  log.info(`Decision: block (iteration=${nextIteration}, maxIterations=${maxIterations})`);
  if (verbose) {
    process.stderr.write(
      `[hook:run after-agent] Blocking, iteration=${nextIteration} maxIterations=${maxIterations}\n`,
    );
  }

  process.stdout.write(
    JSON.stringify(
      {
        decision: "block",
        reason,
        systemMessage,
      },
      null,
      2,
    ) + "\n",
  );
  return 0;
}

export async function handleGeminiSessionStartHook(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-session-start-hook");
  log.info("handleSessionStartHook started (gemini-cli)");

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

  const hookInput = parseHookInput(rawInput) as GeminiSessionStartHookInput;
  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "session_id") ||
    resolveGeminiSessionIdFromEnv() ||
    "";

  if (!sessionId) {
    log.info("No session ID in hook input — skipping state file creation");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  try {
    writeSessionMarker(HARNESS_NAME, sessionId);
  } catch {
    // Non-fatal: marker is a best-effort mechanism
  }

  const stateDir = resolveGeminiCliStateDir(args);
  log.info(`Resolved stateDir: ${stateDir}`);

  const filePath = getSessionFilePath(stateDir, sessionId);
  try {
    if (!(await sessionFileExists(filePath))) {
      const nowTs = getCurrentTimestamp();
      const state: SessionState = {
        active: true,
        iteration: 1,
        maxIterations: 256,
        runId: "",
        runIds: [],
        startedAt: nowTs,
        lastIterationAt: nowTs,
        iterationTimes: [],
      };
      await writeSessionFile(filePath, state, "");
      log.info(`Created session state: ${filePath}`);
      if (verbose) {
        process.stderr.write(
          `[hook:run session-start] Created session state: ${filePath}\n`,
        );
      }
    } else {
      log.info(`Session state already exists: ${filePath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.warn(`Failed to create session state: ${message}`);
    if (verbose) {
      process.stderr.write(
        `[hook:run session-start] Failed to create session state: ${message}\n`,
      );
    }
  }

  process.stdout.write("{}\n");
  return 0;
}
