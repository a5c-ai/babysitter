/**
 * Error hierarchy for @a5c-ai/agent-mux.
 *
 * All errors extend the base AgentMuxError.
 */

import type { AgentName, ErrorCode, ValidationFieldError } from './types.js';

// ---------------------------------------------------------------------------
// AgentMuxError — Base (§3.1)
// ---------------------------------------------------------------------------

/**
 * Base error class for all agent-mux errors.
 * Provides a machine-readable `code` and a `recoverable` flag.
 */
export class AgentMuxError extends Error {
  /** Machine-readable error code. */
  readonly code: ErrorCode;

  /** Whether the operation can be retried. */
  readonly recoverable: boolean;

  constructor(code: ErrorCode, message: string, recoverable: boolean = false) {
    super(message);
    this.name = 'AgentMuxError';
    this.code = code;
    this.recoverable = recoverable;
  }
}

// ---------------------------------------------------------------------------
// CapabilityError (§3.2)
// ---------------------------------------------------------------------------

/**
 * Thrown when a RunOptions field or API call requires a capability that
 * the target agent or model does not support.
 */
export class CapabilityError extends AgentMuxError {
  /** The agent that lacks the capability. */
  readonly agent: AgentName;

  /** The capability that was requested. */
  readonly capability: string;

  /** The model that was targeted, if applicable. */
  readonly model?: string;

  constructor(agent: AgentName, capability: string, model?: string) {
    const modelSuffix = model ? ` (model: ${model})` : '';
    super(
      'CAPABILITY_ERROR',
      `Agent "${agent}" does not support capability "${capability}"${modelSuffix}`,
      false,
    );
    this.name = 'CapabilityError';
    this.agent = agent;
    this.capability = capability;
    this.model = model;
  }
}

// ---------------------------------------------------------------------------
// ValidationError (§3.3)
// ---------------------------------------------------------------------------

/**
 * Thrown when input values fail schema or range validation.
 */
export class ValidationError extends AgentMuxError {
  /** The field(s) that failed validation. */
  readonly fields: ValidationFieldError[];

  constructor(fields: ValidationFieldError[]) {
    const summary = fields.map((f) => `${f.field}: ${f.message}`).join('; ');
    super('VALIDATION_ERROR', `Validation failed: ${summary}`, false);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

// ---------------------------------------------------------------------------
// AuthError (§3.4)
// ---------------------------------------------------------------------------

/**
 * Thrown when an agent's authentication state prevents the requested operation.
 */
export class AuthError extends AgentMuxError {
  /** The agent with the auth problem. */
  readonly agent: AgentName;

  /** Current auth status. */
  readonly status: 'unauthenticated' | 'expired' | 'unknown';

  /** Human-readable guidance on how to authenticate. */
  readonly guidance: string;

  constructor(
    agent: AgentName,
    status: AuthError['status'],
    guidance: string,
  ) {
    super(
      'AUTH_ERROR',
      `Agent "${agent}" authentication failed (${status}): ${guidance}`,
      false,
    );
    this.name = 'AuthError';
    this.agent = agent;
    this.status = status;
    this.guidance = guidance;
  }
}
