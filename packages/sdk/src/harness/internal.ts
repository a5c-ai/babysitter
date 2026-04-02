/**
 * Internal harness adapter.
 *
 * The 'internal' harness represents the SDK's built-in programmatic execution
 * engine (piWrapper). It is always available, requires no external CLI, and is
 * the default harness for harness:create-run.
 *
 * Unlike the 'pi' harness (which invokes the pi CLI as a child process), the
 * internal harness calls piWrapper.prompt() directly in-process.
 */

import * as path from "node:path";
import { createClaudeCodeAdapter } from "./claudeCode";
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

function resolveInternalPluginRoot(
  args: { pluginRoot?: string } = {},
): string | undefined {
  const root =
    args.pluginRoot || process.env.OMP_PLUGIN_ROOT || process.env.PI_PLUGIN_ROOT;
  return root ? path.resolve(root) : undefined;
}

function resolveInternalStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  if (args.stateDir) return path.resolve(args.stateDir);
  if (process.env.BABYSITTER_STATE_DIR) {
    return path.resolve(process.env.BABYSITTER_STATE_DIR);
  }

  const pluginRoot = resolveInternalPluginRoot(args);
  if (pluginRoot) {
    return path.resolve(pluginRoot, "..", ".a5c");
  }

  return path.resolve(".a5c");
}

function resolveInternalSessionId(parsed: { sessionId?: string }): string | undefined {
  if (parsed.sessionId) return parsed.sessionId;
  if (process.env.OMP_SESSION_ID) return process.env.OMP_SESSION_ID;
  if (process.env.PI_SESSION_ID) return process.env.PI_SESSION_ID;
  return undefined;
}

export function createInternalAdapter(): HarnessAdapter {
  const claude = createClaudeCodeAdapter();

  return {
    name: "internal",

    // The internal harness is never auto-detected via env vars.
    // It is explicitly selected as the default or via --harness internal.
    isActive(): boolean {
      return false;
    },

    autoResolvesSessionId(): boolean {
      return true;
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      return resolveInternalSessionId(parsed);
    },

    resolveStateDir(args: {
      stateDir?: string;
      pluginRoot?: string;
    }): string | undefined {
      return resolveInternalStateDir(args);
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      return resolveInternalPluginRoot(args);
    },

    getCapabilities(): HarnessCapability[] {
      return [Cap.Programmatic, Cap.SessionBinding, Cap.StopHook, Cap.HeadlessPrompt];
    },

    async bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      const stateDir = resolveInternalStateDir({
        stateDir: opts.stateDir,
        pluginRoot: opts.pluginRoot,
      });
      const result = await claude.bindSession({
        ...opts,
        stateDir,
      });
      return { ...result, harness: "internal" };
    },

    handleStopHook(args: HookHandlerArgs): Promise<number> {
      const pluginRoot = resolveInternalPluginRoot(args);
      const stateDir = resolveInternalStateDir({
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
      const pluginRoot = resolveInternalPluginRoot(args);
      const stateDir = resolveInternalStateDir({
        stateDir: args.stateDir,
        pluginRoot,
      });
      return claude.handleSessionStartHook({
        ...args,
        pluginRoot,
        stateDir,
      });
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      return null;
    },

    // Internal harness has no CLI to install — it IS the SDK.
    // eslint-disable-next-line @typescript-eslint/require-await
    async installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return {
        harness: "internal",
        summary: "The internal harness is built into the babysitter SDK and requires no separate installation.",
        dryRun: options.dryRun,
      };
    },

    getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
      return createPiContext(opts);
    },
  };
}
