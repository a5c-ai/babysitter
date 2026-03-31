import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

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
    '  named export (e.g., `./my-process.js#process`)',
    '- `--prompt "$PROMPT"` -- the user\'s initial prompt/request text',
    `- \`--harness ${ctx.harness}\` -- activates ${ctx.harnessLabel} session binding. The session ID is`,
    `  auto-resolved from ${ctx.sessionEnvVars}.`,
  ];

  if (ctx.sessionBindingFlags) {
    const flagParts = ctx.sessionBindingFlags.split(/\s+--/).filter(Boolean);
    for (const part of flagParts) {
      const flagName = part.startsWith('--') ? part : `--${part}`;
      const nameOnly = flagName.split(/\s/)[0];
      if (nameOnly === '--state-dir') {
        requiredFlagsLines.push('- `--state-dir .a5c` -- required for honest workspace-local session state');
      } else if (nameOnly === '--plugin-root') {
        requiredFlagsLines.push(`- \`--plugin-root "${ctx.pluginRootVar}"\` -- plugin root for state resolution`);
      }
    }
  }

  const sessionIdNote = ctx.harness === 'codex'
    ? `Do **not** pass \`--session-id\` explicitly inside a real ${ctx.harnessLabel} session. The ${ctx.harnessLabel}\nadapter auto-resolves the session/thread ID from environment variables. Only pass\n\`--session-id\` in out-of-band recovery flows.\n`
    : '';

  const resumeFlagsLine = ctx.resumeFlags
    ? `\n  ${ctx.resumeFlags} \\`
    : '';

  const mistakeHarnessNote = ctx.harness === 'codex'
    ? `- wrong: Trying to bind the session in a separate step after run creation\n- correct: Using \`--harness ${ctx.harness}\` with \`run:create\` to create the run AND\n  auto-bind the session, relying on environment variables for honest session\n  binding`
    : ctx.harness === 'pi'
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
