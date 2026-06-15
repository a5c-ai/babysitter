import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Get Effects + Perform Effects intro sections.
 */
export function renderEffects(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('effects.md'), ctx);
}
