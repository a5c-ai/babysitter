import type { SessionState } from '../types/session';
import type { AdapterCapabilities } from '../types/adapter';
import type { MergedExecutionResult } from '../merge-engine';

// Re-export for convenience
export type { MergedExecutionResult } from '../merge-engine';

/**
 * Interface for the session store dependency.
 * Mirrors the public API of session-store so we don't couple tightly.
 */
export interface SessionStore {
  loadSession(sessionId: string, sessionDir?: string): Promise<SessionState | null>;
  saveSession(session: SessionState, sessionDir?: string): Promise<void>;
}

/**
 * Options for materializing execution context.
 */
export interface MaterializeOptions {
  sessionId: string;
  sessionStore: SessionStore;
  /** Opt-in allowlist for which persisted env keys may be rehydrated. */
  envAllowlist?: string[];
  /** Directory for temp file generation. */
  tempDir?: string;
  /** Adapter capabilities to inject as AGENT_CAPABILITIES_JSON. */
  capabilities?: AdapterCapabilities;
}

/**
 * The materialized execution context for downstream processes.
 */
export interface ExecMaterialization {
  env: Record<string, string>;
  contextFilePath?: string;
  tempEnvFilePath?: string;
}

/**
 * Options for adapting merged results to harness-native format.
 */
export interface AdaptOutputOptions {
  adapter: string;
  mergedResult: MergedExecutionResult;
  nativeInput: unknown;
  capabilities: AdapterCapabilities;
}

/**
 * Result of output adaptation, including degradation tracking.
 */
export interface AdaptedOutput {
  /** The adapted native output. */
  output: Record<string, unknown>;
  /** Fields that could not be rendered due to adapter limitations. */
  degradedFields: string[];
}

/**
 * Propagation backend mode per spec section 14.2.
 */
export type PropagationBackend = 'native_env_file' | 'runtime_hook' | 'wrapper_only' | 'none';

/**
 * Options for the propagateEnv function.
 */
export interface PropagationOptions {
  /** Path to the native env file (required for native_env_file backend). */
  nativeEnvFilePath?: string;
  /** Directory for temp file generation (used by wrapper_only). */
  tempDir?: string;
  /** Session ID for session-store persistence (used by none backend). */
  sessionId?: string;
  /** Session store instance (used by none backend). */
  sessionStore?: SessionStore;
}
