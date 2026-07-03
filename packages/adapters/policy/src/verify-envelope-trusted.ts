/**
 * Milestone A — Unified trust core: the trusted-store verifier wrapper.
 *
 * Implements AC-35 (trusted-store key resolution + fingerprint binding + kind
 * check), AC-2 (runtime signedFields completeness), AC-51 (bound payloadType
 * domain separation), AC-27 (expiry/revocation), AC-8/AC-10/AC-42/AC-46/AC-47
 * (CommandAuthorization shape + gate verification), and AC-35g (trust-chain
 * verification with per-link trusted-store resolution).
 *
 * OVERRIDING RULE: fail closed. Every verification/parse/config error is a DENY,
 * never a pass-through. No fallbacks (repo rule: fallbacks are evil). Every
 * public entry point catches all exceptions and returns `{ valid: false }`.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verifySignature, verifyTrustChain } from '@a5c-ai/trust-core';
import type { SignedEnvelope, TrustChainLink } from '@a5c-ai/trust-core';

// ── Evidence taxonomy & payload-type domain separation (AC-51) ──────────────

export type EvidenceKind =
  | 'human-approval'
  | 'model-decision'
  | 'delegation'
  | 'command-authorization'
  | 'config-manifest';

/** The bound `payloadType` constant expected for each kind (AC-51). */
export const EXPECTED_PAYLOAD_TYPE: Record<EvidenceKind, string> = {
  'human-approval': 'human-approval',
  'model-decision': 'model-decision',
  delegation: 'delegation',
  'command-authorization': 'command-authorization',
  'config-manifest': 'config-manifest',
};

/**
 * Per-kind required signed-field sets (AC-2). Every entry MUST appear in an
 * envelope's `signedFields` (and be present on the payload) or the envelope is
 * denied at the trust boundary. `payloadType` is required for EVERY kind (AC-51).
 */
export const REQUIRED_SIGNED_FIELDS: Record<EvidenceKind, string[]> = {
  'human-approval': ['payloadType', 'action', 'scope', 'approvedBy', 'approvedAt'],
  'model-decision': [
    'payloadType',
    'modelId',
    'provider',
    'inputMessagesHash',
    'outputContent',
    'timestamp',
    'toolCalls',
  ],
  delegation: ['payloadType', 'delegatorFingerprint', 'delegatorSignature', 'delegatedAt'],
  'command-authorization': [
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
  ],
  'config-manifest': ['payloadType', 'configEpoch', 'files', 'issuedAt'],
};

// ── Identity & key model (AC-6) ─────────────────────────────────────────────

export type TrustRootKind = 'human' | 'engine' | 'agent' | 'tool' | 'config';

export interface TrustRoot {
  /** sha256 of the SPKI/DER (or PEM) public key. */
  fingerprint: string;
  kind: TrustRootKind;
  /** REQUIRED key material — inline PEM/DER-base64 ... */
  publicKey?: string;
  /** ... OR a repo-relative path to it (exactly one of the two). */
  publicKeyPath?: string;
  label: string;
  /**
   * Stable identity this root belongs to (AC-41 distinct-holder). Two keys owned by
   * ONE human/identity share one `identityId` so a quorum counts them as ONE holder.
   * When absent, the evaluator falls back to `label`, then the fingerprint (a store
   * that maps one identity to one root needs neither).
   */
  identityId?: string;
  /**
   * For `engine` roots (AC-6/AC-39): distinguishes the AUTHORITATIVE transport-proxy
   * attestation key (`'proxy'`, held outside the agent process) from the
   * correlation-grade in-process genty key (`'in-process'`, held INSIDE the agent and
   * therefore forgeable by a compromised agent). A model-decision step that requires
   * (or defaults to requiring) proxy attestation is satisfied only by a `'proxy'` root.
   */
  producer?: 'proxy' | 'in-process';
  expiresAt?: string;
  revoked?: boolean;
}

export interface TrustStore {
  trustRoots: TrustRoot[];
}

export interface TrustedVerification {
  valid: boolean;
  reason?: string;
  /** The resolved root's kind, on success. */
  resolvedKind?: TrustRootKind;
  /** The resolved fingerprint, on success. */
  fingerprint?: string;
}

