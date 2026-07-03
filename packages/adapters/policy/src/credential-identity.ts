/**
 * Milestone B — Credential-identity ALIAS canonicalization (AC-55) + deny-on-ambiguous
 * (AC-40a).
 *
 * The trusted credential→scope source (AC-40) canonicalizes aliases of ONE physical
 * credential (e.g. a KMS key referenced by ARN and by key-id) to a SINGLE
 * collision-resistant identity BEFORE the deny-on-ambiguous rule, so legitimate
 * multi-alias credentials are not falsely denied. The identity key is sha256 of the
 * credential's STABLE secret-store identity — never the value prefix, env-var name, or
 * an agent-supplied alias.
 *
 * OVERRIDING RULE: fail closed. An absent alias, an unknown identity, an ambiguous
 * identity (backed by >1 distinct credential), or ANY thrown exception → deny (no scope
 * guessed, never the narrower of two candidates).
 */
import { createHash } from 'node:crypto';

/** Maps a credential ALIAS (ARN, key-id, secret name) → its stable secret-store id. */
export type CredentialAliasMap = Record<string, string>;

export interface CredentialScopeSource {
  /** Alias → stable secret-store identity (canonicalized before hashing). */
  aliasMap: CredentialAliasMap;
  /** Canonical identity (sha256 of the stable id) → credential scope. */
  scopeByIdentity: Record<string, string>;
  /** Canonical identities known to be backed by >1 distinct credential → deny. */
  ambiguousIdentities?: string[];
}

export interface CredentialScopeResolution {
  resolved: boolean;
  scope?: string;
  /** The canonical identity resolved, on success (for audit). */
  identity?: string;
  reason?: string;
}

/**
 * Canonicalize a stable secret-store identity string into a collision-resistant
 * identity key: `sha256(stableId)` as a 64-char hex digest (AC-40a). This is NEVER the
 * raw ARN / key-id / env-var name.
 */
export function canonicalizeCredentialIdentity(stableId: string): string {
  if (typeof stableId !== 'string' || stableId.length === 0) {
    throw new Error('canonicalizeCredentialIdentity: stable id must be a non-empty string');
  }
  return createHash('sha256').update(stableId).digest('hex');
}

/**
 * Resolve a credential's scope from the trusted source, keyed by the collision-
 * resistant canonical identity of the alias.
 *
 * Fail closed: an alias absent from the trusted alias map (incl. an agent-supplied
 * alias), an identity absent from `scopeByIdentity`, an identity flagged ambiguous, or
 * any exception → `{ resolved: false }` with no scope.
 */
export function resolveCredentialScope(
  alias: string,
  source: CredentialScopeSource,
): CredentialScopeResolution {
  try {
    if (typeof alias !== 'string' || alias.length === 0) {
      return { resolved: false, reason: 'missing alias' };
    }
    if (!source || typeof source !== 'object' || !source.aliasMap || !source.scopeByIdentity) {
      return { resolved: false, reason: 'missing credential scope source' };
    }

    // The alias MUST be in the trusted alias map — an agent-supplied alias not present
    // is never trusted.
    const stableId = source.aliasMap[alias];
    if (typeof stableId !== 'string' || stableId.length === 0) {
      return { resolved: false, reason: 'alias not in trusted alias map' };
    }

    const identity = canonicalizeCredentialIdentity(stableId);

    // Deny if this identity is flagged ambiguous (backed by >1 distinct credential).
    if (Array.isArray(source.ambiguousIdentities) && source.ambiguousIdentities.includes(identity)) {
      return { resolved: false, reason: 'ambiguous identity (>1 distinct credential)' };
    }

    const scope = source.scopeByIdentity[identity];
    if (typeof scope !== 'string' || scope.length === 0) {
      return { resolved: false, reason: 'identity absent from trusted scope map' };
    }

    return { resolved: true, scope, identity };
  } catch (err) {
    return { resolved: false, reason: `exception during scope resolution: ${(err as Error)?.message ?? String(err)}` };
  }
}
