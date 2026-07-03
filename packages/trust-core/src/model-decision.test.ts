/**
 * Milestone A — Unified trust core.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md
 * (§3, §4.1a). These exercise the NEW `ModelDecisionPayload` / `SignedToolCall`
 * type that the design adds beside `trust/model-signing.ts` in @a5c-ai/genty-core
 * (the single, deliberate relaxation of the no-new-schema rule — AC-34, AC-51).
 *
 * The implementation for this milestone does not exist yet; these imports are
 * expected to fail to resolve until it lands. The tests express the contract and
 * must be syntactically valid.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, verifySignature } from './signing.js';
// NEW type + helpers introduced in Milestone A (do not yet exist):
import {
  signModelDecision,
  verifyModelDecision,
  type ModelDecisionPayload,
  type SignedToolCall,
} from './model-decision.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

// deepSortKeys canonical JSON of an args object (mirrors genty canonicalize
// ordering); argsHash is sha256 over this canonical form (AC-34/§4.1a).
function canonicalArgs(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(sort);
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      out[k] = sort((v as Record<string, unknown>)[k]);
    }
    return out;
  };
  return JSON.stringify(sort(value));
}

function makePayload(overrides: Partial<ModelDecisionPayload> = {}): ModelDecisionPayload {
  const toolCalls: SignedToolCall[] = [
    { toolCallId: 'call_A', name: 'Bash', argsHash: sha256(canonicalArgs({ command: 'aws s3 cp a b' })) },
    { toolCallId: 'call_B', name: 'Read', argsHash: sha256(canonicalArgs({ path: '/etc/hosts' })) },
  ];
  return {
    payloadType: 'model-decision',
    modelId: 'claude-opus-4',
    provider: 'anthropic',
    inputMessagesHash: sha256('input-messages'),
    outputContent: 'decided',
    timestamp: '2026-07-03T00:00:00.000Z',
    toolCalls,
    ...overrides,
  };
}

// The full required-signed-field set for a model-decision payload (AC-51 + §4.1a).
const MODEL_DECISION_SIGNED_FIELDS = [
  'payloadType',
  'modelId',
  'provider',
  'inputMessagesHash',
  'outputContent',
  'timestamp',
  'toolCalls',
];

describe('Milestone A — ModelDecisionPayload / SignedToolCall (AC-34, AC-51)', () => {
  it('AC-34: payload carries a signed toolCalls[] each with {toolCallId, name, argsHash}', () => {
    const kp = createKeyPair();
    const payload = makePayload();
    const env = signModelDecision(kp, payload);

    expect(Array.isArray(env.payload.toolCalls)).toBe(true);
    for (const tc of env.payload.toolCalls) {
      expect(typeof tc.toolCallId).toBe('string');
      expect(typeof tc.name).toBe('string');
      expect(tc.argsHash).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(verifyModelDecision(kp.publicKey, env)).toBe(true);
  });

  it('AC-51: payloadType constant is "model-decision" and is inside signedFields', () => {
    const kp = createKeyPair();
    const env = signModelDecision(kp, makePayload());
    expect(env.payload.payloadType).toBe('model-decision');
    expect(env.signedFields).toContain('payloadType');
  });

  it('AC-34/§4.1a: toolCalls and its sub-fields are covered by the signature', () => {
    const kp = createKeyPair();
    const env = signModelDecision(kp, makePayload());
    expect(env.signedFields).toEqual(expect.arrayContaining(MODEL_DECISION_SIGNED_FIELDS));

    // Tampering a tool call's argsHash after signing must break verification.
    env.payload.toolCalls[0].argsHash = sha256(canonicalArgs({ command: 'rm -rf /' }));
    expect(verifyModelDecision(kp.publicKey, env)).toBe(false);
  });

  it('AC-34: tampering a toolCallId after signing breaks verification', () => {
    const kp = createKeyPair();
    const env = signModelDecision(kp, makePayload());
    env.payload.toolCalls[1].toolCallId = 'call_forged';
    expect(verifyModelDecision(kp.publicKey, env)).toBe(false);
  });

  it('AC-34a: attestation binds each executing call by (toolCallId, argsHash)', () => {
    const kp = createKeyPair();
    const args = { command: 'aws s3 cp a b' };
    const env = signModelDecision(kp, makePayload());

    // The gate finds a SignedToolCall matching the executing toolCallId + argsHash.
    const match = env.payload.toolCalls.find((tc) => tc.toolCallId === 'call_A');
    expect(match).toBeDefined();
    expect(match!.argsHash).toBe(sha256(canonicalArgs(args)));
  });

  it('AC-34a: a matching toolCallId with a MISMATCHED argsHash does not satisfy the call', () => {
    const kp = createKeyPair();
    const env = signModelDecision(kp, makePayload());
    const match = env.payload.toolCalls.find((tc) => tc.toolCallId === 'call_A');
    // Different args than what was attested → hash differs → step unsatisfied.
    const otherArgsHash = sha256(canonicalArgs({ command: 'aws s3 rm x' }));
    expect(match!.argsHash).not.toBe(otherArgsHash);
  });

  it('AC-34a: no SignedToolCall for the executing call id → step unsatisfied (deny)', () => {
    const kp = createKeyPair();
    const env = signModelDecision(kp, makePayload());
    const match = env.payload.toolCalls.find((tc) => tc.toolCallId === 'call_ZZZ');
    expect(match).toBeUndefined();
  });

  it('AC-1: canonical form is stable regardless of payload key insertion order', () => {
    const kp = createKeyPair();
    const a = signModelDecision(kp, makePayload());
    // Same content, keys inserted in a different order.
    const reordered: ModelDecisionPayload = {
      toolCalls: makePayload().toolCalls,
      timestamp: '2026-07-03T00:00:00.000Z',
      outputContent: 'decided',
      inputMessagesHash: sha256('input-messages'),
      provider: 'anthropic',
      modelId: 'claude-opus-4',
      payloadType: 'model-decision',
    };
    // Under a's SAME meta, the reordered payload must still verify: the canonical
    // form deep-sorts keys, so insertion order is irrelevant to the signature.
    const reenv = { ...a, payload: reordered };
    expect(verifySignature(kp.publicKey, reenv)).toBe(true);
  });

  it('rejects verification under a different (wrong) key', () => {
    const kp1 = createKeyPair();
    const kp2 = createKeyPair();
    const env = signModelDecision(kp1, makePayload());
    expect(verifyModelDecision(kp2.publicKey, env)).toBe(false);
    expect(verifySignature(kp2.publicKey, env)).toBe(false);
  });

  it('AC-34: an attestation with an empty toolCalls[] cannot bind any tool call', () => {
    const kp = createKeyPair();
    const env = signModelDecision(kp, makePayload({ toolCalls: [] }));
    expect(env.payload.toolCalls.find((tc) => tc.toolCallId === 'call_A')).toBeUndefined();
  });
});
