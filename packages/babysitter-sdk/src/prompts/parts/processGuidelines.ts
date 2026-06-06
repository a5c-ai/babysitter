import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Process Creation Guidelines and methodologies section,
 * including discovery markers.
 */
export function renderProcessGuidelines(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('process-guidelines.md'), ctx);
}
