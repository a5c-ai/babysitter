import type { UnifiedHookResult } from '@a5c-ai/hooks-mux-core';

/**
 * OpenCode native hook output formats.
 *
 * OpenCode is an in-process adapter; results are returned programmatically
 * rather than via stdout.
 */

/** session.created hook output. */
export interface OpenCodeSessionCreatedOutput {
  /** Additional context to provide to the session. */
  additionalContext?: string;
  /** Environment variables to persist via shell.env. */
  persistEnv?: Record<string, string>;
}

/** tool.execute.before hook output: permission and mutation. */
export interface OpenCodeToolExecuteBeforeOutput {
  /** Permission decision. */
  decision?: 'allow' | 'deny';
  /** Reason for the decision. */
  reason?: string;
  /** Mutated tool input (replaces original). */
  toolInput?: unknown;
  /** Additional context to inject. */
  additionalContext?: string;
  /** Environment variables to persist via shell.env. */
  persistEnv?: Record<string, string>;
}

/** tool.execute.after hook output. */
export interface OpenCodeToolExecuteAfterOutput {
  /** Additional context to inject. */
  additionalContext?: string;
  /** Environment variables to persist via shell.env. */
  persistEnv?: Record<string, string>;
}

/** shell.env hook output: env injection payload. */
export interface OpenCodeShellEnvOutput {
  /** Environment variables to inject into the runtime. */
  env?: Record<string, string>;
}

/**
 * Render a UnifiedHookResult back to OpenCode's native output format.
 *
 * @param result - The unified hook result from handler execution.
 * @param nativeEventName - The original OpenCode event name.
 * @returns The native output object.
 */
export function renderOpenCodeOutput(
  result: UnifiedHookResult,
  nativeEventName: string,
): Record<string, unknown> {
  switch (nativeEventName) {
    case 'session.created':
      return renderSessionCreatedOutput(result) as Record<string, unknown>;
    case 'tool.execute.before':
      return renderToolExecuteBeforeOutput(result) as Record<string, unknown>;
    case 'tool.execute.after':
      return renderToolExecuteAfterOutput(result) as Record<string, unknown>;
    case 'shell.env':
      return renderShellEnvOutput(result) as Record<string, unknown>;
    default:
      return renderGenericOutput(result);
  }
}

function renderSessionCreatedOutput(result: UnifiedHookResult): OpenCodeSessionCreatedOutput {
  const output: OpenCodeSessionCreatedOutput = {};

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  if (result.persistEnv != null && Object.keys(result.persistEnv).length > 0) {
    output.persistEnv = result.persistEnv;
  }

  return output;
}

function renderToolExecuteBeforeOutput(
  result: UnifiedHookResult,
): OpenCodeToolExecuteBeforeOutput {
  const output: OpenCodeToolExecuteBeforeOutput = {};

  if (result.decision === 'allow') {
    output.decision = 'allow';
  } else if (result.decision === 'deny') {
    output.decision = 'deny';
  }
  // 'ask', 'continue', 'noop' produce no decision

  if (result.reason != null) {
    output.reason = result.reason;
  }

  // Tool input mutation
  if (result.toolMutation?.value != null) {
    output.toolInput = result.toolMutation.value;
  }

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  if (result.persistEnv != null && Object.keys(result.persistEnv).length > 0) {
    output.persistEnv = result.persistEnv;
  }

  return output;
}

function renderToolExecuteAfterOutput(result: UnifiedHookResult): OpenCodeToolExecuteAfterOutput {
  const output: OpenCodeToolExecuteAfterOutput = {};

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  if (result.persistEnv != null && Object.keys(result.persistEnv).length > 0) {
    output.persistEnv = result.persistEnv;
  }

  return output;
}

function renderShellEnvOutput(result: UnifiedHookResult): OpenCodeShellEnvOutput {
  const output: OpenCodeShellEnvOutput = {};

  // The shell.env hook's primary purpose is env injection.
  // Map persistEnv to the native env field.
  if (result.persistEnv != null && Object.keys(result.persistEnv).length > 0) {
    output.env = result.persistEnv;
  }

  return output;
}

function renderGenericOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  if (result.persistEnv != null && Object.keys(result.persistEnv).length > 0) {
    output.persistEnv = result.persistEnv;
  }

  return output;
}
