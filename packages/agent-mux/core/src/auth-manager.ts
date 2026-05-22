/**
 * AuthManager interface and implementation for @a5c-ai/agent-mux.
 *
 * Provides read-only authentication state detection and setup guidance
 * for all supported agents. Delegates detection to agent adapters.
 *
 * @see 08-config-and-auth.md
 */

import type { AgentName } from './types.js';
import type { AdapterRegistry } from './adapter-registry.js';
import { AgentMuxError } from './errors.js';
import { telemetry } from '@a5c-ai/agent-mux-observability';
import type { Span } from '@opentelemetry/api';

// Re-export all auth types from the dedicated module
export type {
  AuthMethod as AuthMethodType,
  AuthState as FullAuthState,
  AuthSetupGuidance as FullAuthSetupGuidance,
  AuthSetupStep,
  AuthEnvVar,
} from './auth-types.js';

import type { AuthState } from './auth-types.js';
import type { AuthMethod } from './auth-types.js';
import type { AuthSetupGuidance } from './auth-types.js';

// ---------------------------------------------------------------------------
// AuthManager Interface
// ---------------------------------------------------------------------------

/** Authentication state detection and setup guidance. */
export interface AuthManager {
  /** Check authentication state for a single agent. */
  check(agent: AgentName): Promise<AuthState>;

  /** Check authentication state for all registered agents. */
  checkAll(): Promise<Record<string, AuthState>>;

  /** Get structured setup guidance for authenticating with an agent. */
  getSetupGuidance(agent: AgentName): AuthSetupGuidance;
}

// ---------------------------------------------------------------------------
// AuthManagerImpl
// ---------------------------------------------------------------------------

/**
 * Implementation of AuthManager.
 *
 * Delegates detection to adapter.detectAuth() and guidance to
 * adapter.getAuthGuidance(). Each call to check() performs a fresh
 * detection (no caching).
 */
export class AuthManagerImpl implements AuthManager {
  private readonly _adapters: AdapterRegistry;

  constructor(adapters: AdapterRegistry) {
    this._adapters = adapters;
  }

  // -- Helper ------------------------------------------------------------------

  private _getAdapter(agent: AgentName) {
    const adapter = this._adapters.get(agent);
    if (!adapter) {
      throw new AgentMuxError('AGENT_NOT_FOUND', `Unknown agent: "${agent}"`);
    }
    return adapter;
  }

  // -- check() -----------------------------------------------------------------

  async check(agent: AgentName): Promise<AuthState> {
    const span = (telemetry as any).getTracer?.()?.startSpan(`auth.check.${agent}`);
    const adapter = this._getAdapter(agent);
    try {
      const rawState = await adapter.detectAuth();

      const state: AuthState = {
        agent,
        status: rawState.status,
        method: rawState.method as AuthMethod | undefined,
        identity: rawState.identity,
        expiresAt: rawState.expiresAt
          ? (rawState.expiresAt instanceof Date ? rawState.expiresAt : new Date(rawState.expiresAt as string))
          : undefined,
        checkedAt: new Date(),
      };

      if (span) {
        span.setAttributes({
          status: state.status,
          method: state.method || 'unknown',
        });
        telemetry.endSpanSuccess(span);
      }

      telemetry.recordAuthEvent(agent, state.method || 'unknown', state.status === 'authenticated');

      return state;
    } catch (err: any) {
      if (span) {
        telemetry.endSpanError(span, err);
      }
      throw err;
    }
  }

  // -- checkAll() --------------------------------------------------------------

  async checkAll(): Promise<Record<string, AuthState>> {
    const adapters = this._adapters.list();
    const results: Record<string, AuthState> = {};

    const checks = adapters.map(async (info) => {
      try {
        const state = await this.check(info.agent);
        results[info.agent] = state;
      } catch {
        results[info.agent] = {
          agent: info.agent,
          status: 'unknown',
          checkedAt: new Date(),
          details: 'Auth detection failed',
        };
      }
    });

    await Promise.all(checks);
    return results;
  }

  // -- getSetupGuidance() ------------------------------------------------------

  getSetupGuidance(agent: AgentName): AuthSetupGuidance {
    const adapter = this._getAdapter(agent);
    return adapter.getAuthGuidance();
  }
}