// ── CommandAuthorization payload (AC-8) ─────────────────────────────────────

export interface EvidenceStepBinding {
  stepIndex: number;
  requiredKind: string;
  envelopeHash: string;
}

export interface CommandAuthorizationPayload {
  payloadType: 'command-authorization';
  policyId: string;
  policyDocHash: string;
  configEpoch: number;
  matchedChainId: string;
  toolName: string;
  toolCallId: string;
  commandHash: string;
  argsHash: string;
  credentialScope: string;
  evidenceFingerprints: string[];
  evidenceEnvelopeHashes: string[];
  evidenceStepBindings: EvidenceStepBinding[];
  runId?: string;
  sessionId?: string;
  issuedAt: string;
  expiresAt: string;
}

export interface CommandAuthorizationGateContext {
  now: number;
  toolName: string;
  toolCallId: string;
  commandHash: string;
  argsHash: string;
  credentialScope: string;
  policyDocHash: string;
  currentConfigEpoch: number;
  minEpochFloor: number;
  issuerRoots: TrustRoot[];
  /** Number of required chain steps that MUST each have a bound evidence (AC-42). */
  requiredStepCount?: number;
}

// ── Trust-chain step (AC-35g) ───────────────────────────────────────────────

export interface TrustedChainStep {
  step: string;
  envelope: SignedEnvelope;
  requiredKind: TrustRootKind;
  allowedFingerprints?: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const sha256hex = (data: string): string =>
  createHash('sha256').update(data).digest('hex');

const DENY = (reason: string): TrustedVerification => ({ valid: false, reason });

/**
 * Resolve the trust root's public-key material — inline `publicKey` or, failing
 * that, from `publicKeyPath`. Returns null when no material can be resolved
 * (which is a DENY at the call site — a root MUST carry material, AC-6/AC-7).
 */
function resolvePublicKey(root: TrustRoot): string | null {
  if (typeof root.publicKey === 'string' && root.publicKey.length > 0) {
    return root.publicKey;
  }
  if (typeof root.publicKeyPath === 'string' && root.publicKeyPath.length > 0) {
    // Reading the pinned path is out-of-agent config; any error → deny (fail closed).
    const material = readFileSync(root.publicKeyPath, 'utf-8');
    if (typeof material === 'string' && material.length > 0) return material;
  }
  return null;
}

/** True if the root's key is not expired at the given signing instant (AC-27). */
function keyValidAt(root: TrustRoot, signedAt: string): boolean {
  if (!root.expiresAt) return true;
  const expiry = new Date(root.expiresAt).getTime();
  const signed = new Date(signedAt).getTime();
  if (Number.isNaN(expiry) || Number.isNaN(signed)) return false; // fail closed
  return signed <= expiry;
}

/**
 * Assert AC-2 / AC-51 completeness for an envelope of the given kind:
 *   - every REQUIRED_SIGNED_FIELDS[kind] entry is in `signedFields` AND present
 *     on `payload`;
 *   - `payloadType` is signed and equals the expected constant for `kind`.
 * Returns null on success, or a deny-reason string.
 */
function checkCompleteness<T>(
  envelope: SignedEnvelope<T>,
  kind: EvidenceKind,
): string | null {
  const required = REQUIRED_SIGNED_FIELDS[kind];
  if (!Array.isArray(envelope.signedFields)) return 'signedFields is not an array';
  const signed = new Set(envelope.signedFields);
  const payload = envelope.payload as Record<string, unknown>;
  if (payload === null || typeof payload !== 'object') return 'payload is not an object';

  for (const field of required) {
    if (!signed.has(field)) return `required field not signed: ${field}`;
    if (!(field in payload)) return `signed field absent from payload: ${field}`;
  }
  // AC-51: payloadType must be signed (covered above) AND equal the expected constant.
  if (payload.payloadType !== EXPECTED_PAYLOAD_TYPE[kind]) {
    return `payloadType mismatch: expected ${EXPECTED_PAYLOAD_TYPE[kind]}`;
  }
  return null;
}

/**
 * The core resolution + verification of a single envelope against a trusted
 * store, following AC-35 steps (a)–(g) in order, failing closed at the first
 * failure. Shared by `verifyEnvelopeTrusted`, the CA gate, and the chain verifier.
 */
function verifyOne<T>(
  envelope: SignedEnvelope<T>,
  requiredKind: EvidenceKind,
  store: TrustStore,
  allowedFingerprints?: string[],
): TrustedVerification {
  if (!envelope || typeof envelope !== 'object') return DENY('missing envelope');
  if (!store || !Array.isArray(store.trustRoots)) return DENY('missing trust store');

  const fp = envelope.publicKeyFingerprint;
  if (typeof fp !== 'string' || fp.length === 0) return DENY('missing fingerprint');

  // (a) Resolve key material ONLY from the trusted store.
  const root = store.trustRoots.find((r) => r && r.fingerprint === fp);
  if (!root) return DENY('fingerprint not in trusted store');

  const rootKind = root.kind as TrustRootKind;
  const stepKind = trustRootKindForEvidence(requiredKind);

  // (b) Select by (requiredKind, allowedFingerprints).
  if (rootKind !== stepKind) return DENY('trust-root kind does not match required kind');
  if (allowedFingerprints && !allowedFingerprints.includes(fp)) {
    return DENY('fingerprint not in allowedFingerprints');
  }

  // (a cont.) Resolve material; a root with no material → deny (AC-6/AC-7).
  const resolvedPublicKey = resolvePublicKey(root);
  if (resolvedPublicKey === null) return DENY('trust root carries no key material');

  // (c) Bind fingerprint to material.
  if (sha256hex(resolvedPublicKey) !== fp) {
    return DENY('sha256(publicKey) !== envelope.publicKeyFingerprint');
  }

  // (d) Cross-kind is already rejected in (b); stated explicitly for clarity.

  // (e) signedFields completeness + bound payloadType.
  const completenessError = checkCompleteness(envelope, requiredKind);
  if (completenessError) return DENY(completenessError);

  // (f) Root validity — revoked / expired at signedAt.
  if (root.revoked === true) return DENY('trust root revoked');
  if (!keyValidAt(root, envelope.signedAt)) return DENY('key expired at signing time');

  // (g) Only now: the raw signature check.
  if (!verifySignature(resolvedPublicKey, envelope)) return DENY('signature verification failed');

  return { valid: true, resolvedKind: rootKind, fingerprint: fp };
}

/**
 * Map an evidence/authorization/config kind to the trust-root kind that anchors
 * it (AC-6 table). human-approval → human; model-decision & command-authorization
 * → engine; delegation → agent; config-manifest → config.
 */
function trustRootKindForEvidence(kind: EvidenceKind): TrustRootKind {
  switch (kind) {
    case 'human-approval':
      return 'human';
    case 'model-decision':
      return 'engine';
    case 'command-authorization':
      return 'engine';
    case 'delegation':
      return 'agent';
    case 'config-manifest':
      return 'config';
  }
}

// ── AC-35: verifyEnvelopeTrusted ────────────────────────────────────────────

/**
 * Verify a signed envelope against the trusted store (AC-35). This is the ONLY
 * sanctioned entry to genty's raw `verifySignature` at a trust boundary.
 *
 * Every failure — unknown fingerprint, wrong kind, disallowed fingerprint,
 * fingerprint/material mismatch, missing key material, incomplete signedFields,
 * wrong payloadType, revoked/expired root, bad signature, or ANY thrown
 * exception — is a DENY (`{ valid: false }`). Fail closed, no fallbacks.
 */
export function verifyEnvelopeTrusted<T>(
  envelope: SignedEnvelope<T>,
  requiredKind: EvidenceKind,
  store: TrustStore,
  allowedFingerprints?: string[],
): TrustedVerification {
  try {
    return verifyOne(envelope, requiredKind, store, allowedFingerprints);
  } catch (err) {
    return DENY(`exception during verification: ${(err as Error)?.message ?? String(err)}`);
  }
}

// ── AC-8/AC-10/AC-42/AC-46/AC-47: verifyCommandAuthorization ────────────────

export interface CommandAuthorizationVerification {
  valid: boolean;
  reason?: string;
}

/**
 * Verify a CommandAuthorization envelope at an execution gate (AC-10). Accepts
 * iff ALL of the following hold; else denies (fail closed):
 *   1.  verifyEnvelopeTrusted(auth, 'command-authorization', issuerRoots) passes
 *       (signature + trusted-store + fingerprint binding + kind + signedFields
 *       completeness + payloadType).
 *   2.  now < expiresAt and now >= issuedAt.
 *   3.  toolName equals the executing tool.
 *   3a. toolCallId equals the executing tool-call id.
 *   4.  commandHash equals the gate-recomputed canonicalized-argv hash.
 *   5.  argsHash equals the gate-recomputed args hash (TOCTOU).
 *   6.  credentialScope equals the gate's scope.
 *   9.  policyDocHash equals the gate's integrity-verified policy-doc hash.
 *   10. configEpoch === currentConfigEpoch AND configEpoch >= minEpochFloor.
 *   42. every required step has a bound evidence, and every binding's envelopeHash
 *       is present in evidenceEnvelopeHashes.
 */
export function verifyCommandAuthorization(
  envelope: SignedEnvelope<CommandAuthorizationPayload>,
  ctx: CommandAuthorizationGateContext,
): CommandAuthorizationVerification {
  try {
    if (!ctx || typeof ctx !== 'object') return DENY('missing gate context');
    if (!Array.isArray(ctx.issuerRoots)) return DENY('missing issuerRoots');
    if (!envelope || typeof envelope !== 'object') return DENY('missing authorization');

    const issuerFingerprints = ctx.issuerRoots.map((r) => r.fingerprint);
    const store: TrustStore = { trustRoots: ctx.issuerRoots };

    // (1) Trusted-store verification of the authorization itself.
    const trusted = verifyOne(
      envelope,
      'command-authorization',
      store,
      issuerFingerprints,
    );
    if (!trusted.valid) return DENY(`authorization not trusted: ${trusted.reason}`);

    const p = envelope.payload;

    // (2) Temporal bounds.
    const issuedAt = new Date(p.issuedAt).getTime();
    const expiresAt = new Date(p.expiresAt).getTime();
    if (Number.isNaN(issuedAt) || Number.isNaN(expiresAt)) return DENY('bad issuedAt/expiresAt');
    if (!(ctx.now >= issuedAt)) return DENY('authorization not yet valid');
    if (!(ctx.now < expiresAt)) return DENY('authorization expired');

    // (3) toolName.
    if (p.toolName !== ctx.toolName) return DENY('toolName mismatch');
    // (3a) toolCallId.
    if (p.toolCallId !== ctx.toolCallId) return DENY('toolCallId mismatch');
    // (4) commandHash.
    if (p.commandHash !== ctx.commandHash) return DENY('commandHash mismatch');
    // (5) argsHash.
    if (p.argsHash !== ctx.argsHash) return DENY('argsHash mismatch');
    // (6) credentialScope.
    if (p.credentialScope !== ctx.credentialScope) return DENY('credentialScope mismatch');
    // (9) policyDocHash.
    if (p.policyDocHash !== ctx.policyDocHash) return DENY('policyDocHash mismatch');
    // (10) configEpoch floor + current.
    if (typeof p.configEpoch !== 'number') return DENY('missing configEpoch');
    if (p.configEpoch < ctx.minEpochFloor) return DENY('configEpoch below floor');
    if (p.configEpoch !== ctx.currentConfigEpoch) return DENY('configEpoch != current manifest epoch');

    // (42) Evidence coverage of every required step.
    if (!Array.isArray(p.evidenceStepBindings)) return DENY('missing evidenceStepBindings');
    if (!Array.isArray(p.evidenceEnvelopeHashes)) return DENY('missing evidenceEnvelopeHashes');
    if (typeof ctx.requiredStepCount === 'number') {
      const boundSteps = new Set(p.evidenceStepBindings.map((b) => b.stepIndex));
      if (boundSteps.size < ctx.requiredStepCount) return DENY('a required step lacks a bound evidence');
    }
    const hashes = new Set(p.evidenceEnvelopeHashes);
    for (const binding of p.evidenceStepBindings) {
      if (!binding || typeof binding.envelopeHash !== 'string') return DENY('malformed step binding');
      if (!hashes.has(binding.envelopeHash)) {
        return DENY('step binding envelopeHash absent from evidenceEnvelopeHashes');
      }
    }

    return { valid: true };
  } catch (err) {
    return DENY(`exception during CA verification: ${(err as Error)?.message ?? String(err)}`);
  }
}

// ── AC-35g: verifyTrustChainTrusted ─────────────────────────────────────────

export interface ChainVerification {
  valid: boolean;
  reason?: string;
  brokenAt?: number;
}

/**
 * The delegation-binding fields carried inside a `DelegationChainLink` payload
 * (genty `trust/types.ts`). They are always members of
 * `REQUIRED_SIGNED_FIELDS['delegation']`, so a verified delegation envelope has
 * them inside the signature — an attacker cannot alter the declared delegator or
 * its signature without invalidating the link's own signature.
 */
interface DelegationLinkPayload {
  delegatorFingerprint?: unknown;
  delegatorSignature?: unknown;
}

/**
 * Read the signed delegation binding (`delegatorFingerprint`,
 * `delegatorSignature`) off a link's payload. Returns `null` for either value
 * when it is absent or not a non-empty string.
 */
function readDelegationBinding(envelope: SignedEnvelope): {
  delegatorFingerprint: string | null;
  delegatorSignature: string | null;
} {
  const payload = (envelope?.payload ?? {}) as DelegationLinkPayload;
  const fp =
    typeof payload.delegatorFingerprint === 'string' && payload.delegatorFingerprint.length > 0
      ? payload.delegatorFingerprint
      : null;
  const sig =
    typeof payload.delegatorSignature === 'string' && payload.delegatorSignature.length > 0
      ? payload.delegatorSignature
      : null;
  return { delegatorFingerprint: fp, delegatorSignature: sig };
}

/**
 * Verify a delegation trust chain (AC-35g + delegation-linkage). Each link's key
 * is resolved from the trusted store by fingerprint (NEVER taken from the link),
 * the per-step kind is enforced, and revocation/expiry/completeness are checked
 * before the raw `verifyTrustChain` primitive runs.
 *
 * DELEGATION LINKAGE (the load-bearing A→B→C guarantee). The previous
 * implementation built links for `verifyTrustChain` WITHOUT `parentSignature`,
 * so genty's parent-linkage check (`chain.ts:35`, `if (i>0 && link.parentSignature)`)
 * was dead code: a "chain" passed as an unordered SET of individually-trusted
 * agent envelopes with no real delegation relationship. An attacker could
 * reorder links, or splice in a foreign-but-individually-trusted envelope, and
 * still pass.
 *
 * We now verify true delegation linkage. Each link's signed payload declares who
 * delegated to it (`delegatorFingerprint`) and carries the delegator's signature
 * over the parent link (`delegatorSignature`, which is the parent envelope's
 * signature). For every link i>0 that participates in a linked chain we assert,
 * failing closed on any mismatch:
 *   - `delegatorFingerprint === chain[i-1].publicKeyFingerprint` — the declared
 *     delegator is exactly the immediate predecessor's signer (rejects
 *     reordering and non-adjacent parents); AND
 *   - `delegatorSignature === chain[i-1].signature` — the delegator's signature
 *     covers the parent link. We populate `TrustChainLink.parentSignature` with
 *     this value so genty's own check runs and re-confirms it.
 *
 * A chain is treated as a LINKED delegation chain when ANY link (i>0) binds to
 * its immediate predecessor. Once a chain is linked, EVERY link i>0 MUST bind to
 * its immediate predecessor — a chain is either a fully-linked A→B→C or a set of
 * independent roots; mixing (i.e. splicing a foreign, unlinked envelope into a
 * linked chain) is denied. This closes the "spliced-in foreign envelope" and
 * "reordering" attacks while leaving a chain of independent trusted roots (no
 * link declaring an in-chain delegator) as a valid non-delegation set.
 *
 * Any failure or exception → deny.
 */
export function verifyTrustChainTrusted(
  chain: TrustedChainStep[],
  store: TrustStore,
): ChainVerification {
  try {
    if (!Array.isArray(chain)) return { valid: false, reason: 'chain is not an array' };
    if (!store || !Array.isArray(store.trustRoots)) return { valid: false, reason: 'missing store' };

    const rawLinks: TrustChainLink[] = [];
    for (let i = 0; i < chain.length; i++) {
      const link = chain[i];
      if (!link || !link.envelope) return { valid: false, reason: `malformed link ${i}`, brokenAt: i };

      // Resolve each link through the trusted-store wrapper (kind + fingerprint
      // binding + completeness + revocation/expiry + signature).
      const trusted = verifyOne(
        link.envelope,
        'delegation',
        store,
        link.allowedFingerprints,
      );
      if (!trusted.valid) return { valid: false, reason: trusted.reason, brokenAt: i };
      if (link.requiredKind && trusted.resolvedKind !== link.requiredKind) {
        return { valid: false, reason: `link ${i} kind mismatch`, brokenAt: i };
      }

      // Re-resolve the trusted public key for the raw chain primitive.
      const root = store.trustRoots.find((r) => r && r.fingerprint === link.envelope.publicKeyFingerprint);
      const resolvedPublicKey = root ? resolvePublicKey(root) : null;
      if (resolvedPublicKey === null) return { valid: false, reason: `link ${i} key unresolved`, brokenAt: i };

      rawLinks.push({
        step: link.step,
        envelope: link.envelope,
        publicKey: resolvedPublicKey,
      });
    }

    // ── Delegation linkage. A chain is a LINKED delegation chain if ANY link
    // (i>0) declares a `delegatorFingerprint` that names ANOTHER link's signer in
    // this chain — i.e. it asserts an in-chain delegation relationship. We detect
    // linkage by "declares an in-chain delegator" (not merely "binds to the
    // immediate predecessor") so that a REORDERED chain — where a link's declared
    // delegator is present in the chain but is no longer its immediate
    // predecessor — is still recognized as a linked chain and then rejected by the
    // immediate-predecessor assertion below. A chain of independent roots (every
    // link's declared delegator names nothing in the chain, e.g. the frozen
    // sentinel fixtures) is NOT a delegation chain and is left as a valid set.
    const chainSigners = new Set(
      chain.map((link) => link.envelope.publicKeyFingerprint),
    );
    const isLinkedChain = chain.some((link, i) => {
      if (i === 0) return false;
      const { delegatorFingerprint } = readDelegationBinding(link.envelope);
      return delegatorFingerprint !== null && chainSigners.has(delegatorFingerprint);
    });

    if (isLinkedChain) {
      for (let i = 1; i < chain.length; i++) {
        const parent = chain[i - 1].envelope;
        const { delegatorFingerprint, delegatorSignature } = readDelegationBinding(chain[i].envelope);

        // The declared delegator MUST be exactly the immediate predecessor's
        // signer — rejects reordering, non-adjacent parents, and a spliced
        // foreign envelope that fails to bind to its predecessor.
        if (delegatorFingerprint !== parent.publicKeyFingerprint) {
          return { valid: false, reason: `link ${i} delegator does not bind to immediate predecessor`, brokenAt: i };
        }
        // The delegator's signature MUST cover the parent link (its signature).
        if (delegatorSignature !== parent.signature) {
          return { valid: false, reason: `link ${i} delegatorSignature does not cover the parent link`, brokenAt: i };
        }
        // Populate parentSignature so genty's own linkage check re-confirms it.
        rawLinks[i].parentSignature = parent.signature;
      }
    }

    const result = verifyTrustChain(rawLinks);
    if (!result.valid) return { valid: false, reason: result.reason, brokenAt: result.brokenAt };
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: `exception during chain verification: ${(err as Error)?.message ?? String(err)}` };
  }
}
