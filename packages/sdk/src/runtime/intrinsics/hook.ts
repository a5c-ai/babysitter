/**
 * Hook Intrinsic
 * Allows process files to call hooks directly
 */

import type { InternalProcessContext } from "../processContext";
import type { HookResult } from "../../hooks/types";
import { callHook } from "../../hooks/dispatcher";

export interface HookIntrinsicOptions {
  /**
   * Optional label for this hook invocation (for journal/logging)
   */
  label?: string;

  /**
   * Timeout in milliseconds (defaults to 30000)
   */
  timeout?: number;

  /**
   * Whether to throw on hook failures (defaults to false)
   */
  throwOnFailure?: boolean;
}

/**
 * Run a hook from within a process
 * This is exposed as ctx.hook() in process files
 */
export async function runHookIntrinsic(
  hookType: string,
  payload: Record<string, unknown>,
  context: InternalProcessContext,
  options?: HookIntrinsicOptions
): Promise<HookResult> {
  // Add timestamp if not present
  const fullPayload = {
    ...payload,
    hookType,
    timestamp: new Date().toISOString(),
  };

  // Add runId from context if not in payload
  if (!("runId" in fullPayload) && context.runId) {
    (fullPayload as any).runId = context.runId;
  }

  // Log the hook invocation
  const label = options?.label || `hook:${hookType}`;
  context.logger?.(`[${label}] Calling hook: ${hookType}`);

  try {
    const result = await callHook({
      hookType,
      payload: fullPayload,
      cwd: context.runDir,
      timeout: options?.timeout,
      throwOnFailure: options?.throwOnFailure,
    });

    // Log the result
    const hookCount = result.executedHooks.length;
    const successCount = result.executedHooks.filter((h) => h.status === "success").length;
    context.logger?.(
      `[${label}] Hook execution complete: ${successCount}/${hookCount} hooks succeeded`
    );

    return result;
  } catch (error) {
    context.logger?.(
      `[${label}] Hook execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}
