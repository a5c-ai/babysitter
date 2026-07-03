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

// ── Delegation-linkage adversarial coverage (added, not modifying frozen tests).
// The frozen tests above assert per-link trusted-store resolution but never a
// REAL A→B→C delegation relationship: verifyTrustChainTrusted previously built
// links WITHOUT parentSignature, so genty's parent-linkage check was dead and a
// "chain" passed as an unordered set of individually-trusted envelopes. These
// tests build genuinely LINKED delegation chains (each link declares its
// immediate predecessor as delegator and carries the predecessor's signature)
// and assert reordering / splicing / forged-parent all fail closed.

/**
 * Sign a delegation link that genuinely binds to `parent` — i.e. the link's
 * signed payload declares the parent's SIGNER fingerprint as its delegator and
 * carries the parent envelope's SIGNATURE as `delegatorSignature`. A chain of
 * such links is a real A→B→C delegation chain.
 */
function signLinkedDelegation(
  kp: ReturnType<typeof createKeyPair>,
  parent: SignedEnvelope<DelegationPayload> | null,
): SignedEnvelope<DelegationPayload> {
  return signDelegation(kp, {
    delegatorFingerprint: parent ? parent.publicKeyFingerprint : 'fp-root',
    delegatorSignature: parent ? parent.signature : 'root-sig',
  });
}

describe('Milestone A — verifyTrustChainTrusted delegation linkage (A→B→C binding)', () => {
  it('accepts a genuinely linked A→B→C delegation chain', () => {
    const a = createKeyPair();
    const b = createKeyPair();
    const c = createKeyPair();
    const linkA = signLinkedDelegation(a, null);
    const linkB = signLinkedDelegation(b, linkA);
    const linkC = signLinkedDelegation(c, linkB);
    const chain: TrustedChainStep[] = [
      { step: 'delegate-a', envelope: linkA, requiredKind: 'agent' },
      { step: 'delegate-b', envelope: linkB, requiredKind: 'agent' },
      { step: 'delegate-c', envelope: linkC, requiredKind: 'agent' },
    ];
    const store = {
      trustRoots: [agentRoot(a), agentRoot(b, { label: 'b' }), agentRoot(c, { label: 'c' })],
    };
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(true);
  });

  it('reordered links (B before A) in a linked chain → deny (linkage broken)', () => {
    const a = createKeyPair();
    const b = createKeyPair();
    const c = createKeyPair();
    const linkA = signLinkedDelegation(a, null);
    const linkB = signLinkedDelegation(b, linkA);
    const linkC = signLinkedDelegation(c, linkB);
    // Present B, A, C: B claims A as delegator but its predecessor is now nothing,
    // and A's predecessor becomes B — the declared linkage no longer matches the
    // immediate predecessor, so the chain is rejected.
    const chain: TrustedChainStep[] = [
      { step: 'delegate-b', envelope: linkB, requiredKind: 'agent' },
      { step: 'delegate-a', envelope: linkA, requiredKind: 'agent' },
      { step: 'delegate-c', envelope: linkC, requiredKind: 'agent' },
    ];
    const store = {
      trustRoots: [agentRoot(a), agentRoot(b, { label: 'b' }), agentRoot(c, { label: 'c' })],
    };
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(false);
  });

  it('a foreign, individually-trusted envelope spliced into a linked chain → deny', () => {
    const a = createKeyPair();
    const b = createKeyPair();
    const foreign = createKeyPair();
    const linkA = signLinkedDelegation(a, null);
    const linkB = signLinkedDelegation(b, linkA);
    // The foreign link is validly signed by a trusted agent root, but it does NOT
    // bind to its predecessor (B) — it declares a sentinel delegator. Splicing it
    // into a linked chain must be denied even though it is individually trusted.
    const foreignLink = signDelegation(foreign, {
      delegatorFingerprint: 'fp-unrelated',
      delegatorSignature: 'unrelated-sig',
    });
    const chain: TrustedChainStep[] = [
      { step: 'delegate-a', envelope: linkA, requiredKind: 'agent' },
      { step: 'delegate-b', envelope: linkB, requiredKind: 'agent' },
      { step: 'spliced-foreign', envelope: foreignLink, requiredKind: 'agent' },
    ];
    const store = {
      trustRoots: [
        agentRoot(a),
        agentRoot(b, { label: 'b' }),
        agentRoot(foreign, { label: 'foreign' }),
      ],
    };
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(false);
  });

  it('forged parent signature (delegatorSignature does not cover the parent) → deny', () => {
    const a = createKeyPair();
    const b = createKeyPair();
    const linkA = signLinkedDelegation(a, null);
    // B declares A as delegator (correct fingerprint) but forges the signature it
    // claims A produced over the parent — linkage must fail closed.
    const linkB = signDelegation(b, {
      delegatorFingerprint: linkA.publicKeyFingerprint,
      delegatorSignature: 'forged-parent-signature',
    });
    const chain: TrustedChainStep[] = [
      { step: 'delegate-a', envelope: linkA, requiredKind: 'agent' },
      { step: 'delegate-b', envelope: linkB, requiredKind: 'agent' },
    ];
    const store = { trustRoots: [agentRoot(a), agentRoot(b, { label: 'b' })] };
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(false);
  });

  it('missing parent binding on a middle link of an otherwise-linked chain → deny', () => {
    const a = createKeyPair();
    const b = createKeyPair();
    const c = createKeyPair();
    const linkA = signLinkedDelegation(a, null);
    // B does NOT bind to A (sentinel delegator) ...
    const linkB = signDelegation(b, {
      delegatorFingerprint: 'fp-none',
      delegatorSignature: 'no-sig',
    });
    // ... but C DOES bind to B, making this a linked chain overall. The unbound
    // middle link must break it.
    const linkC = signLinkedDelegation(c, linkB);
    const chain: TrustedChainStep[] = [
      { step: 'delegate-a', envelope: linkA, requiredKind: 'agent' },
      { step: 'delegate-b', envelope: linkB, requiredKind: 'agent' },
      { step: 'delegate-c', envelope: linkC, requiredKind: 'agent' },
    ];
    const store = {
      trustRoots: [agentRoot(a), agentRoot(b, { label: 'b' }), agentRoot(c, { label: 'c' })],
    };
    const res = verifyTrustChainTrusted(chain, store);
    expect(res.valid).toBe(false);
  });
});
