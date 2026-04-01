import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the See Also links section.
 * This section is identical across all harnesses.
 */
export function renderSeeAlso(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('see-also.md'), ctx);
}
