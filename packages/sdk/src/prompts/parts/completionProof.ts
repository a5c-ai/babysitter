import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Completion Proof section.
 */
export function renderCompletionProof(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('completion-proof.md'), ctx);
}
