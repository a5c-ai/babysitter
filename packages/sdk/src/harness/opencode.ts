/**
 * OpenCode harness adapter.
 *
 * Centralizes all OpenCode-specific behaviors:
 *   - Session ID resolution (BABYSITTER_SESSION_ID → OPENCODE_SESSION_ID)
 *   - State directory conventions (global state dir by default)
 *   - Session binding (run:create → state file with run association)
 *   - Minimal stop hook handler (no native stop hook — in-turn model)
 *   - Session-start hook handler (baseline state file creation)
 *
 * OpenCode characteristics:
 *   - Go binary, CLI command: `opencode`
 *   - Config directory: `.opencode/`
 *   - Plugin system: JS/TS modules in `.opencode/plugins/` with hooks for
 *     `tool.execute.before/after`, `session.idle`, `session.created`, `shell.env`
 *   - NO blocking stop hook — `session.idle` is fire-and-forget
 *   - Programmatic API: `@opencode-ai/sdk` with `session.create()`,
 *     `session.prompt()`, `event.subscribe()` (SSE)
 *   - Env vars: Does NOT inject distinctive env vars into plugins — weak
 *     caller detection. The babysitter plugin self-injects
 *     `BABYSITTER_SESSION_ID` via the `shell.env` hook.
 *   - Loop mechanism: in-turn (no stop-hook, must use SDK loop driver or
 *     in-turn orchestration)
 *   - Capabilities: [HeadlessPrompt] only
 */

import * as path from "node:path";
import { existsSync, mkdirSync, appendFileSync } from "node:fs";
import { loadJournal } from "../storage/journal";
import { readRunMetadata } from "../storage/runFiles";
import { buildEffectIndex } from "../runtime/replay/effectIndex";
import type { EffectRecord } from "../runtime/types";
import {
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
  deleteSessionFile,
  updateSessionState,
  getCurrentTimestamp,
} from "../session";
import type { SessionState } from "../session";
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
import { createOpenCodeContext } from "../prompts/context";
import { getGlobalStateDir } from "../config";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HARNESS_NAME = "opencode";

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
  return getGlobalStateDir();
}

// ---------------------------------------------------------------------------
// Session ID resolution
// ---------------------------------------------------------------------------

function resolveSessionIdInternal(parsed: { sessionId?: string }): string | undefined {
  // 1. Explicit arg (highest priority)
  if (parsed.sessionId) return parsed.sessionId;

  // 2. Cross-harness standard env var (self-injected by babysitter plugin's shell.env hook)
  if (process.env.BABYSITTER_SESSION_ID) return process.env.BABYSITTER_SESSION_ID;

  // 3. OpenCode-specific env vars (set by babysitter plugin's shell.env hook)
  if (process.env.OPENCODE_SESSION_ID) return process.env.OPENCODE_SESSION_ID;

  return undefined;
}

// ---------------------------------------------------------------------------
// Stop hook handler (minimal — no native stop hook)
// ---------------------------------------------------------------------------

/**
 * Handles the stop hook for OpenCode.
 *
 * OpenCode does NOT have a native stop hook that can block/restart the agent.
 * This handler checks run status and returns approve/block as a decision, but
 * the actual loop driving happens externally (in-turn model or SDK loop driver).
 *
 * When a run is still in progress (has pending effects or is not completed),
 * we output a block decision with context for the next iteration. When the
 * run is completed/failed or no run is bound, we allow exit.
 */
