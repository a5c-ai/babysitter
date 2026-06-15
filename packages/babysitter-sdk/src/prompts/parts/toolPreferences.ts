import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Tool Usage Rules section.
 * Static guidelines for preferring dedicated tools over shell commands.
 */
export function renderToolPreferences(_ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('tool-preferences.md'), _ctx);
}
