import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Priority Ladder section — how to resolve rule conflicts.
 * Always-on by default (hasPriorityLadder defaults to true).
 */
export function renderPriorityLadder(ctx: PromptContext): string {
  if (ctx.hasPriorityLadder === false) return '';
  return renderTemplate(resolveTemplatePath('priority-ladder.md'), ctx);
}