async function handleStopHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-opencode-stop-hook");
  log.info("handleStopHook started (opencode)");

  // 1. Read hook input JSON from stdin (if available)
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

  // 2. Resolve session ID
  const sessionId =
    safeStr(hookInput, "session_id") ||
    process.env.BABYSITTER_SESSION_ID ||
    process.env.OPENCODE_SESSION_ID ||
    "";

  if (!sessionId) {
    log.info("No session ID — allowing exit");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);

  // 3. Resolve state directory and read session state
  const stateDir = resolveStateDirInternal(args);
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

  // 4. Check max iterations
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

  // 5. If no run is bound, allow exit
  if (!runId) {
    log.info("No run associated with session — allowing exit");
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("run", runId);

  // 6. Get run state
  let runState = "";
  let pendingKinds = "";

  try {
    const runDir = path.isAbsolute(runId)
      ? runId
      : path.join(runsDir, runId);

    void readRunMetadata(runDir);
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

  // 7. Allow exit if run is completed, failed, or state is unknown
  if (runState === "completed" || runState === "failed" || !runState) {
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  // 8. Run still in progress — output block decision with context
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
    process.stderr.write(
      `[hook:run stop] Blocking, iteration=${nextIteration}\n`,
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
  const log = createHookLogger("babysitter-opencode-session-start-hook");
  log.info("handleSessionStartHook started (opencode)");

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

  const hookInput = parseHookInput(rawInput);

  // 2. Resolve session ID
  //    OpenCode does NOT auto-inject env vars — the babysitter plugin's
  //    shell.env hook self-injects BABYSITTER_SESSION_ID.
  const sessionId =
    safeStr(hookInput, "session_id") ||
    process.env.BABYSITTER_SESSION_ID ||
    process.env.OPENCODE_SESSION_ID ||
    "";

  if (!sessionId) {
    log.info("No session ID — skipping state file creation");
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

  // 4. Output empty object
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

function installOpenCodePlugin(
  _options: HarnessInstallOptions,
): HarnessInstallResult {
  // OpenCode plugin installation is not yet automated.
  // Plugins are JS/TS modules placed in .opencode/plugins/.
  return {
    harness: HARNESS_NAME,
    summary: "OpenCode plugin installation is not yet automated. " +
      "Place babysitter plugin files in .opencode/plugins/babysitter/ manually.",
  };
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

export function createOpenCodeAdapter(): HarnessAdapter {
  return {
    name: HARNESS_NAME,

    isActive(): boolean {
      // OpenCode does NOT inject distinctive env vars into plugins.
      // The babysitter plugin's shell.env hook self-injects BABYSITTER_SESSION_ID
      // and OPENCODE_SESSION_ID. OPENCODE_PROJECT_DIR may be set by the plugin.
      return !!(
        process.env.OPENCODE_SESSION_ID ||
        process.env.OPENCODE_PROJECT_DIR
      );
    },

    autoResolvesSessionId(): boolean {
      // OpenCode does not natively inject session IDs — the babysitter
      // plugin's shell.env hook self-injects BABYSITTER_SESSION_ID.
      return false;
    },

    getMissingSessionIdHint(): string {
      return (
        "OpenCode does not auto-inject session IDs. Use --session-id explicitly, " +
        "or ensure the babysitter plugin's shell.env hook is configured to set " +
        "BABYSITTER_SESSION_ID."
      );
    },

    supportsHookType(hookType: string): boolean {
      // OpenCode plugin hooks: session.created, session.idle,
      // tool.execute.before, tool.execute.after, shell.env
      // Maps to SDK hook types:
      //   session-start → session.created
      //   pre-tool-use  → tool.execute.before
      //   post-tool-use → tool.execute.after
      // Note: NO stop hook — session.idle is fire-and-forget
      const supported = [
        "session-start",
        "pre-tool-use",
        "post-tool-use",
      ];
      return supported.includes(hookType);
    },

    getUnsupportedHookMessage(hookType: string): string {
      if (hookType === "stop") {
        return (
          "OpenCode does not support a blocking stop hook. " +
          "The session.idle event is fire-and-forget. " +
          "Use in-turn orchestration or the SDK loop driver instead."
        );
      }
      return `Hook type "${hookType}" is not supported by the OpenCode adapter.`;
    },

    getCapabilities(): HarnessCapability[] {
      // No StopHook, no SessionBinding natively, no MCP.
      // HeadlessPrompt via @opencode-ai/sdk programmatic API.
      return [HarnessCapability.HeadlessPrompt];
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      return resolveSessionIdInternal(parsed);
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
        process.env.OPENCODE_PLUGIN_ROOT;
      return root ? path.resolve(root) : undefined;
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

    findHookDispatcherPath(startCwd: string): string | null {
      // OpenCode plugins are in .opencode/plugins/, not standalone scripts.
      // Walk up from startCwd looking for .opencode/plugins/babysitter/
      let current = path.resolve(startCwd);
      const root = path.parse(current).root;

      while (current !== root) {
        const candidate = path.join(current, ".opencode", "plugins", "babysitter", "index.js");
        if (existsSync(candidate)) return candidate;

        const tsCandidate = path.join(current, ".opencode", "plugins", "babysitter", "index.ts");
        if (existsSync(tsCandidate)) return tsCandidate;

        current = path.dirname(current);
      }

      return null;
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return Promise.resolve(installOpenCodePlugin(options));
    },

    getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
      return createOpenCodeContext(opts);
    },
  };
}
