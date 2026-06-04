/**
 * Internal harness adapter.
 *
 * The 'agent-core' harness represents the SDK's built-in programmatic execution
 * engine (agent-core). It is always available, requires no external CLI, and is
 * the default harness for `agent-platform create-run`.
 *
 * Unlike the 'pi' harness (which invokes the pi CLI as a child process), the
 * agent-core harness calls agent-core.prompt() directly in-process.
 */

import * as path from "node:path";
import {
  createClaudeCodeAdapter,
  normalizeSessionStateDir,
  type PromptContext,
  createInternalContext,
} from "@a5c-ai/babysitter-sdk";
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
  return normalizeSessionStateDir(
    args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
  );
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
    name: "agent-core",

    // The built-in agent-core harness is never auto-detected via env vars.
    // It is explicitly selected as the default or via --harness agent-core.
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
      return [
        Cap.Programmatic,
        Cap.SessionBinding,
        Cap.StopHook,
        Cap.HeadlessPrompt,
        Cap.ConcurrentEffects,
        Cap.BackgroundEffects,
        Cap.MultiHarnessDispatch,
      ];
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
      return { ...result, harness: "agent-core" };
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

    // Agent-core has no CLI to install — it IS the built-in runtime.
    // eslint-disable-next-line @typescript-eslint/require-await
    async installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return {
        harness: "agent-core",
        summary: "The agent-core harness is built into the babysitter SDK and requires no separate installation.",
        dryRun: options.dryRun,
      };
    },

    getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
      return createInternalContext(opts);
    },
  };
}
