import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Interview phase section for both interactive and non-interactive modes.
 */
export function renderInterview(ctx: PromptContext): string {
  // Pre-compute the tool reference for the non-interactive header
  const toolRef = ctx.interactiveToolName
    ? ` or no ${ctx.interactiveToolName}`
    : '';

  const augmentedCtx = {
    ...ctx,
    interactiveToolName: toolRef,
  };

  return renderTemplate(resolveTemplatePath('interview.md'), augmentedCtx);
}
