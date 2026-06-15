import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Output Efficiency section.
 * Static guidelines for concise, action-oriented output.
 */
export function renderOutputEfficiency(_ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('output-efficiency.md'), _ctx);
}
