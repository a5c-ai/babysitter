import type { PromptContext } from "../../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

export function createCursorContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext({
    harness: 'cursor',
    harnessLabel: 'Cursor',
    capabilities: ['hooks', 'stop-hook', 'mcp', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '${CURSOR_PLUGIN_ROOT}',
    loopControlTerm: 'stop-hook',
    sessionBindingFlags: '',
    hookDriven: true,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'conversation_id from hook stdin (authoritative per-request); PID-scoped session marker; BABYSITTER_SESSION_ID fallback',
    resumeFlags: '',
    cliSetupSnippet: createDefaultCliSetupSnippet(),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
  }, overrides);
}
