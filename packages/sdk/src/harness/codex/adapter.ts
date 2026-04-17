import { createClaudeCodeAdapter } from "../claudeCode";
import type {
  HarnessAdapter,
  HarnessInstallOptions,
  HarnessInstallResult,
  SessionBindOptions,
  SessionBindResult,
} from "../types";
import type { PromptContext } from "../../prompts/types";
import { createCodexContext } from "./promptContext";
import { handleCodexSessionStartHook, handleCodexStopHook } from "./hooks";
import { installCodexHarness, installCodexPlugin } from "./install";
import {
  resolveCodexPluginRoot,
  resolveCodexSessionId,
  resolveCodexStateDir,
} from "./shared";

export function createCodexAdapter(): HarnessAdapter {
  const claude = createClaudeCodeAdapter();

  return {
    name: "codex",

    isActive(): boolean {
      return !!(
        process.env.BABYSITTER_SESSION_ID ||
        process.env.CODEX_THREAD_ID ||
        process.env.CODEX_SESSION_ID ||
        process.env.CODEX_PLUGIN_ROOT
      );
    },

    autoResolvesSessionId(): boolean {
      return true;
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
        "Use --session-id explicitly, or launch through a Codex hook callback " +
        "that provides a stable session/thread ID."
      );
    },

    supportsHookType(hookType: string): boolean {
      void hookType;
      return true;
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

    handleStopHook(args) {
      return handleCodexStopHook(args, claude);
    },

    handleSessionStartHook(args) {
      return handleCodexSessionStartHook(args);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      return null;
    },

    installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installCodexHarness(options);
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installCodexPlugin(options);
    },

    getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
      return createCodexContext(opts);
    },
  };
}
