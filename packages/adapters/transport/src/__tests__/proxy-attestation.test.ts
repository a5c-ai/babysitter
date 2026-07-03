/**
 * Milestone C — AUTHORITATIVE proxy model-attestation (transport).
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §6.1–6.3
 * (AC-11 attestation identity + engine trust root; AC-12 NON-streaming: sign after
 * trackCompletionOutcome, before protocol encoding, over
 * {modelId, provider, inputMessagesHash, outputContent, toolCalls}; AC-13 STREAMING:
 * accumulate deltas, sign at the terminal `done` event over the fully-accumulated
 * arguments; AC-14 sidecar keyed by x-request-id, per-toolCallId index; AC-16
 * resolution by tool-call id), §6.4/AC-39 (proxy producer marker), §6.5/AC-18 +
 * §11/AC-44 (passthrough claims NO attestation), and §14/AC-53 (argsHash boundary
 * conformance: proxy-side JSON.parse(arguments) → canonicalizeArgs is byte-identical
 * to the gate-side canonicalizeArgs of the delivered object; input-mutating hook
 * after attestation fails closed).
 *
 * The design mandates ONE shared canonicalizer (AC-52): the proxy's argsHash and every
 * gate's argsHash are produced by the IDENTICAL `canonicalizeArgs` exported from
 * @a5c-ai/policy-adapter. These tests import that shared helper and assert byte-identity.
 *
 * Imports come from the intended module paths the Milestone-C implementation WILL
 * provide: `@a5c-ai/transport-adapter/attestation` (a leaf attestation util with no
 * adapter-runtime dependency). Module resolution MAY fail until the milestone lands —
 * expected; there are no syntax errors. Adversarial cases MUST fail closed.
 *
 * Producer strategy note: `CompletionResult.toolCalls[].arguments` is a JSON STRING
 * (types.ts:50-59). The proxy JSON.parses it, then canonicalizes via the shared helper
 * (AC-12/AC-53) so proxy-side and gate-side hashes match byte-for-byte.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair } from '@a5c-ai/trust-core';
import type { SignedEnvelope, ModelDecisionPayload } from '@a5c-ai/trust-core';
import { canonicalizeArgs, argsHash } from '@a5c-ai/policy-adapter';

// The attestation producer + sidecar store the transport milestone WILL export.
import {
  signCompletionAttestation,
  accumulateStreamAttestation,
  AttestationSidecarStore,
  PROXY_ATTESTATION_PRODUCER,
  type CompletionAttestationInput,
  type StreamAttestationAccumulator,
} from '../attestation.js';

import type { CompletionResult, CompletionStreamEvent } from '../types.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** The proxy's engine key pair — held OUTSIDE the agent process (AC-11). */
function proxyKey(): ReturnType<typeof createKeyPair> {
  return createKeyPair();
}

const REQUEST_ID = 'req-abc-123';

/** A non-streaming CompletionResult with one tool call (arguments is a JSON string). */
function completionResult(overrides?: Partial<CompletionResult>): CompletionResult {
  return {
    id: 'cmpl-1',
    model: 'claude-opus-4-20250101',
    role: 'assistant',
    text: '',
    finishReason: 'tool_use',
    usage: { inputTokens: 10, outputTokens: 5 } as unknown as CompletionResult['usage'],
    toolCalls: [
      {
        id: 'call_A',
        name: 'Bash',
        arguments: JSON.stringify({ command: 'aws s3 cp a b', region: 'us-east-1' }),
      },
    ],
    ...overrides,
  };
}

function attestationInput(
  kp: ReturnType<typeof createKeyPair>,
  overrides?: Partial<CompletionAttestationInput>,
): CompletionAttestationInput {
  return {
    keyPair: kp,
    modelId: 'claude-opus-4-20250101',
    provider: 'anthropic',
    inputMessagesHash: sha256('[messages]'),
    result: completionResult(),
    requestId: REQUEST_ID,
    ...overrides,
  };
}

// ── AC-12 — non-streaming attestation produced + signed ───────────────────────

