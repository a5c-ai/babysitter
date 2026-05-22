import type { UnifiedHookResult } from '@a5c-ai/hooks-mux-core';

/**
 * Pi native hook output formats.
 *
 * Pi hooks communicate results as in-process return objects.
 * The shape depends on the event type.
 */

/** tool_call hook output: permission decision and optional tool input mutation. */
export interface PiToolCallOutput {
  decision?: 'allow' | 'deny';
  reason?: string;
  /** Mutated tool input — Pi supports in-place mutation. */
  toolInput?: unknown;
}

/** session_start hook output. */
export interface PiSessionStartOutput {
  /** Additional context to inject (not native — must be handled by the hook layer). */
  additionalContext?: string;
  /** State to persist via extension-state. */
  persistState?: Record<string, string>;
}

/** context hook output. */
export interface PiContextOutput {
  /** Context content to inject into the model context. */
  contextContent?: string;
}

/** before_provider_request hook output. */
export interface PiBeforeProviderRequestOutput {
  /** Modified messages to send to the provider. */
  messages?: unknown[];
}

/** Generic output shape for unrecognized events. */
export interface PiGenericOutput {
  [key: string]: unknown;
}

/**
 * Render a UnifiedHookResult back to Pi's native output format.
 *
 * @param result - The unified hook result from handler execution.
 * @param nativeEventName - The original Pi event name.
 * @returns The native output object to return to Pi.
 */
export function renderPiOutput(
  result: UnifiedHookResult,
  nativeEventName: string,
): Record<string, unknown> {
  switch (nativeEventName) {
    case 'tool_call':
      return renderToolCallOutput(result);
    case 'session_start':
      return renderSessionStartOutput(result);
    case 'context':
      return renderContextOutput(result);
    case 'before_provider_request':
      return renderBeforeProviderRequestOutput(result);
    default:
      return renderGenericOutput(result);
  }
}

function renderToolCallOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  // Map unified decision to Pi's permission decision
  if (result.decision === 'allow') {
    output['decision'] = 'allow';
  } else if (result.decision === 'deny') {
    output['decision'] = 'deny';
  }
  // 'ask', 'continue', and 'noop' are not natively supported by Pi;
  // 'ask' falls through to no decision (Pi defaults to allow)

  if (result.reason != null) {
    output['reason'] = result.reason;
  }

  // Tool input mutation: Pi supports in-place mutation via toolMutation
  if (result.toolMutation != null) {
    output['toolInput'] = result.toolMutation.value;
  }

  return output;
}

function renderSessionStartOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.additionalContext != null) {
    output['additionalContext'] = result.additionalContext;
  }

  // Collect env to persist via extension-state
  if (result.persistEnv != null && Object.keys(result.persistEnv).length > 0) {
    output['persistState'] = result.persistEnv;
  }

  return output;
}

function renderContextOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.additionalContext != null) {
    output['contextContent'] = result.additionalContext;
  }

  return output;
}

function renderBeforeProviderRequestOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.systemMessage != null) {
    output['systemMessage'] = result.systemMessage;
  }

  return output;
}

function renderGenericOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.additionalContext != null) {
    output['additionalContext'] = result.additionalContext;
  }

  return output;
}

/**
 * Build extension-state entries for Pi session persistence.
 *
 * Pi uses its native extension-state mechanism for key-value persistence
 * across hook invocations. Unlike Claude's env-file approach, this is
 * an in-process API — no file I/O needed.
 *
 * @param persistEnv - Key-value pairs to persist.
 * @returns Record of key-value pairs to store in extension-state.
 */
export function buildExtensionState(persistEnv: Record<string, string>): Record<string, string> {
  return { ...persistEnv };
}
