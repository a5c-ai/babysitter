import * as path from "node:path";
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
import { createCursorContext } from "./promptContext";
import {
  handleCursorSessionStartHook,
  handleCursorStopHook,
  resolveCursorStateDir,
} from "./hooks";
import { readSessionMarker } from "../../utils/sessionMarker";

const HARNESS_NAME = "cursor";
const resolveStateDirInternal = resolveCursorStateDir;

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

function installCursorHarness(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
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

export function createCursorAdapter(): HarnessAdapter {
  return {
    name: HARNESS_NAME,

    isActive(): boolean {
      return !!(
        process.env.CURSOR_PROJECT_DIR ||
        process.env.CURSOR_VERSION
      );
    },

    autoResolvesSessionId(): boolean {
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
      if (parsed.sessionId) return parsed.sessionId;
      const trustEnv = process.env.BABYSITTER_TRUST_ENV_SESSION === "1";
      if (trustEnv) {
        if (process.env.BABYSITTER_SESSION_ID) return process.env.BABYSITTER_SESSION_ID;
        return undefined;
      }
      if (process.env.BABYSITTER_SESSION_ID) return process.env.BABYSITTER_SESSION_ID;
      const fromMarker = readSessionMarker("cursor");
      if (fromMarker) return fromMarker;
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
      return handleCursorStopHook(args);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleCursorSessionStartHook(args);
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
