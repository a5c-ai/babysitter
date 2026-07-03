/**
 * Milestone B — Authorization issuance (AC-9, AC-42) + carry-forward hardening.
 *
 * Frozen tests authored SOLELY from docs/design/proof-based-policy-enforcement.md §5
 * (AC-9 issuance rules, AC-42 evidence coverage of every required step) and §9 (the
 * issued authorization is configEpoch-bound, short-lived, and re-verifiable at a gate).
 *
 * On chain satisfaction the issuer mints a short-lived signed CommandAuthorization
 * (SignedEnvelope<CommandAuthorizationPayload>) binding the exact tool + toolCallId +
 * commandHash + argsHash + credentialScope + evidence fingerprints + evidence content
 * hashes + configEpoch + expiry. FAIL CLOSED: any verification error / expired key /
 * unknown fingerprint / condition miss / below-floor epoch → NO authorization.
 *
 * CARRY-FORWARD hardening asserted here (where it belongs — the B issuer/gate caller):
 *   - the issuer/gate caller MUST pass an explicit requiredStepCount (or fail closed)
 *     so AC-42 step-coverage is never silently skipped.
 *
 * The issued envelope is then re-verified via the Milestone-A verifyCommandAuthorization
 * to confirm it is well-formed and gate-acceptable — closing the issue→verify loop.
 *
 * These import the intended @a5c-ai/policy-adapter module paths the Milestone-B
 * implementation WILL provide; resolution may fail until then (expected).
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

import { issueCommandAuthorization, type IssueRequest, type IssueResult } from '../authorization-issuer.js';
import {
  verifyCommandAuthorization,
  type CommandAuthorizationPayload,
  type TrustRoot,
  type TrustStore,
} from '../verify-envelope-trusted.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const HUMAN_FIELDS = ['payloadType', 'action', 'scope', 'approvedBy', 'approvedAt', 'expiresAt'];
const MODEL_FIELDS = ['payloadType', 'modelId', 'provider', 'inputMessagesHash', 'outputContent', 'timestamp', 'toolCalls'];

function humanApproval(kp: ReturnType<typeof createKeyPair>, overrides: Record<string, unknown> = {}) {
  return signPayload(kp.privateKey, kp.fingerprint, {
    payloadType: 'human-approval',
    action: 'aws-prod-write',
    scope: 'aws:prod:s3',
    approvedBy: kp.fingerprint,
    approvedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    ...overrides,
  }, HUMAN_FIELDS);
}
function modelDecision(kp: ReturnType<typeof createKeyPair>, overrides: Record<string, unknown> = {}) {
  return signPayload(kp.privateKey, kp.fingerprint, {
    payloadType: 'model-decision',
    modelId: 'claude-opus-4-1',
    provider: 'anthropic',
    inputMessagesHash: sha256('input'),
    outputContent: 'tool-call',
    timestamp: new Date().toISOString(),
    toolCalls: [{ toolCallId: 'call_A', name: 'Bash', argsHash: sha256('{"command":"aws s3 cp a b"}') }],
    ...overrides,
  }, MODEL_FIELDS);
}

function humanRoot(kp: ReturnType<typeof createKeyPair>, label: string, extra: Partial<TrustRoot> = {}): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'human', publicKey: kp.publicKey, label, ...extra };
}
function engineRoot(kp: ReturnType<typeof createKeyPair>, label: string, extra: Partial<TrustRoot> = {}): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'engine', publicKey: kp.publicKey, label, ...extra };
}

const argsHashV = sha256('{"command":"aws s3 cp a b"}');
const commandHashV = sha256('aws|s3|cp|a|b');

function baseRequest(overrides: Partial<IssueRequest> = {}): IssueRequest {
  const alice = createKeyPair();
  const proxy = createKeyPair();
  const issuer = createKeyPair();
  const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), engineRoot(issuer, 'issuer')] };
  return {
    issuerKeyPair: issuer,
    store,
    policyId: 'aws-prod-write',
    policyDocHash: sha256('policy-doc-bytes'),
    matchedChainId: 'human-plus-opus',
    configEpoch: 5,
    minEpochFloor: 5,
    toolName: 'Bash',
    toolCallId: 'call_A',
    commandHash: commandHashV,
    argsHash: argsHashV,
    credentialScope: 'aws:prod:s3',
    authorizationTtlSeconds: 120,
    // The exact evidence per REQUIRED step, plus the explicit requiredStepCount.
    requiredStepCount: 2,
    evidenceUsed: [
      { kind: 'human-approval', envelope: humanApproval(alice), stepIndex: 0 },
      { kind: 'model-decision', envelope: modelDecision(proxy), stepIndex: 1 },
    ],
    ...overrides,
  } as IssueRequest;
}

describe('Milestone B — authorization issuance (AC-9)', () => {
  it('AC-9: issues a short-lived signed CommandAuthorization when the chain is satisfied', () => {
    const req = baseRequest();
    const result: IssueResult = issueCommandAuthorization(req);
    expect(result.issued).toBe(true);
    const env = result.authorization as SignedEnvelope<CommandAuthorizationPayload>;
    expect(env.payload.payloadType).toBe('command-authorization');
    expect(env.payload.toolCallId).toBe('call_A');
    expect(env.payload.configEpoch).toBe(5);
    // Short-lived: expiresAt = issuedAt + ttl.
    const ttlMs = new Date(env.payload.expiresAt).getTime() - new Date(env.payload.issuedAt).getTime();
    expect(ttlMs).toBe(120_000);
  });

  it('AC-9/AC-42: the issued authorization binds evidence content hashes (not just fingerprints)', () => {
    const req = baseRequest();
    const result = issueCommandAuthorization(req);
    const env = result.authorization as SignedEnvelope<CommandAuthorizationPayload>;
    // One binding per required step, each with an envelopeHash present in evidenceEnvelopeHashes.
    expect(env.payload.evidenceStepBindings).toHaveLength(2);
    for (const b of env.payload.evidenceStepBindings) {
      expect(env.payload.evidenceEnvelopeHashes).toContain(b.envelopeHash);
    }
  });

  it('AC-9 → gate: the issued authorization re-verifies at a gate via verifyCommandAuthorization', () => {
    const req = baseRequest();
    const result = issueCommandAuthorization(req);
    const env = result.authorization as SignedEnvelope<CommandAuthorizationPayload>;
    const issuerRoot = req.store.trustRoots.find((r) => r.label === 'issuer')!;
    const res = verifyCommandAuthorization(env, {
      now: Date.now(),
      toolName: 'Bash',
      toolCallId: 'call_A',
      commandHash: commandHashV,
      argsHash: argsHashV,
      credentialScope: 'aws:prod:s3',
      policyDocHash: sha256('policy-doc-bytes'),
      currentConfigEpoch: 5,
      minEpochFloor: 5,
      issuerRoots: [issuerRoot],
      requiredStepCount: 2,
    });
    expect(res.valid).toBe(true);
  });
});

describe('Milestone B — issuance fails closed (AC-9 fail-closed)', () => {
  it('AC-42 carry-forward: an ABSENT requiredStepCount → fail closed (never silently skip step-coverage)', () => {
    // The issuer/gate caller MUST pass an explicit requiredStepCount or fail closed.
    const req = baseRequest({ requiredStepCount: undefined as unknown as number });
    const result = issueCommandAuthorization(req);
    expect(result.issued).toBe(false);
  });

  it('AC-42: fewer bound evidences than requiredStepCount → no authorization', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const req = baseRequest({
      requiredStepCount: 2,
      // Only one step bound, but two required.
      evidenceUsed: [{ kind: 'human-approval', envelope: humanApproval(alice), stepIndex: 0 }],
      store: { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy')] },
    });
    const result = issueCommandAuthorization(req);
    expect(result.issued).toBe(false);
  });

  it('AC-9: an evidence envelope that does NOT verify against the trusted store → no authorization', () => {
    const rogue = createKeyPair(); // unregistered human
    const proxy = createKeyPair();
    const issuer = createKeyPair();
    const req = baseRequest({
      store: { trustRoots: [engineRoot(proxy, 'proxy'), engineRoot(issuer, 'issuer')] }, // rogue not registered
      issuerKeyPair: issuer,
      evidenceUsed: [
        { kind: 'human-approval', envelope: humanApproval(rogue), stepIndex: 0 },
        { kind: 'model-decision', envelope: modelDecision(proxy), stepIndex: 1 },
      ],
    });
    const result = issueCommandAuthorization(req);
    expect(result.issued).toBe(false);
  });

  it('AC-47: a below-floor configEpoch → no authorization (anti-rollback at issue time)', () => {
    const req = baseRequest({ configEpoch: 3, minEpochFloor: 5 });
    const result = issueCommandAuthorization(req);
    expect(result.issued).toBe(false);
  });

  it('any exception during issuance is a denial, never a pass (fail closed)', () => {
    const result = issueCommandAuthorization(null as never);
    expect(result.issued).toBe(false);
  });
});

// ── Carry-forward hardening: the evaluator/issuer MUST reject a non-delegation
// "valid set" as a proven delegation, confirm the terminal identity, and reject
// empty/single-link chains where a delegation is required. These belong in the B
// consumer that calls the Milestone-A trust-chain verifier.
describe('Milestone B — delegation carry-forward hardening (evaluator/issuer consumer)', () => {
  const DELEGATION_FIELDS = ['payloadType', 'delegatorFingerprint', 'delegatorSignature', 'delegatedAt'];
  function signDelegation(kp: ReturnType<typeof createKeyPair>, overrides: Record<string, unknown> = {}) {
    return signPayload(kp.privateKey, kp.fingerprint, {
      payloadType: 'delegation',
      delegatorFingerprint: 'fp-root',
      delegatorSignature: 'root-sig',
      delegatedAt: '2026-07-03T00:00:00.000Z',
      ...overrides,
    }, DELEGATION_FIELDS);
  }
  function agentRoot(kp: ReturnType<typeof createKeyPair>, label: string, extra: Partial<TrustRoot> = {}): TrustRoot {
    return { fingerprint: kp.fingerprint, kind: 'agent', publicKey: kp.publicKey, label, ...extra };
  }

  const DELEG_DOC = `
version: 1
actions:
  - id: delegated-action
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 rm"] }
      credentialScope: "aws:prod:*"
    chains:
      - id: requires-delegation
        requirements:
          - step:
              kind: delegation
              trustedIdentities: []
              conditions: { requiresDelegation: true, expectedDelegatee: "__DELEGATEE_FP__" }
`;

  it('rejects an EMPTY / single-link non-delegation chain where a delegation is required', async () => {
    const { parsePolicyDocument } = await import('../policy-schema.js');
    const { evaluatePolicy } = await import('../policy-evaluator.js');
    const a = createKeyPair();
    const store: TrustStore = { trustRoots: [agentRoot(a, 'a')] };
    const doc = parsePolicyDocument(DELEG_DOC.replaceAll('__DELEGATEE_FP__', a.fingerprint));

    // A single independent link with no delegation relationship must NOT satisfy a
    // step that requires an actual delegation.
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [{ kind: 'delegation', envelope: signDelegation(a, { delegatorFingerprint: 'fp-unrelated' }) }],
      context: {
        now: Date.now(),
        toolName: 'Bash',
        toolCallId: 'call_A',
        canonicalArgv: ['aws', 's3', 'rm', 'x'],
        args: { command: 'aws s3 rm x' },
        argsHash: sha256('{"command":"aws s3 rm x"}'),
        credentialScope: 'aws:prod:s3',
        configEpoch: 5,
        minEpochFloor: 5,
      } as never,
    });
    expect(decision.granted).toBe(false);
  });

  it('confirms the chain terminal identity equals the expected delegatee (else deny)', async () => {
    const { parsePolicyDocument } = await import('../policy-schema.js');
    const { evaluatePolicy } = await import('../policy-evaluator.js');
    const a = createKeyPair();
    const b = createKeyPair();
    const wrongDelegatee = createKeyPair();
    const store: TrustStore = { trustRoots: [agentRoot(a, 'a'), agentRoot(b, 'b')] };
    // Policy expects the terminal identity to be `wrongDelegatee`, but the chain ends at b.
    const doc = parsePolicyDocument(DELEG_DOC.replaceAll('__DELEGATEE_FP__', wrongDelegatee.fingerprint));

    const linkA = signDelegation(a, { delegatorFingerprint: 'fp-root', delegatorSignature: 'root-sig' });
    const linkB = signDelegation(b, { delegatorFingerprint: a.fingerprint, delegatorSignature: linkA.signature });

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'delegation', envelope: linkA },
        { kind: 'delegation', envelope: linkB },
      ],
      context: {
        now: Date.now(),
        toolName: 'Bash',
        toolCallId: 'call_A',
        canonicalArgv: ['aws', 's3', 'rm', 'x'],
        args: { command: 'aws s3 rm x' },
        argsHash: sha256('{"command":"aws s3 rm x"}'),
        credentialScope: 'aws:prod:s3',
        configEpoch: 5,
        minEpochFloor: 5,
      } as never,
    });
    // Terminal identity (b) != expected delegatee (wrongDelegatee) → deny.
    expect(decision.granted).toBe(false);
  });
});
