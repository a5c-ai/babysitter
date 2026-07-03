/**
 * Milestone B — Trust-chain evaluator (AC-9, AC-19a, AC-20, AC-41, AC-41a, AC-42) +
 * condition operators (AC-22).
 *
 * Frozen tests authored SOLELY from docs/design/proof-based-policy-enforcement.md §5
 * (AC-9 issuance precondition), §7 (schema semantics: OR across chains AND across
 * steps; conditions vocabulary incl. modelIdMatches/tags/notExpired; quorum
 * distinct-holder AC-41; heterogeneous composition AC-41a; AC-42 coverage) and §9
 * (AC-20 evaluation semantics, deny > grant precedence).
 *
 * The evaluator, given a SignedEnvelope evidence set, MUST:
 *   - verify EVERY signature via the Milestone-A verifyEnvelopeTrusted / trust-chain,
 *   - verify chain linkage, evaluate conditions,
 *   - produce an auditable PolicyDecision { granted, matchedChainId?, reason, evidenceUsed },
 *   - grant on the FIRST fully-satisfied chain (AC-19a),
 *   - FAIL CLOSED on any verification error / expired key / unknown fingerprint /
 *     condition miss / below-floor epoch.
 *
 * BOTH the aws-cli human+opus chain AND a 2-human quorum chain must evaluate correctly
 * WITHOUT code changes; and a single heterogeneous chain (human+opus AND 2-human-quorum,
 * AC-41a) must be satisfiable.
 *
 * These import the intended @a5c-ai/policy-adapter module paths the Milestone-B
 * implementation WILL provide; resolution may fail until then (expected).
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

import { evaluatePolicy, type PolicyDecision, type EvaluationContext } from '../policy-evaluator.js';
import { parsePolicyDocument } from '../policy-schema.js';
import type { TrustRoot, TrustStore } from '../verify-envelope-trusted.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

// ── Evidence builders (Milestone-A envelope shapes) ─────────────────────────

const HUMAN_FIELDS = ['payloadType', 'action', 'scope', 'approvedBy', 'approvedAt', 'expiresAt'];
const MODEL_FIELDS = ['payloadType', 'modelId', 'provider', 'inputMessagesHash', 'outputContent', 'timestamp', 'toolCalls'];

function humanApproval(
  kp: ReturnType<typeof createKeyPair>,
  overrides: Record<string, unknown> = {},
): SignedEnvelope<Record<string, unknown>> {
  const payload = {
    payloadType: 'human-approval',
    action: 'aws-prod-write',
    scope: 'aws:prod:s3',
    approvedBy: kp.fingerprint,
    approvedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    ...overrides,
  };
  return signPayload(kp.privateKey, kp.fingerprint, payload, HUMAN_FIELDS);
}

function modelDecision(
  kp: ReturnType<typeof createKeyPair>,
  overrides: Record<string, unknown> = {},
): SignedEnvelope<Record<string, unknown>> {
  const payload = {
    payloadType: 'model-decision',
    modelId: 'claude-opus-4-1',
    provider: 'anthropic',
    inputMessagesHash: sha256('input'),
    outputContent: 'tool-call',
    timestamp: new Date().toISOString(),
    toolCalls: [{ toolCallId: 'call_A', name: 'Bash', argsHash: sha256('{"command":"aws s3 cp a b"}') }],
    ...overrides,
  };
  return signPayload(kp.privateKey, kp.fingerprint, payload, MODEL_FIELDS);
}

function humanRoot(kp: ReturnType<typeof createKeyPair>, label: string, extra: Partial<TrustRoot> = {}): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'human', publicKey: kp.publicKey, label, ...extra };
}
function engineRoot(kp: ReturnType<typeof createKeyPair>, label: string, extra: Partial<TrustRoot> = {}): TrustRoot {
  return { fingerprint: kp.fingerprint, kind: 'engine', publicKey: kp.publicKey, label, ...extra };
}

// ── Policy documents ────────────────────────────────────────────────────────

const AWS_DOC = `
version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: false
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 cp", "s3 rm", "s3 sync"] }
      credentialScope: "aws:prod:*"
    chains:
      - id: human-plus-opus
        requirements:
          - step:
              kind: human-approval
              trustedIdentities: ["__ALICE_FP__"]
              conditions: { scopeEquals: "aws:prod:s3", notExpired: true }
          - step:
              kind: model-decision
              conditions: { modelIdMatches: "claude-opus-.*" }
      - id: two-human-quorum
        requirements:
          - quorum: { of: human-approval, min: 2, trustedIdentities: ["__ALICE_FP__", "__BOB_FP__"] }
`;

/** Build the aws policy with concrete allowed fingerprints substituted in. */
function awsDoc(aliceFp: string, bobFp: string) {
  return parsePolicyDocument(
    AWS_DOC.replaceAll('__ALICE_FP__', aliceFp).replaceAll('__BOB_FP__', bobFp),
  );
}

