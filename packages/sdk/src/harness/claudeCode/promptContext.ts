import type { PromptContext } from "../../prompts/types";
import {
  createClaudeCodeCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

export function createClaudeCodeContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext({
    harness: 'claude-code',
    harnessLabel: 'Claude Code',
    capabilities: ['hooks', 'stop-hook', 'ask-user-question', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '${CLAUDE_PLUGIN_ROOT}',
    loopControlTerm: 'stop-hook',
    sessionBindingFlags: '',
    hookDriven: true,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'PID-scoped session marker (authoritative); CLAUDE_ENV_FILE and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '',
    cliSetupSnippet: createClaudeCodeCliSetupSnippet(),
    sdkVersionExpr: '$SDK_VERSION',
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
  }, overrides);
}
