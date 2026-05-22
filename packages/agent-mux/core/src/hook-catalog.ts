/**
 * Per-harness hook type catalog.
 *
 * Lists the hook types each harness natively supports. Used by
 * `amux hooks <agent> discover` and to validate `add` / `set` operations.
 *
 * The catalog is conservative: it reflects documented, stable hook names
 * at the time of writing. Unknown hook types are still accepted (marked
 * "custom") so plugin adapters can register their own.
 */

import type { AgentName } from './types.js';

export interface HookTypeEntry {
  name: string;
  description: string;
  /** Direction of the hook: 'pre' blocks/modifies, 'post' observes. */
  direction: 'pre' | 'post' | 'event';
}

export const HOOK_CATALOG: Record<string, HookTypeEntry[]> = {
  claude: [
    { name: 'PreToolUse', description: 'Before a tool is invoked.', direction: 'pre' },
    { name: 'PostToolUse', description: 'After a tool returns.', direction: 'post' },
    { name: 'UserPromptSubmit', description: 'When the user submits a prompt.', direction: 'pre' },
    { name: 'Notification', description: 'Claude emits a notification.', direction: 'event' },
    { name: 'Stop', description: 'Main agent stops.', direction: 'event' },
    { name: 'SubagentStop', description: 'Subagent stops.', direction: 'event' },
    { name: 'SessionStart', description: 'Session starts.', direction: 'event' },
    { name: 'SessionEnd', description: 'Session ends.', direction: 'event' },
  ],
  codex: [
    { name: 'OnToolCall', description: 'Around tool calls.', direction: 'pre' },
    { name: 'OnStop', description: 'Codex run stops.', direction: 'event' },
  ],
  gemini: [
    { name: 'pre_prompt', description: 'Before prompt submission.', direction: 'pre' },
    { name: 'post_response', description: 'After model response.', direction: 'post' },
  ],
  copilot: [
    { name: 'preTool', description: 'Before tool use.', direction: 'pre' },
    { name: 'postTool', description: 'After tool use.', direction: 'post' },
  ],
  cursor: [
    { name: 'pre_tool', description: 'Before tool use.', direction: 'pre' },
    { name: 'post_tool', description: 'After tool use.', direction: 'post' },
  ],
  opencode: [
    { name: 'on_step', description: 'Per-step hook.', direction: 'event' },
  ],
  pi: [
    { name: 'onEvent', description: 'Generic event hook.', direction: 'event' },
  ],
  omp: [
    { name: 'onEvent', description: 'Generic event hook.', direction: 'event' },
  ],
  openclaw: [
    { name: 'onEvent', description: 'Generic event hook.', direction: 'event' },
  ],
  hermes: [
    { name: 'onEvent', description: 'Generic event hook.', direction: 'event' },
  ],
};

export function getHookCatalog(agent: AgentName | string): HookTypeEntry[] {
  return HOOK_CATALOG[agent] ?? [];
}

export function isKnownHookType(agent: AgentName | string, hookType: string): boolean {
  const entries = HOOK_CATALOG[agent];
  if (!entries) return false;
  return entries.some((e) => e.name === hookType);
}
