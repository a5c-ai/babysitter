/**
 * Oh-My-Pi harness adapter.
 *
 * Extends the SDK harness layer with "pi" support while reusing the
 * mature Claude stop/session-start hook handlers. The Pi adapter maps
 * Oh-My-Pi-specific environment conventions to the generic adapter interface.
 */

import * as path from "node:path";
import { existsSync } from "node:fs";
import * as os from "node:os";
import { createClaudeCodeAdapter } from "./claudeCode";
import type {
  HarnessAdapter,
  HookHandlerArgs,
  HarnessInstallOptions,
  HarnessInstallResult,
  SessionBindOptions,
  SessionBindResult,
} from "./types";
import {
  installCliViaNpm,
  runPackageBinaryViaNpx,
} from "./installSupport";
import {
  BabysitterRuntimeError,
  ErrorCategory,
} from "../runtime/exceptions";

function resolvePiPluginRoot(
  args: { pluginRoot?: string } = {},
): string | undefined {
  const root =
    args.pluginRoot || process.env.OMP_PLUGIN_ROOT || process.env.PI_PLUGIN_ROOT;
  return root ? path.resolve(root) : undefined;
}

function resolvePiStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  if (args.stateDir) return path.resolve(args.stateDir);
  if (process.env.BABYSITTER_STATE_DIR) {
    return path.resolve(process.env.BABYSITTER_STATE_DIR);
  }

  const pluginRoot = resolvePiPluginRoot(args);
  if (pluginRoot) {
    // Oh-My-Pi plugins conventionally live under ".omp", while state is in ".a5c".
    return path.resolve(pluginRoot, "..", ".a5c");
  }

  return path.resolve(".a5c");
}

function resolvePiSessionId(parsed: { sessionId?: string }): string | undefined {
  if (parsed.sessionId) return parsed.sessionId;
  if (process.env.OMP_SESSION_ID) return process.env.OMP_SESSION_ID;
  if (process.env.PI_SESSION_ID) return process.env.PI_SESSION_ID;
  return undefined;
}

async function installPiFamilyHarness(args: {
  harness: "pi" | "oh-my-pi";
  cliCommand: "pi" | "omp";
  packageName: string;
  options: HarnessInstallOptions;
}): Promise<HarnessInstallResult> {
  return installCliViaNpm({
    harness: args.harness,
    cliCommand: args.cliCommand,
    packageName: args.packageName,
    summary: `Install the ${args.harness} CLI globally via npm.`,
    options: args.options,
  });
}

function getPiPluginInstallRoot(args: {
  harness: "pi" | "oh-my-pi";
  workspace?: string;
}): string {
  const base = path.resolve(args.workspace ?? os.homedir());
  const pluginsDir = args.harness === "oh-my-pi"
    ? path.join(base, ".omp", "plugins")
    : path.join(base, ".pi", "plugins");
  return path.join(pluginsDir, "babysitter-pi");
}

export async function installPiFamilyPlugin(args: {
  harness: "pi" | "oh-my-pi";
  options: HarnessInstallOptions;
}): Promise<HarnessInstallResult> {
  const targetDir = getPiPluginInstallRoot({
    harness: args.harness,
    workspace: args.options.workspace,
  });
  if (existsSync(targetDir)) {
    return {
      harness: args.harness,
      warning: "The Babysitter PI plugin is already installed at the target location; skipping reinstall.",
      location: targetDir,
    };
  }

  const packageArgs = ["install", "--harness", args.harness];
  if (args.options.workspace) {
    packageArgs.push("--workspace", path.resolve(args.options.workspace));
  } else {
    packageArgs.push("--global");
  }

  return runPackageBinaryViaNpx({
    harness: args.harness,
    packageName: "@a5c-ai/babysitter-pi",
    packageArgs,
    summary: args.options.workspace
      ? `Install the published Babysitter PI plugin into the target workspace for ${args.harness}.`
      : `Install the published Babysitter PI plugin into the user-level ${args.harness} plugin directory.`,
    options: args.options,
    env: process.env,
    location: targetDir,
  });
}

export function createPiAdapter(): HarnessAdapter {
  const claude = createClaudeCodeAdapter();

  return {
    name: "pi",

    isActive(): boolean {
      return !!(
        process.env.OMP_SESSION_ID ||
        process.env.PI_SESSION_ID ||
        process.env.OMP_PLUGIN_ROOT ||
        process.env.PI_PLUGIN_ROOT
      );
    },

    autoResolvesSessionId(): boolean {
      return true;
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

    async bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      const stateDir = resolvePiStateDir({
        stateDir: opts.stateDir,
        pluginRoot: opts.pluginRoot,
      });
      const result = await claude.bindSession({
        ...opts,
        stateDir,
      });
      return { ...result, harness: "pi" };
    },

    handleStopHook(args: HookHandlerArgs): Promise<number> {
      const pluginRoot = resolvePiPluginRoot(args);
      const stateDir = resolvePiStateDir({
        stateDir: args.stateDir,
        pluginRoot,
      });
      return claude.handleStopHook({
        ...args,
        pluginRoot,
        stateDir,
      });
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      const pluginRoot = resolvePiPluginRoot(args);
      const stateDir = resolvePiStateDir({
        stateDir: args.stateDir,
        pluginRoot,
      });
      return claude.handleSessionStartHook({
        ...args,
        pluginRoot,
        stateDir,
      });
    },

    findHookDispatcherPath(startCwd: string): string | null {
      const pluginRoot = resolvePiPluginRoot();
      if (pluginRoot) {
        const candidate = path.join(pluginRoot, "hooks", "hook-dispatcher.sh");
        if (existsSync(candidate)) return candidate;
      }

      const local = path.join(path.resolve(startCwd), ".omp", "hooks", "hook-dispatcher.sh");
      if (existsSync(local)) return local;

      return null;
    },

    installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installPiFamilyHarness({
        harness: "pi",
        cliCommand: "pi",
        packageName: "@mariozechner/pi-coding-agent",
        options,
      });
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installPiFamilyPlugin({
        harness: "pi",
        options,
      });
    },
  };
}
