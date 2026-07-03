/**
 * Milestone A — Unified trust core: chain verification extensions.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §4
 * (AC-35g — delegation chains verified with each link's key resolved from the
 * trusted store, never taken from the link; per-step trusted-identity + kind).
 *
 * These import from intended @a5c-ai/policy-adapter paths that Milestone A WILL
 * provide, wrapping genty verifyTrustChain (never called directly at a trust
 * boundary). Adversarial cases MUST fail closed.
 */
import { describe, it, expect } from 'vitest';
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

import {
  verifyTrustChainTrusted,
  type TrustRoot,
  type TrustedChainStep,
} from '../verify-envelope-trusted.js';

interface DelegationPayload {
  payloadType: 'delegation';
  delegatorFingerprint: string;
  delegatorSignature: string;
  delegatedAt: string;
}

const DELEGATION_FIELDS = ['payloadType', 'delegatorFingerprint', 'delegatorSignature', 'delegatedAt'];

function signDelegation(
  kp: ReturnType<typeof createKeyPair>,
  overrides: Partial<DelegationPayload> = {},
): SignedEnvelope<DelegationPayload> {
  const payload: DelegationPayload = {
    payloadType: 'delegation',
    delegatorFingerprint: 'fp-parent',
    delegatorSignature: 'parent-sig',
    delegatedAt: '2026-07-03T00:00:00.000Z',
    ...overrides,
  };
  return signPayload(kp.privateKey, kp.fingerprint, payload, DELEGATION_FIELDS);
}

function agentRoot(kp: ReturnType<typeof createKeyPair>, overrides: Partial<TrustRoot> = {}): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'agent', publicKey: kp.publicKey, label: 'agent', ...overrides };
}

describe('Milestone A — verifyTrustChainTrusted (AC-35g, per-step kind + identity)', () => {
  it('accepts a delegation chain whose links resolve to trusted agent roots', () => {
    const a = createKeyPair();
    const b = createKeyPair();
    const chain: TrustedChainStep[] = [
      { step: 'delegate-1', envelope: signDelegation(a), requiredKind: 'agent' },
      { step: 'delegate-2', envelope: signDelegation(b), requiredKind: 'agent' },
    ];
    const store = { trustRoots: [agentRoot(a), agentRoot(b, { label: 'agent-2' })] };
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(true);
  });

  it('AC-35g: a link key is resolved from the store, NOT taken from the link → forged link denies', () => {
    const a = createKeyPair();
    const attacker = createKeyPair();
    // The attacker signs a link but its fingerprint is not a trusted agent root.
    const chain: TrustedChainStep[] = [
      { step: 'delegate-1', envelope: signDelegation(a), requiredKind: 'agent' },
      { step: 'delegate-2', envelope: signDelegation(attacker), requiredKind: 'agent' },
    ];
    const store = { trustRoots: [agentRoot(a)] }; // attacker not registered
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(false);
  });

  it('per-step kind: an engine-kind link where an agent kind is required → deny', () => {
    const a = createKeyPair();
    const b = createKeyPair();
    const chain: TrustedChainStep[] = [
      { step: 'delegate-1', envelope: signDelegation(a), requiredKind: 'agent' },
      { step: 'delegate-2', envelope: signDelegation(b), requiredKind: 'agent' },
    ];
    // b is registered as engine, but the step requires agent → cross-kind denial.
    const store = { trustRoots: [agentRoot(a), { ...agentRoot(b), kind: 'engine' as const }] };
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(false);
  });

  it('a tampered link envelope (signature mismatch) breaks the chain', () => {
    const a = createKeyPair();
    const b = createKeyPair();
    const linkB = signDelegation(b);
    linkB.payload.delegatorFingerprint = 'fp-forged';
    const chain: TrustedChainStep[] = [
      { step: 'delegate-1', envelope: signDelegation(a), requiredKind: 'agent' },
      { step: 'delegate-2', envelope: linkB, requiredKind: 'agent' },
    ];
    const store = { trustRoots: [agentRoot(a), agentRoot(b, { label: 'agent-2' })] };
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(false);
  });

  it('a revoked root anywhere in the chain → deny', () => {
    const a = createKeyPair();
    const b = createKeyPair();
    const chain: TrustedChainStep[] = [
      { step: 'delegate-1', envelope: signDelegation(a), requiredKind: 'agent' },
      { step: 'delegate-2', envelope: signDelegation(b), requiredKind: 'agent' },
    ];
    const store = { trustRoots: [agentRoot(a), agentRoot(b, { revoked: true })] };
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(false);
  });

  it('any exception during chain verification is a denial (fail closed)', () => {
    const res = verifyTrustChainTrusted(null as never, { trustRoots: [] });
    expect(res.valid).toBe(false);
  });
});
