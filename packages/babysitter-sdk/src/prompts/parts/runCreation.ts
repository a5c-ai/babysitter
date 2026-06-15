import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';
import { listPluginTargetDescriptors } from '@a5c-ai/atlas/catalog';

/**
 * Check whether the harness uses codex-style ambient env var session binding.
 */
function hasCodexAmbientSessionBinding(ctx: PromptContext): boolean {
  const target = listPluginTargetDescriptors().find(t => t.targetId === ctx.harness);
  if (target?.callerEnvVars) {
    return target.callerEnvVars.includes('CODEX_THREAD_ID') || target.callerEnvVars.includes('CODEX_SESSION_ID');
  }
  return false;
}

/**
 * Check whether the harness uses programmatic adapter family (pi-style).
 */
function isProgrammaticAdapter(ctx: PromptContext): boolean {
  const target = listPluginTargetDescriptors().find(t => t.targetId === ctx.harness);
  return target?.adapterFamily === 'programmatic';
}

/**
 * Renders the run:create and session binding section.
 * Complex conditional logic is pre-computed and passed as extras to the template.
 */
export function renderRunCreation(ctx: PromptContext): string {
  const bindingFlagsLine = ctx.sessionBindingFlags
    ? `\n  ${ctx.sessionBindingFlags} \\`
    : '';

  const requiredFlagsLines = [
    '**Required flags:**',
    '- `--process-id <id>` -- unique identifier for the process definition',
    '- `--entry <absolute-path>#<export>` -- path to the process JS file and its',
    '  named export (e.g., `./my-process.js#process`). Omit to create a bare run',
    '  (assign the process later via `run:assign-process`)',
    '- `--prompt "$PROMPT"` -- the user\'s initial prompt/request text',
    `- \`--harness ${ctx.harness}\` -- activates ${ctx.harnessLabel} session binding. The session ID is`,
    `  auto-resolved from ${ctx.sessionEnvVars}.`,
  ];

  const isCodexStyle = hasCodexAmbientSessionBinding(ctx);
  const sessionIdNote = isCodexStyle
    ? `Do **not** pass \`--session-id\` explicitly inside a real ${ctx.harnessLabel} session. The\nsession ID auto-resolves from the **PID-scoped session marker** written by the\nsession-start hook (authoritative), with the harness env file and\n\`AGENT_SESSION_ID\` env var used only as last-resort fallbacks. Orchestrators\ncan verify the binding at any time via \`babysitter session:whoami --json\`. Only\npass \`--session-id\` in out-of-band recovery flows.\n`
    : `The session ID auto-resolves from the **PID-scoped session marker** written by\nthe session-start hook (authoritative), with the harness env file and\n\`AGENT_SESSION_ID\` env var used only as last-resort fallbacks. Orchestrators\ncan verify the binding at any time via \`babysitter session:whoami --json\`.\n`;

  const resumeFlagsLine = ctx.resumeFlags
    ? `\n  ${ctx.resumeFlags} \\`
    : '';

  const isProgrammatic = isProgrammaticAdapter(ctx);
  const mistakeHarnessNote = isCodexStyle
    ? `- wrong: Trying to bind the session in a separate step after run creation\n- correct: Using \`--harness ${ctx.harness}\` with \`run:create\` to create the run AND\n  auto-bind the session, relying on environment variables for honest session\n  binding`
    : isProgrammatic
      ? `- correct: Using \`--harness ${ctx.harness}\` with \`run:create\` to create the run AND\n  auto-bind the session, relying on the environment variables set by the\n  extension for honest session binding.`
      : `- wrong: Trying to bind the session in a separate step after run creation instead of using \`--harness ${ctx.harness}\` to do both in one step.\n- correct: Using \`--harness ${ctx.harness}\` with \`run:create\` to create the run AND auto-bind the session without manual intervention and relying on the environment variables set by the hooks for honest session binding.`;

  return renderTemplate(resolveTemplatePath('run-creation.md'), ctx, {
    bindingFlagsLine,
    requiredFlagsList: requiredFlagsLines.join('\n'),
    sessionIdNote,
    resumeFlagsLine,
    mistakeHarnessNote,
  });
}
