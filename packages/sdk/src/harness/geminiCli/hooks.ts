import * as path from "node:path";
import { existsSync, readFileSync } from "node:fs";
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
  appendStopHookEvent as appendStopHookEventShared,
  cleanupSession,
  createHookLogger,
  parseHookInput,
  readStdin,
  safeStr,
} from "../hooks/utils";
import { resolveHookRunState } from "../hooks/runState";
import { resolveSessionIdWithMarker } from "../../utils/sessionMarker";

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

function appendStopHookEvent(
  runDir: string,
  data: Parameters<typeof appendStopHookEventShared>[1],
): Promise<void> {
  return appendStopHookEventShared(runDir, data, HARNESS_NAME);
}

export function resolveGeminiSessionIdFromEnv(): string | undefined {
  return resolveSessionIdWithMarker("gemini-cli", {}, ["GEMINI_SESSION_ID"]);
}

export function resolveGeminiCliStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  return normalizeSessionStateDir(args.stateDir ?? process.env.BABYSITTER_STATE_DIR);
}

export async function handleGeminiAfterAgentHook(args: HookHandlerArgs): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-after-agent-hook");

  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.warn(`stdin read error: ${message}`);
    process.stdout.write("{}\n");
    return 0;
  } finally {
    if (typeof process.stdin.unref === "function") { process.stdin.unref(); }
  }

  const hookInput = parseHookInput(rawInput) as GeminiAfterAgentHookInput;
  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "session_id") ||
    resolveGeminiSessionIdFromEnv() || "";

  if (!sessionId) { process.stdout.write("{}\n"); return 0; }

  log.setContext("session", sessionId);
  const stateDir = resolveGeminiCliStateDir(args);
  const runsDir = args.runsDir || ".a5c/runs";
  const filePath = getSessionFilePath(stateDir, sessionId);

  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) { process.stdout.write("{}\n"); return 0; }
    sessionFile = await readSessionFile(filePath);
  } catch { process.stdout.write("{}\n"); return 0; }

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

  const promptResponse = safeStr(hookInput as Record<string, unknown>, "prompt_response");
  let hasPromise = false;
  let promiseValue: string | null = null;

  if (promptResponse) {
    promiseValue = extractPromiseTag(promptResponse);
    hasPromise = promiseValue !== null;
  }

  if (!hasPromise) {
    const transcriptPath = safeStr(hookInput as Record<string, unknown>, "transcript_path");
    if (transcriptPath) {
      const resolvedTranscript = path.resolve(transcriptPath);
      if (existsSync(resolvedTranscript)) {
        try {
          promiseValue = extractPromiseTag(readFileSync(resolvedTranscript, "utf-8"));
          hasPromise = promiseValue !== null;
        } catch { /* ignore */ }
      }
    }
  }

  if (!runId) { await cleanupSession(filePath); process.stdout.write("{}\n"); return 0; }

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
    ...state, iteration: nextIteration, lastIterationAt: currentTime, iterationTimes: updatedTimes,
  };

  try { await writeSessionFile(filePath, updatedState, prompt); } catch { /* ignore */ }

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
  const systemMessage = completionProof
    ? `Babysitter iteration ${nextIteration}/${maxIterations} | Run completed! Extract promise tag to finish.`
    : runState === "waiting" && pendingKinds
      ? `Babysitter iteration ${nextIteration}/${maxIterations} | Waiting on: ${pendingKinds}`
      : runState === "failed"
        ? `Babysitter iteration ${nextIteration}/${maxIterations} | Failed`
        : `Babysitter iteration ${nextIteration}/${maxIterations} [${runState}]`;

  await appendStopHookEvent(path.join(runsDir, runId), {
    sessionId, iteration: state.iteration, decision: "block",
    reason: "continue_loop", runState, pendingKinds, hasPromise,
  });

  if (verbose) {
    process.stderr.write(
      `[hook:run after-agent] Blocking, iteration=${nextIteration} maxIterations=${maxIterations}\n`,
    );
  }

  process.stdout.write(JSON.stringify({ decision: "block", reason, systemMessage }, null, 2) + "\n");
  return 0;
}

// Re-export the session-start hook from its extracted module
export { handleGeminiSessionStartHook } from "./sessionStartHook";
