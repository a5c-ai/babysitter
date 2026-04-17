/**
 * Reference to a hook handler function.
 */
export interface HandlerRef {
  /** Module or plugin that provides the handler. */
  source: string;
  /** Export name or handler identifier within the source. */
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
