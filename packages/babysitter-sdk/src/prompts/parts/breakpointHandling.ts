import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Breakpoint Handling section including mode detection,
 * interactive/non-interactive handling, routing fields, retry pattern,
 * and posting examples.
 */
export function renderBreakpointHandling(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('breakpoint-handling.md'), ctx);
}
