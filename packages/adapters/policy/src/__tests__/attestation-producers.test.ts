/**
 * Milestone C — evidence producers integrated with the trust chain.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §6:
 *   - AC-11/AC-12/AC-34: the AUTHORITATIVE proxy producer signs a ModelDecisionPayload
 *     with a bound toolCalls[] that VERIFIES against the trusted store and SATISFIES a
 *     model-decision step for the exact executing tool call;
 *   - AC-34a: an attestation whose bound toolCalls[] does NOT match the executing
 *     {toolCallId, argsHash} is a denial (no replay within a turn);
 *   - AC-15/AC-39: the IN-PROCESS genty producer signs the same payload type but its
 *     trust root is a DIFFERENT `engine` root marked `producer:'in-process'`
 *     (correlation-grade). Presented where PROXY attestation is required (explicitly, or
 *     by the credentialScope DEFAULT of AC-39), it is REJECTED → deny;
 *   - AC-17: a policy step that explicitly requires proxy attestation rejects the
 *     in-process variant even for a non-credential action.
 *
 * These bind the Milestone-C PRODUCERS (signCompletionAttestation from the transport
 * attestation module; signInProcessModelDecision from genty-core) to the SHIPPED
 * Milestone-B evaluator, so a producer that mis-hashes or mis-marks its output is
 * caught by real evaluation, not a hand-rolled fake.
 *
 * Import paths are the intended Milestone-C module paths; resolution MAY fail until the
 * milestone lands (expected — no syntax errors). Adversarial cases MUST fail closed.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { SignedEnvelope, ModelDecisionPayload } from '@a5c-ai/genty-core/trust';

import { evaluatePolicy, type EvaluationContext, type Evidence } from '../policy-evaluator.js';
import { parsePolicyDocument } from '../policy-schema.js';
import { argsHash } from '../canonicalize-args.js';
import type { TrustRoot, TrustStore } from '../verify-envelope-trusted.js';

// Milestone-C producers (intended module paths).
import { signCompletionAttestation, type CompletionAttestationInput } from '@a5c-ai/transport-adapter/attestation';
import { signInProcessModelDecision, type InProcessAttestationInput } from '@a5c-ai/genty-core/trust/in-process-attestation';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

// ── Trust roots ──────────────────────────────────────────────────────────────

function humanRoot(kp: ReturnType<typeof createKeyPair>, label: string, extra: Partial<TrustRoot> = {}): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'human', publicKey: kp.publicKey, label, ...extra };
}
/** The AUTHORITATIVE proxy engine root (held outside the agent, AC-11/AC-39). */
function proxyRoot(kp: ReturnType<typeof createKeyPair>, label: string): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'engine', producer: 'proxy', publicKey: kp.publicKey, label };
}
/** The correlation-grade IN-PROCESS engine root (held inside the agent, AC-15/AC-39). */
function inProcessRoot(kp: ReturnType<typeof createKeyPair>, label: string): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'engine', producer: 'in-process', publicKey: kp.publicKey, label };
}

function humanApproval(kp: ReturnType<typeof createKeyPair>): SignedEnvelope<Record<string, unknown>> {
  const payload = {
    payloadType: 'human-approval',
    action: 'aws-prod-write',
    scope: 'aws:prod:s3',
    approvedBy: kp.fingerprint,
    approvedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  };
  return signPayload(kp.privateKey, kp.fingerprint, payload, [
    'payloadType', 'action', 'scope', 'approvedBy', 'approvedAt', 'expiresAt',
  ]);
}

// ── Producer inputs (both bind the SAME executing tool call: call_A) ──────────

const DELIVERED_ARGS = { command: 'aws s3 cp a b' };
const EXEC_ARGS_HASH = argsHash(DELIVERED_ARGS);

/** Wrap a ModelDecisionPayload envelope as generic policy `Evidence` (the gate does the same). */
function modelEvidence(env: SignedEnvelope<ModelDecisionPayload>): Evidence {
  return { kind: 'model-decision', envelope: env as unknown as SignedEnvelope<Record<string, unknown>> };
}

function proxyAttestation(kp: ReturnType<typeof createKeyPair>): SignedEnvelope<ModelDecisionPayload> {
  const inp: CompletionAttestationInput = {
    keyPair: kp,
    modelId: 'claude-opus-4-20250101',
    provider: 'anthropic',
    inputMessagesHash: sha256('[messages]'),
    requestId: 'req-1',
    result: {
      id: 'cmpl-1',
      model: 'claude-opus-4-20250101',
      role: 'assistant',
      text: '',
      finishReason: 'tool_use',
      usage: {} as never,
      toolCalls: [{ id: 'call_A', name: 'Bash', arguments: JSON.stringify(DELIVERED_ARGS) }],
    } as never,
  };
  return signCompletionAttestation(inp);
}

