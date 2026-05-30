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
  /** Optional handler type. Omitted type is treated as a legacy shell command. */
  type?: 'command' | 'shell';
  /** Optional shell executable used for command handlers. */
  shell?: string;
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
  /** Additional matcher conditions evaluated with AND semantics after `when`. */
  if?: Record<string, unknown>;
  handler: HandlerRef;
  timeoutMs?: number;
  /** Optional shell executable for this hook entry. */
  shell?: string;
  /** Diagnostic status message surfaced in handler metadata. */
  statusMessage?: string;
  /** Run the command without awaiting process exit. */
  async?: boolean;
  /** Request a rewake/reminder after async completion when supported. */
  asyncRewake?: boolean;
  /** Suppress duplicate execution for this entry within a session. */
  once?: boolean;
}
