/**
 * Milestone A — Unified trust core: config-integrity manifest + anti-rollback.
 *
 * Implements AC-36 (one signed manifest verified before honoring any root/policy),
 * AC-37 (off-workspace pin of the config root fingerprint), AC-46 (monotonic
 * configEpoch covering ALL config files together), AC-47 (off-workspace minimum
 * epoch floor), and AC-51 (bound payloadType 'config-manifest').
 *
 * OVERRIDING RULE: deny-all on any mismatch — wrong signer, wrong/absent
 * payloadType, below-floor epoch, a config file whose hash disagrees, a file on
 * disk not listed in the manifest, a missing manifest, or ANY thrown exception.
 * Fail closed, no fallbacks.
 */
import { createHash } from 'node:crypto';
import {
  verifyEnvelopeTrusted,
  type TrustRoot,
  type TrustStore,
} from './verify-envelope-trusted.js';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

export type { TrustRoot } from './verify-envelope-trusted.js';

const sha256hex = (data: string): string =>
  createHash('sha256').update(data).digest('hex');

export interface ConfigManifestFileEntry {
  path: string;
  sha256: string;
}

export interface ConfigManifestPayload {
  payloadType: 'config-manifest';
  /** Monotonically increasing; strictly greater on every re-sign (AC-46). */
  configEpoch: number;
  /** EVERY config file: trust-roots.json + every policies/*.yaml. */
  files: ConfigManifestFileEntry[];
  issuedAt: string;
}

export interface ConfigManifestVerifyContext {
  /** The off-workspace pinned config-root fingerprint (AC-37). */
  pinnedConfigRootFp: string;
  /** The config-root trust record carrying key material (kind:'config'). */
  configRoot: TrustRoot;
  /** The off-workspace pinned minimum epoch floor, POLICY_CONFIG_MIN_EPOCH (AC-47). */
  minEpoch: number;
  /** The actual on-disk bytes of each config file, keyed by manifest path. */
  files: Record<string, string>;
}

export interface ConfigManifestVerification {
  valid: boolean;
  reason?: string;
  /** On success, the honored epoch. */
  configEpoch?: number;
  /** On success, the manifest-verified config file paths (for downstream loading). */
  verifiedFiles?: string[];
}

const DENY = (reason: string): ConfigManifestVerification => ({ valid: false, reason });

/**
 * Verify the config manifest before ANY trust root or policy document is honored
 * (AC-36). Deny-all on any failure.
 */
export function verifyConfigManifest(
  manifest: SignedEnvelope<ConfigManifestPayload> | undefined,
  ctx: ConfigManifestVerifyContext,
): ConfigManifestVerification {
  try {
    if (!manifest || typeof manifest !== 'object') return DENY('missing manifest');
    if (!ctx || typeof ctx !== 'object') return DENY('missing verify context');
    if (typeof ctx.pinnedConfigRootFp !== 'string' || ctx.pinnedConfigRootFp.length === 0) {
      return DENY('missing pinned config-root fingerprint');
    }
    if (!ctx.configRoot || typeof ctx.configRoot !== 'object') return DENY('missing config root');
    if (typeof ctx.minEpoch !== 'number') return DENY('missing epoch floor');
    if (!ctx.files || typeof ctx.files !== 'object') return DENY('missing on-disk files');

    // The manifest MUST be signed by the pinned config root and no other. The
    // pinned fingerprint is the sole allowed signer; the store is exactly the
    // config root (so an attacker key cannot be resolved).
    const store: TrustStore = { trustRoots: [ctx.configRoot] };

    // (1) Signature + trusted-store + fingerprint binding + kind('config') +
    // signedFields completeness + payloadType==='config-manifest' (AC-35/AC-51).
    const trusted = verifyEnvelopeTrusted(
      manifest,
      'config-manifest',
      store,
      [ctx.pinnedConfigRootFp],
    );
    if (!trusted.valid) return DENY(`manifest not trusted: ${trusted.reason}`);

    const payload = manifest.payload;

    // (2) Epoch floor (AC-47).
    if (typeof payload.configEpoch !== 'number') return DENY('missing configEpoch');
    if (payload.configEpoch < ctx.minEpoch) return DENY('configEpoch below pinned floor');

    // (3) Every config file: recompute sha256 and require it to match the
    // manifest entry; and every on-disk file MUST be listed in the manifest.
    if (!Array.isArray(payload.files)) return DENY('manifest.files is not an array');
    const manifestByPath = new Map<string, string>();
    for (const entry of payload.files) {
      if (!entry || typeof entry.path !== 'string' || typeof entry.sha256 !== 'string') {
        return DENY('malformed manifest file entry');
      }
      manifestByPath.set(entry.path, entry.sha256);
    }

    // 3a: no on-disk config file may be unlisted (an adversary dropped it in).
    for (const diskPath of Object.keys(ctx.files)) {
      if (!manifestByPath.has(diskPath)) return DENY(`on-disk file not listed in manifest: ${diskPath}`);
    }

    // 3b: every listed file must be present on disk with a matching hash.
    for (const [path, expectedHash] of manifestByPath) {
      const bytes = ctx.files[path];
      if (typeof bytes !== 'string') return DENY(`manifest-listed file missing on disk: ${path}`);
      if (sha256hex(bytes) !== expectedHash) return DENY(`hash mismatch for ${path}`);
    }

    return {
      valid: true,
      configEpoch: payload.configEpoch,
      verifiedFiles: [...manifestByPath.keys()],
    };
  } catch (err) {
    return DENY(`exception during manifest verification: ${(err as Error)?.message ?? String(err)}`);
  }
}
