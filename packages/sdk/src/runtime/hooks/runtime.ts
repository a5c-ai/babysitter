/**
 * Runtime hook integration helpers
 *
 * Provides safe hook calling with error handling for SDK runtime.
 * Hook failures are logged but do not break orchestration.
 */

import { callHook } from "../../hooks/dispatcher";
import type { HookType, HookResult } from "../../hooks/types";

export interface RuntimeHookOptions {
  cwd: string;
  timeout?: number;
  logger?: (message: string) => void;
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

    const result = await callHook({
      hookType,
      payload: fullPayload,
      cwd,
      timeout,
    });

    // Log hook execution if logger provided
    if (logger && result.executedHooks.length > 0) {
      logger(
        `[hooks] Executed ${result.executedHooks.length} hook(s) for ${hookType}`
      );
    }

    return result;
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
