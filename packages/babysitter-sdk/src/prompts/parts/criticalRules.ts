import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';
import { listPluginTargetDescriptors } from '@a5c-ai/atlas/catalog';

/**
 * Resolve whether the current harness uses codex-style ambient env var
 * session binding (CODEX_THREAD_ID / CODEX_SESSION_ID). Checks catalog
 * callerEnvVars instead of comparing harness name.
 */
function hasCodexAmbientSessionBinding(ctx: PromptContext): boolean {
  const target = listPluginTargetDescriptors().find(t => t.targetId === ctx.harness);
  if (target?.callerEnvVars) {
    return target.callerEnvVars.includes('CODEX_THREAD_ID') || target.callerEnvVars.includes('CODEX_SESSION_ID');
  }
  return false;
}

/**
 * Renders the Critical Rules section, parameterized by harness context.
 * All content lives in the critical-rules.md template.
 */
export function renderCriticalRules(ctx: PromptContext): string {
  const codexSessionIdRule = hasCodexAmbientSessionBinding(ctx)
    ? `CRITICAL RULE: Do not fabricate a session ID. The ${ctx.harnessLabel} adapter resolves\nthe session ID from the PID-scoped marker first, then direct ambient bindings such\nas \`CODEX_THREAD_ID\`/\`CODEX_SESSION_ID\`, then \`AGENT_SESSION_ID\` as the final\nfallback. Do not assume env vars are always present or fresh: they may be stale\n(inherited from an ancestor shell) or missing. For CI pipelines that deliberately\nexport \`AGENT_SESSION_ID\`, set \`AGENT_TRUST_ENV_SESSION=1\` to force the legacy\ntrusted-env behavior explicitly.`
    : '';

  return renderTemplate(resolveTemplatePath('critical-rules.md'), ctx, {
    codexSessionIdRule,
  });
}
