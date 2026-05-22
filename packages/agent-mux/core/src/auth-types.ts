/**
 * Authentication-related types for @a5c-ai/agent-mux.
 *
 * Defines auth methods, auth state snapshots, setup guidance,
 * setup steps, and environment variable descriptors.
 *
 * @see 08-config-and-auth.md
 */

import type { AgentName } from './types.js';

// ---------------------------------------------------------------------------
// AuthMethod
// ---------------------------------------------------------------------------

/** Authentication methods supported by agents. */
export type AuthMethod =
  | 'api_key'
  | 'oauth'
  | 'oauth_device'
  | 'browser_login'
  | 'token_file'
  | 'keychain'
  | 'github_token'
  | 'config_file'
  | 'none';

/** Human-readable auth method metadata exposed in capability manifests. */
export interface AuthMethodDescriptor {
  /** Method identifier used by auth state and setup guidance. */
  readonly type: AuthMethod | string;

  /** Human-readable name. */
  readonly name: string;

  /** Optional description or setup hint. */
  readonly description?: string;
}

// ---------------------------------------------------------------------------
// AuthState
// ---------------------------------------------------------------------------

/**
 * Authentication state snapshot for an agent.
 * Returned by adapter.detectAuth() and wrapped by AuthManager.
 */
export interface AuthState {
  /** The agent this state belongs to. Set by AuthManager. */
  readonly agent?: AgentName;

  /** Current authentication status. */
  readonly status: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown';

  /** The authentication method that was detected. */
  readonly method?: AuthMethod | string;

  /** Identity string (email, key prefix, etc.). */
  readonly identity?: string;

  /** When the credentials expire. */
  readonly expiresAt?: Date | string;

  /** When this auth state was checked. Set by AuthManager. */
  readonly checkedAt?: Date;

  /** Additional details about the auth state. */
  readonly details?: string;
}

// ---------------------------------------------------------------------------
// AuthSetupStep
// ---------------------------------------------------------------------------

/** A single step in the auth setup process. */
export interface AuthSetupStep {
  /** Step number (1-indexed). */
  readonly step: number;

  /** Human-readable description. */
  readonly description: string;

  /** Shell command to run for this step. */
  readonly command?: string;

  /** URL to visit for this step. */
  readonly url?: string;
}

// ---------------------------------------------------------------------------
// AuthEnvVar
// ---------------------------------------------------------------------------

/** An environment variable relevant to agent authentication. */
export interface AuthEnvVar {
  /** The environment variable name. */
  readonly name: string;

  /** Human-readable description. */
  readonly description: string;

  /** Whether required for the primary auth method. */
  readonly required: boolean;

  /** Example format for the value. */
  readonly exampleFormat?: string;
}

// ---------------------------------------------------------------------------
// AuthSetupGuidance
// ---------------------------------------------------------------------------

/** Structured authentication setup guidance. */
export interface AuthSetupGuidance {
  /** The agent this guidance is for. */
  readonly agent?: AgentName;

  /** Human-readable display name for the auth provider. */
  readonly providerName?: string;

  /** Ordered list of setup steps. */
  readonly steps: (AuthSetupStep | string)[];

  /** Environment variables relevant to authentication. */
  readonly envVars?: (AuthEnvVar | string)[];

  /** Documentation URLs. */
  readonly documentationUrls?: string[];

  /** Documentation links (alias for backward compat). */
  readonly links?: string[];

  /** Platform-specific notes. */
  readonly platformNotes?: Record<string, string>;

  /** CLI command to initiate login, if available. */
  readonly loginCommand?: string;

  /** CLI command to verify auth status, if available. */
  readonly verifyCommand?: string;
}
