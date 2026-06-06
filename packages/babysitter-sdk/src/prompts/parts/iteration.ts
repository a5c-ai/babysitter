import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Run Iteration section.
 */
export function renderIteration(ctx: PromptContext): string {
  const iterateFlagsSuffix = ctx.iterateFlags
    ? ` ${ctx.iterateFlags}`
    : '';

  return renderTemplate(resolveTemplatePath('iteration.md'), ctx, {
    iterateFlagsSuffix,
  });
}
