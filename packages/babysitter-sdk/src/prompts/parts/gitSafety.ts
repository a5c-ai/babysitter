import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Git Operations Protocol section.
 * Static safety rules for git operations.
 */
export function renderGitSafety(_ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('git-safety.md'), _ctx);
}
