import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Process Creation phase section.
 */
export function renderProcessCreation(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('process-creation.md'), ctx);
}
