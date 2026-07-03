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
  // These fixtures register the authoritative PROXY attestation key. AC-39 defaults
  // requireProxyAttestation to TRUE for the credentialScope-touching aws action, so the
  // engine root must be marked `producer:'proxy'` for a valid, correct fixture.
  return { fingerprint: kp.fingerprint, kind: 'engine', producer: 'proxy', publicKey: kp.publicKey, label, ...extra };
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

// ── Defect 1: model-decision MUST be bound to the executing tool call (AC-34a/AC-30) ──
describe('Milestone B — model-decision tool-call binding (AC-34a / AC-30 replay-within-turn)', () => {
  function setup() {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy'), humanRoot(bob, 'bob')] };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);
    return { alice, proxy, bob, store, doc };
  }

  it('grants when the attestation binds THIS executing toolCallId + argsHash (correct binding)', () => {
    const { alice, proxy, store, doc } = setup();
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        { kind: 'model-decision', envelope: modelDecision(proxy) },
      ],
      context: ctx(), // toolCallId call_A + argsHash for `aws s3 cp a b` — matches the attestation
    });
    expect(decision.granted).toBe(true);
    expect(decision.matchedChainId).toBe('human-plus-opus');
  });

  it('AC-34a: attestation for a DIFFERENT toolCallId (sibling call in the same turn) → deny', () => {
    const { alice, proxy, store, doc } = setup();
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        // Attestation binds call_B, but the executing call is call_A → replay to a sibling.
        {
          kind: 'model-decision',
          envelope: modelDecision(proxy, {
            toolCalls: [{ toolCallId: 'call_B', name: 'Bash', argsHash: sha256('{"command":"aws s3 cp a b"}') }],
          }),
        },
      ],
      context: ctx({ toolCallId: 'call_A' }),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-34a: attestation with the right toolCallId but a MISMATCHED argsHash → deny', () => {
    const { alice, proxy, store, doc } = setup();
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        {
          kind: 'model-decision',
          envelope: modelDecision(proxy, {
            toolCalls: [{ toolCallId: 'call_A', name: 'Bash', argsHash: sha256('{"command":"aws s3 rm OTHER"}') }],
          }),
        },
      ],
      context: ctx({ toolCallId: 'call_A' }), // argsHash is for `aws s3 cp a b`, not the attested `rm OTHER`
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-34a: attestation with an EMPTY toolCalls[] cannot bind any call → deny', () => {
    const { alice, proxy, store, doc } = setup();
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        { kind: 'model-decision', envelope: modelDecision(proxy, { toolCalls: [] }) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });
});

// ── Defect 2: argv anti-evasion routed through matchArgv (AC-38 / AC-38a / AC-38c) ──
describe('Milestone B — evaluator routes action matching through the anti-evasion matcher (AC-38)', () => {
  // A DENY action covering `aws s3 rm`; disguised aliases must resolve to `aws` and be
  // DENIED (or, for unresolvable wrappers, denied as covered-but-unauthorized). None may
  // fall through to "no chain satisfied"/default-allow.
  function denyDoc(): ReturnType<typeof parsePolicyDocument> {
    return parsePolicyDocument(`
version: 1
actions:
  - id: aws-prod-deny
    effect: deny
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 rm"], wrapperAllowlist: ["time", "sudo"], recognizedPrograms: ["aws"] }
      credentialScope: "aws:prod:*"
`);
  }
  const store: TrustStore = { trustRoots: [] };

  function evalCommand(command: string) {
    return evaluatePolicy({
      document: denyDoc(),
      store,
      evidence: [],
      context: ctx({
        canonicalArgv: ['aws', 's3', 'rm', 'x'],
        args: { command },
        rawCommand: command,
        argsHash: sha256('{"command":"x"}'),
        credentialScope: 'aws:prod:s3',
      }),
    });
  }

  it('AC-38: a bare covered `aws s3 rm` is DENIED by the deny action', () => {
    expect(evalCommand('aws s3 rm s3://prod/x').granted).toBe(false);
  });

  it('AC-38.1: `sh -c "aws s3 rm ..."` resolves to inner `aws` → DENIED (not a silent pass)', () => {
    expect(evalCommand('sh -c "aws s3 rm s3://prod/x"').granted).toBe(false);
  });

  it('AC-38.1: nested `sh -c "sh -c \\"aws s3 rm\\""` recurses → DENIED', () => {
    expect(evalCommand('sh -c "sh -c \\"aws s3 rm x\\""').granted).toBe(false);
  });

  it('AC-38c: `npx aws s3 rm` — npx not on allowlist → covered-but-unauthorized → DENIED', () => {
    expect(evalCommand('npx aws s3 rm x').granted).toBe(false);
  });

  it('AC-38a: env-indirection `AWS=aws;$AWS s3 rm` → unresolvable covered → DENIED', () => {
    expect(evalCommand('AWS=aws; $AWS s3 rm x').granted).toBe(false);
  });

  it('AC-38a: command-substitution `$(echo aws) s3 rm` → unresolvable covered → DENIED', () => {
    expect(evalCommand('$(echo aws) s3 rm x').granted).toBe(false);
  });

  it('AC-38a: backtick program `` `which aws` s3 rm `` → unresolvable covered → DENIED', () => {
    expect(evalCommand('`which aws` s3 rm x').granted).toBe(false);
  });

  it('AC-38a: `eval "aws s3 rm"` → unresolvable covered → DENIED', () => {
    expect(evalCommand('eval "aws s3 rm x"').granted).toBe(false);
  });

  it('AC-38c: busybox applet `busybox sh -c "aws s3 rm"` → not on allowlist → DENIED', () => {
    expect(evalCommand('busybox sh -c "aws s3 rm x"').granted).toBe(false);
  });

  it('AC-38c: interpreter `python -c "os.system(\'aws s3 rm\')"` → unresolvable → DENIED', () => {
    expect(evalCommand('python -c "import os; os.system(\'aws s3 rm x\')"').granted).toBe(false);
    expect(evalCommand('node -e "child_process.exec(\'aws s3 rm x\')"').granted).toBe(false);
  });
});

