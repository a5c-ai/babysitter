import * as path from "node:path";
import { mkdirSync, appendFileSync } from "node:fs";
import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import type { SessionState } from "../../session/types";
import {
  getCurrentTimestamp,
  updateSessionState,
  writeSessionFile,
} from "../../session/write";
import type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
  HarnessInstallOptions,
  HarnessInstallResult,
} from "../types";
import { HarnessCapability } from "../types";
import type { PromptContext } from "../../prompts/types";
import { createOpenClawContext } from "./promptContext";
import { getGlobalLogDir, normalizeSessionStateDir } from "../../config";
import { checkCliAvailable } from "../discovery";
import { installCliViaNpm } from "../installSupport";

const HARNESS_NAME = "openclaw";

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

function resolveStateDirInternal(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  return normalizeSessionStateDir(
    args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
  );
}

function resolveSessionIdInternal(parsed: {
  sessionId?: string;
}): string | undefined {
  if (parsed.sessionId) return parsed.sessionId;
  if (process.env.BABYSITTER_SESSION_ID)
    return process.env.BABYSITTER_SESSION_ID;
  if (process.env.OPENCLAW_SHELL) return process.env.OPENCLAW_SHELL;
  return undefined;
}

function writeNoopHookResult(): void {
  process.stdout.write("{}\n");
}

async function handleSessionStartHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-openclaw-session-start-hook");
  log.info("handleSessionStartHook started (openclaw)");

  const sessionId =
    process.env.BABYSITTER_SESSION_ID || process.env.OPENCLAW_SHELL || "";

  if (!sessionId) {
    log.info("No session ID — skipping state file creation");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.warn(`Failed to create session state: ${msg}`);
    if (verbose) {
      process.stderr.write(
        `[hook:run session-start] Failed to create session state: ${msg}\n`,
      );
    }
  }

  process.stdout.write("{}\n");
  return 0;
}

async function bindSessionImpl(
  opts: SessionBindOptions,
): Promise<SessionBindResult> {
  const { sessionId, runId, maxIterations = 256, prompt, verbose } = opts;
  const stateDir = resolveStateDirInternal({
    stateDir: opts.stateDir,
    pluginRoot: opts.pluginRoot,
  });
  const filePath = getSessionFilePath(stateDir, sessionId);

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

  const nowTs = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    runIds: [],
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
      return undefined;
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindSessionImpl(opts);
    },

    handleStopHook(_args: HookHandlerArgs): Promise<number> {
      writeNoopHookResult();
      return Promise.resolve(0);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleSessionStartHookImpl(args);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
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
