import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Dependencies section: CLI setup and jq requirement.
 */
export function renderDependencies(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('dependencies.md'), ctx);
}
