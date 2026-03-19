/**
 * Codex harness adapter.
 *
 * Codex can participate in session binding and state resolution, but it does
 * not expose the Claude-style blocking stop/session-start hook contract.
 * Keep this adapter honest: support explicit run binding and env detection,
 * but reject fictional hook-driven orchestration.
 */

import * as path from "node:path";
import { readFileSync } from "node:fs";
import { createClaudeCodeAdapter } from "./claudeCode";
import type {
  HarnessAdapter,
  HookHandlerArgs,
  SessionBindOptions,
  SessionBindResult,
} from "./types";

function resolveCodexPluginRoot(
  args: { pluginRoot?: string } = {},
): string | undefined {
  const root = args.pluginRoot || process.env.CODEX_PLUGIN_ROOT;
  return root ? path.resolve(root) : undefined;
}

function resolveCodexStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  if (args.stateDir) return path.resolve(args.stateDir);
  if (process.env.BABYSITTER_STATE_DIR) {
    return path.resolve(process.env.BABYSITTER_STATE_DIR);
  }

  const pluginRoot = resolveCodexPluginRoot(args);
  if (pluginRoot) {
    // Codex plugins conventionally live under ".codex", while state is in ".a5c".
    return path.resolve(pluginRoot, "..", ".a5c");
  }

  return path.resolve(".a5c");
}

function resolveCodexSessionId(parsed: { sessionId?: string }): string | undefined {
  if (parsed.sessionId) return parsed.sessionId;
  // Codex injects CODEX_THREAD_ID; keep CODEX_SESSION_ID as legacy fallback.
  if (process.env.CODEX_THREAD_ID) return process.env.CODEX_THREAD_ID;
  if (process.env.CODEX_SESSION_ID) return process.env.CODEX_SESSION_ID;

  const envFile = process.env.CODEX_ENV_FILE;
  if (!envFile) return undefined;

  try {
    const content = readFileSync(envFile, "utf-8");
    const match = content.match(
      /(?:^|\n)\s*(?:export\s+)?(?:CODEX_THREAD_ID|CODEX_SESSION_ID)="([^"]+)"/,
    );
    return match?.[1] || undefined;
  } catch {
    return undefined;
  }
}

export function createCodexAdapter(): HarnessAdapter {
  const claude = createClaudeCodeAdapter();
  const unsupportedHookMessage = (
    hookType: string,
  ): string => (
    `Codex does not support the babysitter "${hookType}" hook contract. ` +
    `Use explicit --session-id binding plus the external Codex supervisor ` +
    `or notify-based monitoring instead.`
  );

  return {
    name: "codex",

    isActive(): boolean {
      return !!(
        process.env.CODEX_THREAD_ID ||
        process.env.CODEX_SESSION_ID ||
        process.env.CODEX_ENV_FILE ||
        process.env.CODEX_PLUGIN_ROOT
      );
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      return resolveCodexSessionId(parsed);
    },

    resolveStateDir(args: {
      stateDir?: string;
      pluginRoot?: string;
    }): string | undefined {
      return resolveCodexStateDir(args);
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      return resolveCodexPluginRoot(args);
    },

    getMissingSessionIdHint(): string {
      return (
        "Use --session-id explicitly, or launch through the Codex babysitter " +
        "supervisor so it can provide a stable session/thread ID."
      );
    },

    supportsHookType(hookType: string): boolean {
      return hookType !== "stop" && hookType !== "session-start";
    },

    getUnsupportedHookMessage(hookType: string): string {
      return unsupportedHookMessage(hookType);
    },

    async bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      const stateDir = resolveCodexStateDir({
        stateDir: opts.stateDir,
        pluginRoot: opts.pluginRoot,
      });
      const result = await claude.bindSession({
        ...opts,
        stateDir,
      });
      return {
        ...result,
        harness: "codex",
      };
    },

    handleStopHook(_args: HookHandlerArgs): Promise<number> {
      process.stderr.write(`${unsupportedHookMessage("stop")}\n`);
      return Promise.resolve(1);
    },

    handleSessionStartHook(_args: HookHandlerArgs): Promise<number> {
      process.stderr.write(`${unsupportedHookMessage("session-start")}\n`);
      return Promise.resolve(1);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      return null;
    },
  };
}
