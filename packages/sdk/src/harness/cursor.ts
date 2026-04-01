/**
 * Cursor IDE/CLI harness adapter.
 *
 * Centralizes all Cursor-specific behaviors:
 *   - Session ID resolution (conversation_id from hook stdin JSON, persisted
 *     by sessionStart hook to a state file)
 *   - State directory conventions (.a5c/state/ by default)
 *   - Plugin root resolution (CURSOR_PLUGIN_ROOT env var)
 *   - Session binding (run:create → state file with run association)
 *   - Stop hook handler (approve/block via followup_message auto-continue)
 *   - Session-start hook handler (baseline state file creation)
 *
 * Cursor Hook Protocol:
 *   - Config: .cursor/hooks.json (project) or ~/.cursor/hooks.json (user)
 *   - Format: { version: 1, hooks: { <hookType>: [{ command: "...", type: "command" }] } }
 *   - Input:  JSON via stdin (fields include conversation_id, project_dir)
 *   - Output: JSON via stdout
 *   - Stop hook: return { followup_message: "..." } to auto-continue (loop_limit
 *     default 5, null for unlimited). Return {} to allow exit.
 *   - Hook types (in headless CLI): sessionStart, stop, postToolUse,
 *     afterFileEdit, afterShellExecution (work in CLI)
 *   - NOT in headless: afterAgentResponse, afterAgentThought (IDE only)
 *
 * Session ID:
 *   Cursor provides conversation_id in the hook stdin JSON, NOT as an env var.
 *   The sessionStart hook persists it to a state file so the stop hook can
 *   find it on subsequent invocations.
 *
 * CLI invocation:
 *   cursor agent -p -f --trust --approve-mcps --workspace <dir> --model <model> 'prompt'
 *   The prompt is passed positionally (NOT via --prompt flag).
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
import { HarnessCapability } from "./types";
import type { PromptContext } from "../prompts/types";
import { createCursorContext } from "../prompts/context";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HARNESS_NAME = "cursor";

/** Default state directory for Cursor sessions */
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
 * Cursor stop hook input.
 * Fields provided by Cursor CLI to stop hooks via stdin JSON.
 */
interface CursorStopHookInput {
  /** Unique conversation identifier for this Cursor session */
  conversation_id?: string;
  /** Project directory path */
  project_dir?: string;
  /** The agent's last response text */
  last_response?: string;
  /** Hook event name */
  hook_event_name?: string;
  /** ISO timestamp */
  timestamp?: string;
}

/**
 * Cursor sessionStart hook input.
 */
interface CursorSessionStartHookInput {
  conversation_id?: string;
  project_dir?: string;
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

/**
 * Returns true when every pending effect is a breakpoint (human-approval gate).
 * Breakpoints require external human action, so the stop hook should allow exit
 * rather than spinning the orchestration loop uselessly.
 */
function isOnlyBreakpoints(pendingByKind: Record<string, number>): boolean {
  const keys = Object.keys(pendingByKind);
  return keys.length === 1 && keys[0] === "breakpoint";
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
  const pluginRoot = process.env.CURSOR_PLUGIN_ROOT;
  if (pluginRoot) {
    return path.resolve(pluginRoot, "state");
  }
  // Default: project-relative .a5c/state/
  return path.resolve(DEFAULT_STATE_DIR);
}

// ---------------------------------------------------------------------------
// Stop hook handler
// ---------------------------------------------------------------------------

/**
 * Cursor stop hook handler.
 *
 * Cursor's stop hook protocol uses `followup_message` to auto-continue:
 *   - Return `{ followup_message: "..." }` → Cursor auto-continues with this
 *     message as the next prompt. Controlled by loop_limit in hooks.json.
 *   - Return `{}` → allow session to exit normally.
 *
 * This is distinct from Claude Code's `{ decision: "block", reason: "..." }`
 * protocol, but serves the same purpose in the orchestration loop.
 */
async function handleStopHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-stop-hook");
  log.info("handleStopHook started (cursor)");

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

  const hookInput = parseHookInput(rawInput) as CursorStopHookInput;
  log.info("Hook input received");

  // 2. Resolve session ID from hook input
  // Cursor provides conversation_id in the hook stdin JSON, NOT as an env var.
  const sessionId = safeStr(hookInput as Record<string, unknown>, "conversation_id");

