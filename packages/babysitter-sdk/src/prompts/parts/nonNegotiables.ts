import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Non-Negotiables section.
 * Only returns content if ctx.hasNonNegotiables is true (currently Codex only).
 */
export function renderNonNegotiables(ctx: PromptContext): string {
  if (!ctx.hasNonNegotiables) {
    return '';
  }

  return renderTemplate(resolveTemplatePath('non-negotiables.md'), ctx);
}
