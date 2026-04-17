import type { PromptContext } from "../../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

export function createOhMyPiContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext({
    harness: 'oh-my-pi',
    harnessLabel: 'oh-my-pi',
    capabilities: ['skills', 'slash-commands', 'task-tool', 'harness-routing', 'programmatic-session', 'mcp'],
    pluginRootVar: '${OMP_PLUGIN_ROOT}',
    loopControlTerm: 'skill-driven',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion',
    sessionEnvVars: 'PID-scoped session marker (authoritative); OMP_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '',
    cliSetupSnippet: createDefaultCliSetupSnippet(),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
  }, overrides);
}
