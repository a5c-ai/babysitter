import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Coding Philosophy section.
 * Static guidelines for minimal, focused changes.
 */
export function renderCodingPhilosophy(_ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('coding-philosophy.md'), _ctx);
}
