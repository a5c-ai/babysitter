/**
 * Gemini CLI harness adapter.
 *
 * Centralizes all Gemini CLI-specific behaviors:
 *   - Session ID resolution (GEMINI_SESSION_ID env var or hook stdin)
 *   - State directory conventions (.a5c/state/ by default)
 *   - Extension path resolution (GEMINI_EXTENSION_PATH or script-relative)
 *   - Session binding (run:create → state file with run association)
 *   - AfterAgent hook handler (deny/approve decision — equivalent to Stop hook)
 *   - SessionStart hook handler (baseline state file creation)
 *
 * Gemini CLI Hook Protocol:
 *   - Input:  JSON via stdin
 *   - Output: JSON via stdout (plain text MUST NOT appear on stdout)
 *   - Stderr: debug/log output only
 *   - Exit 0: success, stdout parsed as JSON
 *   - Exit 2: system block (stderr used as rejection reason)
 *
 * AfterAgent hook output:
 *   - `{}` or `{"decision":"allow"}` → allow session to exit normally
 *   - `{"decision":"block","reason":"...","systemMessage":"..."}` → continue loop
 *   - `{"decision":"deny","systemMessage":"..."}` → deny/retry (newer Gemini CLI)
 *
 * Gemini CLI environment variables available in hooks:
 *   - GEMINI_SESSION_ID  — unique ID for the current Gemini CLI session
 *   - GEMINI_PROJECT_DIR — absolute path to the project root
 *   - GEMINI_CWD         — current working directory
 */

import * as path from "node:path";
import { existsSync, mkdirSync, appendFileSync } from "node:fs";
import { loadJournal, appendEvent } from "../storage/journal";
import { readRunMetadata } from "../storage/runFiles";
import { buildEffectIndex } from "../runtime/replay/effectIndex";
import { resolveCompletionProof } from "../cli/completionProof";
import type { EffectRecord } from "../runtime/types";
import {
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
  deleteSessionFile,
  updateSessionState,
  getCurrentTimestamp,
  updateIterationTimes,
  isIterationTooFast,
} from "../session";
import type { SessionState } from "../session";
import { extractPromiseTag } from "../cli/commands/session";
import type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
  HarnessInstallOptions,
  HarnessInstallResult,
} from "./types";
import {
  copyGeminiExtension,
  getGeminiExtensionDir,
  installCliViaNpm,
  resolveRepoRoot,
} from "./installSupport";
import {
  BabysitterRuntimeError,
  ErrorCategory,
} from "../runtime/exceptions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HARNESS_NAME = "gemini-cli";

/** Default state directory for Gemini CLI sessions */
const DEFAULT_STATE_DIR = ".a5c/state";

// ---------------------------------------------------------------------------
// Structured file logger
// ---------------------------------------------------------------------------

interface HookLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  setContext(key: string, value: string): void;
}

function createHookLogger(hookName: string): HookLogger {
  const logDir = process.env.BABYSITTER_LOG_DIR || ".a5c/logs";
  const logFile = logDir ? path.join(logDir, `${hookName}.log`) : null;
  const context: Record<string, string> = {};

  if (logFile) {
    try {
      mkdirSync(logDir, { recursive: true });
    } catch {
      // Best-effort
    }
  }

  function write(level: string, message: string): void {
    if (!logFile) return;
    const ts = new Date().toISOString();
    const ctxParts = Object.entries(context).map(([k, v]) => `${k}=${v}`);
    const ctxStr = ctxParts.length > 0 ? ` [${ctxParts.join(" ")}]` : "";
    const line = `[${level}] ${ts}${ctxStr} ${message}\n`;
    try {
      appendFileSync(logFile, line);
    } catch {
      // Best-effort
    }
  }

  return {
    info: (msg: string) => write("INFO", msg),
    warn: (msg: string) => write("WARN", msg),
    error: (msg: string) => write("ERROR", msg),
    setContext: (key: string, value: string) => {
      context[key] = value;
    },
  };
}

// ---------------------------------------------------------------------------
// Journal event helper
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Stdin reader
// ---------------------------------------------------------------------------

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Hook input parsing
// ---------------------------------------------------------------------------

/**
 * Gemini CLI AfterAgent hook input.
 * Standard fields provided by Gemini CLI to AfterAgent hooks.
 */
interface GeminiAfterAgentHookInput {
  /** Unique session identifier */
  session_id?: string;
  /** The user's original prompt/request */
  prompt?: string;
  /** The final text response generated by the agent in this turn */
  prompt_response?: string;
  /** True if this hook is already running as part of a retry sequence */
  stop_hook_active?: boolean;
  /** Path to the full conversation transcript (if available) */
  transcript_path?: string;
  /** Current working directory */
  cwd?: string;
  /** Name of the hook event */
  hook_event_name?: string;
  /** ISO timestamp */
  timestamp?: string;
}

