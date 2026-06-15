/**
 * Base harness adapter class.
 *
 * Provides default implementations for all HarnessAdapter methods.
 * Each harness adapter extends this class and overrides only the
 * methods that have truly harness-specific behavior.
 */

import * as path from "node:path";
import { normalizeSessionStateDir } from "../config";
import type { PromptContext } from "../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../prompts/contextShared";
import type {
  HarnessAdapter,
  HarnessCapability,
  HookHandlerArgs,
  SessionBindOptions,
  SessionBindResult,
} from "./types";
import { bindSession } from "./hooks/sessionBinding";
import { handleStopHookCommon } from "./hooks/stopHookHandler";
import { buildStopHookContinuation } from "./hooks/stopHookContinuation";
import { initializeSessionState, readStdin, parseHookInput, safeStr } from "./hooks/utils";
import {
  resolveSessionIdWithMarker,
  writeSessionMarker,
} from "../utils/sessionMarker";

// ---------------------------------------------------------------------------
// Adapter configuration interface
// ---------------------------------------------------------------------------

export interface AdapterConfig {
  /** Harness identifier (e.g. "claude-code"). */
  name: string;
  /** Human-readable label (e.g. "Claude Code"). */
  displayName: string;
  /** Env vars that indicate this harness is active. */
  activationEnvVars: string[];
  /** Capabilities advertised by this harness. */
  capabilities: HarnessCapability[];
  /** Term used for the mechanism that continues the orchestration loop. */
  loopControlTerm: string;
  /** Whether this adapter auto-resolves session IDs from environment. */
  autoResolvesSession: boolean;
  /** Env vars to check for plugin root. */
  pluginRootEnvVars: string[];
  /** If true, resolvePluginRoot always returns undefined (no plugin root concept). */
  noPluginRoot?: boolean;
  /** Env vars to check for session ID (in priority order). These are "native" harness vars that beat AGENT_SESSION_ID. */
  sessionIdEnvVars: string[];
  /** Env vars checked AFTER AGENT_SESSION_ID and PID marker (lower priority fallbacks). */
  fallbackSessionIdEnvVars?: string[];

  // ── Hook behavior fields ──
  /**
   * If set, only these hook types are supported. `supportsHookType()` returns
   * true only for types in this set. If undefined, all hook types are supported.
   */
  supportedHookTypes?: string[];
  /**
   * If true, the adapter does not support any hooks (supportsHookType always
   * returns false and handleStopHook/handleSessionStartHook are no-ops).
   */
  noHookSupport?: boolean;
  /**
   * Whether bindSession should auto-release sessions from terminal runs.
   * Default: false.
   */
  autoReleaseStale?: boolean;
  /** Custom hint for missing session ID. If undefined, uses generic hint. */
  missingSessionIdHint?: string;
  /** Custom messages for specific unsupported hook types. */
  unsupportedHookMessages?: Record<string, string>;

  // ── Prompt context fields ──
  /** Capabilities list for prompt context. */
  promptCapabilities: string[];
  /** Plugin root variable expression for shell interpolation. */
  pluginRootVar: string;
  /** Whether orchestration uses stop-hook (true) or in-turn (false). */
  hookDriven: boolean;
  /** Name of the interactive question tool. */
  interactiveToolName: string;
  /** Description of session env var resolution. */
  sessionEnvVars: string;
  /** Whether this harness supports intent fidelity checks. */
  hasIntentFidelityChecks: boolean;
  /** Whether this harness has non-negotiables section. */
  hasNonNegotiables: boolean;
}

// ---------------------------------------------------------------------------
// Base adapter class
// ---------------------------------------------------------------------------

export abstract class BaseHarnessAdapter implements HarnessAdapter {
  constructor(protected readonly config: AdapterConfig) {}

  get name(): string {
    return this.config.name;
  }

  isActive(): boolean {
    return this.config.activationEnvVars.some((v) => !!process.env[v]);
  }

  autoResolvesSessionId(): boolean {
    return this.config.autoResolvesSession;
  }

  resolveSessionId(parsed: { sessionId?: string }): string | undefined {
    // Harness-native env vars are everything in sessionIdEnvVars except AGENT_SESSION_ID
    // (resolveSessionIdWithMarker handles AGENT_SESSION_ID separately with correct precedence)
    const harnessEnvVars = this.config.sessionIdEnvVars.filter(
      (v) => v !== "AGENT_SESSION_ID",
    );
    const result = resolveSessionIdWithMarker(this.config.name, parsed, harnessEnvVars);
    if (result) return result;

    // Check lower-priority fallback env vars (these lose to AGENT_SESSION_ID and markers)
    if (this.config.fallbackSessionIdEnvVars) {
      for (const envVar of this.config.fallbackSessionIdEnvVars) {
        const val = process.env[envVar];
        if (val) return val;
      }
    }
    return undefined;
  }

