/**
 * Reference to a hook handler shell command.
 */
export interface HandlerRef {
  /** Shell command to execute as a child process. */
  source: string;
  /** Handler identifier (informational label for diagnostics). */
  handler: string;
  /** Optional priority (lower = earlier execution). */
  priority?: number;
}

/**
 * An entry in the hook execution plan.
 *
 * Spec section 12.3.
 */
export interface HookPlanEntry {
  id: string;
  pluginId: string;
  phase: string;
  priority: number;
  when?: Record<string, unknown>;
  handler: HandlerRef;
  timeoutMs?: number;
}
