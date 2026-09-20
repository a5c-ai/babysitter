import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Breakpoint Handling section including mode detection,
 * interactive/non-interactive handling, routing fields, retry pattern,
 * and posting examples.
 */
export function renderBreakpointHandling(ctx: PromptContext): string {
  // Harnesses without a named question tool leave interactiveToolName empty.
  // Interpolating it raw produced "if the  itself throws an error"; fall back
  // to a generic noun so the sentence reads correctly on every harness.
  // Mirrors the guard in parts/interview.ts.
  const augmentedCtx = {
    ...ctx,
    interactiveToolName: ctx.interactiveToolName || 'question tool',
  };

  return renderTemplate(resolveTemplatePath('breakpoint-handling.md'), augmentedCtx);
}
