/**
 * Milestone A — Unified trust core: proven → SignedEnvelope bridge.
 *
 * Implements AC-3 (bridge derives human evidence from a legacy proven answer
 * WITHOUT re-signing the human's intent as the adapter's own), AC-43 (derived
 * evidence still evaluates as kind:'human', anchored on the ORIGINAL human
 * fingerprint), and AC-48 (legacy signedFields completeness assertion —
 * {breakpointId, approved, responderId} ⊆ signedFields, each present on the
 * answer, and approved === true — applied at the trust boundary BEFORE any
 * evidence is derived).
 *
 * OVERRIDING RULE: fail closed. Any failed check, a non-human trust root, a
 * failed proven verification, approved !== true, or ANY thrown exception yields
 * `{ derived: false }` with no evidence emitted. No fallbacks.
 */
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';
import { verifyAnswer } from '@a5c-ai/tasks-adapter/proven';
import type { ProvenBreakpointAnswer } from '@a5c-ai/tasks-adapter';
import type { TrustRoot, TrustStore } from './verify-envelope-trusted.js';

export type { TrustRoot } from './verify-envelope-trusted.js';

/**
 * The derived human-approval payload (AC-43). It records the ORIGINAL human
 * fingerprint so the evaluator resolves the human-approval step against that
 * human root, not the adapter's bridging (engine) key.
 */
export interface DerivedHumanApprovalPayload {
  payloadType: 'human-approval';
  originalHumanFingerprint: string;
  breakpointId: string;
  approved: boolean;
  provenVerified: true;
  responderId: string;
  approvedAt: string;
}

export interface DerivedEvidence {
  kind: 'human-approval';
  envelope: SignedEnvelope<DerivedHumanApprovalPayload>;
}

export interface BridgeResult {
  derived: boolean;
  reason?: string;
  evidence?: DerivedEvidence;
}

export interface BridgeOptions {
  /** proven baseDir where trusted public keys live (for verifyAnswer). */
  baseDir?: string;
  /** The policy trusted store — originalHumanFingerprint MUST be a human root. */
  store: TrustStore;
}

/** The AC-48 legacy-completeness required set on the proven answer. */
const REQUIRED_LEGACY_SIGNED_FIELDS = ['breakpointId', 'approved', 'responderId'] as const;

const DENY = (reason: string): BridgeResult => ({ derived: false, reason });

/**
 * Bridge a legacy ProvenBreakpointAnswer into human-approval evidence, or deny.
 */
export async function bridgeProvenAnswer(
  proven: ProvenBreakpointAnswer,
  opts: BridgeOptions,
): Promise<BridgeResult> {
  try {
    if (!proven || typeof proven !== 'object') return DENY('missing proven answer');
    if (!opts || !opts.store || !Array.isArray(opts.store.trustRoots)) return DENY('missing store');

    // ── AC-48: legacy signedFields completeness, applied BEFORE any derivation.
    if (!Array.isArray(proven.signedFields)) return DENY('signedFields is not an array');
    const signed = new Set(proven.signedFields);
    const answer = proven as unknown as Record<string, unknown>;
    for (const field of REQUIRED_LEGACY_SIGNED_FIELDS) {
      // Must be within the human-signed set ...
      if (!signed.has(field)) return DENY(`required legacy field not signed: ${field}`);
      // ... AND present on the answer object (a signedFields entry naming an
      // absent field is treated as missing → deny).
      if (!(field in answer) || answer[field] === undefined) {
        return DENY(`signed legacy field absent from answer: ${field}`);
      }
    }

    // ── The original human fingerprint MUST be a currently-valid, non-revoked
    // `human` trust root (AC-43); otherwise a relabeled/engine key could be
    // laundered into human evidence.
    const fp = proven.publicKeyFingerprint;
    if (typeof fp !== 'string' || fp.length === 0) return DENY('missing publicKeyFingerprint');
    const humanRoot: TrustRoot | undefined = opts.store.trustRoots.find(
      (r) => r && r.fingerprint === fp,
    );
    if (!humanRoot) return DENY('fingerprint not in trusted store');
    if (humanRoot.kind !== 'human') return DENY('fingerprint is not a human trust root');
    if (humanRoot.revoked === true) return DENY('human trust root revoked');

    // ── The human root MUST be valid at the moment the answer was given
    // (mirrors keyValidAt(root, answeredAt) used in verify-envelope-trusted
    // verifyOne). An EXPIRED human root can otherwise launder proven answers into
    // human evidence, since only kind/revoked were checked before. Deny if the
    // root's expiresAt is at or before the answer's answeredAt. Fail closed on a
    // malformed timestamp.
    if (typeof humanRoot.expiresAt === 'string' && humanRoot.expiresAt.length > 0) {
      const answeredAtRaw = answer.answeredAt;
      if (typeof answeredAtRaw !== 'string' || answeredAtRaw.length === 0) {
        return DENY('answer has no answeredAt to validate the human root against');
      }
      const expiry = new Date(humanRoot.expiresAt).getTime();
      const answeredAt = new Date(answeredAtRaw).getTime();
      if (Number.isNaN(expiry) || Number.isNaN(answeredAt)) {
        return DENY('malformed human-root expiresAt or answer answeredAt');
      }
      if (answeredAt > expiry) return DENY('human trust root expired at answeredAt');
    }

    // ── AC-3: verify the legacy answer via proven verifyAnswer against the human
    // root's proven trusted directory. Only a genuinely human-signed answer passes.
    const provenResult = await verifyAnswer(proven, opts.baseDir);
    if (!provenResult.valid) return DENY(`proven verification failed: ${provenResult.reason}`);

    // ── Only now trust `approved`, and derive ONLY when approved === true (a
    // signed rejection never yields an approval envelope).
    if (proven.approved !== true) return DENY('answer not approved (approved !== true)');

    // ── Derive the human-approval evidence. It is co-signed by the adapter's
    // bridging identity for storage integrity ONLY; the evaluator anchors the
    // human-approval step on originalHumanFingerprint, not this bridging key.
    const bridging = createKeyPair();
    const payload: DerivedHumanApprovalPayload = {
      payloadType: 'human-approval',
      originalHumanFingerprint: fp,
      breakpointId: String(answer.breakpointId),
      approved: true,
      provenVerified: true,
      responderId: String(answer.responderId),
      approvedAt: typeof answer.answeredAt === 'string' ? answer.answeredAt : new Date().toISOString(),
    };
    const envelope = signPayload(bridging.privateKey, bridging.fingerprint, payload, [
      'payloadType',
      'originalHumanFingerprint',
      'breakpointId',
      'approved',
      'provenVerified',
      'responderId',
      'approvedAt',
    ]);

    return {
      derived: true,
      evidence: { kind: 'human-approval', envelope },
    };
  } catch (err) {
    return DENY(`exception during bridge: ${(err as Error)?.message ?? String(err)}`);
  }
}
