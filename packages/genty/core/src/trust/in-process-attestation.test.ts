/**
 * Milestone C — IN-PROCESS genty model-attestation.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §6.2
 * (AC-15: `endpoint.model` flows into ToolExecutionContext + tool_use/tool_result
 * events; the genty adapter signs ONE ModelDecisionPayload per model turn binding
 * EVERY call in `result.toolCalls` with {toolCallId, name, argsHash}; the same signed
 * envelope is attached to the ToolExecutionContext of each call in the turn) and §6.4
 * (AC-39: this producer's fingerprint is a DIFFERENT `engine` trust root, marked
 * correlation-grade / in-process — NOT the proxy — and is not accepted for
 * credential-touching actions unless the policy explicitly opts out of
 * requireProxyAttestation).
 *
 * The producer signs via `trust/model-decision` (`signModelDecision`) and stamps a
 * producer marker distinguishing it from the AUTHORITATIVE proxy variant. `argsHash`
 * uses the SHARED `canonicalizeArgs` (AC-52) so the in-process attestation is
 * verifiable against the same gate-side hash as the proxy variant.
 *
 * Imports come from the intended module path the Milestone-C implementation WILL
 * provide: `./in-process-attestation.js`. Module resolution MAY fail until the
 * milestone lands — expected; no syntax errors. Adversarial cases MUST fail closed.
 *
 * NormalizedToolCall shape (session.ts): { id, name, arguments: Record<string,unknown>,
 * rawArguments: string }.
 */
import { describe, it, expect } from 'vitest';
import { createKeyPair, verifyModelDecision } from '@a5c-ai/trust-core';
import { verifyModelDecision as verifyMD } from '@a5c-ai/trust-core';
import { argsHash } from '@a5c-ai/policy-adapter';

// The in-process producer + its context-attachment helper the milestone WILL export.
import {
  signInProcessModelDecision,
  attachAttestationToContext,
  IN_PROCESS_ATTESTATION_PRODUCER,
  type InProcessAttestationInput,
  type NormalizedToolCallLike,
} from './in-process-attestation.js';

import type { ToolExecutionContext } from '../types.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** The genty adapter identity key — held INSIDE the agent process (correlation-grade). */
function adapterKey(): ReturnType<typeof createKeyPair> {
  return createKeyPair();
}

/** Two model-emitted tool calls in one turn (arguments already parsed to objects). */
function turnToolCalls(): NormalizedToolCallLike[] {
  return [
    { id: 'call_A', name: 'Bash', arguments: { command: 'aws s3 ls' }, rawArguments: '{"command":"aws s3 ls"}' },
    { id: 'call_B', name: 'Read', arguments: { path: '/etc/hosts' }, rawArguments: '{"path":"/etc/hosts"}' },
  ];
}

function input(
  kp: ReturnType<typeof createKeyPair>,
  overrides?: Partial<InProcessAttestationInput>,
): InProcessAttestationInput {
  return {
    keyPair: kp,
    // endpoint.model flows into the attestation (AC-15).
    modelId: 'claude-opus-4-20250101',
    provider: 'genty',
    inputMessagesHash: 'a'.repeat(64),
    toolCalls: turnToolCalls(),
    ...overrides,
  };
}

// ── AC-15 — one attestation per turn, binds EVERY call ────────────────────────

describe('Milestone C — in-process attestation (AC-15)', () => {
  it('AC-15: signs ONE ModelDecisionPayload per turn binding every result.toolCalls entry', () => {
    const kp = adapterKey();
    const env = signInProcessModelDecision(input(kp));
    expect(env.payload.payloadType).toBe('model-decision');
    const ids = env.payload.toolCalls.map((tc) => tc.toolCallId);
    expect(ids).toEqual(['call_A', 'call_B']);
    // A valid signature by the in-process (engine) key.
    expect(verifyMD(kp.publicKey, env)).toBe(true);
    expect(verifyModelDecision(kp.publicKey, env)).toBe(true);
  });

  it('AC-15: model id is recorded per tool call (via the turn attestation)', () => {
    const kp = adapterKey();
    const env = signInProcessModelDecision(input(kp));
    expect(env.payload.modelId).toBe('claude-opus-4-20250101');
  });

  it('AC-52: each call binds argsHash via the SHARED canonicalizeArgs (gate-matchable)', () => {
    const kp = adapterKey();
    const env = signInProcessModelDecision(input(kp));
    const callA = env.payload.toolCalls.find((tc) => tc.toolCallId === 'call_A');
    expect(callA?.argsHash).toBe(argsHash({ command: 'aws s3 ls' }));
  });

  it('AC-15: the SAME signed envelope is attached to each call ToolExecutionContext (modelId + attestation)', () => {
    const kp = adapterKey();
    const env = signInProcessModelDecision(input(kp));
    const baseCtx: ToolExecutionContext = {};
    const ctxA = attachAttestationToContext(baseCtx, env, 'call_A');
    const ctxB = attachAttestationToContext(baseCtx, env, 'call_B');
    // Each context carries the model id + the same turn attestation (AC-15).
    expect((ctxA as { modelId?: string }).modelId).toBe('claude-opus-4-20250101');
    expect((ctxB as { modelId?: string }).modelId).toBe('claude-opus-4-20250101');
    const attA = (ctxA as { modelAttestation?: typeof env }).modelAttestation;
    const attB = (ctxB as { modelAttestation?: typeof env }).modelAttestation;
    expect(attA).toBeDefined();
    // Same turn → same signature on both calls' contexts.
    expect(attA?.signature).toBe(env.signature);
    expect(attB?.signature).toBe(env.signature);
  });
});

// ── AC-39 — producer marker distinguishes in-process from proxy ───────────────

describe('Milestone C — in-process producer marker (AC-39)', () => {
  it('AC-39: the in-process producer marker is `in-process`, NOT `proxy`', () => {
    // A compromised agent can forge this key, so it is correlation-grade only and
    // MUST be labeled distinctly from the authoritative out-of-agent proxy variant.
    expect(IN_PROCESS_ATTESTATION_PRODUCER).toBe('in-process');
    expect(IN_PROCESS_ATTESTATION_PRODUCER).not.toBe('proxy');
  });
});

// ── Fail-closed — empty/absent toolCalls cannot satisfy a step ────────────────

describe('Milestone C — in-process attestation fail-closed (AC-34a)', () => {
  it('an attestation with an empty toolCalls[] binds no call (step unsatisfiable → deny)', () => {
    const kp = adapterKey();
    const env = signInProcessModelDecision(input(kp, { toolCalls: [] }));
    // AC-34a: an attestation with empty/absent toolCalls cannot satisfy any
    // model-decision step for a tool call.
    expect(env.payload.toolCalls).toEqual([]);
  });
});