  resolveStateDir(args: {
    stateDir?: string;
    pluginRoot?: string;
  }): string | undefined {
    return normalizeSessionStateDir(
      args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
    );
  }

  resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
    if (this.config.noPluginRoot) return undefined;
    if (args.pluginRoot) return path.resolve(args.pluginRoot);
    for (const envVar of this.config.pluginRootEnvVars) {
      const val = process.env[envVar];
      if (val) return path.resolve(val);
    }
    return undefined;
  }

  getCapabilities(): HarnessCapability[] {
    return this.config.capabilities;
  }

  getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
    return createPromptContext(
      {
        harness: this.config.name,
        harnessLabel: this.config.displayName,
        capabilities: this.config.promptCapabilities,
        pluginRootVar: this.config.pluginRootVar,
        loopControlTerm: this.config.loopControlTerm,
        sessionBindingFlags: "",
        hookDriven: this.config.hookDriven,
        interactiveToolName: this.config.interactiveToolName,
        sessionEnvVars: this.config.sessionEnvVars,
        resumeFlags: "",
        cliSetupSnippet: createDefaultCliSetupSnippet(),
        iterateFlags: "",
        hasIntentFidelityChecks: this.config.hasIntentFidelityChecks,
        hasNonNegotiables: this.config.hasNonNegotiables,
      },
      opts ? { interactive: opts.interactive } : undefined,
    );
  }

  async bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
    const stateDir = this.resolveStateDir({
      stateDir: opts.stateDir,
      pluginRoot: opts.pluginRoot,
    });
    return bindSession({
      harness: this.config.name,
      stateDir: stateDir ?? "",
      opts,
      autoReleaseStale: this.config.autoReleaseStale ?? false,
    });
  }

  async handleStopHook(args: HookHandlerArgs): Promise<number> {
    if (this.config.noHookSupport || !this.supportsHookType("stop")) {
      process.stdout.write("{}\n");
      return 0;
    }
    const common = await handleStopHookCommon(args, {
      harness: this.config.name,
      sessionIdFields: ["session_id", "conversation_id"],
      useDetailedRunState: true,
      pluginRootEnvVars: this.config.pluginRootEnvVars,
      resolveStateDir: (a) =>
        normalizeSessionStateDir(
          a.stateDir ?? process.env.BABYSITTER_STATE_DIR,
        ),
    });
    if (!common.shouldContinue) {
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
  }

  async handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
    if (this.config.noHookSupport) {
      process.stdout.write("{}\n");
      return 0;
    }

    let rawInput = "";
    if (args.stdinPayload !== undefined) {
      rawInput = args.stdinPayload;
    } else if (this.config.hookDriven) {
      // Only read stdin for hook-driven adapters (they pipe JSON via harness hooks)
      try {
        rawInput = await readStdin();
      } catch {
        // stdin unavailable — fall through to env-based resolution
      } finally {
        if (typeof process.stdin.unref === "function") {
          process.stdin.unref();
        }
      }
    }

    const hookInput = parseHookInput(rawInput);
    let sessionId =
      safeStr(hookInput, "session_id") ||
      safeStr(hookInput, "conversation_id") ||
      process.env.AGENT_SESSION_ID ||
      "";
    if (!sessionId) {
      // Check harness-native and fallback session env vars
      for (const envVar of [...this.config.sessionIdEnvVars, ...(this.config.fallbackSessionIdEnvVars ?? [])]) {
        if (envVar !== "AGENT_SESSION_ID" && process.env[envVar]) {
          sessionId = process.env[envVar]!;
          break;
        }
      }
    }

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
    writeSessionMarker(this.config.name, sessionId);

    process.stdout.write("{}\n");
    return 0;
  }

  findHookDispatcherPath(_startCwd: string): string | null {
    return null;
  }

  getMissingSessionIdHint(): string {
    return this.config.missingSessionIdHint ??
      `Pass --session-id explicitly or ensure the ${this.config.name} hook context provides one.`;
  }

  supportsHookType(hookType: string): boolean {
    if (this.config.noHookSupport) return false;
    if (this.config.supportedHookTypes) {
      return this.config.supportedHookTypes.includes(hookType);
    }
    return true;
  }

  getUnsupportedHookMessage(hookType: string): string {
    const custom = this.config.unsupportedHookMessages?.[hookType];
    if (custom) return custom;
    return `Hook type "${hookType}" is not supported by the ${this.config.name} adapter.`;
  }
}
