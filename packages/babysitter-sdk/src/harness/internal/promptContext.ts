import type { PromptContext } from "../../prompts/types";
import {
  createInternalCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

export function createInternalContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext({
    harness: 'internal',
    harnessLabel: 'Internal (Programmatic)',
    capabilities: [
      'task-tool',
      'breakpoint-routing',
      'programmatic-session',
      'concurrent-effects',
      'background-effects',
      'multi-harness-dispatch',
    ],
    pluginRootVar: '',
    loopControlTerm: 'in-turn',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion',
    sessionEnvVars: 'PID-scoped session marker (authoritative); OMP_SESSION_ID / PI_SESSION_ID and AGENT_SESSION_ID are fallbacks',
    resumeFlags: '',
    cliSetupSnippet: createInternalCliSetupSnippet(),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
  }, overrides);
}
