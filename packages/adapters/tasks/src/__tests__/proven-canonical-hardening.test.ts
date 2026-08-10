/**
 * Milestone A (owner addendum) — AC-54: proven canonical-form hardening.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §14
 * (AC-54): the proven legacy signing canonical form (proven/sign.ts:23-30,
 * unescaped `field=value\n`) MUST be hardened with delimiter/length-prefix
 * escaping (or migrated to the genty JSON canonical form) so the AC-48 bridge
 * does not stand on an ambiguous concatenation. Requirements:
 *   - Two distinct field assignments MUST NOT collide to the same signing bytes.
 *   - Existing proven signatures MUST continue to verify (dual-read).
 *
 * These import the intended hardened canonical helper the Milestone-A
 * implementation WILL export from the proven module, alongside the existing
 * signer used for the dual-read case. The hardened helper does not exist yet;
 * resolution failure here is expected.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { BreakpointAnswer } from '../types.js';
import { generateKeyPair, saveTrustedPublicKey, savePrivateKey } from '../proven/keys.js';
import { signAnswer } from '../proven/sign.js';
import { verifyAnswer } from '../proven/verify.js';
// NEW hardened canonical-form helper introduced by AC-54 (does not yet exist):
import { buildHardenedSigningPayload } from '../proven/sign.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proven-harden-'));
});
afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function makeAnswer(overrides: Partial<BreakpointAnswer> = {}): BreakpointAnswer {
  return {
    id: 'answer-001',
    breakpointId: 'bp-001',
    responderId: 'alice',
    responderName: 'Alice W',
    text: 'Approved.',
    approved: true,
    confidence: 95,
    references: [],
    followUpQuestions: [],
    answeredAt: '2026-07-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('Milestone A — AC-54: proven canonical-form hardening', () => {
  const SIGNED = ['id', 'breakpointId', 'responderId', 'text', 'approved', 'confidence', 'answeredAt'];

  it('AC-54: two distinct field assignments do not collide to the same signing bytes', () => {
    // Classic delimiter-injection collision against the unescaped `field=value\n`
    // form: a newline inside `text` can shift the boundary so two different
    // {responderId, text} assignments serialize identically. The hardened form
    // MUST keep them distinct.
    const a = makeAnswer({ responderId: 'alice', text: 'ok\nresponderId=mallory' });
    const b = makeAnswer({ responderId: 'alice', text: 'ok', breakpointId: 'bp-001' });

    const bytesA = buildHardenedSigningPayload(a, SIGNED);
    const bytesB = buildHardenedSigningPayload(b, SIGNED);
    expect(bytesA.equals(bytesB)).toBe(false);
  });

  it('AC-54: a value containing the field separator cannot forge another field', () => {
    // `text` carrying "=" and "\n" must not be reinterpretable as another field=value pair.
    const injected = makeAnswer({ text: 'x\napproved=false' });
    const honest = makeAnswer({ text: 'x' });
    const injectedBytes = buildHardenedSigningPayload(injected, SIGNED);
    const honestBytes = buildHardenedSigningPayload(honest, SIGNED);
    expect(injectedBytes.equals(honestBytes)).toBe(false);
  });

  it('AC-54: differing only in which field holds a delimiter still yields distinct bytes', () => {
    const x = makeAnswer({ responderId: 'a=b', text: 'c' });
    const y = makeAnswer({ responderId: 'a', text: 'b=c' });
    const xb = buildHardenedSigningPayload(x, SIGNED);
    const yb = buildHardenedSigningPayload(y, SIGNED);
    expect(xb.equals(yb)).toBe(false);
  });

  it('AC-54: the hardened form is deterministic for identical content', () => {
    const a = makeAnswer();
    const b = makeAnswer();
    expect(buildHardenedSigningPayload(a, SIGNED).equals(buildHardenedSigningPayload(b, SIGNED))).toBe(true);
  });

  it('AC-54 (dual-read): existing proven signatures still verify after hardening', async () => {
    // A proven answer signed by the existing signer must continue to verify — the
    // hardened verifier reads the legacy form during transition (dual-read).
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);

    const proven = await signAnswer(makeAnswer(), pair.privateKeyRecord.fingerprint, tmpDir);
    const result = await verifyAnswer(proven, tmpDir);
    expect(result.valid).toBe(true);
  });

  it('AC-54: a tampered value that would have collided under the old form now fails verification', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);

    const proven = await signAnswer(makeAnswer({ text: 'ok' }), pair.privateKeyRecord.fingerprint, tmpDir);
    // Mutate text to a value that under the naive concatenation could shift a boundary.
    const tampered = { ...proven, text: 'ok\napproved=false' };
    const result = await verifyAnswer(tampered, tmpDir);
    expect(result.valid).toBe(false);
  });
});