function inProcessAttestation(kp: ReturnType<typeof createKeyPair>): SignedEnvelope<ModelDecisionPayload> {
  const inp: InProcessAttestationInput = {
    keyPair: kp,
    modelId: 'claude-opus-4-20250101',
    provider: 'genty',
    inputMessagesHash: sha256('[messages]'),
    toolCalls: [{ id: 'call_A', name: 'Bash', arguments: DELIVERED_ARGS, rawArguments: JSON.stringify(DELIVERED_ARGS) }],
  };
  return signInProcessModelDecision(inp);
}

// ── Policy documents ──────────────────────────────────────────────────────────

/** A credential-touching action → requireProxyAttestation DEFAULTS to true (AC-39). */
function credentialDoc(aliceFp: string) {
  return parsePolicyDocument(`
version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: false
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 cp"] }
      credentialScope: "aws:prod:*"
    chains:
      - id: human-plus-opus
        requirements:
          - step: { kind: human-approval, trustedIdentities: ["${aliceFp}"], conditions: { scopeEquals: "aws:prod:s3", notExpired: true } }
          - step: { kind: model-decision, conditions: { modelIdMatches: "claude-opus-.*" } }
`);
}

/** A NON-credential action that EXPLICITLY requires proxy attestation (AC-17). */
function explicitProxyDoc() {
  return parsePolicyDocument(`
version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: true
actions:
  - id: opus-only
    requireProxyAttestation: true
    match:
      tool: "Bash"
    chains:
      - id: opus
        requirements:
          - step: { kind: model-decision, conditions: { modelIdMatches: "claude-opus-.*" } }
`);
}

function ctx(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    now: Date.now(),
    toolName: 'Bash',
    toolCallId: 'call_A',
    canonicalArgv: ['aws', 's3', 'cp', 'a', 'b'],
    args: DELIVERED_ARGS,
    argsHash: EXEC_ARGS_HASH,
    credentialScope: 'aws:prod:s3',
    configEpoch: 5,
    minEpochFloor: 5,
    ...overrides,
  } as EvaluationContext;
}

// ── AC-11/AC-12/AC-34 — proxy attestation satisfies the chain ─────────────────

describe('Milestone C — proxy producer satisfies a credential chain (AC-11/AC-12/AC-34)', () => {
  it('grants when the PROXY attestation binds the executing tool call', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), proxyRoot(proxy, 'proxy')] };

    const decision = evaluatePolicy({
      document: credentialDoc(alice.fingerprint),
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        modelEvidence(proxyAttestation(proxy)),
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(true);
    expect(decision.matchedChainId).toBe('human-plus-opus');
  });

  it('AC-34a: proxy attestation for call_A replayed onto sibling call_B → deny', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), proxyRoot(proxy, 'proxy')] };

    const decision = evaluatePolicy({
      document: credentialDoc(alice.fingerprint),
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        modelEvidence(proxyAttestation(proxy)), // binds call_A only
      ],
      // The gate is now executing a DIFFERENT sibling call in the same turn.
      context: ctx({ toolCallId: 'call_B' }),
    });
    expect(decision.granted).toBe(false);
  });
});

// ── AC-15/AC-39 — in-process producer rejected where proxy is required ────────

describe('Milestone C — in-process producer is correlation-grade, not proxy (AC-15/AC-39/AC-17)', () => {
  it('AC-39: in-process attestation for a CREDENTIAL action (proxy-default) → deny', () => {
    const alice = createKeyPair();
    const inproc = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), inProcessRoot(inproc, 'genty-inproc')] };

    const decision = evaluatePolicy({
      document: credentialDoc(alice.fingerprint), // credentialScope present → requireProxyAttestation defaults true
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        modelEvidence(inProcessAttestation(inproc)),
      ],
      context: ctx(),
    });
    // The in-process (agent-held) attestation cannot satisfy the proxy-default step.
    expect(decision.granted).toBe(false);
  });

  it('AC-17: in-process attestation for a NON-credential action with requireProxyAttestation:true → deny', () => {
    const inproc = createKeyPair();
    const store: TrustStore = { trustRoots: [inProcessRoot(inproc, 'genty-inproc')] };

    const decision = evaluatePolicy({
      document: explicitProxyDoc(),
      store,
      evidence: [modelEvidence(inProcessAttestation(inproc))],
      context: ctx({ credentialScope: '' }),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-39 opt-out: in-process attestation accepted only when the policy explicitly opts out', () => {
    // A non-credential action with the DEFAULT (requireProxyAttestation false) accepts
    // the in-process variant — the correlation-grade path is usable where the policy
    // author has NOT required proxy attestation.
    const inproc = createKeyPair();
    const store: TrustStore = { trustRoots: [inProcessRoot(inproc, 'genty-inproc')] };
    const doc = parsePolicyDocument(`
version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: true
actions:
  - id: opus-correlation
    match: { tool: "Bash" }
    chains:
      - id: opus
        requirements:
          - step: { kind: model-decision, conditions: { modelIdMatches: "claude-opus-.*" } }
`);
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [modelEvidence(inProcessAttestation(inproc))],
      context: ctx({ credentialScope: '' }),
    });
    expect(decision.granted).toBe(true);
    expect(decision.matchedChainId).toBe('opus');
  });
});
