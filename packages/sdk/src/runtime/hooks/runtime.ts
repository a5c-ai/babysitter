/**
 * Runtime hook integration helpers
 *
 * Provides safe hook calling with error handling for SDK runtime.
 * Hook failures are logged but do not break orchestration.
 */

import { callHook } from "../../hooks/dispatcher";
import type { HookType, HookResult } from "../../hooks/types";
import { RunFailedError } from "../exceptions";

const importOptionalModule: (specifier: string) => Promise<unknown> = (() => {
  if (process.env.VITEST) {
    return (specifier) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;
})();

export interface RuntimeHookOptions {
  cwd: string;
  timeout?: number;
  logger?: (message: string) => void;
}

interface HooksMuxCoreLike {
  runNormalized?: (event: HooksMuxRuntimeEvent) => Promise<HooksMuxMergedResult> | HooksMuxMergedResult;
}

interface HooksMuxMergedResult {
  decision?: "allow" | "deny" | "block" | "retry" | "ask" | "defer" | "continue" | "noop";
  reason?: string;
  additionalContext?: string;
  systemMessage?: string;
  followUpMessage?: string;
  continueSession?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
  sessionTitle?: string;
  reloadSkills?: boolean;
  displayContent?: string;
  persistEnv?: Record<string, string>;
  unsetEnv?: string[];
  contextVars?: Record<string, string>;
  metadata?: Record<string, unknown>;
  diagnostics?: unknown;
}

interface HooksMuxRuntimeEvent {
  version: "a5c.hooks.v1";
  adapter: "babysitter-sdk";
  phase: string;
  rawEventName: string;
  supportLevel: "emulated";
  execution: {
    sessionId: string | null;
    adapter: "babysitter-sdk";
    cwd: string;
    nativeEventName: string;
    persistedEnv: Record<string, string>;
    contextVars: Record<string, string>;
    metadata: Record<string, unknown>;
  };
  payload: Record<string, unknown>;
  env: {
    input: Record<string, string>;
    persisted: Record<string, string>;
  };
  raw: Record<string, unknown>;
}

/**
 * Safely call a hook from SDK runtime with error handling.
 *
 * Hook failures are logged but do not throw - orchestration continues.
 *
 * @param hookType - The type of hook to call
 * @param payload - The hook payload
 * @param options - Runtime options (cwd, timeout, logger)
 * @returns HookResult with execution details
 */
export async function callRuntimeHook(
  hookType: HookType,
  payload: Record<string, unknown>,
  options: RuntimeHookOptions
): Promise<HookResult> {
  const { cwd, timeout = 30000, logger } = options;

  try {
    // Ensure timestamp is present
    const fullPayload = {
      ...payload,
      hookType,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    const hooksMuxResult = await callHooksMuxRuntimeHook(hookType, fullPayload, options);
    const result = await callHook({
      hookType,
      payload: fullPayload,
      cwd,
      timeout,
    });

    const combinedResult = combineHookResults(hookType, hooksMuxResult, result);

    // Log hook execution if logger provided
    if (logger && combinedResult.executedHooks.length > 0) {
      logger(
        `[hooks] Executed ${combinedResult.executedHooks.length} hook(s) for ${hookType}`
      );
    }

    return combinedResult;
  } catch (error) {
    // Hook failures should not break orchestration
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (logger) {
      logger(`[hooks] Hook execution failed for ${hookType}: ${errorMessage}`);
    }

    // Return a failure result instead of throwing
    return {
      hookType,
      success: false,
      error: errorMessage,
      executedHooks: [],
    };
  }
}

async function callHooksMuxRuntimeHook(
  hookType: HookType,
  payload: Record<string, unknown>,
  options: RuntimeHookOptions,
): Promise<HookResult | null> {
  let core: HooksMuxCoreLike;
  try {
    core = await importOptionalModule("@a5c-ai/hooks-mux-core") as HooksMuxCoreLike;
  } catch {
    return null;
  }
  if (typeof core.runNormalized !== "function") {
    return null;
  }

  try {
    const merged = await core.runNormalized(buildHooksMuxEvent(hookType, payload, options.cwd));
    return {
      hookType,
      success: true,
      output: normalizeHooksMuxOutput(merged),
      executedHooks: [{
        hookPath: "@a5c-ai/hooks-mux-core",
        hookName: mapRuntimeHookToPhase(hookType),
        hookLocation: "plugin",
        status: "success",
      }],
    };
  } catch (error) {
    return {
      hookType,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executedHooks: [{
        hookPath: "@a5c-ai/hooks-mux-core",
        hookName: mapRuntimeHookToPhase(hookType),
        hookLocation: "plugin",
        status: "failed",
      }],
    };
  }
}

function buildHooksMuxEvent(
  hookType: HookType,
  payload: Record<string, unknown>,
  cwd: string,
): HooksMuxRuntimeEvent {
  return {
    version: "a5c.hooks.v1",
    adapter: "babysitter-sdk",
    phase: mapRuntimeHookToPhase(hookType),
    rawEventName: hookType,
    supportLevel: "emulated",
    execution: {
      sessionId: stringOrNull(payload.sessionId),
      adapter: "babysitter-sdk",
      cwd,
      nativeEventName: hookType,
      persistedEnv: {},
      contextVars: {},
      metadata: {
        hookType,
        runId: payload.runId,
        processId: payload.processId,
        effectId: payload.effectId,
        taskId: payload.taskId,
        kind: payload.kind,
      },
    },
    payload,
    env: {
      input: {},
      persisted: {},
    },
    raw: payload,
  };
}

function mapRuntimeHookToPhase(hookType: HookType): string {
  switch (hookType) {
    case "on-run-start":
      return "session.start";
    case "on-run-complete":
      return "session.end";
    case "on-run-fail":
      return "turn.error";
    case "on-iteration-start":
      return "turn.before_agent";
    case "on-iteration-end":
      return "turn.after_agent";
    case "task.created":
    case "on-task-start":
      return "task.created";
    case "task.completed":
    case "on-task-complete":
      return "task.completed";
    default:
      return hookType;
  }
}

function normalizeHooksMuxOutput(merged: HooksMuxMergedResult): Record<string, unknown> | undefined {
  const output: Record<string, unknown> = {};
  for (const key of [
    "decision",
    "reason",
    "additionalContext",
    "systemMessage",
    "followUpMessage",
    "continueSession",
    "stopReason",
    "suppressOutput",
    "sessionTitle",
    "reloadSkills",
    "displayContent",
    "persistEnv",
    "unsetEnv",
    "contextVars",
    "metadata",
    "diagnostics",
  ] as const) {
    if (merged[key] !== undefined) {
      output[key] = merged[key];
    }
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

function combineHookResults(
  hookType: HookType,
  hooksMuxResult: HookResult | null,
  shellResult: HookResult,
): HookResult {
  if (!hooksMuxResult) return shellResult;
  return {
    hookType,
    success: hooksMuxResult.success && shellResult.success,
    output: combineHookOutputs(hooksMuxResult.output, shellResult.output),
    error: [hooksMuxResult.error, shellResult.error].filter(Boolean).join("; ") || undefined,
    executedHooks: [
      ...hooksMuxResult.executedHooks,
      ...shellResult.executedHooks,
    ],
  };
}

function combineHookOutputs(hooksMuxOutput: unknown, shellOutput: unknown): unknown {
  if (isBlockingHookOutput(hooksMuxOutput)) return hooksMuxOutput;
  if (isBlockingHookOutput(shellOutput)) return shellOutput;
  if (isPlainRecord(hooksMuxOutput) && isPlainRecord(shellOutput)) {
    return { ...hooksMuxOutput, ...shellOutput };
  }
  return shellOutput ?? hooksMuxOutput;
}

function isBlockingHookOutput(output: unknown): boolean {
  if (!isPlainRecord(output)) return false;
  return output.decision === "deny" || output.decision === "ask" || output.decision === "block";
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function assertRuntimeHookAllowed(result: HookResult, hookType: HookType): void {
  const output = result.output;
  if (!output || typeof output !== "object" || Array.isArray(output)) return;

  const decision = (output as Record<string, unknown>).decision;
  if (decision === "deny" || decision === "ask" || decision === "block") {
    const reason = (output as Record<string, unknown>).reason;
    throw new RunFailedError(
      `Runtime hook ${hookType} blocked execution${typeof reason === "string" && reason ? `: ${reason}` : ""}`,
      { details: { hookType, decision, reason } },
    );
  }
}

/**
 * Create a hook payload with automatic timestamp.
 */
export function createRuntimeHookPayload<T extends Record<string, unknown>>(
  hookType: HookType,
  data: T
): T & { hookType: HookType; timestamp: string } {
  return {
    ...data,
    hookType,
    timestamp: new Date().toISOString(),
  };
}
