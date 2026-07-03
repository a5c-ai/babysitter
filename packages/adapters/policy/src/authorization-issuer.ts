/**
 * Milestone B — Authorization issuer (AC-9, AC-42) + carry-forward hardening.
 *
 * On a satisfied policy, the issuer mints a short-lived signed CommandAuthorization
 * (SignedEnvelope<CommandAuthorizationPayload>, configEpoch-bound) via the Milestone-A
 * envelope construction, binding the exact tool + toolCallId + commandHash + argsHash +
 * credentialScope + evidence fingerprints + evidence CONTENT hashes + configEpoch +
 * expiry.
 *
 * FAIL CLOSED — no authorization is issued when:
 *   - `requiredStepCount` is absent (the caller MUST pass it, AC-42 carry-forward);
 *   - fewer bound evidences than `requiredStepCount`;
 *   - any evidence envelope does not verify against the trusted store (AC-9);
 *   - the configEpoch is below the pinned floor (AC-47);
 *   - any thrown exception.
 */
import { createHash } from 'node:crypto';
import { signPayload } from '@a5c-ai/genty-core/trust';
import type { IdentityKeyPair, SignedEnvelope } from '@a5c-ai/genty-core/trust';
import {
  verifyEnvelopeTrusted,
  type TrustStore,
  type EvidenceKind,
  type CommandAuthorizationPayload,
  type EvidenceStepBinding,
} from './verify-envelope-trusted.js';

export interface IssueEvidence {
  kind: 'human-approval' | 'model-decision' | 'delegation';
  envelope: SignedEnvelope<Record<string, unknown>>;
  /** The chain step (or quorum contributor) this evidence binds to (AC-42). */
  stepIndex: number;
}

export interface IssueRequest {
  issuerKeyPair: IdentityKeyPair;
  store: TrustStore;
  policyId: string;
  policyDocHash: string;
  matchedChainId: string;
  configEpoch: number;
  minEpochFloor: number;
  toolName: string;
  toolCallId: string;
  commandHash: string;
  argsHash: string;
  credentialScope: string;
  authorizationTtlSeconds: number;
  /** Number of REQUIRED steps that MUST each have a bound evidence (AC-42). */
  requiredStepCount: number;
  evidenceUsed: IssueEvidence[];
  runId?: string;
  sessionId?: string;
}

export interface IssueResult {
  issued: boolean;
  reason?: string;
  authorization?: SignedEnvelope<CommandAuthorizationPayload>;
}

const KIND_TO_EVIDENCE_KIND: Record<string, EvidenceKind> = {
  'human-approval': 'human-approval',
  'model-decision': 'model-decision',
  delegation: 'delegation',
};

const AUTHORIZATION_SIGNED_FIELDS = [
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
  'runId',
  'sessionId',
  'issuedAt',
  'expiresAt',
];

const DENY = (reason: string): IssueResult => ({ issued: false, reason });

/** Content hash of an evidence envelope (binds identity AND content, AC-9). */
function envelopeHash(envelope: SignedEnvelope<Record<string, unknown>>): string {
  return createHash('sha256').update(JSON.stringify(envelope)).digest('hex');
}

/**
 * Issue a CommandAuthorization iff every precondition holds; otherwise fail closed.
 */
export function issueCommandAuthorization(req: IssueRequest): IssueResult {
  try {
    if (!req || typeof req !== 'object') return DENY('missing issue request');
    if (!req.issuerKeyPair || typeof req.issuerKeyPair.privateKey !== 'string') {
      return DENY('missing issuer key pair');
    }
    if (!req.store || !Array.isArray(req.store.trustRoots)) return DENY('missing trust store');
    if (!Array.isArray(req.evidenceUsed)) return DENY('missing evidenceUsed');

    // AC-42 carry-forward: an ABSENT requiredStepCount fails closed.
    if (typeof req.requiredStepCount !== 'number' || !Number.isInteger(req.requiredStepCount) || req.requiredStepCount < 1) {
      return DENY('explicit requiredStepCount is required (fail closed)');
    }

    // AC-47: below-floor epoch → no authorization.
    if (typeof req.configEpoch !== 'number' || typeof req.minEpochFloor !== 'number') {
      return DENY('missing configEpoch / minEpochFloor');
    }
    if (req.configEpoch < req.minEpochFloor) return DENY('configEpoch below floor');

    // AC-42: at least one bound evidence per required step.
    const boundSteps = new Set(req.evidenceUsed.map((e) => e.stepIndex));
    if (boundSteps.size < req.requiredStepCount) {
      return DENY('fewer bound evidences than requiredStepCount');
    }

    // AC-9: every evidence envelope MUST verify against the trusted store.
    const evidenceFingerprints: string[] = [];
    const evidenceEnvelopeHashes: string[] = [];
    const evidenceStepBindings: EvidenceStepBinding[] = [];

    for (const ev of req.evidenceUsed) {
      const requiredKind = KIND_TO_EVIDENCE_KIND[ev.kind];
      if (!requiredKind) return DENY(`unknown evidence kind: ${ev.kind}`);
      const trusted = verifyEnvelopeTrusted(ev.envelope, requiredKind, req.store);
      if (!trusted.valid) return DENY(`evidence does not verify: ${trusted.reason}`);

      const hash = envelopeHash(ev.envelope);
      evidenceFingerprints.push(ev.envelope.publicKeyFingerprint);
      evidenceEnvelopeHashes.push(hash);
      evidenceStepBindings.push({
        stepIndex: ev.stepIndex,
        requiredKind: ev.kind,
        envelopeHash: hash,
      });
    }

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + req.authorizationTtlSeconds * 1000);

    const payload: CommandAuthorizationPayload = {
      payloadType: 'command-authorization',
      policyId: req.policyId,
      policyDocHash: req.policyDocHash,
      configEpoch: req.configEpoch,
      matchedChainId: req.matchedChainId,
      toolName: req.toolName,
      toolCallId: req.toolCallId,
      commandHash: req.commandHash,
      argsHash: req.argsHash,
      credentialScope: req.credentialScope,
      evidenceFingerprints,
      evidenceEnvelopeHashes,
      evidenceStepBindings,
      runId: req.runId,
      sessionId: req.sessionId,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const authorization = signPayload(
      req.issuerKeyPair.privateKey,
      req.issuerKeyPair.fingerprint,
      payload,
      AUTHORIZATION_SIGNED_FIELDS,
    );

    return { issued: true, authorization };
  } catch (err) {
    return DENY(`exception during issuance: ${(err as Error)?.message ?? String(err)}`);
  }
}
