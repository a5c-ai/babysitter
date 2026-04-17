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
import { createGithubCopilotContext } from "./promptContext";
import { installCliViaNpm } from "../installSupport";
import {
  handleGithubCopilotSessionEndHook,
  handleGithubCopilotSessionStartHook,
  resolveGithubCopilotSessionId,
  resolveGithubCopilotStateDir,
} from "./hooks";
export { setBabysitterSessionIdInCopilotEnvFile } from "./hooks";

const HARNESS_NAME = "github-copilot";
const resolveStateDirInternal = resolveGithubCopilotStateDir;

function resolvePluginRootInternal(args: { pluginRoot?: string }): string | undefined {
  const root =
    args.pluginRoot ||
    process.env.CLAUDE_PLUGIN_DATA ||
    process.env.COPILOT_PLUGIN_ROOT;
  return root ? path.resolve(root) : undefined;
}

const resolveSessionIdInternal = resolveGithubCopilotSessionId;

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

function findHookDispatcherPathImpl(startCwd: string): string | null {
  const pluginRoot = resolvePluginRootInternal({});
  if (pluginRoot) {
    const candidate = path.join(
      path.resolve(pluginRoot),
      "hooks.json",
    );
    if (existsSync(candidate)) return candidate;
  }

  let current = path.resolve(startCwd);
  const root = path.parse(current).root;

  while (current !== root) {
    const candidate = path.join(current, ".github", "copilot", "hooks.json");
    if (existsSync(candidate)) return candidate;

    const copilotCandidate = path.join(current, ".copilot", "hooks.json");
    if (existsSync(copilotCandidate)) return copilotCandidate;

    const a5cCandidate = path.join(current, ".a5c", "hooks.json");
    if (existsSync(a5cCandidate)) return a5cCandidate;

    current = path.dirname(current);
  }

  return null;
}

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
  return {
    harness: HARNESS_NAME,
    summary: "GitHub Copilot CLI plugin installation is not yet automated. " +
      "Configure hooks in .github/copilot/ or ~/.copilot/ manually.",
  };
}

export function createGithubCopilotAdapter(): HarnessAdapter {
  return {
    name: HARNESS_NAME,

    isActive(): boolean {
      return !!(
        process.env.BABYSITTER_SESSION_ID ||
        process.env.COPILOT_HOME ||
        process.env.COPILOT_GITHUB_TOKEN
      );
    },

    autoResolvesSessionId(): boolean {
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
      return handleGithubCopilotSessionEndHook(args);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleGithubCopilotSessionStartHook(args);
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
