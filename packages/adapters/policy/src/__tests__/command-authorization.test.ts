/**
 * Milestone A — Unified trust core: CommandAuthorization envelope.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §5
 * (AC-8 payload shape + signedFields completeness, AC-9 issuance, AC-10
 * verification incl. configEpoch binding AC-46/AC-47, AC-42 per-step coverage,
 * AC-51 domain separation).
 *
 * These import from intended @a5c-ai/policy-adapter paths that Milestone A WILL
 * provide. The scope of THIS milestone-A file is the envelope shape + its
 * verification contract (signature, expiry, signedFields completeness,
 * payloadType, configEpoch floor). Full policy evaluation lives in Milestone B.
 *
 * Adversarial cases MUST fail closed.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

import {
  verifyCommandAuthorization,
  REQUIRED_SIGNED_FIELDS,
  type CommandAuthorizationPayload,
  type TrustRoot,
} from '../verify-envelope-trusted.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

// The full signed field set for a command-authorization (AC-8): ALL fields.
const CA_FIELDS = [
  'payloadType',
  'policyId',
  'policyDocHash',
  'configEpoch',
  'matchedChainId',
  'toolName',
  'toolCallId',
  'commandHash',
  'argsHash',
  'credentialScope',
  'evidenceFingerprints',
  'evidenceEnvelopeHashes',
  'evidenceStepBindings',
  'issuedAt',
  'expiresAt',
];

function makeCA(overrides: Partial<CommandAuthorizationPayload> = {}): CommandAuthorizationPayload {
  const now = Date.now();
  return {
    payloadType: 'command-authorization',
    policyId: 'aws-prod-write',
    policyDocHash: sha256('policy-doc-bytes'),
    configEpoch: 5,
    matchedChainId: 'human-plus-opus',
    toolName: 'Bash',
    toolCallId: 'call_A',
    commandHash: sha256('aws s3 cp a b'),
    argsHash: sha256(JSON.stringify({ command: 'aws s3 cp a b' })),
    credentialScope: 'aws:prod:s3-ro',
    evidenceFingerprints: ['fp-human-alice', 'fp-engine-proxy'],
    evidenceEnvelopeHashes: [sha256('human-env'), sha256('model-env')],
    evidenceStepBindings: [
      { stepIndex: 0, requiredKind: 'human-approval', envelopeHash: sha256('human-env') },
      { stepIndex: 1, requiredKind: 'model-decision', envelopeHash: sha256('model-env') },
    ],
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 120_000).toISOString(),
    ...overrides,
  };
}

function issuerRoot(kp: ReturnType<typeof createKeyPair>): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'engine', publicKey: kp.publicKey, label: 'issuer' };
}

function signCA(
  kp: ReturnType<typeof createKeyPair>,
  payload: CommandAuthorizationPayload,
  fields: string[] = CA_FIELDS,
): SignedEnvelope<CommandAuthorizationPayload> {
  return signPayload(kp.privateKey, kp.fingerprint, payload, fields);
}

// The exact runtime context a gate recomputes and re-checks against (AC-10).
function gateContext(overrides: Record<string, unknown> = {}) {
  return {
    now: Date.now(),
    toolName: 'Bash',
    toolCallId: 'call_A',
    commandHash: sha256('aws s3 cp a b'),
    argsHash: sha256(JSON.stringify({ command: 'aws s3 cp a b' })),
    credentialScope: 'aws:prod:s3-ro',
    policyDocHash: sha256('policy-doc-bytes'),
    currentConfigEpoch: 5,
    minEpochFloor: 5,
    issuerRoots: [] as TrustRoot[],
    ...overrides,
  };
}

describe('Milestone A — CommandAuthorization envelope (AC-8, AC-10, AC-42, AC-46/47, AC-51)', () => {
  it('AC-8: REQUIRED_SIGNED_FIELDS[command-authorization] is the full field set', () => {
    const required = REQUIRED_SIGNED_FIELDS['command-authorization'];
    for (const f of CA_FIELDS) {
      expect(required).toContain(f);
    }
  });

  it('AC-10.1: a well-formed authorization from a trusted issuer verifies', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA());
    const ctx = gateContext({ issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(true);
  });

  it('AC-10.1: an authorization signed by a non-issuer engine key → deny', () => {
    const issuer = createKeyPair();
    const rogue = createKeyPair();
    const env = signCA(rogue, makeCA());
    // Only the real issuer fingerprint is allowed.
    const ctx = gateContext({ issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-8/AC-2: an authorization missing any field from signedFields → deny', () => {
    const issuer = createKeyPair();
    // Omit toolCallId from the signed set (load-bearing anti-replay field, AC-34).
    const partial = CA_FIELDS.filter((f) => f !== 'toolCallId');
    const env = signCA(issuer, makeCA(), partial);
    const ctx = gateContext({ issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-51: payloadType wrong constant on an authorization → deny', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA({ payloadType: 'human-approval' as unknown as 'command-authorization' }));
    const ctx = gateContext({ issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-10.2: an expired authorization → deny', () => {
    const issuer = createKeyPair();
    const past = Date.now() - 10_000;
    const env = signCA(
      issuer,
      makeCA({
        issuedAt: new Date(past - 120_000).toISOString(),
        expiresAt: new Date(past).toISOString(),
      }),
    );
    const ctx = gateContext({ issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-10.3: toolName mismatch at the gate → deny', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA({ toolName: 'Bash' }));
    const ctx = gateContext({ toolName: 'Read', issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-10.3a: toolCallId mismatch at the gate → deny (anti replay-within-turn)', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA({ toolCallId: 'call_A' }));
    const ctx = gateContext({ toolCallId: 'call_B', issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-10.4: commandHash mismatch (mutated command after issuance) → deny (TOCTOU)', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA());
    const ctx = gateContext({
      commandHash: sha256('aws s3 rm --recursive s3://prod'),
      issuerRoots: [issuerRoot(issuer)],
    });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-10.5: argsHash mismatch recomputed at the gate → deny (TOCTOU)', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA());
    const ctx = gateContext({
      argsHash: sha256(JSON.stringify({ command: 'different' })),
      issuerRoots: [issuerRoot(issuer)],
    });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-10.6: credentialScope mismatch at the gate → deny', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA({ credentialScope: 'aws:prod:s3-ro' }));
    const ctx = gateContext({ credentialScope: 'aws:prod:*', issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-10.9: policyDocHash mismatch at the gate → deny', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA());
    const ctx = gateContext({ policyDocHash: sha256('a-different-policy'), issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-10.10 / AC-46: configEpoch != current honored manifest epoch → deny', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA({ configEpoch: 5 }));
    // A stale authorization issued under epoch 5, but the gate now honors epoch 6.
    const ctx = gateContext({ currentConfigEpoch: 6, minEpochFloor: 6, issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-47: authorization configEpoch below the off-workspace floor → deny', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA({ configEpoch: 3 }));
    // The pinned floor has advanced to 5; a below-floor authorization is rejected
    // even though its signature verifies (anti-rollback).
    const ctx = gateContext({ currentConfigEpoch: 3, minEpochFloor: 5, issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-42: every required step must have a bound, verified evidence envelope', () => {
    const issuer = createKeyPair();
    // A chain with two required steps but only one binding → issuer must not produce
    // a valid authorization; presented at the gate it fails coverage.
    const env = signCA(
      issuer,
      makeCA({
        evidenceStepBindings: [
          { stepIndex: 0, requiredKind: 'human-approval', envelopeHash: sha256('human-env') },
          // step 1 (model-decision) binding omitted
        ],
      }),
    );
    const ctx = gateContext({
      requiredStepCount: 2,
      issuerRoots: [issuerRoot(issuer)],
    });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-42: evidenceEnvelopeHashes must cover every step binding (no silent skip)', () => {
    const issuer = createKeyPair();
    const env = signCA(
      issuer,
      makeCA({
        // A step binding references an envelope hash absent from evidenceEnvelopeHashes.
        evidenceEnvelopeHashes: [sha256('human-env')],
        evidenceStepBindings: [
          { stepIndex: 0, requiredKind: 'human-approval', envelopeHash: sha256('human-env') },
          { stepIndex: 1, requiredKind: 'model-decision', envelopeHash: sha256('model-env') },
        ],
      }),
    );
    const ctx = gateContext({ requiredStepCount: 2, issuerRoots: [issuerRoot(issuer)] });
    const res = verifyCommandAuthorization(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('any exception during gate verification is a denial, never a pass', () => {
    const issuer = createKeyPair();
    const env = signCA(issuer, makeCA());
    // Malformed context (no issuerRoots array) must deny, not throw through.
    const res = verifyCommandAuthorization(env, { now: Date.now() } as never);
    expect(res.valid).toBe(false);
  });
});
