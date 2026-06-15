import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Root Cause & Guardrail section.
 * Always-on by default (hasRootCauseGuardrail defaults to true).
 */
export function renderRootCauseGuardrail(ctx: PromptContext): string {
  if (ctx.hasRootCauseGuardrail === false) return '';
  return renderTemplate(resolveTemplatePath('root-cause-guardrail.md'), ctx);
}
