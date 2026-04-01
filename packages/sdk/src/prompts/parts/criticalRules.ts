import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Critical Rules section, parameterized by harness context.
 * All content lives in the critical-rules.md template.
 */
export function renderCriticalRules(ctx: PromptContext): string {
  const codexSessionIdRule = ctx.harness === 'codex'
    ? `CRITICAL RULE: Do not fabricate a session ID. Let the ${ctx.harnessLabel} adapter auto-resolve\nit from ${ctx.sessionEnvVars.split(',').map(s => '`' + s.trim() + '`').join(', ')}.`
    : '';

  return renderTemplate(resolveTemplatePath('critical-rules.md'), ctx, {
    codexSessionIdRule,
  });
}
