/**
 * A fragment of context accumulated during a session,
 * used for state tracking and cross-hook communication.
 */
export interface ContextFragment {
  /** Unique fragment identifier. */
  fragmentId: string;
  /** The source that produced this fragment (handler, adapter, etc.). */
  source: string;
  /** ISO-8601 timestamp of when the fragment was created. */
  createdAt: string;
  /** The fragment data. */
  data: Record<string, unknown>;
  /** Optional TTL in seconds; fragment expires after this duration. */
  ttlSeconds?: number;
}

/**
 * Tracks the state of a hooks-mux session.
 *
 * Spec section 15.3.
 */
export interface SessionState {
  version: 'a5c.hooks.session.v1';
  sessionId: string;
  adapter: string;
  createdAt: string;
  updatedAt: string;
  cwd?: string;
  transcriptPath?: string;
  persistedEnv: Record<string, string>;
  contextVars: Record<string, string>;
  contextFragments: ContextFragment[];
  metadata: Record<string, unknown>;
}
