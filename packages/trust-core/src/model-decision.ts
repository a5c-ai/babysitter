import { signPayload, verifySignature } from './signing.js';
import type { ModelResponsePayload } from './model-signing.js';
import type { IdentityKeyPair, SignedEnvelope } from './types.js';

/**
 * Milestone A — model-decision payload extension (AC-34, AC-51).
 *
 * The reused `ModelResponsePayload` (model-signing.ts) has no field naming the
 * tool call it authorized, so a valid attestation is replayable to a *different*
 * tool call in the same turn. `ModelDecisionPayload` extends it with:
 *   - a bound `payloadType: 'model-decision'` domain-separation constant (AC-51),
 *     which MUST be inside `signedFields` so a signature over one payload kind is
 *     not transferable to a structurally compatible payload of another kind, and
 *   - a signed `toolCalls[]` array binding each `{ toolCallId, name, argsHash }`
 *     so an attestation is bound to the exact tool call(s) the model emitted.
 *
 * This is the single, deliberate relaxation of the no-new-schema rule; it lives
 * beside `model-signing.ts` in @a5c-ai/genty-core so both the proxy (authoritative)
 * and in-process genty producers share it.
 */

/** A single tool call the model emitted, bound to its arguments by hash (AC-34). */
export interface SignedToolCall {
  /** The provider/harness tool-call id (NormalizedToolCall.id). */
  toolCallId: string;
  /** Tool name the model chose. */
  name: string;
  /** sha256 of canonical JSON of that call's arguments (deepSortKeys ordering). */
  argsHash: string;
}

export interface ModelDecisionPayload extends ModelResponsePayload {
  /** AC-51 domain-separation constant; MUST be in signedFields. */
  payloadType: 'model-decision';
  /** EVERY tool call the model emitted this turn, each bound (AC-34). */
  toolCalls: SignedToolCall[];
}

/**
 * The required signed-field set for a model-decision payload (AC-51 + §4.1a).
 * Every one of these MUST appear in `signedFields` so it is covered by the
 * signature; the policy adapter re-asserts this completeness at the trust
 * boundary (AC-2 / AC-10 step 8).
 */
export const MODEL_DECISION_SIGNED_FIELDS: readonly string[] = [
  'payloadType',
  'modelId',
  'provider',
  'inputMessagesHash',
  'outputContent',
  'timestamp',
  'toolCalls',
];

/**
 * Sign a ModelDecisionPayload with the producer's (engine) key pair.
 *
 * The signed-field set is fixed to MODEL_DECISION_SIGNED_FIELDS so `payloadType`
 * and every sub-field of `toolCalls[]` are covered by the signature.
 */
export function signModelDecision(
  producerKeyPair: IdentityKeyPair,
  payload: ModelDecisionPayload,
): SignedEnvelope<ModelDecisionPayload> {
  return signPayload(
    producerKeyPair.privateKey,
    producerKeyPair.fingerprint,
    payload,
    [...MODEL_DECISION_SIGNED_FIELDS],
  );
}

/**
 * Verify a ModelDecisionPayload envelope against the producer's public key.
 *
 * This is the raw signature check; the trust-boundary wrapper
 * (`verifyEnvelopeTrusted` in @a5c-ai/policy-adapter) additionally resolves the
 * key from the trusted store and asserts kind + signedFields completeness.
 */
export function verifyModelDecision(
  producerPublicKey: string,
  envelope: SignedEnvelope<ModelDecisionPayload>,
): boolean {
  return verifySignature(producerPublicKey, envelope);
}