/**
 * Gemini CLI SessionStart hook input.
 */
interface GeminiSessionStartHookInput {
  session_id?: string;
  cwd?: string;
  hook_event_name?: string;
  timestamp?: string;
}

function parseHookInput(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Malformed JSON — treat as empty
  }
  return {};
}

function safeStr(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  return typeof val === "string" ? val : "";
}

// ---------------------------------------------------------------------------
// Pending-by-kind helper
// ---------------------------------------------------------------------------

function countPendingByKind(records: EffectRecord[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = record.kind ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)),
  );
}

// ---------------------------------------------------------------------------
// Cleanup helper
// ---------------------------------------------------------------------------

async function cleanupSession(filePath: string): Promise<void> {
  try {
    await deleteSessionFile(filePath);
  } catch {
    // Best-effort cleanup
  }
}

// ---------------------------------------------------------------------------
// State directory resolution
// ---------------------------------------------------------------------------

function resolveStateDirInternal(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  if (args.stateDir) return path.resolve(args.stateDir);
  if (args.pluginRoot) {
    return path.resolve(args.pluginRoot, "state");
  }
  // Check Gemini CLI extension path env var
  const extensionPath =
    process.env.GEMINI_EXTENSION_PATH ||
    process.env.BABYSITTER_EXTENSION_PATH;
  if (extensionPath) {
    return path.resolve(extensionPath, "state");
  }
  // Default: project-relative .a5c/state/
  return path.resolve(DEFAULT_STATE_DIR);
}

// ---------------------------------------------------------------------------
// AfterAgent (Stop) hook handler
// ---------------------------------------------------------------------------

