import type { PromptContext } from "../../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

export function createCodexContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext({
    harness: 'codex',
    harnessLabel: 'Codex',
    capabilities: ['hooks', 'stop-hook', 'ask-user-question', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '${CODEX_PLUGIN_ROOT}',
    loopControlTerm: 'stop-hook',
    sessionBindingFlags: '',
    hookDriven: true,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars:
      'PID-scoped session marker (authoritative); CODEX_THREAD_ID/CODEX_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '',
    cliSetupSnippet: createDefaultCliSetupSnippet(),
    iterateFlags: '',
    hasIntentFidelityChecks: true,
    hasNonNegotiables: true,
  }, overrides);
}
