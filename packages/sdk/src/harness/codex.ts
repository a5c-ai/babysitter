/**
 * Codex harness adapter.
 *
 * Extends the SDK harness layer with "codex" support while reusing the
 * mature Claude stop/session-start hook handlers. The Codex adapter maps
 * Codex-specific environment conventions to the generic adapter interface.
 */

import * as path from "node:path";
import { existsSync, readFileSync } from "node:fs";
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

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      const stateDir = resolveCodexStateDir({
        stateDir: opts.stateDir,
        pluginRoot: opts.pluginRoot,
      });
      return claude.bindSession({
        ...opts,
        stateDir,
      });
    },

    handleStopHook(args: HookHandlerArgs): Promise<number> {
      const pluginRoot = resolveCodexPluginRoot(args);
      const stateDir = resolveCodexStateDir({
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
      const pluginRoot = resolveCodexPluginRoot(args);
      const stateDir = resolveCodexStateDir({
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
      const pluginRoot = resolveCodexPluginRoot();
      if (pluginRoot) {
        const candidate = path.join(pluginRoot, "hooks", "hook-dispatcher.sh");
        if (existsSync(candidate)) return candidate;
      }

      const local = path.join(path.resolve(startCwd), ".codex", "hooks", "hook-dispatcher.sh");
      if (existsSync(local)) return local;

      return null;
    },
  };
}
