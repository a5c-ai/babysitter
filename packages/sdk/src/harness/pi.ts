import * as path from "node:path";
import type {
  HarnessAdapter,
  HarnessCapability,
  HookHandlerArgs,
  HarnessInstallOptions,
  HarnessInstallResult,
  SessionBindOptions,
  SessionBindResult,
} from "./types";
import { HarnessCapability as Cap } from "./types";
import type { PromptContext } from "../prompts/types";
import { createPiContext } from "../prompts/context";
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
import {
  installCliViaNpm,
  runPackageBinaryViaNpx,
} from "./installSupport";

function resolvePiPluginRoot(
  args: { pluginRoot?: string } = {},
): string | undefined {
  const root = args.pluginRoot || process.env.PI_PLUGIN_ROOT;
  return root ? path.resolve(root) : undefined;
}

function resolvePiStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  if (args.stateDir) return path.resolve(args.stateDir);
  return getGlobalStateDir();
}

function resolvePiSessionId(parsed: { sessionId?: string }): string | undefined {
  if (parsed.sessionId) return parsed.sessionId;
  if (process.env.BABYSITTER_SESSION_ID) return process.env.BABYSITTER_SESSION_ID;
  if (process.env.PI_SESSION_ID) return process.env.PI_SESSION_ID;
  return undefined;
}

async function bindPiSession(
  opts: SessionBindOptions,
): Promise<SessionBindResult> {
  const stateDir = resolvePiStateDir({
    stateDir: opts.stateDir,
    pluginRoot: opts.pluginRoot,
  });
  const stateFile = getSessionFilePath(stateDir, opts.sessionId);

  if (await sessionFileExists(stateFile)) {
    const existing = await readSessionFile(stateFile);
    if (existing.state.runId && existing.state.runId !== opts.runId) {
      return {
        harness: "pi",
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
      harness: "pi",
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
    harness: "pi",
    sessionId: opts.sessionId,
    stateFile,
  };
}

function writeNoopHookResult(): void {
  process.stdout.write("{}\n");
}

async function installPiFamilyPlugin(args: {
  harness: "pi" | "oh-my-pi";
  packageName: string;
  options: HarnessInstallOptions;
}): Promise<HarnessInstallResult> {
  const packageArgs = ["install"];
  if (args.options.workspace) {
    packageArgs.push("--workspace", path.resolve(args.options.workspace));
  } else {
    packageArgs.push("--global");
  }

  return runPackageBinaryViaNpx({
    harness: args.harness,
    packageName: args.packageName,
    packageArgs,
    summary: args.options.workspace
      ? `Install the published Babysitter ${args.harness} package for the target workspace.`
      : `Install the published Babysitter ${args.harness} package into the user profile.`,
    options: args.options,
    env: process.env,
  });
}

export async function installPiPlugin(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  return installPiFamilyPlugin({
    harness: "pi",
    packageName: "@a5c-ai/babysitter-pi",
    options,
  });
}

export function createPiAdapter(): HarnessAdapter {
  return {
    name: "pi",

    isActive(): boolean {
      return !!(
        process.env.BABYSITTER_SESSION_ID ||
        process.env.PI_SESSION_ID ||
        process.env.PI_PLUGIN_ROOT
      );
    },

    autoResolvesSessionId(): boolean {
      return true;
    },

    getMissingSessionIdHint(): string {
      return "Pi should provide PI_SESSION_ID when the Babysitter package is active.";
    },

    supportsHookType(_hookType: string): boolean {
      return false;
    },

    getUnsupportedHookMessage(hookType: string): string {
      return `Pi does not use babysitter hook:run for "${hookType}". Use the Pi package skills and extension bridge instead.`;
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      return resolvePiSessionId(parsed);
    },

    resolveStateDir(args: {
      stateDir?: string;
      pluginRoot?: string;
    }): string | undefined {
      return resolvePiStateDir(args);
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      return resolvePiPluginRoot(args);
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindPiSession(opts);
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
        harness: "pi",
        cliCommand: "pi",
        packageName: "@mariozechner/pi-coding-agent",
        summary: "Install the Pi Coding Agent CLI globally via npm.",
        options,
      });
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installPiPlugin(options);
    },

    getCapabilities(): HarnessCapability[] {
      return [Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt];
    },

    getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
      return createPiContext(opts);
    },
  };
}
