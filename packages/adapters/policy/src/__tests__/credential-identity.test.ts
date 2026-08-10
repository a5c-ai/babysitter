/**
 * Milestone B — Credential-identity ALIAS canonicalization (AC-55, owner addendum).
 *
 * Frozen tests authored SOLELY from docs/design/proof-based-policy-enforcement.md §14
 * (AC-55) with the deny-on-ambiguous rule from §9.3 (AC-40a).
 *
 * AC-55: the trusted credential→scope source (AC-40/AC-40a) MUST canonicalize aliases
 * of ONE physical credential (e.g. a KMS key referenced by ARN and by key-id) to a
 * SINGLE collision-resistant identity BEFORE the GATE-3 deny-on-ambiguous rule is
 * applied, so legitimate multi-alias credentials are NOT falsely denied. A two-alias-
 * one-credential case MUST resolve to ONE scope.
 *
 * AC-40a: the identity key is sha256 of the credential's STABLE secret-store identity
 * (broker key id, KMS ARN/key-version, secret name+version) — NEVER the credential
 * value's prefix, the env-var name, or an agent-supplied alias. If two DISTINCT
 * credentials collide to the same identity, or a credential's identity is absent/
 * ambiguous, GATE 3 DENIES (fail closed) — it never guesses and never picks the
 * narrower of two candidate scopes.
 *
 * These import the intended @a5c-ai/policy-adapter module paths the Milestone-B
 * implementation WILL provide; resolution may fail until then (expected).
 */
import { describe, it, expect } from 'vitest';

import {
  canonicalizeCredentialIdentity,
  resolveCredentialScope,
  type CredentialScopeSource,
  type CredentialAliasMap,
} from '../credential-identity.js';

/**
 * The trusted, out-of-agent scope source: a map keyed by the collision-resistant
 * canonical identity → scope. Plus an alias map that canonicalizes the two known
 * aliases of ONE physical KMS credential to that single identity.
 */
const KMS_ARN = 'arn:aws:kms:us-east-1:123456789012:key/abcd-1234';
const KMS_KEY_ID = 'abcd-1234'; // the SAME physical key, referenced by key-id

const ALIAS_MAP: CredentialAliasMap = {
  // Both aliases point to the same stable secret-store identity.
  [KMS_ARN]: 'kms:key/abcd-1234:v7',
  [KMS_KEY_ID]: 'kms:key/abcd-1234:v7',
};

const SCOPE_SOURCE: CredentialScopeSource = {
  aliasMap: ALIAS_MAP,
  // Keyed by the CANONICAL identity (sha256 of the stable secret-store identity).
  scopeByIdentity: {
    [canonicalizeCredentialIdentity('kms:key/abcd-1234:v7')]: 'aws:prod:s3-ro',
  },
};

describe('Milestone B — credential-identity alias canonicalization (AC-55)', () => {
  it('AC-55: two aliases of ONE physical credential canonicalize to the SAME identity', () => {
    const idViaArn = canonicalizeCredentialIdentity(ALIAS_MAP[KMS_ARN]);
    const idViaKeyId = canonicalizeCredentialIdentity(ALIAS_MAP[KMS_KEY_ID]);
    expect(idViaArn).toBe(idViaKeyId);
  });

  it('AC-55: a two-alias-one-credential case resolves to ONE scope (not falsely denied)', () => {
    const viaArn = resolveCredentialScope(KMS_ARN, SCOPE_SOURCE);
    const viaKeyId = resolveCredentialScope(KMS_KEY_ID, SCOPE_SOURCE);
    expect(viaArn.resolved).toBe(true);
    expect(viaKeyId.resolved).toBe(true);
    expect(viaArn.scope).toBe('aws:prod:s3-ro');
    expect(viaKeyId.scope).toBe(viaArn.scope);
  });

  it('AC-40a: the identity is collision-resistant (sha256 of stable identity), NOT a guessable label', () => {
    const id = canonicalizeCredentialIdentity('kms:key/abcd-1234:v7');
    // A sha256 hex digest is 64 hex chars — not the raw label / ARN / env-var name.
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toBe(KMS_ARN);
    expect(id).not.toBe(KMS_KEY_ID);
  });
});

describe('Milestone B — credential scope deny-on-ambiguous (AC-40a fail-closed)', () => {
  it('AC-40a: a credential whose identity is ABSENT in the trusted map → deny (no scope guessed)', () => {
    const res = resolveCredentialScope('arn:aws:kms:...:key/unknown', SCOPE_SOURCE);
    expect(res.resolved).toBe(false);
    expect(res.scope).toBeUndefined();
  });

  it('AC-40a: two DISTINCT credentials colliding to the SAME identity → deny (fail closed)', () => {
    // A mis-keyed broker: two distinct physical credentials map to one identity.
    const ambiguousSource: CredentialScopeSource = {
      aliasMap: {
        'cred-A': 'shared:identity:1',
        'cred-B': 'shared:identity:1', // distinct physical creds, same identity key
      },
      scopeByIdentity: {
        [canonicalizeCredentialIdentity('shared:identity:1')]: 'aws:prod:s3-ro',
      },
      // The source flags that this identity is backed by >1 distinct credential.
      ambiguousIdentities: [canonicalizeCredentialIdentity('shared:identity:1')],
    };
    const resA = resolveCredentialScope('cred-A', ambiguousSource);
    const resB = resolveCredentialScope('cred-B', ambiguousSource);
    expect(resA.resolved).toBe(false);
    expect(resB.resolved).toBe(false);
  });

  it('AC-40a: an agent-supplied alias not in the trusted alias map is NEVER trusted → deny', () => {
    // The agent claims its creds are the covered KMS key by passing a made-up alias.
    const res = resolveCredentialScope('agent-claimed-alias', SCOPE_SOURCE);
    expect(res.resolved).toBe(false);
  });

  it('any exception during scope resolution is a denial, never a pass (fail closed)', () => {
    const res = resolveCredentialScope('cred-A', null as never);
    expect(res.resolved).toBe(false);
  });
});
