import * as path from "node:path";
import type {
  HarnessAdapter,
  HarnessCapability,
  HarnessInstallOptions,
  HarnessInstallResult,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
} from "./types";
import { HarnessCapability as Cap } from "./types";
import type { PromptContext } from "../prompts/types";
import { createOhMyPiContext } from "../prompts/context";
import { getGlobalStateDir } from "../config";
import {
  getCurrentTimestamp,
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
  updateSessionState,
  writeSessionFile,
} from "../session";
import type { SessionState } from "../session";
import { installCliViaNpm, runPackageBinaryViaNpx } from "./installSupport";

function resolveOhMyPiPluginRoot(
  args: { pluginRoot?: string } = {},
): string | undefined {
  const root = args.pluginRoot || process.env.OMP_PLUGIN_ROOT;
  return root ? path.resolve(root) : undefined;
}

function resolveOhMyPiStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  if (args.stateDir) return path.resolve(args.stateDir);
  return getGlobalStateDir();
}

function resolveOhMyPiSessionId(parsed: { sessionId?: string }): string | undefined {
  if (parsed.sessionId) return parsed.sessionId;
  if (process.env.BABYSITTER_SESSION_ID) return process.env.BABYSITTER_SESSION_ID;
  if (process.env.OMP_SESSION_ID) return process.env.OMP_SESSION_ID;
  return undefined;
}

async function bindOhMyPiSession(
  opts: SessionBindOptions,
): Promise<SessionBindResult> {
  const stateDir = resolveOhMyPiStateDir({
    stateDir: opts.stateDir,
    pluginRoot: opts.pluginRoot,
  });
  const stateFile = getSessionFilePath(stateDir, opts.sessionId);

  if (await sessionFileExists(stateFile)) {
    const existing = await readSessionFile(stateFile);
    if (existing.state.runId && existing.state.runId !== opts.runId) {
      return {
        harness: "oh-my-pi",
        sessionId: opts.sessionId,
        stateFile,
        error: `Session already associated with run ${existing.state.runId}`,
      };
    }

    await updateSessionState(
      stateFile,
      { active: true, runId: opts.runId },
      existing,
    );
    return {
      harness: "oh-my-pi",
      sessionId: opts.sessionId,
      stateFile,
    };
  }

  const now = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations: opts.maxIterations ?? 256,
    runId: opts.runId,
    startedAt: now,
    lastIterationAt: now,
    iterationTimes: [],
  };
  await writeSessionFile(stateFile, state, opts.prompt);

  return {
    harness: "oh-my-pi",
    sessionId: opts.sessionId,
    stateFile,
  };
}

function writeNoopHookResult(): void {
  process.stdout.write("{}\n");
}

async function installOhMyPiPlugin(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  const packageArgs = ["install"];
  if (options.workspace) {
    packageArgs.push("--workspace", path.resolve(options.workspace));
  } else {
    packageArgs.push("--global");
  }

  return runPackageBinaryViaNpx({
    harness: "oh-my-pi",
    packageName: "@a5c-ai/babysitter-omp",
    packageArgs,
    summary: options.workspace
      ? "Install the published Babysitter oh-my-pi package for the target workspace."
      : "Install the published Babysitter oh-my-pi package into the user profile.",
    options,
    env: process.env,
  });
}

export function createOhMyPiAdapter(): HarnessAdapter {
  return {
    name: "oh-my-pi",

    isActive(): boolean {
      return !!(
        process.env.BABYSITTER_SESSION_ID ||
        process.env.OMP_SESSION_ID ||
        process.env.OMP_PLUGIN_ROOT
      );
    },

    autoResolvesSessionId(): boolean {
      return true;
    },

    getMissingSessionIdHint(): string {
      return "oh-my-pi should provide OMP_SESSION_ID when the Babysitter package is active.";
    },

    supportsHookType(_hookType: string): boolean {
      return false;
    },

    getUnsupportedHookMessage(hookType: string): string {
      return `oh-my-pi does not use babysitter hook:run for "${hookType}". Use the oh-my-pi package skills and extension bridge instead.`;
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      return resolveOhMyPiSessionId(parsed);
    },

    resolveStateDir(args: {
      stateDir?: string;
      pluginRoot?: string;
    }): string | undefined {
      return resolveOhMyPiStateDir(args);
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      return resolveOhMyPiPluginRoot(args);
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindOhMyPiSession(opts);
    },

    handleStopHook(_args: HookHandlerArgs): Promise<number> {
      writeNoopHookResult();
      return Promise.resolve(0);
    },

    handleSessionStartHook(_args: HookHandlerArgs): Promise<number> {
      writeNoopHookResult();
      return Promise.resolve(0);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      return null;
    },

    installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installCliViaNpm({
        harness: "oh-my-pi",
        cliCommand: "omp",
        packageName: "@oh-my-pi/pi-coding-agent",
        summary: "Install the oh-my-pi CLI globally via npm.",
        options,
      });
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installOhMyPiPlugin(options);
    },

    getCapabilities(): HarnessCapability[] {
      return [Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt, Cap.Mcp];
    },

    getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
      return createOhMyPiContext(opts);
    },
  };
}
