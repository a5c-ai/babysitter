/**
 * Milestone B — Policy document schema (AC-19 / AC-19a / AC-38b) + trust-root store
 * loader duplicate-fingerprint rejection (carry-forward hardening from Milestone A).
 *
 * Frozen tests authored SOLELY from docs/design/proof-based-policy-enforcement.md §7
 * (policy document schema: declarative trust-chain templates per action; ≥2 chains;
 * commandDefaultAllow; defaultDeny; conditions vocabulary), §8 (AC-22 reuse of the
 * existing condition operator set, no third engine), and §10/AC-26 (trust-roots store).
 *
 * The schema MUST express MULTIPLE alternative chain shapes for one action WITHOUT
 * code changes:
 *   - the aws-cli human+opus chain (an ordered typed-step chain), AND
 *   - a 2-human quorum chain,
 * both parseable from ONE document. Heterogeneous composition (a single chain mixing
 * typed steps AND a quorum requirement — "human+opus AND 2-human-quorum", AC-41a) is
 * also expressible.
 *
 * CARRY-FORWARD hardening: the config/trust-root loader MUST reject a store containing
 * duplicate fingerprints.
 *
 * These import the intended @a5c-ai/policy-adapter module paths the Milestone-B
 * implementation WILL provide; resolution may fail until then (expected).
 */
import { describe, it, expect } from 'vitest';

import {
  parsePolicyDocument,
  type PolicyDocument,
  type PolicyActionDoc,
} from '../policy-schema.js';
import { loadTrustStore } from '../policy-schema.js';
import type { TrustRoot } from '../verify-envelope-trusted.js';

/**
 * A policy document expressing BOTH the aws-cli human+opus chain AND a 2-human quorum
 * chain for the SAME action — verbatim intent of the §7 example. This is the pure
 * declarative-expressiveness test: both shapes come from one document, no code changes.
 */
const AWS_DOC_YAML = `
version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: false
defaultDeny:
  - "aws:prod:*"
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv:
        program: "aws"
        subcommandEquals: ["s3 cp", "s3 rm", "s3 sync"]
      credentialScope: "aws:prod:*"
    chains:
      - id: human-plus-opus
        steps:
          - kind: human-approval
            trustedIdentities: ["fp:human:alice", "role:sre-oncall"]
            conditions:
              scopeEquals: "aws:prod:s3"
              notExpired: true
          - kind: model-decision
            conditions:
              modelIdMatches: "claude-opus-.*"
      - id: two-human-quorum
        quorum: { of: "human-approval", min: 2 }
        steps:
          - kind: human-approval
            trustedIdentities: ["role:sre-oncall"]
`;