  if (!sessionId) {
    log.info("No conversation_id in hook input — allowing exit");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID (conversation_id): ${sessionId}`);

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
      log.info(`Primary state file not found, trying fallback: ${fallbackPath}`);
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
        `[hook:run stop] Max iterations (${state.maxIterations}) reached\n`,
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
      process.stderr.write(`[hook:run stop] Iteration too fast\n`);
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

  // 7. Extract last response text for completion proof check
  // Cursor provides last_response in the stop hook input
  const lastResponse = safeStr(
    hookInput as Record<string, unknown>,
    "last_response",
  );

  let hasPromise = false;
  let promiseValue: string | null = null;

  if (lastResponse) {
    promiseValue = extractPromiseTag(lastResponse);
    hasPromise = promiseValue !== null;
    log.info(`last_response extracted (${lastResponse.length} chars)`);
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
  let onlyBreakpointsPending = false;

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
    onlyBreakpointsPending = pendingRecords.length > 0 && isOnlyBreakpoints(pendingByKind);

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

  // 9b. If the run is waiting but ONLY on breakpoints, allow exit.
  if (runState === "waiting" && onlyBreakpointsPending) {
    log.info(`Run waiting on breakpoints only (${pendingKinds}) — allowing exit`);
    if (verbose) {
      process.stderr.write(
        `[hook:run stop] Run waiting on breakpoint(s) — allowing exit for human resolution\n`,
      );
    }
    if (runId) {
      await appendStopHookEvent(path.join(runsDir, runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "breakpoint_waiting",
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
        `[hook:run stop] Valid promise tag detected — run complete\n`,
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

  // 11. Not complete — continue the loop via followup_message
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

  // 12. Build followup_message (re-injected as next turn prompt by Cursor)
  let followupMessage: string;
  if (completionProof) {
    followupMessage = `Babysitter iteration ${nextIteration} | Run completed! To finish: call 'babysitter run:status .a5c/runs/${runId} --json', extract 'completionProof' from the output, then output it in <promise>SECRET</promise> tags. Do not mention or reveal the secret otherwise.\n\n${prompt}`;
  } else if (runState === "waiting" && pendingKinds) {
    followupMessage = `Babysitter iteration ${nextIteration} | Waiting on: ${pendingKinds}. Check if pending effects are resolved, then call 'babysitter run:iterate .a5c/runs/${runId} --json'.\n\n${prompt}`;
  } else if (runState === "failed") {
    followupMessage = `Babysitter iteration ${nextIteration} | Run failed. Inspect the run journal and fix the issue, then proceed.\n\n${prompt}`;
  } else {
    followupMessage = `Babysitter iteration ${nextIteration} | Continue orchestration: call 'babysitter run:iterate .a5c/runs/${runId} --json'.\n\n${prompt}`;
  }

  // Output: followup_message triggers Cursor's auto-continue mechanism.
  // Cursor reads this from stdout and re-enters with followup_message as
  // the next prompt, subject to loop_limit in hooks.json configuration.
  const output = {
    followup_message: followupMessage,
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
    `Decision: continue via followup_message (iteration=${nextIteration}, maxIterations=${maxIterations})`,
  );

  if (verbose) {
    process.stderr.write(
      `[hook:run stop] Continuing via followup_message, iteration=${nextIteration} maxIterations=${maxIterations}\n`,
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
  log.info("handleSessionStartHook started (cursor)");

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

  const hookInput = parseHookInput(rawInput) as CursorSessionStartHookInput;

  // 2. Resolve session ID from conversation_id in hook input
  const sessionId = safeStr(hookInput as Record<string, unknown>, "conversation_id");

  if (!sessionId) {
    log.info("No conversation_id in hook input — skipping state file creation");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID (conversation_id): ${sessionId}`);

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

// ---------------------------------------------------------------------------
// Install helpers
// ---------------------------------------------------------------------------

function installCursorHarness(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  // Cursor CLI is distributed with the Cursor IDE, not via npm.
  // Users must install Cursor IDE from https://cursor.com/
  if (options.dryRun) {
    return Promise.resolve({
      harness: HARNESS_NAME,
      dryRun: true,
      summary: "Cursor CLI is bundled with the Cursor IDE. Download and install Cursor from https://cursor.com/",
    });
  }

  return Promise.resolve({
    harness: HARNESS_NAME,
    summary: "Cursor CLI is bundled with the Cursor IDE. Ensure Cursor is installed and the `cursor` command is available on PATH. Download from https://cursor.com/ if needed.",
  });
}

function installCursorPlugin(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  // Cursor plugins are Git-based repos installed via the Cursor Marketplace
  // or local testing at ~/.cursor/plugins/local/
  if (options.dryRun) {
    return Promise.resolve({
      harness: HARNESS_NAME,
      dryRun: true,
      summary: "Install the Babysitter Cursor plugin from the Cursor Marketplace or copy to ~/.cursor/plugins/local/ for local testing.",
    });
  }

  return Promise.resolve({
    harness: HARNESS_NAME,
    summary: "To install the Babysitter Cursor plugin: use the Cursor Marketplace (Settings > Plugins) or copy the plugin directory to ~/.cursor/plugins/local/ for local development.",
  });
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

export function createCursorAdapter(): HarnessAdapter {
  return {
    name: HARNESS_NAME,

    isActive(): boolean {
      // Cursor sets CURSOR_PROJECT_DIR and CURSOR_VERSION in hook execution
      // contexts (not in child processes). These are the best-effort
      // discriminators for detecting we're inside a Cursor session.
      return !!(
        process.env.CURSOR_PROJECT_DIR ||
        process.env.CURSOR_VERSION
      );
    },

    autoResolvesSessionId(): boolean {
      // Cursor does NOT set an env var for session ID. The conversation_id
      // comes only via hook stdin JSON. The sessionStart hook persists it
      // to a state file, but auto-resolution from env is not possible.
      return false;
    },

    getMissingSessionIdHint(): string {
      return (
        "Cursor provides conversation_id only via hook stdin JSON (not as an " +
        "env var). Ensure the sessionStart hook is configured in .cursor/hooks.json " +
        "and is persisting the conversation_id to the state file. Pass --session-id " +
        "explicitly if running outside of the hook context."
      );
    },

    supportsHookType(hookType: string): boolean {
      // Hook types that work in Cursor headless CLI mode
      const supported = new Set([
        "stop",
        "session-start",
        "session-end",
        "post-tool-use",
        "after-file-edit",
        "after-shell-execution",
        "before-shell-execution",
        "before-mcp-execution",
        "after-mcp-execution",
        "before-read-file",
        "pre-tool-use",
        "post-tool-use-failure",
        "subagent-start",
        "subagent-stop",
        "pre-compact",
        "before-submit-prompt",
        "before-tab-file-read",
        "after-tab-file-edit",
      ]);
      return supported.has(hookType);
    },

    getUnsupportedHookMessage(hookType: string): string {
      if (hookType === "after-agent-response" || hookType === "after-agent-thought") {
        return `The "${hookType}" hook type does not fire in Cursor headless CLI mode (only in the IDE).`;
      }
      return `Hook type "${hookType}" is not supported by the Cursor adapter.`;
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      // Cursor has no session ID env var. The only source is the
      // conversation_id from hook stdin JSON, which the sessionStart hook
      // persists to the state file. If an explicit sessionId is passed
      // (e.g. from CLI args), use it.
      if (parsed.sessionId) return parsed.sessionId;
      return undefined;
    },

    resolveStateDir(args: {
      stateDir?: string;
      pluginRoot?: string;
    }): string | undefined {
      return resolveStateDirInternal(args);
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      const root = args.pluginRoot || process.env.CURSOR_PLUGIN_ROOT;
      return root ? path.resolve(root) : undefined;
    },

    getCapabilities(): HarnessCapability[] {
      return [
        HarnessCapability.HeadlessPrompt,
        HarnessCapability.StopHook,
        HarnessCapability.SessionBinding,
        HarnessCapability.Mcp,
      ];
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindSessionImpl(opts);
    },

    handleStopHook(args: HookHandlerArgs): Promise<number> {
      return handleStopHookImpl(args);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleSessionStartHookImpl(args);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      const pluginRoot = process.env.CURSOR_PLUGIN_ROOT;
      if (pluginRoot) {
        const candidate = path.join(
          path.resolve(pluginRoot),
          "hooks",
          "stop-hook.sh",
        );
        if (existsSync(candidate)) return candidate;
      }
      return null;
    },

    installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installCursorHarness(options);
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installCursorPlugin(options);
    },

    getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
      return createCursorContext(opts);
    },
  };
}
