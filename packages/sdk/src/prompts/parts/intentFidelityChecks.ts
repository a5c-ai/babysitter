import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Intent Fidelity Checks section.
 * Only returns content if ctx.hasIntentFidelityChecks is true (currently Codex only).
 */
export function renderIntentFidelityChecks(ctx: PromptContext): string {
  if (!ctx.hasIntentFidelityChecks) {
    return '';
  }

  return renderTemplate(resolveTemplatePath('intent-fidelity-checks.md'), ctx);
}
