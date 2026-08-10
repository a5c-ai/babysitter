/**
 * Milestone E — PRODUCTION authorization store (ALLOW path, §5 / AC-9 / AC-49).
 *
 * Proves the ALLOW-path production seam: on a satisfied policy grant the store issues a
 * real CommandAuthorization (via the shipped issueFromDecision) and makes it resolvable by
 * the exact executing tool-call id — exactly what the orchestrator threads into the gate's
 * AuthorizationResolver. And it stays FAIL CLOSED: a non-granted decision stores nothing,
 * a lookup for a different tool-call id resolves nothing, and an expired authorization is
 * not returned.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload, signModelDecision } from '@a5c-ai/trust-core';
import type { IdentityKeyPair, SignedEnvelope } from '@a5c-ai/trust-core';

import {
  createAuthorizationStore,
  evaluatePolicy,
  parsePolicyDocument,
  argsHash as computeArgsHash,
  canonicalizeArgv,
  type Evidence,
  type EvaluationContext,
  type TrustRoot,
  type TrustStore,
} from '../index.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const TOOL = 'Bash';
const COMMAND = 'aws s3 rm s3://prod-bucket/secret';
const INPUT = { command: COMMAND };
const TOOL_CALL_ID = 'call_aws_rm';
const CRED_SCOPE_GLOB = 'aws:prod:*';
const HUMAN_SCOPE = 'aws:prod:s3';
const OPUS_MODEL = 'claude-opus-4-8';

const HUMAN_SIGNED_FIELDS = ['payloadType', 'action', 'scope', 'approvedBy', 'approvedAt', 'expiresAt'];

interface Keys {
  issuer: IdentityKeyPair;
  proxyEngine: IdentityKeyPair;
  alice: IdentityKeyPair;
}

function freshKeys(): Keys {
  return { issuer: createKeyPair(), proxyEngine: createKeyPair(), alice: createKeyPair() };
}

function trustRootsFor(keys: Keys): TrustRoot[] {
  return [
    { fingerprint: keys.alice.fingerprint, kind: 'human', identityId: 'sre-oncall:alice', label: 'role:sre-oncall', publicKey: keys.alice.publicKey },
    { fingerprint: keys.proxyEngine.fingerprint, kind: 'engine', producer: 'proxy', label: 'transport-proxy', publicKey: keys.proxyEngine.publicKey },
    { fingerprint: keys.issuer.fingerprint, kind: 'engine', label: 'policy-adapter-issuer', publicKey: keys.issuer.publicKey },
  ];
}

function signHumanApproval(kp: IdentityKeyPair): SignedEnvelope<Record<string, unknown>> {
  return signPayload(
    kp.privateKey,
    kp.fingerprint,
    {
      payloadType: 'human-approval',
      action: 'aws-prod-write',
      scope: HUMAN_SCOPE,
      approvedBy: 'alice',
      approvedAt: '2026-07-03T00:00:00.000Z',
      expiresAt: '2999-01-01T00:00:00.000Z',
    },
    HUMAN_SIGNED_FIELDS,
  ) as SignedEnvelope<Record<string, unknown>>;
}

function signModelAttestation(kp: IdentityKeyPair, toolCallId = TOOL_CALL_ID): SignedEnvelope<Record<string, unknown>> {
  return signModelDecision(kp, {
    payloadType: 'model-decision',
    modelId: OPUS_MODEL,
    provider: 'anthropic',
    inputMessagesHash: sha256('input-messages'),
    outputContent: 'tool_use aws s3 rm',
    timestamp: '2026-07-03T00:00:00.000Z',
    toolCalls: [{ toolCallId, name: TOOL, argsHash: computeArgsHash(INPUT) }],
  }) as unknown as SignedEnvelope<Record<string, unknown>>;
}

function policyYaml(keys: Keys): string {
  return `version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: false
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv:
        program: "aws"
        subcommandEquals: ["s3 cp", "s3 rm", "s3 sync"]
        recognizedPrograms: ["aws"]
      credentialScope: "${CRED_SCOPE_GLOB}"
    chains:
      - id: human-plus-opus
        requirements:
          - step:
              kind: human-approval
              trustedIdentities: ["${keys.alice.fingerprint}"]
              conditions:
                scopeEquals: "${HUMAN_SCOPE}"
                notExpired: true
          - step:
              kind: model-decision
              conditions:
                modelIdMatches: "claude-opus-.*"
`;
}

function ctx(over: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    now: Date.now(),
    toolName: TOOL,
    toolCallId: TOOL_CALL_ID,
    canonicalArgv: canonicalizeArgv(COMMAND),
    args: INPUT,
    argsHash: computeArgsHash(INPUT),
    credentialScope: CRED_SCOPE_GLOB,
    configEpoch: 5,
    minEpochFloor: 5,
    rawCommand: COMMAND,
    ...over,
  };
}

describe('Milestone E — production authorization store (ALLOW path)', () => {
  it('ALLOW: a satisfied grant issues + resolves by the exact executing tool-call id', () => {
    const keys = freshKeys();
    const store: TrustStore = { trustRoots: trustRootsFor(keys) };
    const doc = parsePolicyDocument(policyYaml(keys));
    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(keys.alice) },
      { kind: 'model-decision', envelope: signModelAttestation(keys.proxyEngine) },
    ];
    const context = ctx();
    const decision = evaluatePolicy({ document: doc, store, evidence, context });
    expect(decision.granted).toBe(true);

    const authStore = createAuthorizationStore();
    const res = authStore.insertFromDecision({
      decision,
      context,
      issuerKeyPair: keys.issuer,
      store,
      policyDocHash: sha256(policyYaml(keys)),
      authorizationTtlSeconds: 120,
    });
    expect(res.inserted).toBe(true);
    expect(authStore.size()).toBe(1);

    // The gate resolves the issued authorization by the exact executing tool-call id.
    const resolved = authStore.resolver({ toolName: TOOL, toolCallId: TOOL_CALL_ID, sessionId: undefined, runId: undefined });
    expect(resolved).toBeDefined();
    expect(resolved!.payload.toolCallId).toBe(TOOL_CALL_ID);
  });

  it('FAIL CLOSED: a non-granted decision stores nothing → resolver yields undefined', () => {
    const keys = freshKeys();
    const store: TrustStore = { trustRoots: trustRootsFor(keys) };
    const doc = parsePolicyDocument(policyYaml(keys));
    // Only a human approval — the opus model-decision step is unsatisfied → not granted.
    const evidence: Evidence[] = [{ kind: 'human-approval', envelope: signHumanApproval(keys.alice) }];
    const context = ctx();
    const decision = evaluatePolicy({ document: doc, store, evidence, context });
    expect(decision.granted).toBe(false);

    const authStore = createAuthorizationStore();
    const res = authStore.insertFromDecision({
      decision,
      context,
      issuerKeyPair: keys.issuer,
      store,
      policyDocHash: sha256(policyYaml(keys)),
      authorizationTtlSeconds: 120,
    });
    expect(res.inserted).toBe(false);
    expect(authStore.size()).toBe(0);
    expect(authStore.resolver({ toolName: TOOL, toolCallId: TOOL_CALL_ID, sessionId: undefined, runId: undefined })).toBeUndefined();
  });

  it('FAIL CLOSED: resolver yields nothing for a DIFFERENT tool-call id (no cross-call reuse)', () => {
    const keys = freshKeys();
    const store: TrustStore = { trustRoots: trustRootsFor(keys) };
    const doc = parsePolicyDocument(policyYaml(keys));
    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(keys.alice) },
      { kind: 'model-decision', envelope: signModelAttestation(keys.proxyEngine) },
    ];
    const context = ctx();
    const decision = evaluatePolicy({ document: doc, store, evidence, context });
    const authStore = createAuthorizationStore();
    authStore.insertFromDecision({
      decision,
      context,
      issuerKeyPair: keys.issuer,
      store,
      policyDocHash: sha256(policyYaml(keys)),
      authorizationTtlSeconds: 120,
    });
    expect(authStore.resolver({ toolName: TOOL, toolCallId: 'call_sibling', sessionId: undefined, runId: undefined })).toBeUndefined();
  });

  it('FAIL CLOSED: an EXPIRED authorization is not returned', async () => {
    const keys = freshKeys();
    const store: TrustStore = { trustRoots: trustRootsFor(keys) };
    const doc = parsePolicyDocument(policyYaml(keys));
    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(keys.alice) },
      { kind: 'model-decision', envelope: signModelAttestation(keys.proxyEngine) },
    ];
    const context = ctx();
    const decision = evaluatePolicy({ document: doc, store, evidence, context });
    const authStore = createAuthorizationStore();
    // TTL of 0 seconds → expires immediately.
    authStore.insertFromDecision({
      decision,
      context,
      issuerKeyPair: keys.issuer,
      store,
      policyDocHash: sha256(policyYaml(keys)),
      authorizationTtlSeconds: 0,
    });
    // Wait past the expiry boundary.
    await new Promise((r) => setTimeout(r, 5));
    expect(authStore.resolver({ toolName: TOOL, toolCallId: TOOL_CALL_ID, sessionId: undefined, runId: undefined })).toBeUndefined();
  });
});
