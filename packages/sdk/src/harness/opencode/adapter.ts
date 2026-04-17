import * as path from "node:path";
import * as os from "node:os";
import { existsSync } from "node:fs";
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
import { createOpenCodeContext } from "./promptContext";
import {
  handleOpenCodeSessionStartHook,
  handleOpenCodeStopHook,
  resolveOpenCodeSessionId,
  resolveOpenCodeStateDir,
} from "./hooks";

const HARNESS_NAME = "opencode";
const resolveStateDirInternal = resolveOpenCodeStateDir;
const resolveSessionIdInternal = resolveOpenCodeSessionId;

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
  const accomplishTaskId = process.env.ACCOMPLISH_TASK_ID;
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    runIds: [],
    startedAt: nowTs,
    lastIterationAt: nowTs,
    iterationTimes: [],
    ...(accomplishTaskId ? { metadata: { accomplishTaskId } } : {}),
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

function installOpenCodePlugin(
  _options: HarnessInstallOptions,
): HarnessInstallResult {
  return {
    harness: HARNESS_NAME,
    summary: "OpenCode plugin installation is not yet automated. " +
      "Place babysitter plugin files in .opencode/plugins/babysitter/ manually.",
  };
}

function getAccomplishDataDirs(): string[] {
  const dirs: string[] = [];
  const configDir = process.env.OPENCODE_CONFIG_DIR;
  if (configDir) {
    const parent = path.dirname(configDir);
    if (parent && parent !== configDir) {
      dirs.push(parent);
    }
  }

  const home = os.homedir();
  const platform = process.platform;

  if (platform === "darwin") {
    dirs.push(path.join(home, "Library", "Application Support", "Accomplish"));
  } else if (platform === "win32") {
    if (process.env.APPDATA) {
      dirs.push(path.join(process.env.APPDATA, "Accomplish"));
    }
    if (process.env.LOCALAPPDATA) {
      dirs.push(path.join(process.env.LOCALAPPDATA, "Accomplish"));
    }
  } else {
    dirs.push(path.join(home, ".config", "Accomplish"));
  }

  return dirs;
}

export function createOpenCodeAdapter(): HarnessAdapter {
  return {
    name: HARNESS_NAME,

    isActive(): boolean {
      return !!(
        process.env.BABYSITTER_SESSION_ID ||
        process.env.OPENCODE_CONFIG ||
        process.env.ACCOMPLISH_TASK_ID
      );
    },

    autoResolvesSessionId(): boolean {
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
      if (args.pluginRoot) return path.resolve(args.pluginRoot);
      if (process.env.OPENCODE_PLUGIN_ROOT) {
        return path.resolve(process.env.OPENCODE_PLUGIN_ROOT);
      }
      const configDir = process.env.OPENCODE_CONFIG_DIR;
      if (configDir) {
        const candidate = path.resolve(configDir, "plugins", "babysitter");
        if (existsSync(candidate)) return candidate;
      }
      for (const dataDir of getAccomplishDataDirs()) {
        const candidate = path.join(dataDir, "opencode", "plugins", "babysitter");
        if (existsSync(candidate)) return candidate;
      }

      return undefined;
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindSessionImpl(opts);
    },

    handleStopHook(args: HookHandlerArgs): Promise<number> {
      return handleOpenCodeStopHook(args);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleOpenCodeSessionStartHook(args);
    },

    findHookDispatcherPath(startCwd: string): string | null {
      let current = path.resolve(startCwd);
      const root = path.parse(current).root;

      while (current !== root) {
        const candidate = path.join(current, ".opencode", "plugins", "babysitter", "index.js");
        if (existsSync(candidate)) return candidate;

        const tsCandidate = path.join(current, ".opencode", "plugins", "babysitter", "index.ts");
        if (existsSync(tsCandidate)) return tsCandidate;

        current = path.dirname(current);
      }

      const accomplishDirs = getAccomplishDataDirs();
      for (const dataDir of accomplishDirs) {
        const candidate = path.join(dataDir, "opencode", "plugins", "babysitter", "index.js");
        if (existsSync(candidate)) return candidate;
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
