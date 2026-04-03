/**
 * GitHub Copilot CLI harness adapter.
 *
 * Centralizes all GitHub Copilot CLI-specific behaviors:
 *   - Session ID resolution (hook stdin JSON with `timestamp` and `cwd`)
 *   - State directory conventions (.a5c/state/ by default)
 *   - Plugin root resolution (COPILOT_PLUGIN_ROOT)
 *   - Session binding (run:create → state file with run association)
 *   - Session-end hook handler (cleanup on session termination)
 *   - Session-start hook handler (baseline state file)
 *
 * GitHub Copilot CLI Hook Protocol (hooks.json):
 *   - Hook event types (camelCase): sessionStart, sessionEnd,
 *     userPromptSubmitted, preToolUse, postToolUse, errorOccurred
 *   - Input:  JSON via stdin (fields: timestamp, cwd)
 *   - Output: JSON via stdout
 *   - Only preToolUse can control flow via
 *     `{"permissionDecision": "deny|allow|ask", "permissionDecisionReason": "..."}`
 *   - ALL OTHER hook outputs are IGNORED by the Copilot CLI
 *
 * Orchestration model: in-turn
 *   GitHub Copilot CLI does NOT have a stop-hook that can block/restart the
 *   agent. The orchestration loop is driven by the agent itself within a
 *   single session (in-turn model), not by hook-driven re-entry.
 *
 * CRITICAL: isActive() detection — the official docs do NOT confirm any
 * specific env vars (COPILOT_HOME, COPILOT_GITHUB_TOKEN, etc.) being
 * injected into hook scripts. Hooks receive stdin JSON with `timestamp`
 * and `cwd`. Custom env vars can be set via the `env` field in hooks.json.
 * We use COPILOT_HOME / COPILOT_GITHUB_TOKEN as best-effort discriminators
 * when the CLI is running, but this may need refinement.
 */

import * as path from "node:path";
import { existsSync, mkdirSync, appendFileSync, readFileSync } from "node:fs";
import { appendEvent } from "../storage/journal";
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
import { createGithubCopilotContext } from "../prompts/context";
import { installCliViaNpm } from "./installSupport";
import { getGlobalStateDir } from "../config";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HARNESS_NAME = "github-copilot";

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

