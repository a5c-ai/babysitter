/**
 * Milestone A — Unified trust core: proven → SignedEnvelope bridge.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §3.2
 * (AC-3 bridge derives human evidence, AC-43 derived evidence still evaluates as
 * kind:'human' resolved against the original human fingerprint, AC-48 legacy
 * signedFields completeness assertion — {breakpointId, approved, responderId} ⊆
 * signedFields, present on payload, and approved === true).
 *
 * These import from intended @a5c-ai/policy-adapter paths that Milestone A WILL
 * provide, plus the real proven signer/keys (pre-existing code, used only for
 * fixture shape). Adversarial cases MUST fail closed (no evidence emitted).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { BreakpointAnswer, ProvenBreakpointAnswer } from '@a5c-ai/tasks-adapter';
import {
  generateKeyPair,
  saveTrustedPublicKey,
  savePrivateKey,
} from '@a5c-ai/tasks-adapter/proven';
import { signAnswer } from '@a5c-ai/tasks-adapter/proven';

// Intended Milestone-A bridge surface of @a5c-ai/policy-adapter (does not yet exist):
import {
  bridgeProvenAnswer,
  type BridgeResult,
  type TrustRoot,
} from '../proven-bridge.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proven-bridge-'));
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

// A human trust root for the bridge (kind:'human'), keyed by the proven fingerprint.
function humanRootFromProven(fingerprint: string, publicKey: string): TrustRoot {
  return { fingerprint, kind: 'human', publicKey, label: 'alice' };
}

describe('Milestone A — proven bridge (AC-3, AC-43, AC-48)', () => {
  it('AC-3/AC-43: a valid human-signed proven answer bridges into human-approval evidence', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    const proven = await signAnswer(makeAnswer(), pair.privateKeyRecord.fingerprint, tmpDir);

    const store = {
      trustRoots: [
        humanRootFromProven(pair.publicKeyRecord.metadata.fingerprint, pair.publicKeyRecord.publicKey),
      ],
    };
    const res: BridgeResult = await bridgeProvenAnswer(proven, { baseDir: tmpDir, store });

    expect(res.derived).toBe(true);
    // AC-43: the derived envelope records the ORIGINAL human fingerprint and evaluates as 'human'.
    expect(res.evidence!.kind).toBe('human-approval');
    expect(res.evidence!.envelope.payload.payloadType).toBe('human-approval');
    expect(res.evidence!.envelope.payload.originalHumanFingerprint).toBe(
      pair.publicKeyRecord.metadata.fingerprint,
    );
    expect(res.evidence!.envelope.payload.approved).toBe(true);
    expect(res.evidence!.envelope.payload.provenVerified).toBe(true);
  });

  it('AC-48: approved absent from signedFields → deny, no evidence emitted', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    const proven = await signAnswer(makeAnswer(), pair.privateKeyRecord.fingerprint, tmpDir);

    // Attacker strips `approved` from the signed set while leaving approved:true unsigned.
    const forged: ProvenBreakpointAnswer = {
      ...proven,
      approved: true,
      signedFields: proven.signedFields.filter((f) => f !== 'approved'),
    };
    const store = {
      trustRoots: [
        humanRootFromProven(pair.publicKeyRecord.metadata.fingerprint, pair.publicKeyRecord.publicKey),
      ],
    };
    const res = await bridgeProvenAnswer(forged, { baseDir: tmpDir, store });
    expect(res.derived).toBe(false);
    expect(res.evidence).toBeUndefined();
  });

  it('AC-48: breakpointId absent from signedFields → deny (target not human-bound)', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    const proven = await signAnswer(makeAnswer(), pair.privateKeyRecord.fingerprint, tmpDir);

    const forged: ProvenBreakpointAnswer = {
      ...proven,
      breakpointId: 'bp-target',
      signedFields: proven.signedFields.filter((f) => f !== 'breakpointId'),
    };
    const store = {
      trustRoots: [
        humanRootFromProven(pair.publicKeyRecord.metadata.fingerprint, pair.publicKeyRecord.publicKey),
      ],
    };
    const res = await bridgeProvenAnswer(forged, { baseDir: tmpDir, store });
    expect(res.derived).toBe(false);
  });

  it('AC-48: responderId absent from signedFields → deny (identity not human-bound)', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    const proven = await signAnswer(makeAnswer(), pair.privateKeyRecord.fingerprint, tmpDir);

    const forged: ProvenBreakpointAnswer = {
      ...proven,
      signedFields: proven.signedFields.filter((f) => f !== 'responderId'),
    };
    const store = {
      trustRoots: [
        humanRootFromProven(pair.publicKeyRecord.metadata.fingerprint, pair.publicKeyRecord.publicKey),
      ],
    };
    const res = await bridgeProvenAnswer(forged, { baseDir: tmpDir, store });
    expect(res.derived).toBe(false);
  });

  it('AC-48: a signedFields entry naming a field ABSENT on the answer → deny', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    const proven = await signAnswer(makeAnswer(), pair.privateKeyRecord.fingerprint, tmpDir);

    // approved is listed as signed but deleted from the answer object → treated as missing.
    const forged = { ...proven } as ProvenBreakpointAnswer & { approved?: boolean };
    delete forged.approved;
    const store = {
      trustRoots: [
        humanRootFromProven(pair.publicKeyRecord.metadata.fingerprint, pair.publicKeyRecord.publicKey),
      ],
    };
    const res = await bridgeProvenAnswer(forged as ProvenBreakpointAnswer, { baseDir: tmpDir, store });
    expect(res.derived).toBe(false);
  });

  it('AC-48: a valid signed REJECTION (approved:false) yields no approval evidence', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    // A legitimately signed rejection (approved:false is inside signedFields).
    const proven = await signAnswer(makeAnswer({ approved: false }), pair.privateKeyRecord.fingerprint, tmpDir);

    const store = {
      trustRoots: [
        humanRootFromProven(pair.publicKeyRecord.metadata.fingerprint, pair.publicKeyRecord.publicKey),
      ],
    };
    const res = await bridgeProvenAnswer(proven, { baseDir: tmpDir, store });
    // The bridge derives evidence only when approved === true.
    expect(res.derived).toBe(false);
  });

  it('AC-3/AC-43: proven answer whose fingerprint is NOT a human trust root → deny', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    const proven = await signAnswer(makeAnswer(), pair.privateKeyRecord.fingerprint, tmpDir);

    // The same fingerprint is registered as an ENGINE root, not human.
    const store = {
      trustRoots: [
        {
          fingerprint: pair.publicKeyRecord.metadata.fingerprint,
          kind: 'engine' as const,
          publicKey: pair.publicKeyRecord.publicKey,
          label: 'not-a-human',
        },
      ],
    };
    const res = await bridgeProvenAnswer(proven, { baseDir: tmpDir, store });
    expect(res.derived).toBe(false);
  });

  it('AC-43: a compromised adapter cannot launder a non-verifying proven answer into human evidence', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    // Public key intentionally NOT saved as a trusted proven key → proven verifyAnswer fails.
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    const proven = await signAnswer(makeAnswer(), pair.privateKeyRecord.fingerprint, tmpDir);

    const store = {
      trustRoots: [
        humanRootFromProven(pair.publicKeyRecord.metadata.fingerprint, pair.publicKeyRecord.publicKey),
      ],
    };
    const res = await bridgeProvenAnswer(proven, { baseDir: tmpDir, store });
    // Original proven verification did not pass → no derived evidence.
    expect(res.derived).toBe(false);
  });

  it('any exception in the bridge check is a denial (fail closed)', async () => {
    const proven = { signedFields: null } as unknown as ProvenBreakpointAnswer;
    const res = await bridgeProvenAnswer(proven, { baseDir: tmpDir, store: { trustRoots: [] } });
    expect(res.derived).toBe(false);
  });

  // ── Expired-human-root coverage (added). The bridge checked kind:'human' and
  // revoked!==true but never the human root's expiresAt, so an EXPIRED human root
  // could still launder proven answers into human evidence. It now enforces the
  // root is valid at the answer's answeredAt (mirrors keyValidAt).
  it('a human trust root expired at answeredAt → deny, no evidence emitted', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    // Answer given in 2026; the human root expired in 2020.
    const proven = await signAnswer(
      makeAnswer({ answeredAt: '2026-07-03T00:00:00.000Z' }),
      pair.privateKeyRecord.fingerprint,
      tmpDir,
    );
    const store = {
      trustRoots: [
        {
          ...humanRootFromProven(
            pair.publicKeyRecord.metadata.fingerprint,
            pair.publicKeyRecord.publicKey,
          ),
          expiresAt: '2020-01-01T00:00:00.000Z',
        },
      ],
    };
    const res = await bridgeProvenAnswer(proven, { baseDir: tmpDir, store });
    expect(res.derived).toBe(false);
    expect(res.evidence).toBeUndefined();
  });

  it('a human root that expires AFTER answeredAt still bridges (answer within validity)', async () => {
    const pair = generateKeyPair('alice', 'Alice W');
    await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
    await savePrivateKey(pair.privateKeyRecord, tmpDir);
    const proven = await signAnswer(
      makeAnswer({ answeredAt: '2026-07-03T00:00:00.000Z' }),
      pair.privateKeyRecord.fingerprint,
      tmpDir,
    );
    const store = {
      trustRoots: [
        {
          ...humanRootFromProven(
            pair.publicKeyRecord.metadata.fingerprint,
            pair.publicKeyRecord.publicKey,
          ),
          // Root valid until well after the answer was given.
          expiresAt: '2030-01-01T00:00:00.000Z',
        },
      ],
    };
    const res = await bridgeProvenAnswer(proven, { baseDir: tmpDir, store });
    expect(res.derived).toBe(true);
    expect(res.evidence!.kind).toBe('human-approval');
  });
});
