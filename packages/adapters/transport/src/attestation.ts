/**
 * Milestone C — AUTHORITATIVE proxy model-attestation (transport, AC-11..AC-16, AC-53).
 *
 * The proxy signs a `ModelDecisionPayload` at the wire seam, using a key held by the
 * proxy process OUTSIDE the agent (the agent cannot forge what the model answered).
 * This is the AUTHORITATIVE model-decision producer; its trust root is an `engine`
 * root marked `producer:'proxy'`, distinct from the correlation-grade in-process
 * genty variant (AC-39).
 *
 *   - NON-STREAMING (AC-12): `signCompletionAttestation` signs over
 *     { modelId, provider, inputMessagesHash, outputContent, toolCalls } where each
 *     tool call binds `{ toolCallId, name, argsHash }`. `CompletionResult.toolCalls[]
 *     .arguments` is a JSON STRING; the proxy `JSON.parse`s it, then hashes via the
 *     SHARED `canonicalizeArgs` (AC-52/AC-53) so proxy-side and gate-side hashes are
 *     byte-identical. The attestation is NEVER injected into the model response body.
 *   - STREAMING (AC-13): `accumulateStreamAttestation` accumulates tool-call argument
 *     deltas and signs ONLY at the terminal `done` event, over the fully-accumulated
 *     arguments — so `argsHash` is over the final argument bytes.
 *   - SIDECAR (AC-14/AC-16): `AttestationSidecarStore` keys attestations by request id
 *     and indexes by tool-call id, so the policy component resolves by request id and,
 *     when present, tool-call id. The response body stays provider-compatible
 *     (header + sidecar only, never body injection).
 *
 * PASSTHROUGH (AC-18): in passthrough mode there is no `CompletionResult` to attest;
 * the producer MUST NOT fabricate one — a policy requiring proxy attestation then
 * resolves to nothing and denies (fail-closed, correct).
 *
 * OVERRIDING RULE: fail closed. The shared canonicalizer throws on non-representable
 * input (never a silent coercion), and any parse/sign failure propagates to the caller
 * as a thrown error the route handler treats as "no attestation" — never a body-mutating
 * or half-formed attestation.
 */
import { signModelDecision } from '@a5c-ai/genty-core/trust';
import type {
  IdentityKeyPair,
  SignedEnvelope,
  ModelDecisionPayload,
  SignedToolCall,
} from '@a5c-ai/genty-core/trust';
import { argsHash } from '@a5c-ai/policy-adapter';
import type { CompletionResult, CompletionStreamEvent } from './types.js';

/**
 * The AUTHORITATIVE proxy producer marker (AC-39). Distinguishes the out-of-agent
 * proxy attestation from the correlation-grade in-process genty variant (`'in-process'`).
 */
export const PROXY_ATTESTATION_PRODUCER = 'proxy' as const;

// ── Non-streaming producer (AC-12) ───────────────────────────────────────────

export interface CompletionAttestationInput {
  /** The proxy engine key pair (held OUTSIDE the agent process, AC-11). */
  keyPair: IdentityKeyPair;
  modelId: string;
  provider: string;
  /** sha256 over the request messages (AC-12). */
  inputMessagesHash: string;
  /** The provider completion result; `toolCalls[].arguments` is a JSON string. */
  result: CompletionResult;
  /** Correlation id used to key the sidecar entry (AC-14). */
  requestId?: string;
  timestamp?: string;
}

/** A single completed tool call: `{ id, name, arguments: JSON string }`. */
interface RawToolCall {
  id: string;
  name: string;
  arguments: string;
}

/**
 * Build the signed `SignedToolCall[]` from a set of completed tool calls whose
 * `arguments` are provider JSON STRINGS. Each is `JSON.parse`d, then hashed via the
 * SHARED `canonicalizeArgs` (AC-52/AC-53) — the SAME helper a gate uses on the
 * delivered object, so the hashes match byte-for-byte. A malformed arguments string
 * throws (fail closed — never a silent skip that would leave a call unbound).
 */
function bindToolCalls(toolCalls: readonly RawToolCall[]): SignedToolCall[] {
  return toolCalls.map((tc) => ({
    toolCallId: tc.id,
    name: tc.name,
    argsHash: argsHash(JSON.parse(tc.arguments)),
  }));
}

function buildPayload(
  input: Pick<CompletionAttestationInput, 'modelId' | 'provider' | 'inputMessagesHash' | 'timestamp'>,
  outputContent: string,
  toolCalls: SignedToolCall[],
): ModelDecisionPayload {
  return {
    payloadType: 'model-decision',
    modelId: input.modelId,
    provider: input.provider,
    inputMessagesHash: input.inputMessagesHash,
    outputContent,
    timestamp: input.timestamp ?? new Date().toISOString(),
    toolCalls,
  };
}

/**
 * Sign a non-streaming completion attestation (AC-12). The `CompletionResult` is
 * NOT mutated — the attestation is returned as a standalone envelope for the caller
 * to write to the sidecar (bodies stay provider-compatible, AC-12).
 */
export function signCompletionAttestation(
  input: CompletionAttestationInput,
): SignedEnvelope<ModelDecisionPayload> {
  const raw: RawToolCall[] = (input.result.toolCalls ?? []).map((tc) => ({
    id: tc.id,
    name: tc.name,
    arguments: tc.arguments,
  }));
  const payload = buildPayload(input, input.result.text ?? '', bindToolCalls(raw));
  return signModelDecision(input.keyPair, payload);
}