async function handleAfterAgentHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-after-agent-hook");
  log.info("handleAfterAgentHook started");

  // 1. Read hook input JSON from stdin
  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.warn(`stdin read error: ${msg}`);
    process.stdout.write("{}\n");
    return 0;
  } finally {
    if (typeof process.stdin.unref === "function") {
      process.stdin.unref();
    }
  }

  const hookInput = parseHookInput(rawInput) as GeminiAfterAgentHookInput;
  log.info("Hook input received");

  // 2. Resolve session ID from hook input or env var
  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "session_id") ||
    process.env.GEMINI_SESSION_ID ||
    "";

  if (!sessionId) {
    log.info("No session ID in hook input — allowing exit");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  // 3. Resolve state directory
  const stateDir = resolveStateDirInternal(args);
  const runsDir = args.runsDir || ".a5c/runs";

  log.info(`Resolved stateDir: ${stateDir}`);

  // 4. Read session state file
  let filePath = getSessionFilePath(stateDir, sessionId);
  log.info(`Checking session file at: ${filePath}`);

  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      // Fallback: check .a5c/state/ directory
      const fallbackPath = getSessionFilePath(
        path.resolve(DEFAULT_STATE_DIR),
        sessionId,
      );
      log.info(
        `Primary state file not found, trying fallback: ${fallbackPath}`,
      );
      if (await sessionFileExists(fallbackPath)) {
        filePath = fallbackPath;
        log.info(`Found session file at fallback path: ${filePath}`);
      } else {
        log.info(
          `No active babysitter loop for session ${sessionId} — allowing exit`,
        );
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

  // 5. Check max iterations
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

  // 6. Check iteration timing (runaway loop detection)
  const now = getCurrentTimestamp();
  const updatedTimes =
    state.iteration >= 5
      ? updateIterationTimes(state.iterationTimes, state.lastIterationAt, now)
      : state.iterationTimes;

  if (isIterationTooFast(updatedTimes)) {
    if (verbose) {
      process.stderr.write(`[hook:run after-agent] Iteration too fast\n`);
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
  if (runId) log.setContext("run", runId);

  // 7. Extract last assistant message text for completion proof check
  // Gemini CLI provides prompt_response directly in the hook input
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

  // Fallback: check transcript_path if prompt_response is missing
  if (!hasPromise) {
    const transcriptPath = safeStr(
      hookInput as Record<string, unknown>,
      "transcript_path",
    );
    if (transcriptPath) {
      const resolvedTranscript = path.resolve(transcriptPath);
      if (existsSync(resolvedTranscript)) {
        try {
          const { readFileSync } = await import("node:fs");
          const content = readFileSync(resolvedTranscript, "utf-8");
          // Simple extraction: look for <promise>...</promise> anywhere
          promiseValue = extractPromiseTag(content);
          hasPromise = promiseValue !== null;
          log.info("Checked transcript for promise tag");
        } catch {
          log.warn(`Transcript read error: ${transcriptPath}`);
        }
      }
    }
  }

  // 8. If no run is bound, allow exit
  if (!runId) {
    log.info("No run associated with session — allowing exit");
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  // 9. Get run state and completion proof
  let runState = "";
  let completionProof = "";
  let pendingKinds = "";

  try {
    let runDir = path.isAbsolute(runId)
      ? runId
      : path.join(runsDir, runId);
    // Fallback: search alternative locations
    if (
      !existsSync(path.join(runDir, "run.json")) &&
      !path.isAbsolute(runId)
    ) {
      const alternatives = [
        path.join(".a5c", ".a5c", "runs", runId),
        path.join(".a5c", "runs", runId),
      ];
      for (const alt of alternatives) {
        const resolved = path.resolve(alt);
        if (
          resolved !== path.resolve(runDir) &&
          existsSync(path.join(resolved, "run.json"))
        ) {
          log.info(`Run not found at ${runDir}, using fallback: ${resolved}`);
          runDir = resolved;
          break;
        }
      }
    }

    const metadata = await readRunMetadata(runDir);
    const journal = await loadJournal(runDir);
    const index = await buildEffectIndex({ runDir, events: journal });

    const hasCompleted = journal.some((e) => e.type === "RUN_COMPLETED");
    const hasFailed = journal.some((e) => e.type === "RUN_FAILED");

    const pendingRecords = index.listPendingEffects();
    const pendingByKind = countPendingByKind(pendingRecords);
    const kindKeys = Object.keys(pendingByKind);
    if (kindKeys.length > 0) {
      pendingKinds = kindKeys.join(", ");
    }

    if (hasCompleted) {
      runState = "completed";
      completionProof = resolveCompletionProof(metadata);
    } else if (hasFailed) {
      runState = "failed";
    } else if (pendingRecords.length > 0) {
      runState = "waiting";
    } else {
      runState = "created";
    }
  } catch {
    runState = "";
  }

  log.info(`Run state: ${runState || "unknown"}`);
  if (completionProof) log.info("Completion proof available");

  if (!runState) {
    log.warn(`Run state unknown for ${runId} — allowing exit`);
    if (runId) {
      await appendStopHookEvent(path.join(runsDir, runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "run_state_unknown",
        runState,
        pendingKinds,
        hasPromise,
      });
    }
    process.stdout.write("{}\n");
    return 0;
  }

  // 10. Check completion proof match
  if (hasPromise && completionProof && promiseValue === completionProof) {
    log.info("Promise matches completion proof — allowing exit");
    if (verbose) {
      process.stderr.write(
        `[hook:run after-agent] Valid promise tag detected — run complete\n`,
      );
    }
    if (runId) {
      await appendStopHookEvent(path.join(runsDir, runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "completion_proof_matched",
        runState,
        pendingKinds,
        hasPromise,
      });
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  // 11. Not complete — continue the loop
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

  // 12. Build reason (re-injected as next turn prompt) and systemMessage (shown to user)
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

  // Output: block decision (continue loop)
  // Using "block" decision with reason re-injected as next prompt context.
  // Gemini CLI honors this to start a new turn with the reason as prompt context.
  const output = {
    decision: "block",
    reason,
    systemMessage,
  };

  if (runId) {
    await appendStopHookEvent(path.join(runsDir, runId), {
      sessionId,
      iteration: state.iteration,
      decision: "block",
      reason: "continue_loop",
      runState,
      pendingKinds,
      hasPromise,
    });
  }

  log.info(
    `Decision: block (iteration=${nextIteration}, maxIterations=${maxIterations})`,
  );

  if (verbose) {
    process.stderr.write(
      `[hook:run after-agent] Blocking, iteration=${nextIteration} maxIterations=${maxIterations}\n`,
    );
  }

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
  return 0;
}

// ---------------------------------------------------------------------------
// SessionStart hook handler
// ---------------------------------------------------------------------------

async function handleSessionStartHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-session-start-hook");
  log.info("handleSessionStartHook started (gemini-cli)");

  // 1. Read hook input JSON from stdin
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

  // 2. Resolve session ID
  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "session_id") ||
    process.env.GEMINI_SESSION_ID ||
    "";

  if (!sessionId) {
    log.info("No session ID in hook input — skipping state file creation");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  // 3. Resolve state directory and create baseline session file
  const stateDir = resolveStateDirInternal(args);
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.warn(`Failed to create session state: ${msg}`);
    if (verbose) {
      process.stderr.write(
        `[hook:run session-start] Failed to create session state: ${msg}\n`,
      );
    }
  }

  // 4. Output empty object (no additional context to inject at session start)
  process.stdout.write("{}\n");
  return 0;
}

// ---------------------------------------------------------------------------
// Session binding (run:create flow)
// ---------------------------------------------------------------------------

async function bindSessionImpl(
  opts: SessionBindOptions,
): Promise<SessionBindResult> {
  const { sessionId, runId, maxIterations = 256, prompt, verbose } = opts;

  // Resolve state directory
  const stateDir = resolveStateDirInternal({
    stateDir: opts.stateDir,
    pluginRoot: opts.pluginRoot,
  });

  const filePath = getSessionFilePath(stateDir, sessionId);

  // Check for existing session (prevent re-entrant runs)
  if (await sessionFileExists(filePath)) {
    try {
      const existing = await readSessionFile(filePath);
      if (existing.state.runId && existing.state.runId !== runId) {
        return {
          harness: HARNESS_NAME,
          sessionId,
          stateFile: filePath,
          error: `Session already associated with run: ${existing.state.runId}`,
        };
      }
      // Update existing session with run ID
      await updateSessionState(
        filePath,
        { runId, active: true },
        { state: existing.state, prompt: existing.prompt },
      );
      if (verbose) {
        process.stderr.write(
          `[run:create] Updated existing session ${sessionId} with run ${runId}\n`,
        );
      }
      return { harness: HARNESS_NAME, sessionId, stateFile: filePath };
    } catch {
      // Corrupted state file — overwrite
    }
  }

  // Create new session state with run associated
  const nowTs = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    startedAt: nowTs,
    lastIterationAt: nowTs,
    iterationTimes: [],
  };

  try {
    await writeSessionFile(filePath, state, prompt);
  } catch (e) {
    return {
      harness: HARNESS_NAME,
      sessionId,
      error: `Failed to write session state: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (verbose) {
    process.stderr.write(
      `[run:create] Session ${sessionId} initialized and bound to run ${runId}\n`,
    );
  }

  return { harness: HARNESS_NAME, sessionId, stateFile: filePath };
}

async function installGeminiHarness(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  return installCliViaNpm({
    harness: HARNESS_NAME,
    cliCommand: "gemini",
    packageName: "@google/gemini-cli",
    summary: "Install the Gemini CLI globally via npm.",
    options,
  });
}

async function installGeminiPlugin(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  const repoRoot = resolveRepoRoot();
  if (!repoRoot) {
    throw new BabysitterRuntimeError(
      "RepoRootNotFound",
      "Could not resolve the babysitter repo root for the repo-local Gemini extension install.",
      { category: ErrorCategory.Configuration },
    );
  }

  return copyGeminiExtension({
    harness: HARNESS_NAME,
    summary: "Install the repo-local Gemini extension payload into the active workspace.",
    sourceDir: path.join(repoRoot, "plugins", "babysitter-gemini"),
    targetDir: getGeminiExtensionDir(options.workspace),
    options,
  });
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

export function createGeminiCliAdapter(): HarnessAdapter {
  return {
    name: HARNESS_NAME,

    isActive(): boolean {
      return !!(
        process.env.GEMINI_SESSION_ID ||
        process.env.GEMINI_PROJECT_DIR ||
        process.env.GEMINI_CWD
      );
    },

    autoResolvesSessionId(): boolean {
      return true;
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      if (parsed.sessionId) return parsed.sessionId;
      if (process.env.GEMINI_SESSION_ID) return process.env.GEMINI_SESSION_ID;
      return undefined;
    },

    resolveStateDir(args: {
      stateDir?: string;
      pluginRoot?: string;
    }): string | undefined {
      return resolveStateDirInternal(args);
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      const root =
        args.pluginRoot ||
        process.env.GEMINI_EXTENSION_PATH ||
        process.env.BABYSITTER_EXTENSION_PATH;
      return root ? path.resolve(root) : undefined;
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindSessionImpl(opts);
    },

    /**
     * Handle the AfterAgent hook — the Gemini CLI equivalent of the Stop hook.
     * Reads prompt_response (and optionally transcript_path) from stdin JSON,
     * checks for the completion proof, and outputs block/approve decision.
     */
    handleStopHook(args: HookHandlerArgs): Promise<number> {
      return handleAfterAgentHookImpl(args);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleSessionStartHookImpl(args);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      // Gemini CLI extensions don't use a hook dispatcher in the same way
      const extensionPath =
        process.env.GEMINI_EXTENSION_PATH ||
        process.env.BABYSITTER_EXTENSION_PATH;
      if (extensionPath) {
        const candidate = path.join(
          path.resolve(extensionPath),
          "hooks",
          "after-agent.sh",
        );
        if (existsSync(candidate)) return candidate;
      }
      return null;
    },

    installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installGeminiHarness(options);
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installGeminiPlugin(options);
    },
  };
}
