import type { PromptContext } from "../../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

export function createOpenCodeContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext({
    harness: 'opencode',
    harnessLabel: 'OpenCode',
    capabilities: ['task-tool', 'breakpoint-routing'],
    pluginRootVar: '',
    loopControlTerm: 'in-turn',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: '',
    sessionEnvVars: 'PID-scoped session marker (authoritative); shell.env-injected session ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '',
    cliSetupSnippet: createDefaultCliSetupSnippet(),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
  }, overrides);
}
