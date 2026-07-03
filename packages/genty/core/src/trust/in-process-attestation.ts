/**
 * Milestone C — IN-PROCESS genty model-attestation (AC-15 / AC-34 / AC-39 / AC-52).
 *
 * For the non-proxied genty runtime path, the genty adapter signs ONE
 * `ModelDecisionPayload` per model turn whose `toolCalls[]` binds EVERY call the
 * model emitted this turn with `{ toolCallId, name, argsHash }`. The SAME signed
 * envelope is attached to the `ToolExecutionContext` of each call in the turn; each
 * gate then matches its own `toolCallId` against the signed `toolCalls[]` (AC-34a).
 *
 * PRODUCER MARKER (AC-39). This producer's key is held INSIDE the agent process, so
 * a compromised agent can forge it. It is therefore CORRELATION-GRADE only and is
 * stamped `IN_PROCESS_ATTESTATION_PRODUCER = 'in-process'`, distinct from the
 * AUTHORITATIVE out-of-agent proxy variant (`'proxy'`). A policy step requiring
 * proxy attestation (explicitly, or by the credential-scope default) rejects this.
 *
 * SHARED CANONICALIZATION (AC-52). The `argsHash` MUST be byte-identical to the
 * gate-side hash produced by `@a5c-ai/policy-adapter`'s `canonicalizeArgs`. Because
 * genty-core is a DEPENDENCY of policy-adapter (importing it back would be a cycle),
 * this module re-implements the identical total, loss-preserving serialization:
 * `JSON.stringify` of a deep-key-sorted value that preserves array order, string
 * bytes, and value types, throwing on non-finite numbers (the explicit deny-path).
 * A conformance test in the policy adapter pins byte-identity against this producer.
 *
 * OVERRIDING RULE: fail closed. Any non-representable argument value throws (never a
 * silent coercion); an attestation with an empty/absent `toolCalls[]` binds no call.
 */
import { createHash } from 'node:crypto';
import { signModelDecision } from '@a5c-ai/trust-core';
import type {
  ModelDecisionPayload,
  SignedToolCall,
  IdentityKeyPair,
  SignedEnvelope,
} from '@a5c-ai/trust-core';
import type { ToolExecutionContext } from '../types.js';

/** The correlation-grade in-process producer marker (AC-39). NEVER `'proxy'`. */
export const IN_PROCESS_ATTESTATION_PRODUCER = 'in-process' as const;

/**
 * A normalized model-emitted tool call as seen inside the genty session loop:
 * `{ id, name, arguments (parsed object), rawArguments (string) }`.
 */
export interface NormalizedToolCallLike {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  rawArguments?: string;
}

export interface InProcessAttestationInput {
  /** The genty adapter identity key (held inside the agent process). */
  keyPair: IdentityKeyPair;
  /** `endpoint.model` — flowed into the attestation (AC-15). */
  modelId: string;
  provider: string;
  /** sha256 over the model turn's input messages. */
  inputMessagesHash: string;
  /** EVERY tool call the model emitted this turn. */
  toolCalls: NormalizedToolCallLike[];
  /** Optional assistant output content bound into the attestation. */
  outputContent?: string;
  /** Optional turn timestamp (defaults to now). */
  timestamp?: string;
}

// ── Shared canonicalization (byte-identical to policy-adapter canonicalizeArgs) ──

/**
 * Deep-sort object keys, preserve array order + value types, throw on non-finite
 * numbers. Byte-identical to `@a5c-ai/policy-adapter` `canonicalizeArgs`.
 */
function canonicalValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'number') {
    if (!Number.isFinite(value as number)) {
      throw new Error('canonicalizeArgs: non-finite number is not JSON-representable');
    }
    return value;
  }
  if (t === 'string' || t === 'boolean') return value;
  if (Array.isArray(value)) return value.map((el) => canonicalValue(el));
  if (t === 'object') {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = canonicalValue(obj[key]);
    }
    return sorted;
  }
  throw new Error(`canonicalizeArgs: value of type ${t} is not JSON-representable`);
}

function canonicalizeArgs(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

/** `argsHash = sha256(canonicalizeArgs(args))` — the shared gate-matchable hash (AC-52). */
function argsHash(value: unknown): string {
  return createHash('sha256').update(canonicalizeArgs(value)).digest('hex');
}

// ── Producer ─────────────────────────────────────────────────────────────────

/**
 * Sign ONE `ModelDecisionPayload` per model turn, binding every tool call in
 * `input.toolCalls` with `{ toolCallId, name, argsHash }` (AC-15/AC-34). The
 * `argsHash` uses the shared canonicalizer so it is verifiable against the same
 * gate-side hash as the proxy variant (AC-52).
 */
export function signInProcessModelDecision(
  input: InProcessAttestationInput,
): SignedEnvelope<ModelDecisionPayload> {
  const toolCalls: SignedToolCall[] = input.toolCalls.map((tc) => ({
    toolCallId: tc.id,
    name: tc.name,
    argsHash: argsHash(tc.arguments),
  }));

  const payload: ModelDecisionPayload = {
    payloadType: 'model-decision',
    modelId: input.modelId,
    provider: input.provider,
    inputMessagesHash: input.inputMessagesHash,
    outputContent: input.outputContent ?? '',
    timestamp: input.timestamp ?? new Date().toISOString(),
    toolCalls,
  };

  return signModelDecision(input.keyPair, payload);
}

/**
 * Attach the turn's model id + signed attestation to a per-call
 * `ToolExecutionContext` (AC-15). The SAME signed envelope is attached to every
 * call's context; the gate for a given call matches its own `toolCallId` against
 * the envelope's `toolCalls[]` (AC-34a).
 *
 * `toolCallId` is accepted for API symmetry with the gate (and to make the
 * per-call attachment explicit); the envelope itself already carries the bound
 * `toolCalls[]` for every call in the turn.
 */
export function attachAttestationToContext(
  base: ToolExecutionContext,
  attestation: SignedEnvelope<ModelDecisionPayload>,
  _toolCallId: string,
): ToolExecutionContext {
  return {
    ...base,
    modelId: attestation.payload.modelId,
    modelAttestation: attestation,
  };
}
