import type { UnifiedHookEvent, UnifiedHookResult } from '@a5c-ai/hooks-mux-core';

/**
 * Claude Code native hook output formats.
 *
 * Claude Code hooks communicate results via JSON on stdout.
 * The shape depends on the event type.
 */

/** PreToolUse hook output: permission decision. */
export interface ClaudePreToolUseOutput {
  decision?: 'allow' | 'deny' | 'ask';
  reason?: string;
  /** Additional context injected into the model's context window. */
  additionalContext?: string;
}

/** PostToolUse hook output. */
export interface ClaudePostToolUseOutput {
  /** Additional context injected into the model's context window. */
  additionalContext?: string;
}

/** Stop hook output: continue/stop decision. */
export interface ClaudeStopOutput {
  /** If true, the session continues instead of stopping. */
  continue?: boolean;
  /** Optional reason for the decision. */
  reason?: string;
  /** Follow-up message to send if continuing. */
  followUpMessage?: string;
  /** Additional context injected into the model's context window. */
  additionalContext?: string;
}

/** SessionStart hook output. */
export interface ClaudeSessionStartOutput {
  /** Additional context injected into the model's context window. */
  additionalContext?: string;
}

/** Generic output shape for events with no specific output contract. */
export interface ClaudeGenericOutput {
  [key: string]: unknown;
}

/**
 * Safe no-op response for Stop events during stop-hook recursion.
 *
 * When `stop_hook_active` is true, the hook is firing inside a session that
 * was already continued by a previous stop hook.  Emitting
 * `continueSession: true` here would create an infinite loop, so the only
 * safe response is to let the session stop naturally.
 */
const SAFE_STOP_NOOP: Readonly<Record<string, unknown>> = Object.freeze({
  continue: false,
});

/**
 * Render a UnifiedHookResult back to Claude's native JSON output format.
 *
 * If the optional `event` parameter is provided and indicates stop-hook
 * recursion (`execution.metadata.stop_hook_active === true`), the renderer
 * short-circuits to a safe no-op (`continueSession: false`) to prevent
 * infinite recursion (spec 17.1).
 *
 * @param result - The unified hook result from handler execution.
 * @param nativeEventName - The original Claude event name.
 * @param event - Optional normalized event; used for recursion detection.
 * @returns The native JSON output to write to stdout.
 */
export function renderClaudeOutput(
  result: UnifiedHookResult,
  nativeEventName: string,
  event?: Pick<UnifiedHookEvent, 'execution'>,
): Record<string, unknown> {
  // Recursion guard: if stop_hook_active is set, emit safe no-op for Stop events
  if (
    nativeEventName === 'Stop' &&
    event?.execution.metadata?.stop_hook_active === true
  ) {
    return { ...SAFE_STOP_NOOP };
  }

  switch (nativeEventName) {
    case 'PreToolUse':
      return renderPreToolUseOutput(result);
    case 'PostToolUse':
      return renderPostToolUseOutput(result);
    case 'Stop':
      return renderStopOutput(result);
    case 'SessionStart':
      return renderSessionStartOutput(result);
    default:
      return renderGenericOutput(result);
  }
}

function renderPreToolUseOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  // Map unified decision to Claude's permission decision
  if (result.decision === 'allow') {
    output['decision'] = 'allow';
  } else if (result.decision === 'deny') {
    output['decision'] = 'deny';
  } else if (result.decision === 'ask') {
    output['decision'] = 'ask';
  }
  // 'continue' and 'noop' produce no decision field — Claude defaults to allow

  if (result.reason != null) {
    output['reason'] = result.reason;
  }

  if (result.additionalContext != null) {
    output['additionalContext'] = result.additionalContext;
  }

  return output;
}

function renderPostToolUseOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.additionalContext != null) {
    output['additionalContext'] = result.additionalContext;
  }

  return output;
}

function renderStopOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.continueSession != null) {
    output['continue'] = result.continueSession;
  }

  if (result.stopReason != null) {
    output['reason'] = result.stopReason;
  } else if (result.reason != null) {
    output['reason'] = result.reason;
  }

  if (result.followUpMessage != null) {
    output['followUpMessage'] = result.followUpMessage;
  }

  if (result.additionalContext != null) {
    output['additionalContext'] = result.additionalContext;
  }

  return output;
}

function renderSessionStartOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.additionalContext != null) {
    output['additionalContext'] = result.additionalContext;
  }

  return output;
}

function renderGenericOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  return output;
}