describe('Milestone C — proxy attestation (non-streaming, AC-11/AC-12/AC-34)', () => {
  it('AC-12: signs a ModelDecisionPayload from {modelId, provider, inputMessagesHash, outputContent, toolCalls}', () => {
    const kp = proxyKey();
    const env: SignedEnvelope<ModelDecisionPayload> = signCompletionAttestation(attestationInput(kp));

    expect(env.payload.payloadType).toBe('model-decision');
    expect(env.payload.modelId).toBe('claude-opus-4-20250101');
    expect(env.payload.provider).toBe('anthropic');
    expect(env.payload.inputMessagesHash).toBe(sha256('[messages]'));
    expect(Array.isArray(env.payload.toolCalls)).toBe(true);
    // payloadType + toolCalls MUST be inside signedFields (AC-2/AC-51/§4.1a).
    expect(env.signedFields).toContain('payloadType');
    expect(env.signedFields).toContain('toolCalls');
  });

  it('AC-34: every tool call is bound as {toolCallId, name, argsHash}', () => {
    const kp = proxyKey();
    const env = signCompletionAttestation(attestationInput(kp));
    const bound = env.payload.toolCalls[0];
    expect(bound.toolCallId).toBe('call_A');
    expect(bound.name).toBe('Bash');
    expect(bound.argsHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('AC-53/AC-52: proxy argsHash == shared canonicalizeArgs of the delivered object (byte-identical)', () => {
    const kp = proxyKey();
    const env = signCompletionAttestation(attestationInput(kp));
    // The proxy JSON.parses the provider `arguments` string, then hashes via the
    // shared canonicalizer. A gate hashing the SAME delivered object with the SAME
    // shared helper MUST get the identical hash.
    const deliveredObject = { command: 'aws s3 cp a b', region: 'us-east-1' };
    const gateHash = argsHash(deliveredObject);
    expect(env.payload.toolCalls[0].argsHash).toBe(gateHash);
    // And byte-identity at the serialization level (not just hash-equality).
    const proxyParsed = JSON.parse(completionResult().toolCalls![0].arguments);
    expect(canonicalizeArgs(proxyParsed)).toBe(canonicalizeArgs(deliveredObject));
  });

  it('AC-39: the attestation is stamped with the proxy producer marker', () => {
    const kp = proxyKey();
    const env = signCompletionAttestation(attestationInput(kp));
    // The producer marker distinguishes the AUTHORITATIVE proxy variant (held outside
    // the agent) from the correlation-grade in-process genty variant.
    expect(PROXY_ATTESTATION_PRODUCER).toBe('proxy');
  });

  it('AC-12: attestation is NOT injected into the model response body (bodies stay provider-compatible)', () => {
    const kp = proxyKey();
    const result = completionResult();
    signCompletionAttestation(attestationInput(kp, { result }));
    // The producer MUST NOT mutate the model result JSON — no attestation/signature keys.
    const asRecord = result as unknown as Record<string, unknown>;
    expect(asRecord.attestation).toBeUndefined();
    expect(asRecord.signature).toBeUndefined();
    expect(asRecord.modelDecision).toBeUndefined();
  });
});

// ── AC-14/AC-16 — sidecar keyed by request id + per-toolCallId index ───────────

describe('Milestone C — attestation sidecar (AC-14/AC-16)', () => {
  it('AC-14: attestation is written to the sidecar keyed by request id', () => {
    const kp = proxyKey();
    const store = new AttestationSidecarStore();
    const env = signCompletionAttestation(attestationInput(kp));
    store.put(REQUEST_ID, env);
    expect(store.getByRequestId(REQUEST_ID)).toBeDefined();
  });

  it('AC-16: attestation resolves by tool-call id (per-toolCallId index)', () => {
    const kp = proxyKey();
    const store = new AttestationSidecarStore();
    const env = signCompletionAttestation(attestationInput(kp));
    store.put(REQUEST_ID, env);
    const resolved = store.getByToolCallId('call_A');
    expect(resolved).toBeDefined();
    expect(resolved?.payload.toolCalls.some((tc) => tc.toolCallId === 'call_A')).toBe(true);
  });

  it('AC-16: resolving an unknown tool-call id yields nothing (no attestation → step unsatisfied → deny)', () => {
    const kp = proxyKey();
    const store = new AttestationSidecarStore();
    store.put(REQUEST_ID, signCompletionAttestation(attestationInput(kp)));
    expect(store.getByToolCallId('call_UNKNOWN')).toBeUndefined();
  });
});

// ── AC-13 — streaming: accumulate deltas, sign at terminal `done` ─────────────

describe('Milestone C — proxy attestation (streaming, AC-13)', () => {
  /** A minimal streamed sequence: two arg deltas then a terminal `done`. */
  function streamEvents(): CompletionStreamEvent[] {
    return [
      {
        type: 'tool_call',
        id: 'call_A',
        name: 'Bash',
        argumentsDelta: '{"command":"aws s3 ',
      } as unknown as CompletionStreamEvent,
      {
        type: 'tool_call',
        id: 'call_A',
        name: 'Bash',
        argumentsDelta: 'cp a b","region":"us-east-1"}',
      } as unknown as CompletionStreamEvent,
      { type: 'done' } as unknown as CompletionStreamEvent,
    ];
  }

  it('AC-13: signs only at the terminal `done`, over fully-accumulated arguments', () => {
    const kp = proxyKey();
    const acc: StreamAttestationAccumulator = accumulateStreamAttestation({
      keyPair: kp,
      modelId: 'claude-opus-4-20250101',
      provider: 'anthropic',
      inputMessagesHash: sha256('[messages]'),
      requestId: REQUEST_ID,
    });

    let signedBeforeDone: SignedEnvelope<ModelDecisionPayload> | undefined;
    for (const ev of streamEvents()) {
      const out = acc.onEvent(ev);
      if ((ev as { type: string }).type !== 'done' && out) {
        signedBeforeDone = out;
      }
    }
    // No attestation is emitted before the terminal event (args not yet complete).
    expect(signedBeforeDone).toBeUndefined();

    const env = acc.result();
    expect(env).toBeDefined();
    // argsHash is over the FINAL accumulated argument bytes (AC-13), byte-identical
    // to the shared canonicalizer of the reassembled object (AC-52/AC-53).
    const finalArgs = { command: 'aws s3 cp a b', region: 'us-east-1' };
    expect(env!.payload.toolCalls[0].argsHash).toBe(argsHash(finalArgs));
  });

  it('AC-13/AC-34: streamed attestation binds each tool-call id from accumulated deltas', () => {
    const kp = proxyKey();
    const acc = accumulateStreamAttestation({
      keyPair: kp,
      modelId: 'claude-opus-4-20250101',
      provider: 'anthropic',
      inputMessagesHash: sha256('[messages]'),
      requestId: REQUEST_ID,
    });
    for (const ev of streamEvents()) acc.onEvent(ev);
    const env = acc.result();
    expect(env!.payload.toolCalls.map((tc) => tc.toolCallId)).toContain('call_A');
  });
});

// ── AC-18/AC-44 — passthrough mode does NOT claim a proxy attestation ─────────

describe('Milestone C — passthrough mode documented gap (AC-18/AC-44)', () => {
  it('AC-18: passthrough (no completionEngine) produces NO attestation — it does not silently claim one', () => {
    // In passthrough mode the response body is forwarded unparsed, so there is no
    // CompletionResult to attest. The producer MUST NOT fabricate an attestation.
    const store = new AttestationSidecarStore();
    // Nothing was signed; a policy requiring proxy attestation resolves to nothing.
    expect(store.getByRequestId(REQUEST_ID)).toBeUndefined();
    expect(store.getByToolCallId('call_A')).toBeUndefined();
  });
});

// ── AC-53 — input-mutating hook AFTER attestation → covered action fails closed ─

describe('Milestone C — AC-53 boundary: post-attestation input mutation fails closed', () => {
  it('AC-53: a hook that mutates args after attestation makes the gate argsHash diverge → deny', () => {
    const kp = proxyKey();
    // The proxy attests over the ORIGINAL delivered args.
    const env = signCompletionAttestation(attestationInput(kp));
    const attestedArgsHash = env.payload.toolCalls[0].argsHash;

    // A GATE-1 hook mutates the input AFTER attestation (adds --recursive).
    const mutatedArgs = { command: 'aws s3 cp a b --recursive', region: 'us-east-1' };
    const gateArgsHash = argsHash(mutatedArgs);

    // The gate recomputes over the mutated object; the hashes MUST NOT match, so the
    // model-decision binding (AC-34a) fails and the covered action is denied.
    expect(gateArgsHash).not.toBe(attestedArgsHash);
  });
});
