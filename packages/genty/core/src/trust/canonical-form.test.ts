/**
 * Milestone A — Unified trust core: SignedEnvelope canonical form.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §3.1
 * (AC-1: the universal proof format is genty's SignedEnvelope<T> + JSON canonical
 * form — canonicalize deep-sorts _meta/_payload keys; determinism/stability; a
 * field on payload but absent from signedFields is NOT covered; AC-51 domain
 * separation groundwork — payloadType is an ordinary signed field bound by the
 * canonical form).
 *
 * This exercises ONLY the existing, reused genty primitives (signing.ts) to pin
 * the canonical-form invariants the whole design depends on. It should pass today.
 */
import { describe, it, expect } from 'vitest';
import { createKeyPair, signPayload, verifySignature } from './signing.js';

describe('Milestone A — SignedEnvelope canonical form (AC-1, AC-2 groundwork)', () => {
  it('AC-1: canonical form is stable regardless of payload key insertion order', () => {
    const kp = createKeyPair();
    const fields = ['payloadType', 'a', 'b', 'nested'];
    const p1 = { payloadType: 'x', a: 1, b: 2, nested: { z: 1, y: 2 } };
    // Same content, keys inserted in a different order (incl. nested object).
    const p2 = { nested: { y: 2, z: 1 }, b: 2, a: 1, payloadType: 'x' };
    const e1 = signPayload(kp.privateKey, kp.fingerprint, p1, fields);
    // Re-order the payload under e1's SAME meta (signedAt/signedFields/fingerprint):
    // the canonical form deep-sorts keys, so the reordered payload must still verify
    // against e1's signature — proving key-order independence of the canonical form.
    const reordered = { ...e1, payload: p2 };
    expect(verifySignature(kp.publicKey, reordered)).toBe(true);
  });

  it('AC-1: the envelope carries algorithm Ed25519 and the signed field list', () => {
    const kp = createKeyPair();
    const env = signPayload(kp.privateKey, kp.fingerprint, { payloadType: 'x', a: 1 }, ['payloadType', 'a']);
    expect(env.algorithm).toBe('Ed25519');
    expect(env.signedFields).toEqual(expect.arrayContaining(['payloadType', 'a']));
    expect(verifySignature(kp.publicKey, env)).toBe(true);
  });

  it('AC-2: a field present on payload but ABSENT from signedFields is not covered by the signature', () => {
    const kp = createKeyPair();
    // `secret` is not in signedFields, so mutating it must NOT invalidate the signature.
    const env = signPayload(kp.privateKey, kp.fingerprint, { payloadType: 'x', a: 1, secret: 'orig' }, ['payloadType', 'a']);
    expect(verifySignature(kp.publicKey, env)).toBe(true);
    (env.payload as { secret: string }).secret = 'mutated';
    expect(verifySignature(kp.publicKey, env)).toBe(true);
  });

  it('AC-2: mutating a SIGNED field invalidates the signature', () => {
    const kp = createKeyPair();
    const env = signPayload(kp.privateKey, kp.fingerprint, { payloadType: 'x', a: 1 }, ['payloadType', 'a']);
    (env.payload as { a: number }).a = 999;
    expect(verifySignature(kp.publicKey, env)).toBe(false);
  });

  it('AC-51 groundwork: payloadType, when signed, is bound so it cannot be swapped', () => {
    const kp = createKeyPair();
    const env = signPayload(kp.privateKey, kp.fingerprint, { payloadType: 'model-decision', a: 1 }, ['payloadType', 'a']);
    (env.payload as { payloadType: string }).payloadType = 'command-authorization';
    expect(verifySignature(kp.publicKey, env)).toBe(false);
  });

  it('AC-1: the same payload signed under different signedFields subsets yields different signatures', () => {
    const kp = createKeyPair();
    const payload = { payloadType: 'x', a: 1, b: 2 };
    const wide = signPayload(kp.privateKey, kp.fingerprint, payload, ['payloadType', 'a', 'b']);
    const narrow = signPayload(kp.privateKey, kp.fingerprint, payload, ['payloadType', 'a']);
    expect(wide.signature).not.toBe(narrow.signature);
  });
});
