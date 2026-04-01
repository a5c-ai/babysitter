import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Quick Commands Reference section with harness-specific flags.
 */
export function renderQuickReference(ctx: PromptContext): string {
  const bindingFlags = ctx.sessionBindingFlags
    ? ` \\\n  ${ctx.sessionBindingFlags}`
    : '';

  const augmentedCtx = {
    ...ctx,
    bindingFlags,
  };

  return renderTemplate(
    resolveTemplatePath('quick-reference.md'),
    augmentedCtx as PromptContext & { bindingFlags: string },
  );
}