describe('Milestone B — policy document schema (AC-19: declarative trust-chain templates)', () => {
  it('AC-19: parses an action with matchers and one-or-more required trust-chain templates', () => {
    const doc: PolicyDocument = parsePolicyDocument(AWS_DOC_YAML);
    expect(doc.version).toBe(1);
    expect(doc.actions).toHaveLength(1);
    const action: PolicyActionDoc = doc.actions[0];
    expect(action.id).toBe('aws-prod-write');
    expect(action.match.tool).toBe('Bash');
    expect(action.match.argv?.program).toBe('aws');
    expect(action.match.credentialScope).toBe('aws:prod:*');
  });

  it('AC-19a: an action supports ≥2 alternative chains (OR across chains)', () => {
    const doc = parsePolicyDocument(AWS_DOC_YAML);
    const action = doc.actions[0];
    expect(action.chains.length).toBeGreaterThanOrEqual(2);
    const chainIds = action.chains.map((c) => c.id);
    // BOTH shapes are expressible from ONE document with no code changes.
    expect(chainIds).toContain('human-plus-opus');
    expect(chainIds).toContain('two-human-quorum');
  });

  it('AC-19: the aws-cli human+opus chain is an ordered AND of typed steps with per-step constraints', () => {
    const doc = parsePolicyDocument(AWS_DOC_YAML);
    const chain = doc.actions[0].chains.find((c) => c.id === 'human-plus-opus');
    expect(chain).toBeDefined();
    // Two AND-ed requirements: human-approval THEN model-decision.
    const kinds = (chain?.requirements ?? []).map((r) =>
      'step' in r ? r.step.kind : `quorum:${r.quorum.of}`,
    );
    expect(kinds).toEqual(['human-approval', 'model-decision']);
  });

  it('AC-41: the 2-human quorum chain is expressible as a distinct-holder quorum requirement', () => {
    const doc = parsePolicyDocument(AWS_DOC_YAML);
    const chain = doc.actions[0].chains.find((c) => c.id === 'two-human-quorum');
    expect(chain).toBeDefined();
    const quorumReq = (chain?.requirements ?? []).find((r) => 'quorum' in r);
    expect(quorumReq).toBeDefined();
    if (quorumReq && 'quorum' in quorumReq) {
      expect(quorumReq.quorum.of).toBe('human-approval');
      expect(quorumReq.quorum.min).toBe(2);
    }
  });

  it('AC-41a: a single chain mixing typed steps AND a quorum ("human+opus AND 2-human-quorum") is expressible', () => {
    const hetero = `
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
          - step: { kind: human-approval, trustedIdentities: ["fp:human:alice"] }
          - step: { kind: model-decision, conditions: { modelIdMatches: "claude-opus-.*" } }
          - quorum: { of: human-approval, min: 2, trustedIdentities: ["role:sre-oncall"] }
`;
    const doc = parsePolicyDocument(hetero);
    const chain = doc.actions[0].chains[0];
    // THREE AND-ed requirements in ONE chain (not three OR chains).
    expect(chain.requirements).toHaveLength(3);
    const shapes = chain.requirements.map((r) => ('step' in r ? 'step' : 'quorum'));
    expect(shapes).toEqual(['step', 'step', 'quorum']);
  });

  it('AC-38b: commandDefaultAllow defaults to false when omitted', () => {
    const noFlag = parsePolicyDocument(`
version: 1
actions: []
`);
    expect(noFlag.commandDefaultAllow).toBe(false);
  });

  it('AC-23c: defaultDeny credential-scope globs are parsed', () => {
    const doc = parsePolicyDocument(AWS_DOC_YAML);
    expect(doc.defaultDeny).toContain('aws:prod:*');
  });

  it('conditions reuse the existing operator vocabulary (AC-22 — sugar compiles to base ops)', () => {
    const doc = parsePolicyDocument(AWS_DOC_YAML);
    const humanStep = doc.actions[0].chains
      .find((c) => c.id === 'human-plus-opus')
      ?.requirements.find((r) => 'step' in r && r.step.kind === 'human-approval');
    // modelIdMatches / scopeEquals / notExpired sugar must be representable in the
    // parsed doc (their compilation to eq/matches lives in the evaluator, AC-22).
    expect(humanStep && 'step' in humanStep && humanStep.step.conditions).toBeTruthy();
  });

  it('a malformed document (invalid YAML / missing required fields) → throws (fail closed at parse)', () => {
    expect(() => parsePolicyDocument('this: : : not valid')).toThrow();
    expect(() => parsePolicyDocument('version: 1\nactions: "not-an-array"')).toThrow();
  });
});

describe('Milestone B — trust-root store loader duplicate-fingerprint rejection (carry-forward)', () => {
  const alice: TrustRoot = { fingerprint: 'fp-dupe', kind: 'human', publicKey: 'pk-a', label: 'alice' };
  const bob: TrustRoot = { fingerprint: 'fp-bob', kind: 'human', publicKey: 'pk-b', label: 'bob' };

  it('rejects a store containing duplicate fingerprints (fail closed)', () => {
    const dupe: TrustRoot = { fingerprint: 'fp-dupe', kind: 'engine', publicKey: 'pk-c', label: 'evil' };
    // Two records share `fp-dupe` — one human, one engine. The loader MUST reject the
    // whole store rather than silently pick one (a cross-kind confusion vector).
    expect(() => loadTrustStore({ trustRoots: [alice, dupe, bob] })).toThrow();
  });

  it('accepts a store with all-distinct fingerprints', () => {
    expect(() => loadTrustStore({ trustRoots: [alice, bob] })).not.toThrow();
  });
});
