/**
 * Milestone A — Unified trust core: trusted-store verifier wrapper.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md
 * §4.2 (AC-6/AC-7 trust-root key material), §4 (AC-35 verifier wrapper),
 * §3.1 (AC-2 runtime signedFields completeness, AC-51 domain separation),
 * §10 (AC-27 expiry/revocation).
 *
 * These import from the intended @a5c-ai/policy-adapter module paths that the
 * Milestone-A implementation WILL provide. The package does not exist yet, so
 * resolution failures here are expected; the tests express the contract and are
 * syntactically valid.
 *
 * The overriding rule for this whole file: EVERY adversarial case MUST fail
 * closed — a deny/throw, never a pass.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

// Intended Milestone-A surface of @a5c-ai/policy-adapter (does not yet exist):
import {
  verifyEnvelopeTrusted,
  REQUIRED_SIGNED_FIELDS,
  type TrustRoot,
  type TrustedVerification,
  type EvidenceKind,
} from '../verify-envelope-trusted.js';

const sha256hex = (buf: Buffer | string): string =>
  createHash('sha256').update(buf).digest('hex');

// The verifier binds sha256(publicKey) === envelope.publicKeyFingerprint (AC-35c).
// genty createKeyPair() fingerprints sha256(PEM public key), so recompute the same way.
function fpOf(publicKey: string): string {
  return sha256hex(publicKey);
}

interface HumanApprovalPayload {
  payloadType: 'human-approval';
  action: string;
  scope: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt?: string;
}

const HUMAN_FIELDS = ['payloadType', 'action', 'scope', 'approvedBy', 'approvedAt'];

function signHuman(
  kp: ReturnType<typeof createKeyPair>,
  overrides: Partial<HumanApprovalPayload> = {},
  fields: string[] = HUMAN_FIELDS,
): SignedEnvelope<HumanApprovalPayload> {
  const payload: HumanApprovalPayload = {
    payloadType: 'human-approval',
    action: 'aws-write',
    scope: 'aws:prod:s3',
    approvedBy: 'alice',
    approvedAt: '2026-07-03T00:00:00.000Z',
    ...overrides,
  };
  return signPayload(kp.privateKey, kp.fingerprint, payload, fields);
}

// An in-memory trusted store the verifier resolves key material from (AC-35a).
function storeOf(roots: TrustRoot[]): { trustRoots: TrustRoot[] } {
  return { trustRoots: roots };
}

function humanRoot(
  kp: ReturnType<typeof createKeyPair>,
  overrides: Partial<TrustRoot> = {},
): TrustRoot {
  return {
    fingerprint: kp.fingerprint,
    kind: 'human',
    publicKey: kp.publicKey,
    label: 'alice',
    ...overrides,
  };
}

describe('Milestone A — verifyEnvelopeTrusted (AC-35, AC-2, AC-5/6/7, AC-51, AC-27)', () => {
  it('AC-35: accepts an envelope from a trusted human root of the required kind', () => {
    const kp = createKeyPair();
    const env = signHuman(kp);
    const store = storeOf([humanRoot(kp)]);
    const res: TrustedVerification = verifyEnvelopeTrusted(env, 'human-approval', store);
    expect(res.valid).toBe(true);
  });

  it('AC-35a: fingerprint with NO matching trust root → deny', () => {
    const kp = createKeyPair();
    const env = signHuman(kp);
    const store = storeOf([]); // unknown fingerprint
    const res = verifyEnvelopeTrusted(env, 'human-approval', store);
    expect(res.valid).toBe(false);
  });

  it('AC-35a: the envelope-embedded key is IGNORED; only the store is trusted', () => {
    // An attacker signs with their own key but claims a trusted fingerprint.
    const attacker = createKeyPair();
    const trusted = createKeyPair();
    const env = signHuman(attacker);
    // Relabel the envelope to claim the trusted fingerprint (identity spoof attempt).
    (env as { publicKeyFingerprint: string }).publicKeyFingerprint = trusted.fingerprint;
    const store = storeOf([humanRoot(trusted)]);
    // Store resolves the TRUSTED key; signature was made by attacker → verify fails → deny.
    const res = verifyEnvelopeTrusted(env, 'human-approval', store);
    expect(res.valid).toBe(false);
  });

  it('AC-35c: sha256(resolvedPublicKey) !== envelope.publicKeyFingerprint → deny', () => {
    const kp = createKeyPair();
    const other = createKeyPair();
    const env = signHuman(kp);
    // Trust root claims kp.fingerprint but stores OTHER key material (swapped key file).
    const badRoot: TrustRoot = {
      fingerprint: kp.fingerprint,
      kind: 'human',
      publicKey: other.publicKey, // sha256(other.publicKey) !== kp.fingerprint
      label: 'alice',
    };
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([badRoot]));
    expect(res.valid).toBe(false);
  });

  it('AC-35b/d: cross-kind reuse — an engine root presented for a human step → deny', () => {
    const kp = createKeyPair();
    const env = signHuman(kp);
    // Same key material & fingerprint, but registered as kind:'engine'.
    const engineRoot: TrustRoot = { ...humanRoot(kp), kind: 'engine' };
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([engineRoot]));
    expect(res.valid).toBe(false);
  });

  it('AC-35b: allowedFingerprints restricts which trusted roots satisfy the step', () => {
    const alice = createKeyPair();
    const bob = createKeyPair();
    const env = signHuman(bob); // bob signed
    const store = storeOf([humanRoot(alice), humanRoot(bob, { label: 'bob' })]);
    // Policy step only allows alice's fingerprint → bob's envelope denied.
    const res = verifyEnvelopeTrusted(env, 'human-approval', store, [alice.fingerprint]);
    expect(res.valid).toBe(false);
  });

  it('AC-51: payloadType absent from signedFields → deny even if signature verifies', () => {
    const kp = createKeyPair();
    // Sign WITHOUT payloadType in the signed set.
    const env = signHuman(kp, {}, ['action', 'scope', 'approvedBy', 'approvedAt']);
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([humanRoot(kp)]));
    expect(res.valid).toBe(false);
  });

  it('AC-51: payloadType present but wrong constant for the kind → deny', () => {
    const kp = createKeyPair();
    // A model-decision-typed payload presented for a human-approval step.
    const env = signHuman(kp, { payloadType: 'model-decision' as unknown as 'human-approval' });
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([humanRoot(kp)]));
    expect(res.valid).toBe(false);
  });

  it('AC-2: a required signedField missing from signedFields → deny (runtime completeness)', () => {
    const kp = createKeyPair();
    // Omit approvedBy from the signed set — a security-relevant field.
    const env = signHuman(kp, {}, ['payloadType', 'action', 'scope', 'approvedAt']);
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([humanRoot(kp)]));
    expect(res.valid).toBe(false);
  });

  it('AC-2: a signedFields entry naming a field ABSENT on payload → deny', () => {
    const kp = createKeyPair();
    // Claim approvedBy is signed but delete it from the payload before verifying.
    const env = signHuman(kp);
    delete (env.payload as Partial<HumanApprovalPayload>).approvedBy;
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([humanRoot(kp)]));
    expect(res.valid).toBe(false);
  });

  it('AC-2: REQUIRED_SIGNED_FIELDS defines a non-empty set for every evidence kind', () => {
    const kinds: EvidenceKind[] = [
      'human-approval',
      'model-decision',
      'delegation',
      'command-authorization',
      'config-manifest',
    ];
    for (const k of kinds) {
      expect(REQUIRED_SIGNED_FIELDS[k].length).toBeGreaterThan(0);
      // AC-51: payloadType must be a required signed field for EVERY kind.
      expect(REQUIRED_SIGNED_FIELDS[k]).toContain('payloadType');
    }
  });

  it('AC-35: tampered payload (canonical-form mismatch) → deny', () => {
    const kp = createKeyPair();
    const env = signHuman(kp);
    env.payload.scope = 'aws:prod:*'; // widen scope after signing
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([humanRoot(kp)]));
    expect(res.valid).toBe(false);
  });

  it('AC-27: a revoked trust root → deny regardless of a valid signature', () => {
    const kp = createKeyPair();
    const env = signHuman(kp);
    const revoked = humanRoot(kp, { revoked: true });
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([revoked]));
    expect(res.valid).toBe(false);
  });

  it('AC-27: a key expired before the envelope signedAt → deny', () => {
    const kp = createKeyPair();
    const env = signHuman(kp); // signedAt = now
    const expired = humanRoot(kp, { expiresAt: '2020-01-01T00:00:00.000Z' });
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([expired]));
    expect(res.valid).toBe(false);
  });

  it('AC-27: a signature made while the key was valid still verifies (expiry at signing time)', () => {
    const kp = createKeyPair();
    const env = signHuman(kp); // signedAt = now
    // Key expires in the future relative to signedAt.
    const future = new Date(Date.now() + 3_600_000).toISOString();
    const root = humanRoot(kp, { expiresAt: future });
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([root]));
    expect(res.valid).toBe(true);
  });

  it('AC-6/AC-7: a trust root must carry key material (publicKey or publicKeyPath)', () => {
    const kp = createKeyPair();
    const env = signHuman(kp);
    // Root with NO key material at all → verifier cannot resolve material → deny.
    const noMaterial = {
      fingerprint: kp.fingerprint,
      kind: 'human',
      label: 'alice',
    } as unknown as TrustRoot;
    const res = verifyEnvelopeTrusted(env, 'human-approval', storeOf([noMaterial]));
    expect(res.valid).toBe(false);
  });

  it('any thrown exception during verification is treated as a denial (fail closed)', () => {
    const kp = createKeyPair();
    const env = signHuman(kp);
    // A structurally broken store (null root) must not throw out — it must deny.
    const brokenStore = { trustRoots: [null as unknown as TrustRoot] };
    const res = verifyEnvelopeTrusted(env, 'human-approval', brokenStore);
    expect(res.valid).toBe(false);
  });
});