// ── Streaming producer (AC-13) ────────────────────────────────────────────────

export interface StreamAttestationInput {
  keyPair: IdentityKeyPair;
  modelId: string;
  provider: string;
  inputMessagesHash: string;
  requestId?: string;
  timestamp?: string;
}

export interface StreamAttestationAccumulator {
  /**
   * Feed one stream event. Tool-call argument deltas are accumulated; the terminal
   * `done` event finalizes and signs the attestation. Returns the signed envelope
   * ONLY at the terminal event (so nothing is signed before arguments are complete),
   * otherwise `undefined`.
   */
  onEvent(event: CompletionStreamEvent): SignedEnvelope<ModelDecisionPayload> | undefined;
  /** The signed attestation once the terminal `done` event has been seen. */
  result(): SignedEnvelope<ModelDecisionPayload> | undefined;
}

/** Ordered accumulation of one streamed tool call. */
interface AccumulatingCall {
  id: string;
  name: string;
  args: string;
}

/** Read the tool-call fields from an event tolerating BOTH provider event shapes:
 *  the transport `{ type:'tool-call', id, name, arguments }` and the harness
 *  `{ type:'tool_call', id, name, argumentsDelta }`. */
function readToolCallEvent(event: CompletionStreamEvent): {
  isToolCall: boolean;
  isDone: boolean;
  id?: string;
  name?: string;
  argsChunk?: string;
} {
  const e = event as unknown as Record<string, unknown>;
  const type = typeof e.type === 'string' ? e.type : '';
  const isDone = type === 'done';
  const isToolCall = type === 'tool-call' || type === 'tool_call';
  const id = typeof e.id === 'string' ? e.id : undefined;
  const name = typeof e.name === 'string' ? e.name : undefined;
  const argsChunk =
    typeof e.argumentsDelta === 'string'
      ? (e.argumentsDelta as string)
      : typeof e.arguments === 'string'
        ? (e.arguments as string)
        : undefined;
  return { isToolCall, isDone, id, name, argsChunk };
}

/**
 * Create a stream accumulator that signs ONE attestation at the terminal `done`
 * event, over the fully-accumulated tool-call arguments (AC-13). Signing happens
 * only after every tool call's arguments are complete, so `argsHash` is over the
 * final argument bytes.
 */
export function accumulateStreamAttestation(
  input: StreamAttestationInput,
): StreamAttestationAccumulator {
  const order: string[] = [];
  const calls = new Map<string, AccumulatingCall>();
  let signed: SignedEnvelope<ModelDecisionPayload> | undefined;

  const finalize = (): SignedEnvelope<ModelDecisionPayload> => {
    const raw: RawToolCall[] = order.map((id) => {
      const c = calls.get(id)!;
      return { id: c.id, name: c.name, arguments: c.args };
    });
    const payload = buildPayload(input, '', bindToolCalls(raw));
    return signModelDecision(input.keyPair, payload);
  };

  return {
    onEvent(event: CompletionStreamEvent): SignedEnvelope<ModelDecisionPayload> | undefined {
      const { isToolCall, isDone, id, name, argsChunk } = readToolCallEvent(event);
      if (isToolCall && id) {
        const existing = calls.get(id);
        if (existing) {
          if (name) existing.name = name;
          if (argsChunk) existing.args += argsChunk;
        } else {
          order.push(id);
          calls.set(id, { id, name: name ?? '', args: argsChunk ?? '' });
        }
        // Nothing is signed on a delta — args may still be incomplete (AC-13).
        return undefined;
      }
      if (isDone) {
        signed = finalize();
        return signed;
      }
      return undefined;
    },
    result(): SignedEnvelope<ModelDecisionPayload> | undefined {
      return signed;
    },
  };
}

// ── Sidecar store (AC-14/AC-16) ───────────────────────────────────────────────

/**
 * In-memory attestation sidecar. Keys each attestation by request id (AC-14) and
 * indexes it by every bound tool-call id (AC-16), so the policy component resolves
 * a model-decision evidence by request id and/or tool-call id. The response body is
 * never touched — attestations live only here + in a response header.
 *
 * When no attestation was produced (e.g. passthrough mode, AC-18), lookups return
 * `undefined` — the producer never fabricates an attestation, so a policy requiring
 * proxy attestation resolves to nothing and denies (fail closed).
 */
export class AttestationSidecarStore {
  private readonly byRequestId = new Map<string, SignedEnvelope<ModelDecisionPayload>>();
  private readonly byToolCallId = new Map<string, SignedEnvelope<ModelDecisionPayload>>();

  put(requestId: string, envelope: SignedEnvelope<ModelDecisionPayload>): void {
    if (typeof requestId !== 'string' || requestId.length === 0) return;
    if (!envelope || typeof envelope !== 'object') return;
    this.byRequestId.set(requestId, envelope);
    for (const tc of envelope.payload.toolCalls ?? []) {
      if (tc && typeof tc.toolCallId === 'string' && tc.toolCallId.length > 0) {
        this.byToolCallId.set(tc.toolCallId, envelope);
      }
    }
  }

  getByRequestId(requestId: string): SignedEnvelope<ModelDecisionPayload> | undefined {
    return this.byRequestId.get(requestId);
  }

  getByToolCallId(toolCallId: string): SignedEnvelope<ModelDecisionPayload> | undefined {
    return this.byToolCallId.get(toolCallId);
  }
}
