/**
 * Null harness adapter (no-op fallback).
 *
 * Used when no harness is detected or the SDK is running standalone.
 * All methods return safe defaults that allow normal operation.
 */

import type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
} from "./types";

export function createNullAdapter(): HarnessAdapter {
  return {
    name: "none",

    isActive(): boolean {
      return false;
    },

    resolveSessionId(): string | undefined {
      return undefined;
    },

    resolveStateDir(): string | undefined {
      return undefined;
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      return args.pluginRoot || undefined;
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return Promise.resolve({
        harness: "none",
        sessionId: opts.sessionId,
        error: "No harness adapter active — session not bound",
      });
    },

    handleStopHook(_args: HookHandlerArgs): Promise<number> {
      // No harness → approve (allow exit)
      process.stdout.write('{"decision":"approve"}\n');
      return Promise.resolve(0);
    },

    handleSessionStartHook(_args: HookHandlerArgs): Promise<number> {
      // No harness → nothing to do
      process.stdout.write("{}\n");
      return Promise.resolve(0);
    },

    findHookDispatcherPath(): string | null {
      return null;
    },
  };
}
