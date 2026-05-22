/**
 * Canonical lifecycle phases covering all hook events in the unified hooks-mux system.
 */
export type CanonicalPhase =
  // Session lifecycle
  | 'session.start'
  | 'session.end'
  | 'session.cwd_changed'
  | 'session.file_changed'
  | 'session.config_changed'
  | 'session.compact.before'
  | 'session.compact.after'
  // Turn lifecycle
  | 'turn.user_prompt_submitted'
  | 'turn.before_agent'
  | 'turn.after_agent'
  | 'turn.stop'
  | 'turn.error'
  // Model / planner
  | 'model.before_request'
  | 'model.after_response'
  | 'planner.before_tool_selection'
  // Tool lifecycle
  | 'tool.before'
  | 'tool.after'
  | 'tool.error'
  | 'tool.permission_request'
  | 'tool.permission_denied'
  // Subagent lifecycle
  | 'subagent.start'
  | 'subagent.end'
  // Notification / messaging
  | 'notification'
  | 'message.received'
  | 'message.sending'
  | 'message.sent'
  // MCP
  | 'mcp.elicitation'
  | 'mcp.elicitation_result';

/**
 * Support level indicating how faithfully a harness adapter can map
 * its native hooks to a given canonical phase.
 */
export type SupportLevel = 'native' | 'emulated' | 'lossy' | 'unsupported';

/**
 * Describes the scope/category a lifecycle phase belongs to.
 */
export type LifecycleScope =
  | 'session'
  | 'turn'
  | 'model'
  | 'planner'
  | 'tool'
  | 'subagent'
  | 'notification'
  | 'mcp';

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
