/**
 * Custom harness adapter.
 *
 * Used when running babysitter outside any known harness environment.
 * Requires explicit `--session-id`, `--state-dir`, and other arguments
 * that known adapters (claude-code, codex, etc.) infer automatically
 * from environment variables.
 *
 * This is the fallback adapter when `detectAdapter()` finds no active
 * harness, replacing the null adapter as the default.
 */

import * as path from "node:path";
import { getGlobalStateDir } from "../config";
import type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
} from "./types";

export function createCustomAdapter(): HarnessAdapter {
  return {
    name: "custom",

    isActive(): boolean {
      // The custom adapter is never auto-detected — it is the explicit
      // fallback when no known harness environment is found.
      return false;
    },

    autoResolvesSessionId(): boolean {
      return false;
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      if (parsed.sessionId) return parsed.sessionId;
      // Cross-harness standard env var as fallback for custom adapters
      if (process.env.BABYSITTER_SESSION_ID) return process.env.BABYSITTER_SESSION_ID;
      return undefined;
    },

    resolveStateDir(args: { stateDir?: string; pluginRoot?: string }): string | undefined {
      if (args.stateDir) return path.resolve(args.stateDir);
      return getGlobalStateDir();
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      return args.pluginRoot ? path.resolve(args.pluginRoot) : undefined;
    },

    getMissingSessionIdHint(): string {
      return "Custom harness requires --session-id to be explicitly provided.";
    },

    supportsHookType(_hookType: string): boolean {
      // Custom adapter supports all hook types but with minimal/no-op handlers.
      return true;
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      if (!opts.sessionId) {
        return Promise.resolve({
          harness: "custom",
          sessionId: "",
          error: "Custom harness requires --session-id to be explicitly provided.",
          fatal: false,
        });
      }
      // Minimal binding — store state in the default location.
      return Promise.resolve({
        harness: "custom",
        sessionId: opts.sessionId,
      });
    },

    handleStopHook(_args: HookHandlerArgs): Promise<number> {
      // No harness lifecycle — approve (allow exit).
      process.stdout.write('{"decision":"approve"}\n');
      return Promise.resolve(0);
    },

    handleSessionStartHook(_args: HookHandlerArgs): Promise<number> {
      // No harness lifecycle — nothing to do.
      process.stdout.write("{}\n");
      return Promise.resolve(0);
    },

    findHookDispatcherPath(): string | null {
      return null;
    },
  };
}
