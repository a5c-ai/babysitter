/**
 * GAP-SEC: Execution Mandate system.
 *
 * Mandates are scoped, lifecycle-managed authority grants that can be
 * derived (attenuated) and converted to PolicyRule[] for engine evaluation.
 */

import crypto from 'node:crypto';
import type { PolicyRule, PolicyEvaluationContext } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The set of permissions / limits a mandate grants. */
export interface MandateScope {
  /** Effect kinds allowed. Array of strings, or ['*'] for wildcard. */
  allowedEffectKinds: string[];
  /** Maximum iterations permitted. */
  maxIterations: number;
  /** Maximum concurrent tasks permitted. */
  maxConcurrentTasks: number;
  /** Timeout in milliseconds. */
  timeoutMs: number;
}

/** Lifecycle states of a mandate. */
export type MandateLifecycle = 'created' | 'active' | 'revoked';

/** Where this mandate came from. */
export interface MandateProvenance {
  /** The root mandate ID (self-referential for root mandates). */
  rootMandateId: string;
  /** Chain of mandate IDs from root to parent. */
  derivationChain: string[];
}

/** An execution mandate. */
export interface ExecutionMandate {
  mandateId: string;
  scope: MandateScope;
  grantedBy: string;
  lifecycle: MandateLifecycle;
  provenance: MandateProvenance;
  createdAt: string;
  activatedAt?: string;
  /** High-resolution activation mark (performance.now()) for precise expiry checks. */
  activatedMark?: number;
  revokedAt?: string;
  revokedBy?: string;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface CreateMandateOptions {
  scope: MandateScope;
  grantedBy: string;
}

export interface RevokeMandateOptions {
  revokedBy: string;
  reason: string;
}

export interface DeriveMandateOptions {
  scope: MandateScope;
  grantedBy: string;
}

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface MandateValidationResult {
  valid: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Create a new mandate in the 'created' lifecycle state.
 */
export function createMandate(options: CreateMandateOptions): ExecutionMandate {
  const mandateId = crypto.randomUUID();
  return {
    mandateId,
    scope: { ...options.scope, allowedEffectKinds: [...options.scope.allowedEffectKinds] },
    grantedBy: options.grantedBy,
    lifecycle: 'created',
    provenance: {
      rootMandateId: mandateId,
      derivationChain: [],
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Transition a mandate from 'created' to 'active'.
 */
export function activateMandate(mandate: ExecutionMandate): ExecutionMandate {
  if (mandate.lifecycle !== 'created') {
    throw new Error(`Cannot activate mandate in '${mandate.lifecycle}' state; must be 'created'`);
  }
  const now = Date.now();
  const result: ExecutionMandate = {
    ...mandate,
    scope: { ...mandate.scope, allowedEffectKinds: [...mandate.scope.allowedEffectKinds] },
    lifecycle: 'active',
    activatedAt: new Date(now).toISOString(),
  };
  result.activatedMark = performance.now();
  return result;
}

/**
 * Revoke a mandate. Only active mandates can be revoked.
 */
export function revokeMandate(mandate: ExecutionMandate, options: RevokeMandateOptions): ExecutionMandate {
  if (mandate.lifecycle === 'revoked') {
    throw new Error('Cannot revoke an already-revoked mandate');
  }
  return {
    ...mandate,
    scope: { ...mandate.scope, allowedEffectKinds: [...mandate.scope.allowedEffectKinds] },
    lifecycle: 'revoked',
    revokedAt: new Date().toISOString(),
    revokedBy: options.revokedBy,
  };
}

/**
 * Derive a child mandate from an active parent. The child scope must be
 * equal to or narrower than the parent scope (intersection semantics).
 */
export function deriveMandate(parent: ExecutionMandate, options: DeriveMandateOptions): ExecutionMandate {
  if (parent.lifecycle !== 'active') {
    throw new Error(`Cannot derive from mandate in '${parent.lifecycle}' state; must be 'active'`);
  }

  // Validate scope is not wider than parent
  const parentKinds = parent.scope.allowedEffectKinds;
  const isParentWildcard = parentKinds.length === 1 && parentKinds[0] === '*';

  const childKinds = options.scope.allowedEffectKinds;
  if (!isParentWildcard) {
    for (const kind of childKinds) {
      if (kind === '*') {
        throw new Error('Child scope expands beyond parent: wildcard child not allowed when parent has explicit effect kinds');
      }
      if (!parentKinds.includes(kind)) {
        throw new Error(`Child scope expands beyond parent: effect kind '${kind}' not in parent scope`);
      }
    }
  }

  if (options.scope.maxIterations > parent.scope.maxIterations) {
    throw new Error(`Child scope expands beyond parent: maxIterations ${options.scope.maxIterations} > ${parent.scope.maxIterations}`);
  }
  if (options.scope.maxConcurrentTasks > parent.scope.maxConcurrentTasks) {
    throw new Error(`Child scope expands beyond parent: maxConcurrentTasks ${options.scope.maxConcurrentTasks} > ${parent.scope.maxConcurrentTasks}`);
  }
  if (options.scope.timeoutMs > parent.scope.timeoutMs) {
    throw new Error(`Child scope expands beyond parent: timeoutMs ${options.scope.timeoutMs} > ${parent.scope.timeoutMs}`);
  }

  const mandateId = crypto.randomUUID();
  return {
    mandateId,
    scope: { ...options.scope, allowedEffectKinds: [...options.scope.allowedEffectKinds] },
    grantedBy: options.grantedBy,
    lifecycle: 'created',
    provenance: {
      rootMandateId: parent.provenance.rootMandateId,
      derivationChain: [...parent.provenance.derivationChain, parent.mandateId],
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validate whether a mandate permits the given evaluation context.
 */
export function validateMandateForContext(
  mandate: ExecutionMandate,
  ctx: PolicyEvaluationContext,
): MandateValidationResult {
  // Check lifecycle
  if (mandate.lifecycle === 'revoked') {
    return { valid: false, reason: 'Mandate has been revoked' };
  }
  if (mandate.lifecycle !== 'active') {
    return { valid: false, reason: `Mandate is in '${mandate.lifecycle}' state, not active` };
  }

  // Check expiration (activatedAt + timeoutMs)
  if (mandate.activatedAt) {
    let elapsedMs: number;
    if (mandate.activatedMark != null) {
      elapsedMs = performance.now() - mandate.activatedMark;
    } else {
      elapsedMs = Date.now() - new Date(mandate.activatedAt).getTime();
    }
    if (elapsedMs >= mandate.scope.timeoutMs) {
      return { valid: false, reason: 'Mandate has expired' };
    }
  }

  // Check effect kind
  const kinds = mandate.scope.allowedEffectKinds;
  const isWildcard = kinds.length === 1 && kinds[0] === '*';
  if (!isWildcard && !kinds.includes(ctx.effectKind)) {
    return { valid: false, reason: `Effect kind '${ctx.effectKind}' is not allowed by mandate scope` };
  }

  return { valid: true };
}

/**
 * Convert a mandate's scope into PolicyRule[] for governance engine evaluation.
 */
export function mandateToPolicy(mandate: ExecutionMandate): PolicyRule[] {
  const rules: PolicyRule[] = [];
  const prefix = `mandate:${mandate.mandateId.slice(0, 8)}`;

  // 1. Deny rule for out-of-scope effect kinds (if not wildcard)
  const kinds = mandate.scope.allowedEffectKinds;
  const isWildcard = kinds.length === 1 && kinds[0] === '*';

  if (!isWildcard) {
    // Create a deny rule that matches any effectKind NOT in the allowed list.
    // We use a regex negative lookahead.
    const escaped = kinds.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = `^(?!${escaped.join('|')}$)`;
    rules.push({
      id: `${prefix}:deny-out-of-scope`,
      kind: 'permission',
      condition: { field: 'effectKind', op: 'matches', value: pattern },
      action: 'deny',
      priority: 200,
      metadata: { source: 'mandate', mandateId: mandate.mandateId },
    });
  }

  // 2. Iteration limit rule
  rules.push({
    id: `${prefix}:max-iterations`,
    kind: 'rate-limit',
    condition: { field: 'iteration', op: 'gt', value: String(mandate.scope.maxIterations) },
    action: 'deny',
    priority: 150,
    metadata: { source: 'mandate', mandateId: mandate.mandateId },
  });

  return rules;
}