function ctx(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    now: Date.now(),
    toolName: 'Bash',
    toolCallId: 'call_A',
    canonicalArgv: ['aws', 's3', 'cp', 'a', 'b'],
    args: { command: 'aws s3 cp a b' },
    argsHash: sha256('{"command":"aws s3 cp a b"}'),
    credentialScope: 'aws:prod:s3',
    configEpoch: 5,
    minEpochFloor: 5,
    ...overrides,
  } as EvaluationContext;
}

describe('Milestone B — evaluator: aws-cli human+opus chain (AC-9, AC-19a, AC-20)', () => {
  it('grants when a valid human approval AND a valid opus model-decision satisfy the first chain', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision: PolicyDecision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        { kind: 'model-decision', envelope: modelDecision(proxy) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(true);
    expect(decision.matchedChainId).toBe('human-plus-opus');
    expect(decision.evidenceUsed.length).toBe(2);
  });

  it('AC-30: wrong model (sonnet, not opus) → condition miss → deny', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        { kind: 'model-decision', envelope: modelDecision(proxy, { modelId: 'claude-sonnet-4-5' }) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-29: an approval for a DIFFERENT scope does not satisfy scopeEquals → deny', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice, { scope: 'aws:dev:s3' }) },
        { kind: 'model-decision', envelope: modelDecision(proxy) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-42: missing a required chain step (no model-decision) → deny (no silent skip)', () => {
    const alice = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [{ kind: 'human-approval', envelope: humanApproval(alice) }],
      context: ctx(),
    });
    // Neither chain fully satisfied: human-plus-opus lacks model-decision, quorum lacks 2 humans.
    expect(decision.granted).toBe(false);
  });

  it('AC-28: an approval signed by an UNKNOWN fingerprint (not in store) → deny', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const rogue = createKeyPair(); // never registered
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(rogue) },
        { kind: 'model-decision', envelope: modelDecision(proxy) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-31: an expired human evidence (notExpired condition) → deny', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice, { expiresAt: new Date(Date.now() - 1000).toISOString() }) },
        { kind: 'model-decision', envelope: modelDecision(proxy) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-31: a REVOKED human root → deny', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice', { revoked: true }), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        { kind: 'model-decision', envelope: modelDecision(proxy) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-51: a model-decision envelope presented for the human-approval step (wrong kind/payloadType) → deny', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        // A model-decision envelope relabeled as human-approval on the wrapper.
        { kind: 'human-approval', envelope: modelDecision(proxy) },
        { kind: 'model-decision', envelope: modelDecision(proxy) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });
});

describe('Milestone B — evaluator: 2-human quorum chain (AC-41 distinct-holder)', () => {
  it('grants the quorum chain with 2 DISTINCT human identities', () => {
    const alice = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice, { approvedBy: alice.fingerprint }) },
        { kind: 'human-approval', envelope: humanApproval(bob, { approvedBy: bob.fingerprint }) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(true);
    expect(decision.matchedChainId).toBe('two-human-quorum');
  });

  it('AC-41: quorum satisfied by ONE human holding TWO keys → deny (distinct identities required)', () => {
    // Alice holds two keys; both approvals resolve to the SAME underlying identity.
    const aliceKey1 = createKeyPair();
    const aliceKey2 = createKeyPair();
    const store: TrustStore = {
      trustRoots: [
        // Both roots resolve to the same human identity "alice" (approvedBy / label).
        humanRoot(aliceKey1, 'alice'),
        humanRoot(aliceKey2, 'alice'),
      ],
    };
    const doc = awsDoc(aliceKey1.fingerprint, aliceKey2.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(aliceKey1, { approvedBy: 'alice' }) },
        { kind: 'human-approval', envelope: humanApproval(aliceKey2, { approvedBy: 'alice' }) },
      ],
      context: ctx(),
    });
    // Two distinct KEYS but ONE identity → quorum of 2 distinct humans NOT met.
    expect(decision.granted).toBe(false);
  });

  it('AC-41: only ONE approval present → quorum min:2 unmet → deny', () => {
    const alice = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [{ kind: 'human-approval', envelope: humanApproval(alice, { approvedBy: alice.fingerprint }) }],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });
});

