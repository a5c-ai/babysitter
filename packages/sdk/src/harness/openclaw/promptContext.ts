import type { PromptContext } from "../../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

export function createOpenClawContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext({
    harness: 'openclaw',
    harnessLabel: 'OpenClaw',
    capabilities: ['session-binding', 'mcp', 'headless-prompt', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '',
    loopControlTerm: 'agent_end',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'PID-scoped session marker (authoritative); OPENCLAW_SHELL gateway injection and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '',
    cliSetupSnippet: createDefaultCliSetupSnippet(),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
  }, overrides);
}
