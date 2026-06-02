/**
 * Canonical lifecycle phases covering all hook events in the unified hooks-mux system.
 */
export const CANONICAL_PHASES = [
  // Session lifecycle
  'session.start',
  'session.setup',
  'session.end',
  'session.cwd_changed',
  'session.file_changed',
  'session.config_changed',
  'session.instructions_loaded',
  'session.idle',
  'session.shell_env',
  'session.worktree_create',
  'session.worktree_remove',
  'session.compact.before',
  'session.compact.after',
  // Turn lifecycle
  'turn.user_prompt_submitted',
  'turn.before_prompt',
  'turn.before_prompt_build',
  'turn.prompt_expansion',
  'turn.before_agent',
  'turn.after_agent',
  'turn.stop',
  'turn.stop_failure',
  'turn.error',
  // Model / planner
  'model.before_request',
  'model.after_response',
  'planner.before_tool_selection',
  // Tool lifecycle
  'tool.before',
  'tool.after',
  'tool.after_failure',
  'tool.after_batch',
  'tool.error',
  'tool.permission_request',
  'tool.permission_denied',
  // Task / team lifecycle
  'task.created',
  'task.completed',
  'team.idle',
  // Subagent lifecycle
  'subagent.start',
  'subagent.end',
  // Notification / messaging
  'notification',
  'message.received',
  'message.sending',
  'message.sent',
  // MCP
  'mcp.elicitation',
  'mcp.elicitation_result',
] as const;

export type CanonicalPhase = typeof CANONICAL_PHASES[number];

/**
 * Support level indicating how faithfully a harness adapter can map
 * its native hooks to a given canonical phase.
 */
export type SupportLevel = 'native' | 'emulated' | 'lossy' | 'unsupported';

/**
 * Describes the scope/category a lifecycle phase belongs to.
 */
export const LIFECYCLE_SCOPES = [
  'session',
  'turn',
  'model',
  'planner',
  'tool',
  'task',
  'team',
  'subagent',
  'notification',
  'mcp',
] as const;

export type LifecycleScope = typeof LIFECYCLE_SCOPES[number];

/**
 * Mapping from a canonical phase to a harness-native hook identifier
 * along with support fidelity metadata.
 *
 * Spec section 8.2.
 */
export interface PhaseMapping {
  /** The canonical phase this mapping targets. */
  canonicalPhase: CanonicalPhase;
  /** The harness-native hook name or identifier. */
  nativeHook: string;
  /** How faithfully the native hook maps to the canonical phase. */
  supportLevel: SupportLevel;
  /** Whether the adapter can block on this phase. */
  blockCapability: boolean;
  /** Whether the adapter supports mutation on this phase. */
  mutationCapability: boolean;
  /** The scope/category this phase belongs to. */
  scope: LifecycleScope | 'gateway';
  /** Optional notes about limitations or transformation requirements. */
  notes?: string;
}