async function appendSessionEndEvent(
  runDir: string,
  data: {
    sessionId: string;
    iteration: number;
    reason: string;
  },
): Promise<void> {
  try {
    await appendEvent({
      runDir,
      eventType: "SESSION_END_HOOK_INVOKED",
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
 * GitHub Copilot CLI hook input.
 * Hooks receive JSON via stdin with `timestamp` and `cwd` fields.
 * Session ID is NOT provided via env vars — it must come from stdin JSON
 * if available, or be resolved through other means.
 *
 * Note: sessionEnd hook output is IGNORED by Copilot CLI. Only preToolUse
 * can control flow via permissionDecision. This handler performs cleanup only.
 */
interface CopilotHookInput {
  /** Current working directory */
  cwd?: string;
  /** ISO timestamp */
  timestamp?: string;
  /** Session identifier (if provided via custom hook configuration) */
  session_id?: string;
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
// Plugin root resolution
// ---------------------------------------------------------------------------

function resolvePluginRootInternal(args: { pluginRoot?: string }): string | undefined {
  const root =
    args.pluginRoot ||
    process.env.CLAUDE_PLUGIN_DATA ||
    process.env.COPILOT_PLUGIN_ROOT;
  return root ? path.resolve(root) : undefined;
}

// ---------------------------------------------------------------------------
// Session ID resolution
// ---------------------------------------------------------------------------

function resolveSessionIdInternal(parsed: { sessionId?: string }): string | undefined {
  // 1. Explicit arg (highest priority)
  if (parsed.sessionId) return parsed.sessionId;

  // 2. Cross-harness standard env var (written by session-start hook to env file)
  if (process.env.BABYSITTER_SESSION_ID) return process.env.BABYSITTER_SESSION_ID;

  // 3. Env file (if COPILOT_ENV_FILE or CLAUDE_ENV_FILE exists)
  const envFile = process.env.COPILOT_ENV_FILE || process.env.CLAUDE_ENV_FILE;
  if (envFile) {
    try {
      const content = readFileSync(envFile, "utf-8");
      const match = content.match(
        /(?:^|\n)\s*(?:export\s+)?BABYSITTER_SESSION_ID="([^"]+)"/,
      );
      return match?.[1] || undefined;
    } catch {
      // Fall through
    }
  }

  // 4. Session ID from hook stdin JSON is resolved at hook handler time, not here.
  //    Copilot CLI hooks receive stdin JSON with `timestamp` and `cwd` fields;
  //    session_id may be available if custom hook config passes it.
  return undefined;
}

// ---------------------------------------------------------------------------
// Session-end hook handler (cleanup only)
// ---------------------------------------------------------------------------

/**
 * Handles the sessionEnd hook event for GitHub Copilot CLI.
 *
 * IMPORTANT: Copilot CLI ignores all output from sessionEnd hooks — only
 * preToolUse can control agent flow via permissionDecision. This handler
 * performs best-effort cleanup (session state files, journal events) and
 * always returns exit code 0.
 *
 * Since there is no stop-hook mechanism, orchestration loop control is
 * handled in-turn by the agent itself, not by this hook.
 */
async function handleSessionEndHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-copilot-session-end-hook");
  log.info("handleSessionEndHook started (github-copilot)");

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

  const hookInput = parseHookInput(rawInput) as CopilotHookInput;
  log.info("Hook input received");

  // 2. Resolve session ID from hook input (stdin JSON) or cross-harness env var
  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "session_id") ||
    process.env.BABYSITTER_SESSION_ID ||
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

  const iteration = state.iteration;
  const runId = state.runId ?? "";
  if (runId) log.setContext("run", runId);

  // 5. If no run is bound, just clean up session state
  if (!runId) {
    log.info("No run associated with session — cleaning up");
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  // 6. Log session-end event to the run journal (best-effort)
  try {
    const runDir = path.isAbsolute(runId)
      ? runId
      : path.join(runsDir, runId);
    await appendSessionEndEvent(runDir, {
      sessionId,
      iteration: state.iteration,
      reason: "session_ended",
    });
  } catch {
    // Best-effort: don't fail the hook if journal write fails
  }

  // 7. Clean up session state file
  // Note: Copilot CLI ignores sessionEnd hook output — no flow control
  // is possible here. Orchestration loop is driven in-turn by the agent.
  await cleanupSession(filePath);

  log.info(`Session ended, cleanup complete (iteration=${iteration})`);
  if (verbose) {
    process.stderr.write(
      `[hook:session-end] Session ${sessionId} ended, cleanup complete\n`,
    );
  }

  // Output is ignored by Copilot CLI but we write valid JSON for consistency
  process.stdout.write("{}\n");
  return 0;
}

// ---------------------------------------------------------------------------
// SessionStart hook handler
// ---------------------------------------------------------------------------

async function handleSessionStartHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-copilot-session-start-hook");
  log.info("handleSessionStartHook started (github-copilot)");

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

  const hookInput = parseHookInput(rawInput) as CopilotHookInput;

  // 2. Resolve session ID
  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "session_id") ||
    process.env.BABYSITTER_SESSION_ID ||
    "";

  if (!sessionId) {
    log.info("No session ID in hook input — skipping state file creation");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  // 3. Persist BABYSITTER_SESSION_ID to env file (COPILOT_ENV_FILE or CLAUDE_ENV_FILE)
  const envFile = process.env.COPILOT_ENV_FILE || process.env.CLAUDE_ENV_FILE;
  if (envFile) {
    try {
      appendFileSync(
        envFile,
        `export BABYSITTER_SESSION_ID="${sessionId}"\n`,
      );
    } catch {
      if (verbose) {
        process.stderr.write(
          `[hook:run session-start] Failed to write to env file: ${envFile}\n`,
        );
      }
    }
  }

  // 4. Resolve state directory and create baseline session file
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

  // 5. Output empty object
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
// Hook dispatcher path
// ---------------------------------------------------------------------------

function findHookDispatcherPathImpl(startCwd: string): string | null {
  // Copilot CLI hooks are configured via hooks.json (not standalone scripts).
  // Look for hooks.json in standard locations.
  const pluginRoot = resolvePluginRootInternal({});
  if (pluginRoot) {
    const candidate = path.join(
      path.resolve(pluginRoot),
      "hooks.json",
    );
    if (existsSync(candidate)) return candidate;
  }

  // Walk up from startCwd looking for hooks.json
  let current = path.resolve(startCwd);
  const root = path.parse(current).root;

  while (current !== root) {
    // Check .github/copilot/hooks.json (standard Copilot location)
    const candidate = path.join(current, ".github", "copilot", "hooks.json");
    if (existsSync(candidate)) return candidate;

    // Check .copilot/hooks.json
    const copilotCandidate = path.join(current, ".copilot", "hooks.json");
    if (existsSync(copilotCandidate)) return copilotCandidate;

    const a5cCandidate = path.join(current, ".a5c", "hooks.json");
    if (existsSync(a5cCandidate)) return a5cCandidate;

    current = path.dirname(current);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Install helpers
// ---------------------------------------------------------------------------

async function installCopilotHarness(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  return installCliViaNpm({
    harness: HARNESS_NAME,
    cliCommand: "copilot",
    packageName: "@github/copilot",
    summary: "Install the GitHub Copilot CLI globally via npm.",
    options,
  });
}

function installCopilotPlugin(
  _options: HarnessInstallOptions,
): HarnessInstallResult {
  // Copilot plugin installation is not yet supported via a published package.
  // Return guidance for manual setup.
  return {
    harness: HARNESS_NAME,
    summary: "GitHub Copilot CLI plugin installation is not yet automated. " +
      "Configure hooks in .github/copilot/ or ~/.copilot/ manually.",
  };
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

export function createGithubCopilotAdapter(): HarnessAdapter {
  return {
    name: HARNESS_NAME,

    isActive(): boolean {
      // Best-effort detection: official docs do NOT confirm these env vars
      // are injected into hook scripts. However, COPILOT_HOME or
      // COPILOT_GITHUB_TOKEN may be present when running inside a Copilot
      // CLI session. This distinguishes from Claude Code which uses CLAUDE_* vars.
      return !!(
        process.env.BABYSITTER_SESSION_ID ||
        process.env.COPILOT_HOME ||
        process.env.COPILOT_GITHUB_TOKEN
      );
    },

    autoResolvesSessionId(): boolean {
      // Session ID comes from hook stdin JSON, not env vars
      return false;
    },

    getMissingSessionIdHint(): string {
      return (
        "GitHub Copilot CLI provides session IDs via hook stdin JSON. " +
        "Use --session-id explicitly, or ensure Copilot CLI hooks are configured " +
        "to pass session_id in the stdin payload."
      );
    },

    supportsHookType(hookType: string): boolean {
      // Maps to Copilot CLI hook event types (camelCase):
      //   session-start    → sessionStart
      //   session-end      → sessionEnd
      //   user-prompt-submit → userPromptSubmitted
      //   pre-tool-use     → preToolUse
      //   post-tool-use    → postToolUse
      // Note: there is NO stop hook in Copilot CLI.
      const supported = [
        "session-start",
        "session-end",
        "user-prompt-submit",
        "pre-tool-use",
        "post-tool-use",
      ];
      return supported.includes(hookType);
    },

    getCapabilities(): HarnessCapability[] {
      // No StopHook — Copilot CLI does not support a stop hook that can
      // block/restart the agent. Orchestration uses the in-turn model.
      return [
        HarnessCapability.HeadlessPrompt,
        HarnessCapability.SessionBinding,
        HarnessCapability.Mcp,
      ];
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
      return resolvePluginRootInternal(args);
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindSessionImpl(opts);
    },

    handleStopHook(args: HookHandlerArgs): Promise<number> {
      // Copilot CLI has no stop hook — this maps to sessionEnd for cleanup.
      // Output is ignored by the CLI; no flow control is possible.
      return handleSessionEndHookImpl(args);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleSessionStartHookImpl(args);
    },

    findHookDispatcherPath(startCwd: string): string | null {
      return findHookDispatcherPathImpl(startCwd);
    },

    installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installCopilotHarness(options);
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return Promise.resolve(installCopilotPlugin(options));
    },

    getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
      return createGithubCopilotContext(opts);
    },
  };
}
