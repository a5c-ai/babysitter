import type { UnifiedHookResult } from '@a5c-ai/agent-mux-hooks-core';

/**
 * OpenClaw native hook output formats.
 *
 * OpenClaw is in-process, so results are returned as structured objects
 * rather than stdout JSON. The shape varies by event origin and type.
 */

/** Plugin tool.before output: permission/mutation decision. */
export interface OpenClawToolBeforeOutput {
  decision?: 'allow' | 'deny';
  reason?: string;
  toolInput?: unknown;
}

/** Plugin tool.after output. */
export interface OpenClawToolAfterOutput {
  metadata?: Record<string, unknown>;
}

/** Plugin turn.stop output. */
export interface OpenClawTurnStopOutput {
  continueSession?: boolean;
  reason?: string;
  followUpMessage?: string;
}

/** Plugin session.start output. */
export interface OpenClawSessionStartOutput {
  metadata?: Record<string, unknown>;
}

/** Gateway auth output. */
export interface OpenClawGatewayAuthOutput {
  allowed?: boolean;
  reason?: string;
}

/** Generic output for unrecognized events. */
export interface OpenClawGenericOutput {
  [key: string]: unknown;
}

/**
 * Render a UnifiedHookResult back to OpenClaw's native output format.
 *
 * @param result - The unified hook result from handler execution.
 * @param nativeEventName - The original OpenClaw event name.
 * @returns The native output object.
 */
export function renderOpenClawOutput(
  result: UnifiedHookResult,
  nativeEventName: string,
): Record<string, unknown> {
  switch (nativeEventName) {
    case 'plugin.tool.before':
      return renderToolBeforeOutput(result);
    case 'plugin.tool.after':
      return renderToolAfterOutput(result);
    case 'plugin.turn.stop':
      return renderTurnStopOutput(result);
    case 'plugin.session.start':
      return renderSessionStartOutput(result);
    case 'gateway.auth.check':
      return renderGatewayAuthOutput(result);
    default:
      return renderGenericOutput(result);
  }
}

function renderToolBeforeOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.decision === 'allow') {
    output['decision'] = 'allow';
  } else if (result.decision === 'deny') {
    output['decision'] = 'deny';
  }
  // 'continue', 'noop', 'ask' → no decision field (OpenClaw defaults to allow)

  if (result.reason != null) {
    output['reason'] = result.reason;
  }

  // OpenClaw supports tool input mutation
  if (result.toolMutation != null) {
    output['toolInput'] = result.toolMutation.value;
  }

  return output;
}

function renderToolAfterOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.metadata != null) {
    output['metadata'] = result.metadata;
  }

  return output;
}

function renderTurnStopOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.continueSession != null) {
    output['continueSession'] = result.continueSession;
  }

  if (result.stopReason != null) {
    output['reason'] = result.stopReason;
  } else if (result.reason != null) {
    output['reason'] = result.reason;
  }

  if (result.followUpMessage != null) {
    output['followUpMessage'] = result.followUpMessage;
  }

  return output;
}

function renderSessionStartOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.metadata != null) {
    output['metadata'] = result.metadata;
  }

  return output;
}

function renderGatewayAuthOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.decision === 'allow') {
    output['allowed'] = true;
  } else if (result.decision === 'deny') {
    output['allowed'] = false;
  }

  if (result.reason != null) {
    output['reason'] = result.reason;
  }

  return output;
}

function renderGenericOutput(result: UnifiedHookResult): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  if (result.metadata != null) {
    output['metadata'] = result.metadata;
  }

  return output;
}
