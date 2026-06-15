/**
 * Structured user interaction from within effects — define typed
 * interaction requests (confirm, select, input, multiSelect) that
 * can be rendered into agent prompts and parsed back into typed
 * responses (GAP-TOOLS-026).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InteractionType = 'confirm' | 'select' | 'input' | 'multiSelect';

export interface InteractionRequest {
  type: InteractionType;
  question: string;
  options?: string[];
  default?: string;
}

export interface InteractionResponse {
  type: InteractionType;
  answer: string | string[];
  answeredAt: string;
}

export interface InteractionRequestOptions {
  options?: string[];
  default?: string;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/**
 * Create a typed interaction request.
 */
export function createInteractionRequest(
  type: InteractionType,
  question: string,
  opts?: InteractionRequestOptions,
): InteractionRequest {
  const request: InteractionRequest = { type, question };
  if (opts?.options) request.options = opts.options;
  if (opts?.default !== undefined) request.default = opts.default;
  return request;
}

// ---------------------------------------------------------------------------
// Prompt formatting
// ---------------------------------------------------------------------------

/**
 * Render an interaction request as text suitable for injection into
 * an agent prompt.
 */
export function formatInteractionForPrompt(request: InteractionRequest): string {
  const lines: string[] = [];

  switch (request.type) {
    case 'confirm':
      lines.push(`[CONFIRM] ${request.question}`);
      lines.push(`  Respond with: yes / no`);
      if (request.default) {
        lines.push(`  Default: ${request.default}`);
      }
      break;

    case 'select':
      lines.push(`[SELECT] ${request.question}`);
      if (request.options && request.options.length > 0) {
        for (let i = 0; i < request.options.length; i++) {
          lines.push(`  ${i + 1}. ${request.options[i]}`);
        }
      }
      if (request.default) {
        lines.push(`  Default: ${request.default}`);
      }
      break;

    case 'input':
      lines.push(`[INPUT] ${request.question}`);
      if (request.default) {
        lines.push(`  Default: ${request.default}`);
      }
      break;

    case 'multiSelect':
      lines.push(`[MULTI-SELECT] ${request.question}`);
      if (request.options && request.options.length > 0) {
        for (let i = 0; i < request.options.length; i++) {
          lines.push(`  ${i + 1}. ${request.options[i]}`);
        }
      }
      lines.push('  (select multiple, comma-separated)');
      if (request.default) {
        lines.push(`  Default: ${request.default}`);
      }
      break;
  }

  return lines.join('\n');
}