describe('Milestone B — evaluator: heterogeneous chain composition (AC-41a)', () => {
  const HETERO_DOC = `
version: 1
actions:
  - id: aws-prod-write-hardened
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 rm"] }
      credentialScope: "aws:prod:*"
    chains:
      - id: opus-and-quorum
        requirements:
          - step: { kind: human-approval, trustedIdentities: ["__ALICE_FP__"], conditions: { scopeEquals: "aws:prod:s3" } }
          - step: { kind: model-decision, conditions: { modelIdMatches: "claude-opus-.*" } }
          - quorum: { of: human-approval, min: 2, trustedIdentities: ["__BOB_FP__", "__CAROL_FP__"] }
`;

  it('AC-41a: ONE chain requiring human+opus AND a 2-human quorum is satisfied by all three AND-ed requirements', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const carol = createKeyPair();
    const store: TrustStore = {
      trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob'), humanRoot(carol, 'carol')],
    };
    const doc = parsePolicyDocument(
      HETERO_DOC.replaceAll('__ALICE_FP__', alice.fingerprint)
        .replaceAll('__BOB_FP__', bob.fingerprint)
        .replaceAll('__CAROL_FP__', carol.fingerprint),
    );

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice, { approvedBy: alice.fingerprint }) },
        { kind: 'model-decision', envelope: modelDecision(proxy, { toolCalls: [{ toolCallId: 'call_A', name: 'Bash', argsHash: sha256('{"command":"aws s3 rm x"}') }] }) },
        { kind: 'human-approval', envelope: humanApproval(bob, { approvedBy: bob.fingerprint }) },
        { kind: 'human-approval', envelope: humanApproval(carol, { approvedBy: carol.fingerprint }) },
      ],
      context: ctx({
        canonicalArgv: ['aws', 's3', 'rm', 'x'],
        args: { command: 'aws s3 rm x' },
        argsHash: sha256('{"command":"aws s3 rm x"}'),
      }),
    });
    expect(decision.granted).toBe(true);
    expect(decision.matchedChainId).toBe('opus-and-quorum');
  });

  it('AC-41a: heterogeneous chain with the quorum short by one distinct human → deny', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const carol = createKeyPair();
    const store: TrustStore = {
      trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob'), humanRoot(carol, 'carol')],
    };
    const doc = parsePolicyDocument(
      HETERO_DOC.replaceAll('__ALICE_FP__', alice.fingerprint)
        .replaceAll('__BOB_FP__', bob.fingerprint)
        .replaceAll('__CAROL_FP__', carol.fingerprint),
    );

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice, { approvedBy: alice.fingerprint }) },
        { kind: 'model-decision', envelope: modelDecision(proxy, { toolCalls: [{ toolCallId: 'call_A', name: 'Bash', argsHash: sha256('{"command":"aws s3 rm x"}') }] }) },
        // Only ONE quorum contributor (bob); carol missing → quorum min:2 unmet.
        { kind: 'human-approval', envelope: humanApproval(bob, { approvedBy: bob.fingerprint }) },
      ],
      context: ctx({
        canonicalArgv: ['aws', 's3', 'rm', 'x'],
        args: { command: 'aws s3 rm x' },
        argsHash: sha256('{"command":"aws s3 rm x"}'),
      }),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-41a: an evidence envelope MUST NOT be counted toward more than one requirement (no double-use)', () => {
    // Alice's SINGLE approval cannot satisfy BOTH the typed human-approval step AND
    // count as a quorum contributor. With only alice + bob (two humans total) and the
    // typed step consuming alice, the quorum has only bob left → min:2 unmet → deny.
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = {
      trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')],
    };
    const doc = parsePolicyDocument(
      HETERO_DOC.replaceAll('__ALICE_FP__', alice.fingerprint)
        .replaceAll('__BOB_FP__', alice.fingerprint) // quorum also allows alice
        .replaceAll('__CAROL_FP__', bob.fingerprint),
    );

    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice, { approvedBy: alice.fingerprint }) },
        { kind: 'model-decision', envelope: modelDecision(proxy, { toolCalls: [{ toolCallId: 'call_A', name: 'Bash', argsHash: sha256('{"command":"aws s3 rm x"}') }] }) },
        { kind: 'human-approval', envelope: humanApproval(bob, { approvedBy: bob.fingerprint }) },
      ],
      context: ctx({
        canonicalArgv: ['aws', 's3', 'rm', 'x'],
        args: { command: 'aws s3 rm x' },
        argsHash: sha256('{"command":"aws s3 rm x"}'),
      }),
    });
    // alice used for the typed step; only bob remains for the quorum → deny.
    expect(decision.granted).toBe(false);
  });
});

describe('Milestone B — evaluator: precedence + fail-closed (AC-20)', () => {
  it('AC-20: an explicit deny action wins over a grant (deny > grant > default)', () => {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')] };
    const denyDoc = parsePolicyDocument(`
version: 1
actions:
  - id: aws-prod-deny
    effect: deny
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 rm"] }
      credentialScope: "aws:prod:*"
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 rm"] }
      credentialScope: "aws:prod:*"
    chains:
      - id: human-plus-opus
        requirements:
          - step: { kind: human-approval, trustedIdentities: ["${alice.fingerprint}"] }
          - step: { kind: model-decision, conditions: { modelIdMatches: "claude-opus-.*" } }
`);
    const decision = evaluatePolicy({
      document: denyDoc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        { kind: 'model-decision', envelope: modelDecision(proxy, { toolCalls: [{ toolCallId: 'call_A', name: 'Bash', argsHash: sha256('{"command":"aws s3 rm x"}') }] }) },
      ],
      context: ctx({ canonicalArgv: ['aws', 's3', 'rm', 'x'], args: { command: 'aws s3 rm x' }, argsHash: sha256('{"command":"aws s3 rm x"}') }),
    });
    expect(decision.granted).toBe(false);
  });

  it('any exception during evaluation is a denial, never a pass (fail closed)', () => {
    // A malformed evaluation input must deny, not throw through.
    const decision = evaluatePolicy(null as never);
    expect(decision.granted).toBe(false);
  });
});