// ── Global-option argv-evasion: a deny cannot hide behind global options (AC-38) ──
describe('Milestone B — global-option argv-evasion is un-evadable end-to-end (AC-38)', () => {
  // A DENY action covers `aws s3 rm|cp|sync`, and a SEPARATE broad grant covers all `aws`
  // (any subcommand) with a satisfiable human+opus chain. The residual bypass is: placing
  // a global option before the subcommand (`aws --region us-east-1 s3 rm`) makes the deny
  // NON-MATCH so the broad grant authorizes the disguised destructive command. After the
  // fix, the deny matches regardless of global-option position and wins (deny > grant).
  function evasionDoc(aliceFp: string) {
    return parsePolicyDocument(`
version: 1
commandDefaultAllow: false
actions:
  - id: aws-prod-deny-destructive
    effect: deny
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 rm", "s3 cp", "s3 sync"], wrapperAllowlist: ["time", "sudo"], recognizedPrograms: ["aws"] }
      credentialScope: "aws:prod:*"
  - id: aws-prod-broad-allow
    requireProxyAttestation: false
    match:
      tool: "Bash"
      argv: { program: "aws", wrapperAllowlist: ["time", "sudo"], recognizedPrograms: ["aws"] }
      credentialScope: "aws:prod:*"
    chains:
      - id: human-plus-opus
        requirements:
          - step: { kind: human-approval, trustedIdentities: ["${aliceFp}"], conditions: { scopeEquals: "aws:prod:s3", notExpired: true } }
          - step: { kind: model-decision, conditions: { modelIdMatches: "claude-opus-.*" } }
`);
  }

  function evalDisguised(command: string) {
    const alice = createKeyPair();
    const proxy = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), engineRoot(proxy, 'proxy')] };
    const argsCommand = `{"command":${JSON.stringify(command)}}`;
    return evaluatePolicy({
      document: evasionDoc(alice.fingerprint),
      store,
      // A fully-satisfiable chain is PRESENT — proving the deny wins over an available grant,
      // not merely that the grant was unsatisfied.
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        { kind: 'model-decision', envelope: modelDecision(proxy, { toolCalls: [{ toolCallId: 'call_A', name: 'Bash', argsHash: sha256(argsCommand) }] }) },
      ],
      context: ctx({
        canonicalArgv: ['aws', 's3', 'rm', 'x'],
        args: { command },
        rawCommand: command,
        argsHash: sha256(argsCommand),
        credentialScope: 'aws:prod:s3',
      }),
    });
  }

  it('AC-38: disguised `aws --region us-east-1 s3 rm ...` is DENIED (not authorized by the broad aws grant)', () => {
    expect(evalDisguised('aws --region us-east-1 s3 rm s3://prod/x').granted).toBe(false);
  });

  it('AC-38: `aws --debug s3 rm x` is DENIED', () => {
    expect(evalDisguised('aws --debug s3 rm x').granted).toBe(false);
  });

  it('AC-38: `--flag=value` form `aws --region=us-east-1 s3 cp a b` is DENIED', () => {
    expect(evalDisguised('aws --region=us-east-1 s3 cp a b').granted).toBe(false);
  });

  it('AC-38: option interspersed in the subcommand `aws s3 --recursive rm x` is DENIED', () => {
    expect(evalDisguised('aws s3 --recursive rm x').granted).toBe(false);
  });

  it('AC-38: a LEGITIMATE distinct subcommand `aws --region us-east-1 s3 ls` is GRANTED by the broad allow (not the deny)', () => {
    // The deny only covers rm|cp|sync; `s3 ls` is genuinely distinct, so global options
    // must NOT force it into the deny — it should be authorized by the broad grant.
    const decision = evalDisguised('aws --region us-east-1 s3 ls');
    expect(decision.granted).toBe(true);
    expect(decision.actionId).toBe('aws-prod-broad-allow');
  });

  it('AC-38: `git --no-pager push` deny is un-evadable by the leading global flag', () => {
    const alice = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice')] };
    const doc = parsePolicyDocument(`
version: 1
commandDefaultAllow: true
actions:
  - id: git-push-deny
    effect: deny
    match:
      tool: "Bash"
      argv: { program: "git", subcommandEquals: ["push"], wrapperAllowlist: [], recognizedPrograms: ["git"] }
`);
    const evalGit = (command: string) =>
      evaluatePolicy({
        document: doc,
        store,
        evidence: [],
        context: ctx({ toolName: 'Bash', canonicalArgv: [], args: { command }, rawCommand: command, credentialScope: '' }),
      });
    // Both the bare and the global-option-disguised forms hit the explicit deny.
    expect(evalGit('git push origin main').reason).toBe('explicit deny action matched');
    expect(evalGit('git --no-pager push origin main').reason).toBe('explicit deny action matched');
    // A distinct git subcommand (`status`) is NOT swept into the push deny — it non-matches
    // the deny action (no deny reason), it is merely uncovered by any grant here.
    expect(evalGit('git --no-pager status').reason).not.toBe('explicit deny action matched');
  });

  it('AC-38: `kubectl -n prod delete ...` deny is un-evadable by the `-n prod` short-flag value', () => {
    const store: TrustStore = { trustRoots: [] };
    const doc = parsePolicyDocument(`
version: 1
commandDefaultAllow: true
actions:
  - id: kubectl-delete-deny
    effect: deny
    match:
      tool: "Bash"
      argv: { program: "kubectl", subcommandEquals: ["delete"], wrapperAllowlist: [], recognizedPrograms: ["kubectl"] }
`);
    const evalK = (command: string) =>
      evaluatePolicy({
        document: doc,
        store,
        evidence: [],
        context: ctx({ toolName: 'Bash', canonicalArgv: [], args: { command }, rawCommand: command, credentialScope: '' }),
      });
    expect(evalK('kubectl delete pod/foo').granted).toBe(false);
    expect(evalK('kubectl -n prod delete pod/foo').granted).toBe(false);
    expect(evalK('kubectl --namespace=prod delete pod/foo').granted).toBe(false);
  });
});

