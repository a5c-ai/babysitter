/**
 * GAP-SEC: Authority Chain system.
 *
 * Models delegation chains from human principals through agent principals,
 * with monotonically narrowing scope at each hop.
 */

import type { MandateScope } from './mandate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A principal (human or agent) in the authority chain. */
export interface AuthorityPrincipal {
  kind: 'human' | 'agent';
  id: string;
  displayName: string;
}

/** A single grant of authority from one principal to another. */
export interface AuthorityGrant {
  from: AuthorityPrincipal;
  to: AuthorityPrincipal;
  scope: MandateScope;
  grantedAt: string;
  revokedAt?: string;
  expiresAt?: string;
}

/** A link in the authority chain (wrapping a grant). */
export interface AuthorityChainLink {
  grant: AuthorityGrant;
  index: number;
}

/** A full authority chain from root to leaf. */
export interface AuthorityChain {
  grants: AuthorityGrant[];
  rootPrincipal: AuthorityPrincipal;
  effectiveScope: MandateScope;
}

/** Result of chain validation. */
export interface AuthorityChainValidationResult {
  valid: boolean;
  reason?: string;
}

/** Result of tracing authority to a human root. */
export interface AuthorityTrace {
  humanPrincipal: AuthorityPrincipal;
  hopCount: number;
  principalPath: string[];
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Create an authority chain from an ordered list of grants.
 * Computes the effective scope as the intersection of all grant scopes.
 */
export function createAuthorityChain(grants: AuthorityGrant[]): AuthorityChain {
  if (grants.length === 0) {
    throw new Error('Authority chain requires at least one grant');
  }

  const rootPrincipal = grants[0].from;

  // Compute effective scope as intersection of all grant scopes
  let effectiveScope: MandateScope = { ...grants[0].scope, allowedEffectKinds: [...grants[0].scope.allowedEffectKinds] };
  for (let i = 1; i < grants.length; i++) {
    effectiveScope = attenuateScope(effectiveScope, grants[i].scope);
  }

  return {
    grants: [...grants],
    rootPrincipal,
    effectiveScope,
  };
}

/**
 * Validate an authority chain. Checks:
 * 1. Root must be a human principal.
 * 2. No revoked links.
 * 3. No expired links.
 * 4. Scopes monotonically narrow (no expansion).
 */
export function validateAuthorityChain(chain: AuthorityChain): AuthorityChainValidationResult {
  // 1. Root must be human
  if (chain.rootPrincipal.kind !== 'human') {
    return { valid: false, reason: 'Authority chain must be rooted in a human principal' };
  }

  const now = Date.now();

  for (let i = 0; i < chain.grants.length; i++) {
    const grant = chain.grants[i];

    // 2. No revoked links
    if (grant.revokedAt) {
      return { valid: false, reason: `Grant at index ${i} has been revoked` };
    }

    // 3. No expired links
    if (grant.expiresAt && new Date(grant.expiresAt).getTime() <= now) {
      return { valid: false, reason: `Grant at index ${i} has expired` };
    }

    // 4. Scope must not expand beyond previous grant
    if (i > 0) {
      const parentScope = chain.grants[i - 1].scope;
      const childScope = grant.scope;

      if (!isScopeSubsetOrEqual(parentScope, childScope)) {
        return { valid: false, reason: `Grant at index ${i} expands scope beyond parent` };
      }
    }
  }

  return { valid: true };
}

/**
 * Check if childScope is a subset of or equal to parentScope.
 */
function isScopeSubsetOrEqual(parent: MandateScope, child: MandateScope): boolean {
  // Check effect kinds
  const parentWildcard = parent.allowedEffectKinds.length === 1 && parent.allowedEffectKinds[0] === '*';
  if (!parentWildcard) {
    for (const kind of child.allowedEffectKinds) {
      if (kind === '*') {
        return false; // wildcard child cannot escape non-wildcard parent
      }
      if (!parent.allowedEffectKinds.includes(kind)) {
        return false;
      }
    }
  }

  // Check numeric limits
  if (child.maxIterations > parent.maxIterations) return false;
  if (child.maxConcurrentTasks > parent.maxConcurrentTasks) return false;
  if (child.timeoutMs > parent.timeoutMs) return false;

  return true;
}

/**
 * Attenuate (intersect) two scopes. The result is never wider than either input.
 * Pure function.
 */
export function attenuateScope(parent: MandateScope, child: MandateScope): MandateScope {
  const parentWildcard = parent.allowedEffectKinds.length === 1 && parent.allowedEffectKinds[0] === '*';
  const childWildcard = child.allowedEffectKinds.length === 1 && child.allowedEffectKinds[0] === '*';

  let allowedEffectKinds: string[];
  if (parentWildcard && childWildcard) {
    allowedEffectKinds = ['*'];
  } else if (parentWildcard) {
    allowedEffectKinds = [...child.allowedEffectKinds];
  } else if (childWildcard) {
    allowedEffectKinds = [...parent.allowedEffectKinds];
  } else {
    allowedEffectKinds = parent.allowedEffectKinds.filter(k => child.allowedEffectKinds.includes(k));
  }

  return {
    allowedEffectKinds,
    maxIterations: Math.min(parent.maxIterations, child.maxIterations),
    maxConcurrentTasks: Math.min(parent.maxConcurrentTasks, child.maxConcurrentTasks),
    timeoutMs: Math.min(parent.timeoutMs, child.timeoutMs),
  };
}

/**
 * Trace authority back to the human root, returning the human principal,
 * hop count, and full principal path.
 */
export function traceAuthorityToHuman(chain: AuthorityChain): AuthorityTrace {
  const principalPath: string[] = [chain.grants[0].from.id];
  for (const grant of chain.grants) {
    principalPath.push(grant.to.id);
  }

  return {
    humanPrincipal: chain.rootPrincipal,
    hopCount: chain.grants.length,
    principalPath,
  };
}
