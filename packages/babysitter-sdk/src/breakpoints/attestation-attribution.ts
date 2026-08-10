/**
 * Milestone C — ATTRIBUTION: correlation metadata on the effect result (AC-14, §6.3).
 *
 * Records `{ sessionId, modelId, attestationRequestId }` (and, where present,
 * `toolCallId` + the attestation `producer` marker) on the effect-result metadata
 * (serializer `StoredTaskResult.metadata`) so an auditor can correlate a resolved
 * effect back to the exact model turn — and the exact producer (authoritative proxy
 * vs. correlation-grade in-process) — that authorized it.
 *
 * The proxy attestation sidecar is keyed by request id (AC-14) and indexed by
 * tool-call id (AC-16); recording those ids here threads the correlation through to
 * the persisted effect result.
 */

/**
 * The producer that emitted the model-decision attestation this effect correlates
 * to: the AUTHORITATIVE out-of-agent `'proxy'` variant, or the correlation-grade
 * in-agent `'in-process'` variant (AC-39). Distinguishing them in the audit record
 * is load-bearing: only the proxy variant is authoritative.
 */
export type AttestationProducer = "proxy" | "in-process";

export interface AttestationAttribution {
  /** The session that produced the model turn. */
  sessionId: string;
  /** The model id that drove the turn (`endpoint.model`). */
  modelId: string;
  /** The proxy sidecar request id keying the attestation (AC-14). */
  attestationRequestId: string;
  /** The bound tool-call id, when the effect correlates to a specific call (AC-16). */
  toolCallId?: string;
  /** Which producer signed the attestation (AC-39 correlation-grade distinction). */
  producer?: AttestationProducer;
}

/**
 * The shape recorded on `StoredTaskResult.metadata`. A plain JSON record (no
 * undefined values) so it survives `stableClone` + serialization + disk round-trip.
 */
export interface AttestationAttributionMetadata {
  sessionId: string;
  modelId: string;
  attestationRequestId: string;
  toolCallId?: string;
  producer?: AttestationProducer;
}

/**
 * Build the correlation metadata block for an effect result from an attestation
 * attribution. Only defined fields are included so the persisted metadata stays a
 * clean JSON record.
 */
export function buildAttestationAttributionMetadata(
  attribution: AttestationAttribution,
): AttestationAttributionMetadata {
  const meta: AttestationAttributionMetadata = {
    sessionId: attribution.sessionId,
    modelId: attribution.modelId,
    attestationRequestId: attribution.attestationRequestId,
  };
  if (typeof attribution.toolCallId === "string" && attribution.toolCallId.length > 0) {
    meta.toolCallId = attribution.toolCallId;
  }
  if (attribution.producer === "proxy" || attribution.producer === "in-process") {
    meta.producer = attribution.producer;
  }
  return meta;
}