// ── Defect 3: quorum distinctness by RESOLVED trusted-store identity (AC-41) ──
describe('Milestone B — quorum distinctness by trusted-store identity, not payload label (AC-41)', () => {
  it('AC-41: ONE human with TWO keys both mapping to the same identityId → 2-quorum DENIED', () => {
    // Both keys are registered under the SAME trusted identity `identityId:'mallory'`.
    // The attacker signs approvedBy:'alice' and approvedBy:'bob' to fake two holders —
    // distinctness MUST be counted by the resolved trust-root identity, not approvedBy.
    const key1 = createKeyPair();
    const key2 = createKeyPair();
    const store: TrustStore = {
      trustRoots: [
        humanRoot(key1, 'mallory-key1', { identityId: 'mallory' }),
        humanRoot(key2, 'mallory-key2', { identityId: 'mallory' }),
      ],
    };
    const doc = awsDoc(key1.fingerprint, key2.fingerprint);
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(key1, { approvedBy: 'alice' }) },
        { kind: 'human-approval', envelope: humanApproval(key2, { approvedBy: 'bob' }) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-41: TWO genuinely-distinct trusted identities → 2-quorum GRANTS', () => {
    const alice = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = {
      trustRoots: [
        humanRoot(alice, 'alice', { identityId: 'alice' }),
        humanRoot(bob, 'bob', { identityId: 'bob' }),
      ],
    };
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);
    const decision = evaluatePolicy({
      document: doc,
      store,
      // Even if the attacker mislabels approvedBy, distinct identities still count as 2.
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice, { approvedBy: 'x' }) },
        { kind: 'human-approval', envelope: humanApproval(bob, { approvedBy: 'x' }) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(true);
    expect(decision.matchedChainId).toBe('two-human-quorum');
  });
});

