import type { PromptContext } from "../../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

export function createPiContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext({
    harness: 'pi',
    harnessLabel: 'Pi Coding Agent',
    capabilities: ['skills', 'slash-commands', 'task-tool', 'harness-routing', 'programmatic-session'],
    pluginRootVar: '${PI_PLUGIN_ROOT}',
    loopControlTerm: 'skill-driven',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion',
    sessionEnvVars: 'PID-scoped session marker (authoritative); PI_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '',
    cliSetupSnippet: createDefaultCliSetupSnippet(),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
  }, overrides);
}
