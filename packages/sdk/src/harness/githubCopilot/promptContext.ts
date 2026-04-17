import type { PromptContext } from "../../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

export function createGithubCopilotContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext({
    harness: 'github-copilot',
    harnessLabel: 'GitHub Copilot CLI',
    capabilities: ['hooks', 'mcp', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '${COPILOT_PLUGIN_ROOT}',
    loopControlTerm: 'in-turn',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'PID-scoped session marker (authoritative); COPILOT_ENV_FILE / COPILOT_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '',
    cliSetupSnippet: createDefaultCliSetupSnippet(),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
  }, overrides);
}