// ── Defect 4: unanchored modelIdMatches regex must be full-string ──
describe('Milestone B — modelIdMatches is anchored full-string (allowlist-widening fix)', () => {
  it("modelIdMatches:'claude-opus-.*' does NOT match 'gpt-cheap-claude-opus-x' → deny", () => {
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
        // A disguised model id that a naive substring/unanchored regex would accept.
        { kind: 'model-decision', envelope: modelDecision(proxy, { modelId: 'gpt-cheap-claude-opus-x' }) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });
});

// ── Defect 5: requireProxyAttestation (AC-17/AC-39) ──
describe('Milestone B — requireProxyAttestation (AC-17 / AC-39 credential-scope default)', () => {
  // An engine root that is the IN-PROCESS genty key (producer:'in-process'), forgeable
  // by a compromised agent — correlation-grade only.
  function inProcessRoot(kp: ReturnType<typeof createKeyPair>, label: string): TrustRoot {
    return { fingerprint: kp.fingerprint, kind: 'engine', producer: 'in-process', publicKey: kp.publicKey, label };
  }

  it('AC-39: credential-touching action defaults to requiring proxy → in-process attestation DENIED', () => {
    const alice = createKeyPair();
    const genty = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = {
      trustRoots: [humanRoot(alice, 'alice'), inProcessRoot(genty, 'genty'), humanRoot(bob, 'bob')],
    };
    // AWS_DOC has credentialScope aws:prod:* and does NOT set requireProxyAttestation →
    // defaults to TRUE (AC-39). The in-process attestation must be rejected.
    const doc = awsDoc(alice.fingerprint, bob.fingerprint);
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        { kind: 'model-decision', envelope: modelDecision(genty) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });

  it('AC-39: an explicit opt-out (requireProxyAttestation:false) accepts the in-process attestation', () => {
    const alice = createKeyPair();
    const genty = createKeyPair();
    const bob = createKeyPair();
    const store: TrustStore = {
      trustRoots: [humanRoot(alice, 'alice'), inProcessRoot(genty, 'genty'), humanRoot(bob, 'bob')],
    };
    const doc = parsePolicyDocument(`
version: 1
actions:
  - id: aws-prod-write
    requireProxyAttestation: false
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 cp", "s3 rm", "s3 sync"] }
      credentialScope: "aws:prod:*"
    chains:
      - id: human-plus-model
        requirements:
          - step: { kind: human-approval, trustedIdentities: ["${alice.fingerprint}"], conditions: { scopeEquals: "aws:prod:s3", notExpired: true } }
          - step: { kind: model-decision, conditions: { modelIdMatches: "claude-opus-.*" } }
`);
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [
        { kind: 'human-approval', envelope: humanApproval(alice) },
        { kind: 'model-decision', envelope: modelDecision(genty) },
      ],
      context: ctx(),
    });
    expect(decision.granted).toBe(true);
  });

  it('AC-17: an explicit requireProxyAttestation:true rejects the in-process attestation even without a credentialScope', () => {
    const alice = createKeyPair();
    const genty = createKeyPair();
    const store: TrustStore = { trustRoots: [humanRoot(alice, 'alice'), inProcessRoot(genty, 'genty')] };
    const doc = parsePolicyDocument(`
version: 1
actions:
  - id: model-only
    requireProxyAttestation: true
    match:
      tool: "Bash"
      argv: { program: "aws", subcommandEquals: ["s3 cp"] }
    chains:
      - id: model
        requirements:
          - step: { kind: model-decision, conditions: { modelIdMatches: "claude-opus-.*" } }
`);
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [{ kind: 'model-decision', envelope: modelDecision(genty) }],
      context: ctx(),
    });
    expect(decision.granted).toBe(false);
  });
});

// ── Folded-in guard: empty requirements / requiredStepCount===0 → unsatisfied ──
describe('Milestone B — empty-requirements chain never grants (fail-closed guard)', () => {
  it('a chain whose requirements array is empty cannot be satisfied by an empty evidence set', () => {
    const store: TrustStore = { trustRoots: [] };
    // Construct a document object directly with an empty requirements chain (bypassing
    // the parser, which would reject it) to prove the evaluator itself is fail-closed.
    const doc = {
      version: 1,
      authorizationTtlSeconds: 120,
      commandDefaultAllow: false,
      defaultDeny: [],
      actions: [
        {
          id: 'empty-chain',
          match: { tool: 'Bash' },
          chains: [{ id: 'vacuous', requirements: [] }],
        },
      ],
    } as never;
    const decision = evaluatePolicy({
      document: doc,
      store,
      evidence: [],
      context: ctx({ canonicalArgv: [], args: {}, rawCommand: undefined }),
    });
    expect(decision.granted).toBe(false);
  });
});
