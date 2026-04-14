import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Critical Rules section, parameterized by harness context.
 * All content lives in the critical-rules.md template.
 */
export function renderCriticalRules(ctx: PromptContext): string {
  const codexSessionIdRule = ctx.harness === 'codex'
    ? `CRITICAL RULE: Do not fabricate a session ID. The ${ctx.harnessLabel} adapter resolves\nthe session ID from direct ambient bindings first: \`CODEX_THREAD_ID\`/\`CODEX_SESSION_ID\`,\nthen \`BABYSITTER_SESSION_ID\`, and only then falls back to the PID-scoped marker.\nDo not assume env vars are always present or fresh: they may be stale (inherited\nfrom an ancestor shell) or missing. The PID-scoped marker exists as the final\nrecovery path when env propagation is absent. For CI pipelines that deliberately export\n\`BABYSITTER_SESSION_ID\`, set \`BABYSITTER_TRUST_ENV_SESSION=1\` to force the legacy\ntrusted-env behavior explicitly.`
    : '';

  return renderTemplate(resolveTemplatePath('critical-rules.md'), ctx, {
    codexSessionIdRule,
  });
}
