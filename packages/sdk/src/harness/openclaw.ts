/**
 * OpenClaw harness adapter.
 *
 * Centralizes all OpenClaw-specific behaviors:
 *   - Session ID resolution (BABYSITTER_SESSION_ID, OPENCLAW_SHELL context)
 *   - State directory conventions (global state dir by default)
 *   - Session binding (run:create -> state file with run association)
 *   - No stop hook (OpenClaw is a daemon with no stop-hook model)
 *   - Session-start hook handler (baseline state file + skill discovery context)
 *
 * OpenClaw characteristics:
 *   - Daemon/gateway model, CLI command: `openclaw`
 *   - Env vars: OPENCLAW_SHELL, OPENCLAW_HOME
 *   - Sessions use composite keys: `agent:<agentId>:<channel>:<type>:<id>`
 *   - NO stop-hook model — hooks are registered programmatically
 *   - Capabilities: SessionBinding, Mcp, HeadlessPrompt (NOT StopHook, NOT Programmatic)
 */

import * as path from "node:path";
import { mkdirSync, appendFileSync } from "node:fs";
import {
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
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
import { createOpenClawContext } from "../prompts/context";
import { getGlobalLogDir, getGlobalStateDir } from "../config";
import { checkCliAvailable } from "./discovery";
import { installCliViaNpm } from "./installSupport";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HARNESS_NAME = "openclaw";

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
  const logDir = getGlobalLogDir();
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

function resolveSessionIdInternal(parsed: {
  sessionId?: string;
}): string | undefined {
  // 1. Explicit arg (highest priority)
  if (parsed.sessionId) return parsed.sessionId;

  // 2. Cross-harness standard env var
  if (process.env.BABYSITTER_SESSION_ID)
    return process.env.BABYSITTER_SESSION_ID;

  // 3. OpenClaw shell context — composite key provided by the gateway
  if (process.env.OPENCLAW_SHELL) return process.env.OPENCLAW_SHELL;

  return undefined;
}

// ---------------------------------------------------------------------------
// Stop hook handler (no-op — OpenClaw has no stop-hook model)
// ---------------------------------------------------------------------------

function writeNoopHookResult(): void {
  process.stdout.write("{}\n");
}

// ---------------------------------------------------------------------------
// SessionStart hook handler
// ---------------------------------------------------------------------------

async function handleSessionStartHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-openclaw-session-start-hook");
  log.info("handleSessionStartHook started (openclaw)");

  // OpenClaw is a daemon — session IDs come from the gateway env, not stdin.
  const sessionId =
    process.env.BABYSITTER_SESSION_ID || process.env.OPENCLAW_SHELL || "";

  if (!sessionId) {
    log.info("No session ID — skipping state file creation");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  // Resolve state directory and create baseline session file
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

  // Output empty object
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
// Adapter factory
// ---------------------------------------------------------------------------

export function createOpenClawAdapter(): HarnessAdapter {
  return {
    name: HARNESS_NAME,

    isActive(): boolean {
      return !!(process.env.OPENCLAW_SHELL || process.env.OPENCLAW_HOME);
    },

    autoResolvesSessionId(): boolean {
      return true;
    },

    getMissingSessionIdHint(): string {
      return (
        "Session ID is provided by the OpenClaw gateway. " +
        "Ensure you're running inside an OpenClaw agent session."
      );
    },

    supportsHookType(hookType: string): boolean {
      // OpenClaw hooks are registered programmatically via the daemon.
      // Only session-start is supported via the SDK hook:run path.
      return hookType === "session-start";
    },

    getUnsupportedHookMessage(hookType: string): string {
      if (hookType === "stop") {
        return (
          "OpenClaw does not support a blocking stop hook. " +
          "The daemon manages agent lifecycle via agent_end signals. " +
          "Use the OpenClaw gateway API instead."
        );
      }
      return `Hook type "${hookType}" is not supported by the OpenClaw adapter. OpenClaw hooks are registered programmatically.`;
    },

    getCapabilities(): HarnessCapability[] {
      return [
        HarnessCapability.SessionBinding,
        HarnessCapability.Mcp,
        HarnessCapability.HeadlessPrompt,
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

    resolvePluginRoot(_args: { pluginRoot?: string }): string | undefined {
      // OpenClaw has no OPENCLAW_PLUGIN_ROOT env var.
      return undefined;
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindSessionImpl(opts);
    },

    handleStopHook(_args: HookHandlerArgs): Promise<number> {
      // No-op: OpenClaw has no stop-hook model.
      writeNoopHookResult();
      return Promise.resolve(0);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleSessionStartHookImpl(args);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      // OpenClaw hooks are registered programmatically via the daemon.
      return null;
    },

    async isCliInstalled(): Promise<boolean> {
      const result = await checkCliAvailable("openclaw");
      return result.available;
    },

    async getCliInfo(): Promise<{
      command: string;
      version?: string;
      path?: string;
    }> {
      const result = await checkCliAvailable("openclaw");
      return {
        command: "openclaw",
        version: result.version,
        path: result.path,
      };
    },

    installHarness(
      options: HarnessInstallOptions,
    ): Promise<HarnessInstallResult> {
      return installCliViaNpm({
        harness: HARNESS_NAME,
        cliCommand: "openclaw",
        packageName: "openclaw",
        summary: "Install the OpenClaw CLI globally via npm.",
        options,
      });
    },

    installPlugin(
      options: HarnessInstallOptions,
    ): Promise<HarnessInstallResult> {
      return installCliViaNpm({
        harness: HARNESS_NAME,
        cliCommand: "openclaw",
        packageName: "@a5c-ai/babysitter-openclaw",
        summary:
          "Install the Babysitter OpenClaw plugin package, then register it via `openclaw plugin install babysitter-openclaw`.",
        options,
      });
    },

    getPromptContext(
      opts?: { interactive?: boolean | undefined },
    ): PromptContext {
      return createOpenClawContext(opts);
    },
  };
}
