/**
 * Milestone A — Unified trust core: config integrity manifest + anti-rollback.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §10
 * (AC-26 trust-roots/policy layout, AC-25 key ops), §10.1 (AC-36 config
 * root-of-trust one signed manifest, AC-37 bootstrap/pin, AC-46 monotonic
 * configEpoch covering all config files, AC-47 off-workspace epoch floor),
 * AC-51 domain separation.
 *
 * These import from intended @a5c-ai/policy-adapter paths that Milestone A WILL
 * provide. Adversarial cases MUST fail closed (deny-all).
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/trust-core';
import type { SignedEnvelope } from '@a5c-ai/trust-core';

import {
  verifyConfigManifest,
  type ConfigManifestPayload,
  type TrustRoot,
} from '../config-manifest.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const TRUST_ROOTS_BYTES = '{"roots":[{"fingerprint":"fp-alice","kind":"human"}]}';
const POLICY_BYTES = 'version: 1\nactions: []\n';

const MANIFEST_FIELDS = ['payloadType', 'configEpoch', 'files', 'issuedAt'];

function makeManifest(overrides: Partial<ConfigManifestPayload> = {}): ConfigManifestPayload {
  return {
    payloadType: 'config-manifest',
    configEpoch: 5,
    files: [
      { path: '.policy/trust-roots.json', sha256: sha256(TRUST_ROOTS_BYTES) },
      { path: '.policy/policies/aws.yaml', sha256: sha256(POLICY_BYTES) },
    ],
    issuedAt: '2026-07-03T00:00:00.000Z',
    ...overrides,
  };
}

function configRoot(kp: ReturnType<typeof createKeyPair>): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'config', publicKey: kp.publicKey, label: 'config-root' };
}

function signManifest(
  kp: ReturnType<typeof createKeyPair>,
  payload: ConfigManifestPayload,
  fields: string[] = MANIFEST_FIELDS,
): SignedEnvelope<ConfigManifestPayload> {
  return signPayload(kp.privateKey, kp.fingerprint, payload, fields);
}

// The pinned, off-workspace verification context (AC-37/AC-47).
function pinCtx(kp: ReturnType<typeof createKeyPair>, overrides: Record<string, unknown> = {}) {
  return {
    pinnedConfigRootFp: kp.fingerprint,
    configRoot: configRoot(kp),
    minEpoch: 5, // POLICY_CONFIG_MIN_EPOCH
    // Actual on-disk file bytes the gate recomputes and matches against the manifest.
    files: {
      '.policy/trust-roots.json': TRUST_ROOTS_BYTES,
      '.policy/policies/aws.yaml': POLICY_BYTES,
    } as Record<string, string>,
    ...overrides,
  };
}

describe('Milestone A — config manifest integrity + anti-rollback (AC-36/37/46/47/51)', () => {
  it('AC-36: a manifest signed by the pinned config root, matching all file hashes, verifies', () => {
    const root = createKeyPair();
    const env = signManifest(root, makeManifest());
    const res = verifyConfigManifest(env, pinCtx(root));
    expect(res.valid).toBe(true);
    expect(res.configEpoch).toBe(5);
  });

  it('AC-36: a manifest signed by a NON-config-root key → deny-all', () => {
    const root = createKeyPair();
    const attacker = createKeyPair();
    const env = signManifest(attacker, makeManifest());
    // Pin is the real config root; the attacker's signature does not verify against it.
    const res = verifyConfigManifest(env, pinCtx(root));
    expect(res.valid).toBe(false);
  });

  it('AC-36/AC-51: payloadType not "config-manifest" (or absent from signedFields) → deny', () => {
    const root = createKeyPair();
    const env = signManifest(root, makeManifest({ payloadType: 'command-authorization' as unknown as 'config-manifest' }));
    const res = verifyConfigManifest(env, pinCtx(root));
    expect(res.valid).toBe(false);
  });

  it('AC-36/AC-45: a policy file edited on the workspace (hash disagrees) → deny-all', () => {
    const root = createKeyPair();
    const env = signManifest(root, makeManifest());
    // The workspace-writable adversary edits the policy file after signing.
    const ctx = pinCtx(root, {
      files: {
        '.policy/trust-roots.json': TRUST_ROOTS_BYTES,
        '.policy/policies/aws.yaml': 'version: 1\nactions: [{ id: evil, allow: true }]\n',
      },
    });
    const res = verifyConfigManifest(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-36: a config file present on disk but NOT listed in the manifest → deny-all', () => {
    const root = createKeyPair();
    const env = signManifest(root, makeManifest());
    const ctx = pinCtx(root, {
      files: {
        '.policy/trust-roots.json': TRUST_ROOTS_BYTES,
        '.policy/policies/aws.yaml': POLICY_BYTES,
        // An extra unlisted policy the adversary dropped in.
        '.policy/policies/evil.yaml': 'version: 1\nactions: []\n',
      },
    });
    const res = verifyConfigManifest(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-36: a missing manifest → deny-all', () => {
    const root = createKeyPair();
    const res = verifyConfigManifest(undefined as never, pinCtx(root));
    expect(res.valid).toBe(false);
  });

  it('AC-47: a validly-signed manifest with configEpoch below the pinned floor → deny-all', () => {
    const root = createKeyPair();
    // Manifest at epoch 4 with matching file hashes and a valid signature.
    const env = signManifest(root, makeManifest({ configEpoch: 4 }));
    const ctx = pinCtx(root, { minEpoch: 5 }); // floor advanced to 5
    const res = verifyConfigManifest(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-46: rollback to an older validly-signed manifest is rejected once the floor advances', () => {
    const root = createKeyPair();

    // Epoch N: current, more-restrictive config, matching the floor.
    const current = signManifest(root, makeManifest({ configEpoch: 5 }));
    expect(verifyConfigManifest(current, pinCtx(root, { minEpoch: 5 })).valid).toBe(true);

    // Attacker swaps in an OLDER validly-signed, more-permissive manifest (epoch 4)
    // whose revocation list would un-revoke a stolen key.
    const older = signManifest(
      root,
      makeManifest({
        configEpoch: 4,
        files: [
          { path: '.policy/trust-roots.json', sha256: sha256('{"roots":[],"revoked":[]}') },
          { path: '.policy/policies/aws.yaml', sha256: sha256('version: 1\nactions: []\n') },
        ],
      }),
    );
    // Even though `older` verifies against the config root, epoch 4 < floor 5 → deny.
    const res = verifyConfigManifest(older, pinCtx(root, { minEpoch: 5 }));
    expect(res.valid).toBe(false);
  });

  it('AC-46: partial rollback (old trust-roots + new policy) is impossible — one manifest hash', () => {
    const root = createKeyPair();
    const env = signManifest(root, makeManifest({ configEpoch: 5 }));
    // Adversary keeps the new policy file but swaps trust-roots.json to an old, permissive one.
    const ctx = pinCtx(root, {
      files: {
        '.policy/trust-roots.json': '{"roots":[{"fingerprint":"fp-attacker","kind":"human"}]}',
        '.policy/policies/aws.yaml': POLICY_BYTES,
      },
    });
    // The swapped trust-roots hash won't match the manifest entry → deny-all.
    const res = verifyConfigManifest(env, ctx);
    expect(res.valid).toBe(false);
  });

  it('AC-36: the resulting honored trust roots come only from the manifest-verified config', () => {
    const root = createKeyPair();
    const env = signManifest(root, makeManifest());
    const res = verifyConfigManifest(env, pinCtx(root));
    expect(res.valid).toBe(true);
    // On success, the verified config files are exposed for downstream trust-root loading.
    expect(res.verifiedFiles).toEqual(
      expect.arrayContaining(['.policy/trust-roots.json', '.policy/policies/aws.yaml']),
    );
  });

  it('any exception during manifest verification is a denial (fail closed)', () => {
    const root = createKeyPair();
    const env = signManifest(root, makeManifest());
    // Context missing the pinned fingerprint must deny, not throw through.
    const res = verifyConfigManifest(env, { files: {} } as never);
    expect(res.valid).toBe(false);
  });
});
