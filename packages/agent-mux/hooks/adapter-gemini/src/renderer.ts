import type { UnifiedHookResult } from '@a5c-ai/agent-mux-hooks-core';

/**
 * Gemini CLI native hook output formats.
 *
 * Gemini CLI hooks communicate results via JSON on stdout only.
 * All diagnostic/log output MUST go to stderr.
 */

/** BeforeToolSelection hook output: tool filtering via union aggregation. */
export interface GeminiBeforeToolSelectionOutput {
  /** Tools to include — unioned across multiple hook responses. */
  selectedTools?: string[];
  /** Additional context to inject. */
  additionalContext?: string;
}

/** BeforeModel hook output: request mutation. */
export interface GeminiBeforeModelOutput {
  /** System message to prepend or inject. */
  systemMessage?: string;
  /** Additional context to inject. */
  additionalContext?: string;
  /** Whether to block the model request entirely. */
  block?: boolean;
  /** Reason for blocking. */
  reason?: string;
}

/** AfterModel hook output. */
export interface GeminiAfterModelOutput {
  /** Additional context to inject. */
  additionalContext?: string;
}

/** BeforeAgent hook output. */
export interface GeminiBeforeAgentOutput {
  /** Additional context to inject. */
  additionalContext?: string;
  /** Whether to block the agent turn. */
  block?: boolean;
  /** Reason for blocking. */
  reason?: string;
}

/** AfterAgent hook output: continuation control. */
export interface GeminiAfterAgentOutput {
  /** If true, continue the session with a follow-up. */
  continueSession?: boolean;
  /** Follow-up prompt to inject if continuing. */
  followUpMessage?: string;
  /** Additional context to inject. */
  additionalContext?: string;
  /** Reason for the decision. */
  reason?: string;
}

/** BeforeTool hook output: permission and mutation. */
export interface GeminiBeforeToolOutput {
  /** Permission decision. */
  decision?: 'allow' | 'deny';
  /** Reason for the decision. */
  reason?: string;
  /** Mutated tool input (replaces original). */
  toolInput?: unknown;
  /** Additional context to inject. */
  additionalContext?: string;
}

/** AfterTool hook output. */
export interface GeminiAfterToolOutput {
  /** Additional context to inject. */
  additionalContext?: string;
}

/** SessionStart hook output. */
export interface GeminiSessionStartOutput {
  /** Additional context to inject. */
  additionalContext?: string;
}

/**
 * Render a UnifiedHookResult back to Gemini's native JSON output format.
 *
 * Output JSON goes to stdout. Any diagnostic or log output must go to stderr
 * (handled by the caller, not here).
 *
 * @param result - The unified hook result from handler execution.
 * @param nativeEventName - The original Gemini event name.
 * @returns The native JSON output to write to stdout.
 */
export function renderGeminiOutput(
  result: UnifiedHookResult,
  nativeEventName: string,
): Record<string, unknown> {
  switch (nativeEventName) {
    case 'BeforeToolSelection':
      return renderBeforeToolSelectionOutput(result) as Record<string, unknown>;
    case 'BeforeModel':
      return renderBeforeModelOutput(result) as Record<string, unknown>;
    case 'AfterModel':
      return renderAfterModelOutput(result) as Record<string, unknown>;
    case 'BeforeAgent':
      return renderBeforeAgentOutput(result) as Record<string, unknown>;
    case 'AfterAgent':
      return renderAfterAgentOutput(result) as Record<string, unknown>;
    case 'BeforeTool':
      return renderBeforeToolOutput(result) as Record<string, unknown>;
    case 'AfterTool':
      return renderAfterToolOutput(result) as Record<string, unknown>;
    case 'SessionStart':
      return renderSessionStartOutput(result) as Record<string, unknown>;
    default:
      return renderGenericOutput(result);
  }
}

function renderBeforeToolSelectionOutput(
  result: UnifiedHookResult,
): GeminiBeforeToolSelectionOutput {
  const output: GeminiBeforeToolSelectionOutput = {};

  // toolMutation for BeforeToolSelection carries the selected tool list
  if (result.toolMutation?.value != null && Array.isArray(result.toolMutation.value)) {
    output.selectedTools = result.toolMutation.value as string[];
  }

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  return output;
}

function renderBeforeModelOutput(result: UnifiedHookResult): GeminiBeforeModelOutput {
  const output: GeminiBeforeModelOutput = {};

  if (result.systemMessage != null) {
    output.systemMessage = result.systemMessage;
  }

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  if (result.decision === 'deny') {
    output.block = true;
    if (result.reason != null) {
      output.reason = result.reason;
    }
  }

  return output;
}

function renderAfterModelOutput(result: UnifiedHookResult): GeminiAfterModelOutput {
  const output: GeminiAfterModelOutput = {};

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  return output;
}

function renderBeforeAgentOutput(result: UnifiedHookResult): GeminiBeforeAgentOutput {
  const output: GeminiBeforeAgentOutput = {};

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  if (result.decision === 'deny') {
    output.block = true;
    if (result.reason != null) {
      output.reason = result.reason;
    }
  }

  return output;
}

function renderAfterAgentOutput(result: UnifiedHookResult): GeminiAfterAgentOutput {
  const output: GeminiAfterAgentOutput = {};

  if (result.continueSession != null) {
    output.continueSession = result.continueSession;
  }

  if (result.followUpMessage != null) {
    output.followUpMessage = result.followUpMessage;
  }

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  if (result.stopReason != null) {
    output.reason = result.stopReason;
  } else if (result.reason != null) {
    output.reason = result.reason;
  }

  return output;
}

function renderBeforeToolOutput(
  result: UnifiedHookResult,
): GeminiBeforeToolOutput {
  const output: GeminiBeforeToolOutput = {};

  if (result.decision === 'allow') {
    output.decision = 'allow';
  } else if (result.decision === 'deny') {
    output.decision = 'deny';
  }
  // 'ask', 'continue', 'noop' produce no decision — Gemini defaults to allow

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

  return output;
}

function renderAfterToolOutput(result: UnifiedHookResult): GeminiAfterToolOutput {
  const output: GeminiAfterToolOutput = {};

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
  }

  return output;
}

function renderSessionStartOutput(result: UnifiedHookResult): GeminiSessionStartOutput {
  const output: GeminiSessionStartOutput = {};

  if (result.additionalContext != null) {
    output.additionalContext = result.additionalContext;
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

/**
 * Write JSON output to stdout and log message to stderr.
 *
 * Gemini CLI requires that only the final JSON result goes to stdout.
 * All diagnostic messages must go to stderr.
 */
export function emitOutput(output: Record<string, unknown>, log?: string): void {
  if (log != null) {
    process.stderr.write(log + '\n');
  }
  process.stdout.write(JSON.stringify(output) + '\n');
}

/**
 * Write a log/diagnostic message to stderr (never stdout).
 */
export function logToStderr(message: string): void {
  process.stderr.write(message + '\n');
}
