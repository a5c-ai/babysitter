/**
 * Intercepts built-in task/todo tools during active babysitter runs.
 *
 * When a babysitter run is active, direct use of oh-my-pi's native task
 * and todo tools would conflict with babysitter's own orchestration.
 * This module detects those calls and blocks them, directing the agent
 * to use babysitter effects instead.
 *
 * Wire into the extension via `pi.on("tool_call", ...)`.
 *
 * @module task-interceptor
 */

import { isRunActive } from './session-binder.js';

/** Tool names that should be intercepted during an active run. */
export const INTERCEPTED_TOOLS = [
  'task',
  'todo_write',
  'TodoWrite',
  'TaskCreate',
  'sub_agent',
  'quick_task',
];

/**
 * Check whether a given tool name is subject to interception.
 *
 * @param toolName - The tool name to check.
 * @returns `true` if the tool would be intercepted during an active run.
 */
export function shouldIntercept(toolName: string): boolean {
  return INTERCEPTED_TOOLS.includes(toolName);
}

/**
 * Evaluate whether a tool call should be intercepted.
 *
 * When a babysitter run is actively orchestrating, calls to built-in
 * task and todo tools are blocked and a reason is provided so the
 * agent can route the request through babysitter instead.
 *
 * Returns `null` when no interception is needed (no active run or
 * the tool is not in the intercepted list), allowing normal operation.
 *
 * Returns `{ block: true, reason }` when the tool should be prevented
 * from executing.
 *
 * Designed to be wired into oh-my-pi's `tool_call` event handler:
 * ```ts
 * pi.on('tool_call', (toolName, params) => {
 *   return interceptToolCall(toolName, params, pi);
 * });
 * ```
 *
 * @param toolName - The name of the tool being invoked.
 * @param params   - The parameters passed to the tool.
 * @param pi       - The oh-my-pi ExtensionAPI instance.
 * @returns An intercept result or `null` to allow the call.
 */
export function interceptToolCall(
  toolName: string,
  params: unknown,
  pi: any,
): { block: boolean; reason?: string } | null {
  // No active run -- allow everything.
  if (!isRunActive()) {
    return null;
  }

  // Tool is not one we care about -- allow.
  if (!shouldIntercept(toolName)) {
    return null;
  }

  // Active run AND intercepted tool -- block.
  return {
    block: true,
    reason:
      'Babysitter orchestration is active. Task management is handled by babysitter effects. Use /babysitter:status to check progress.',
  };
}
