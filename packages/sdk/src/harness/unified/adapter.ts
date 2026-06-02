/**
 * Unified harness adapter.
 *
 * Delegates hook plumbing to @a5c-ai/agent-mux-hooks-cli via subprocess while
 * keeping babysitter-specific orchestration logic (iteration tracking,
 * journal inspection, continuation building) in the SDK.
 *
 * This adapter is the DEFAULT fallback when no harness-specific adapter
 * is detected.  It imports NO hooks-mux packages — all communication
 * is via subprocess stdin/stdout and environment variables.
 *
 * Key env vars:
 * - AGENT_UNIFIED_ADAPTER=1        — force-enable the adapter
 * - AGENT_SESSION_ID               — session identifier (hooks-mux convention)
 * - AGENT_CAPABILITIES_JSON        — JSON-serialised proxy capabilities
 * - AGENT_HOOKS_PROXY_PATH         — custom path to the hooks-mux binary
 * - AGENT_SESSION_ID               — session ID (from hooks-mux)
 */

import * as path from "node:path";
import { normalizeSessionStateDir } from "../../config";
import { HarnessCapability } from "../types";
import type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
} from "../types";
import type { PromptContext } from "../../prompts/types";
import {
  deriveCapabilitiesFromProxy,
  type ProxyCapabilities,
} from "./capabilities";
import { createUnifiedContext } from "./promptContext";
import { handleStopHookCommon } from "../hooks/stopHookHandler";
import { buildStopHookContinuation } from "../hooks/stopHookContinuation";
import { initializeSessionState } from "../hooks/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse AGENT_CAPABILITIES_JSON from the environment.
 * Returns `undefined` when absent or malformed.
 */
function readProxyCapabilities(): ProxyCapabilities | undefined {
  const raw = process.env.AGENT_CAPABILITIES_JSON;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as ProxyCapabilities;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

export function createUnifiedAdapter(): HarnessAdapter {
  return {
    name: "unified",

    // ── Detection ──────────────────────────────────────────────────────

    isActive(): boolean {
      return process.env.AGENT_UNIFIED_ADAPTER === "1";
    },

    autoResolvesSessionId(): boolean {
      // The unified adapter reads AGENT_SESSION_ID automatically.
      return !!process.env.AGENT_SESSION_ID;
    },

    // ── Resolution ─────────────────────────────────────────────────────

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      if (parsed.sessionId) return parsed.sessionId;
      if (process.env.AGENT_SESSION_ID) return process.env.AGENT_SESSION_ID;
      return undefined;
    },

    resolveStateDir(args: {
      stateDir?: string;
      pluginRoot?: string;
    }): string | undefined {
      return normalizeSessionStateDir(
        args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
      );
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      if (args.pluginRoot) return path.resolve(args.pluginRoot);
      if (process.env.AGENT_PLUGIN_ROOT)
        return path.resolve(process.env.AGENT_PLUGIN_ROOT);
      return undefined;
    },

    getMissingSessionIdHint(): string {
      return (
        "Set AGENT_SESSION_ID (hooks-mux convention) or pass --session-id explicitly."
      );
    },

    supportsHookType(_hookType: string): boolean {
      // The unified adapter supports all hook types — hooks-mux
      // handles the actual dispatch to the underlying harness.
      return true;
    },

    // ── Capabilities ───────────────────────────────────────────────────

    getCapabilities(): HarnessCapability[] {
      const proxy = readProxyCapabilities();
      if (proxy) {
        return deriveCapabilitiesFromProxy(proxy);
      }
      // Default minimal capabilities
      return [
        HarnessCapability.Programmatic,
        HarnessCapability.SessionBinding,
      ];
    },

    // ── Session binding ────────────────────────────────────────────────

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      const sessionId =
        opts.sessionId ||
        process.env.AGENT_SESSION_ID;

      if (!sessionId) {
        return Promise.resolve({
          harness: "unified",
          sessionId: "",
          error:
            "Unified adapter requires a session ID. " +
            "Set AGENT_SESSION_ID or pass --session-id.",
          fatal: false,
        });
      }

      return Promise.resolve({
        harness: "unified",
        sessionId,
      });
    },

    // ── Hook handlers (shared orchestration logic) ─────────────────────

    async handleStopHook(args: HookHandlerArgs): Promise<number> {
      // Use the shared stop hook handler — works for all harnesses
      const common = await handleStopHookCommon(args, {
        harness: "unified",
        sessionIdFields: ["session_id"],
        useDetailedRunState: true,
        pluginRootEnvVars: ["AGENT_PLUGIN_ROOT"],
        resolveStateDir: (a) =>
          normalizeSessionStateDir(
            a.stateDir ?? process.env.BABYSITTER_STATE_DIR,
          ),
      });
      if (!common.shouldContinue) {
        if (!common.exitReason || common.exitReason === "stdin_error") {
          // Already wrote output in handleStopHookCommon
        }
        return common.exitCode;
      }
      const { reason, systemMessage } = await buildStopHookContinuation({
        nextIteration: common.nextIteration,
        maxIterations: common.state.maxIterations,
        runState: common.runStateDetails?.runState ?? "",
        pendingKinds: common.runStateDetails?.pendingKinds ?? "",
        completionProof: common.runStateDetails?.completionProof ?? "",
        prompt: common.prompt,
        resolvedPluginRoot: common.resolvedPluginRoot,
        runId: common.state.runId ?? undefined,
        runsDir: common.runsDir,
        entrypointImportPath: common.runStateDetails?.entrypointImportPath,
      });
      process.stdout.write(
        JSON.stringify({ decision: "block", reason, systemMessage }) + "\n",
      );
      return 0;
    },

    async handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      // Initialize session state
      const sessionId = process.env.AGENT_SESSION_ID;
      if (!sessionId) {
        process.stdout.write("{}\n");
        return 0;
      }
      const stateDir = normalizeSessionStateDir(
        args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
      );
      if (stateDir) {
        await initializeSessionState(sessionId, stateDir, {
          verbose: args.verbose,
        });
      }

      // Auto-create a bare run for babysitter-plugin sessions so .a5c/runs/
      // exists from the start — the agent can attach a process later via
      // run:assign-process. The run ID is written into session state so the
      // stop hook doesn't kill the session before the agent has a chance to
      // assign a process.
      try {
        const { createRun } = await import("../../runtime/createRun");
        const { resolveRunsDir } = await import("../../config");
        const runsDir = args.runsDir ?? resolveRunsDir();
        const result = await createRun({
          runsDir,
          harness: "unified",
        });
        if (stateDir && sessionId) {
          const { updateSessionState } = await import("../../session/write");
          const { getSessionFilePath } = await import("../../session/parse");
          const filePath = getSessionFilePath(stateDir, sessionId);
          await updateSessionState(filePath, {
            runId: result.runId,
            runIds: [result.runId],
          });
        }
        if (args.verbose) {
          process.stderr.write(`[session-start] bare run created and bound: ${result.runId}\n`);
        }
      } catch (err) {
        if (args.verbose) {
          process.stderr.write(`[session-start] bare run creation failed: ${err instanceof Error ? err.message : String(err)}\n`);
        }
      }

      process.stdout.write("{}\n");
      return 0;
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      // The unified adapter does not ship its own hook dispatcher —
      // hooks-mux is the dispatcher.
      return null;
    },

    // ── Prompt context ─────────────────────────────────────────────────

    getPromptContext(
      opts?: { interactive?: boolean | undefined },
    ): PromptContext {
      return createUnifiedContext(opts);
    },
  };
}
