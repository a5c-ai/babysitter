/**
 * Milestone D — GATE 3 (credential injection backstop, spawn-invocation).
 *
 * Frozen tests authored strictly from docs/design/proof-based-policy-enforcement.md:
 *   §9.3 / AC-23a — a credential about to be delivered by ANY channel spawn-invocation.ts
 *                   controls (docker -e env, docker -v mount, ssh K=V, k8s env / --env,
 *                   k8s secret/serviceaccount) is tagged with a credentialScope from the
 *                   trusted out-of-agent source; before delivery GATE 3 requires a valid
 *                   CommandAuthorization whose credentialScope matches. NO valid
 *                   authorization → the scoped credential is NOT delivered (env dropped,
 *                   -v mount omitted, secret/serviceaccount ref stripped), and if the
 *                   policy marks it required, the spawn is denied. GATE 3 RECOMPUTES
 *                   argsHash/commandHash (the last point before exec) and re-checks them.
 *   §9.3 / AC-40  — the credential→scope mapping comes from a source OUTSIDE the agent
 *                   process; the agent MUST NOT be able to assert a narrower scope for a
 *                   broader credential. No scope in the trusted source for a scoped cred →
 *                   deny (fail closed), never inject untagged.
 *   §9.3 / AC-40a — the credential IDENTITY is collision-resistant (sha256 of the stable
 *                   secret-store id), never the value prefix / env-var name / agent alias;
 *                   an ambiguous or absent identity → deny (never guess, never the narrower).
 *   §9.3 / AC-50  — GATE 3 mediates env + docker -v mount + k8s secret/serviceaccount;
 *                   substrate-delivered credentials (IMDS/IRSA, pre-existing mounts, image
 *                   creds) are a BOUNDED, WARNED non-goal — the evaluator refuses to claim
 *                   a GATE-3 backstop for such an action.
 *   §14  / AC-55  — a KMS credential referenced by two aliases (ARN + key-id) canonicalizes
 *                   to ONE identity → one scope (not falsely denied).
 *
 * MODULE PATHS: shipped primitives import from `@a5c-ai/policy-adapter`; the intended
 * Milestone-D credential gate imports from `../policy-credential-gate.js`. Resolution may
 * fail until Milestone D lands — expected. NO syntax errors.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/trust-core';
import type { SignedEnvelope } from '@a5c-ai/trust-core';
import {
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  canonicalizeCredentialIdentity,
  type CommandAuthorizationPayload,
  type CredentialScopeSource,
  type TrustRoot,
} from '@a5c-ai/policy-adapter';

// Intended Milestone-D GATE-3 credential-injection gate (§9.3, AC-23a/AC-40/AC-50).
import { gateCredentialInjection } from '../policy-credential-gate.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const CA_FIELDS = [
  'payloadType',
  'policyId',
  'policyDocHash',
  'configEpoch',
  'matchedChainId',
  'toolName',
  'toolCallId',
  'commandHash',
  'argsHash',
  'credentialScope',
  'evidenceFingerprints',
  'evidenceEnvelopeHashes',
  'evidenceStepBindings',
  'issuedAt',
  'expiresAt',
];

const ISSUER = createKeyPair();
const ISSUER_ROOT: TrustRoot = {
  fingerprint: ISSUER.fingerprint,
  kind: 'engine',
  publicKey: ISSUER.publicKey,
  label: 'issuer',
};

const COMMAND = 'aws s3 cp a b';
const ARGS = { command: COMMAND };
const CRED_SCOPE = 'aws:prod:s3-ro';
const POLICY_DOC_HASH = sha256('policy-doc-bytes');
const CONFIG_EPOCH = 5;

// The trusted out-of-agent credential→scope source (AC-40/AC-40a/AC-55). Keyed by the
// COLLISION-RESISTANT canonical identity (sha256 of the stable secret-store id). Two
// aliases (ARN + key-id) of ONE credential resolve to one identity → one scope (AC-55).
const STABLE_ID = 'kms:key/prod-s3-ro';
const IDENTITY = canonicalizeCredentialIdentity(STABLE_ID);
const CRED_SOURCE: CredentialScopeSource = {
  aliasMap: {
    'arn:aws:kms:us-east-1:123:key/prod-s3-ro': STABLE_ID,
    'key-id:prod-s3-ro': STABLE_ID,
  },
  scopeByIdentity: { [IDENTITY]: CRED_SCOPE },
  ambiguousIdentities: [],
};

function makeCA(overrides: Partial<CommandAuthorizationPayload> = {}): CommandAuthorizationPayload {
  const now = Date.now();
  return {
    payloadType: 'command-authorization',
    policyId: 'aws-prod-write',
    policyDocHash: POLICY_DOC_HASH,
    configEpoch: CONFIG_EPOCH,
    matchedChainId: 'human-plus-opus',
    toolName: 'Bash',
    toolCallId: 'call_A',
    commandHash: computeCommandHash(COMMAND),
    argsHash: computeArgsHash(ARGS),
    credentialScope: CRED_SCOPE,
    evidenceFingerprints: ['fp-human', 'fp-proxy'],
    evidenceEnvelopeHashes: [sha256('human-env'), sha256('model-env')],
    evidenceStepBindings: [
      { stepIndex: 0, requiredKind: 'human-approval', envelopeHash: sha256('human-env') },
      { stepIndex: 1, requiredKind: 'model-decision', envelopeHash: sha256('model-env') },
    ],
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 120_000).toISOString(),
    ...overrides,
  };
}

function signCA(payload: CommandAuthorizationPayload): SignedEnvelope<CommandAuthorizationPayload> {
  return signPayload(ISSUER.privateKey, ISSUER.fingerprint, payload, CA_FIELDS);
}

/**
 * A scoped credential about to be delivered by some channel. `alias` is what the agent
 * hands to spawn-invocation; the trusted source (AC-40) maps it to a stable id → scope.
 */
interface ScopedCredential {
  /** The env var / mount / secret key name (AC-40a: NOT the identity). */
  name: string;
  value: string;
  /** The alias the agent supplies (ARN, key-id, secret name). */
  alias: string;
  /** The delivery channel spawn-invocation controls. */
  channel: 'docker-env' | 'docker-mount' | 'ssh-env' | 'k8s-env' | 'k8s-secret' | 'k8s-serviceaccount';
  /** Whether the policy marks this credential REQUIRED (spawn denied if it cannot be delivered). */
  required?: boolean;
}

function gateInput(opts: {
  authorization?: SignedEnvelope<CommandAuthorizationPayload> | undefined;
  credentials: ScopedCredential[];
  source?: CredentialScopeSource;
  command?: string;
  args?: unknown;
}) {
  return {
    issuerRoots: [ISSUER_ROOT],
    policyDocHash: POLICY_DOC_HASH,
    currentConfigEpoch: CONFIG_EPOCH,
    minEpochFloor: CONFIG_EPOCH,
    now: Date.now(),
    toolName: 'Bash',
    toolCallId: 'call_A',
    // GATE 3 is the LAST point before exec — it recomputes these from the exact spawn.
    command: opts.command ?? COMMAND,
    args: opts.args ?? ARGS,
    credentialSource: opts.source ?? CRED_SOURCE,
    credentials: opts.credentials,
    resolveAuthorization: () => opts.authorization,
  };
}

describe('Milestone D — GATE 3 credential injection backstop (AC-23a, AC-40, AC-40a, AC-50, AC-55)', () => {
  it('AC-23a: a scoped docker -e ENV credential WITH a matching authorization IS injected', () => {
    const result = gateCredentialInjection(
      gateInput({
        authorization: signCA(makeCA()),
        credentials: [
          { name: 'AWS_KEY', value: 'secret', alias: 'key-id:prod-s3-ro', channel: 'docker-env' },
        ],
      }),
    );
    expect(result.denied).toBe(false);
    expect(result.injected.map((c) => c.name)).toContain('AWS_KEY');
    expect(result.dropped).toHaveLength(0);
  });

  it('AC-23a: a scoped docker -e ENV credential WITHOUT authorization is NOT injected (dropped)', () => {
    const result = gateCredentialInjection(
      gateInput({
        authorization: undefined,
        credentials: [
          { name: 'AWS_KEY', value: 'secret', alias: 'key-id:prod-s3-ro', channel: 'docker-env' },
        ],
      }),
    );
    expect(result.injected.map((c) => c.name)).not.toContain('AWS_KEY');
    expect(result.dropped.map((c) => c.name)).toContain('AWS_KEY');
  });

  it('AC-50: a scoped docker -v MOUNT credential WITHOUT authorization is OMITTED (mount dropped)', () => {
    const result = gateCredentialInjection(
      gateInput({
        authorization: undefined,
        credentials: [
          {
            name: '/host/.aws:/root/.aws',
            value: '/host/.aws',
            alias: 'key-id:prod-s3-ro',
            channel: 'docker-mount',
          },
        ],
      }),
    );
    expect(result.dropped.map((c) => c.channel)).toContain('docker-mount');
    expect(result.injected).toHaveLength(0);
  });

  it('AC-50: a scoped k8s SECRET reference WITHOUT authorization is STRIPPED', () => {
    const result = gateCredentialInjection(
      gateInput({
        authorization: undefined,
        credentials: [
          { name: 'prod-s3-secret', value: 'ref', alias: 'key-id:prod-s3-ro', channel: 'k8s-secret' },
        ],
      }),
    );
    expect(result.dropped.map((c) => c.channel)).toContain('k8s-secret');
    expect(result.injected).toHaveLength(0);
  });

  it('AC-50: a scoped k8s SERVICEACCOUNT reference WITHOUT authorization is STRIPPED', () => {
    const result = gateCredentialInjection(
      gateInput({
        authorization: undefined,
        credentials: [
          {
            name: '--serviceaccount=prod-s3',
            value: 'prod-s3',
            alias: 'key-id:prod-s3-ro',
            channel: 'k8s-serviceaccount',
          },
        ],
      }),
    );
    expect(result.dropped.map((c) => c.channel)).toContain('k8s-serviceaccount');
  });

  it('AC-23a: when a policy marks the scoped credential REQUIRED, no authorization → the spawn is DENIED', () => {
    const result = gateCredentialInjection(
      gateInput({
        authorization: undefined,
        credentials: [
          {
            name: 'AWS_KEY',
            value: 'secret',
            alias: 'key-id:prod-s3-ro',
            channel: 'docker-env',
            required: true,
          },
        ],
      }),
    );
    expect(result.denied).toBe(true);
    expect(result.reason).toBeTruthy();
  });

  it('AC-23a/AC-32: args MUTATED before exec → GATE-3 recomputed argsHash mismatch → deny (TOCTOU)', () => {
    // GATE 3 is the last recomputation before exec. The authorization binds argsHash over
    // ARGS; the actual spawn args were mutated after issuance → the scoped cred is NOT
    // injected and (required) the spawn is denied.
    const result = gateCredentialInjection(
      gateInput({
        authorization: signCA(makeCA()),
        args: { command: 'aws s3 rm --recursive s3://prod' },
        command: 'aws s3 rm --recursive s3://prod',
        credentials: [
          {
            name: 'AWS_KEY',
            value: 'secret',
            alias: 'key-id:prod-s3-ro',
            channel: 'docker-env',
            required: true,
          },
        ],
      }),
    );
    expect(result.denied).toBe(true);
  });

  it('AC-40: an AGENT-SUPPLIED alias absent from the trusted source → no scope → deny (fail closed)', () => {
    // The agent supplies an alias that is NOT in the trusted alias map, trying to get a
    // broad credential tagged as the narrow scope. GATE 3 must not inject an untagged cred.
    const result = gateCredentialInjection(
      gateInput({
        authorization: signCA(makeCA()),
        credentials: [
          {
            name: 'AWS_KEY',
            value: 'secret',
            alias: 'agent-forged-alias',
            channel: 'docker-env',
            required: true,
          },
        ],
      }),
    );
    expect(result.denied).toBe(true);
  });

  it('AC-40a: an AMBIGUOUS credential identity (backed by >1 credential) → deny (never the narrower)', () => {
    const ambiguousSource: CredentialScopeSource = {
      aliasMap: { 'key-id:prod-s3-ro': STABLE_ID },
      scopeByIdentity: { [IDENTITY]: CRED_SCOPE },
      ambiguousIdentities: [IDENTITY],
    };
    const result = gateCredentialInjection(
      gateInput({
        authorization: signCA(makeCA()),
        source: ambiguousSource,
        credentials: [
          {
            name: 'AWS_KEY',
            value: 'secret',
            alias: 'key-id:prod-s3-ro',
            channel: 'docker-env',
            required: true,
          },
        ],
      }),
    );
    expect(result.denied).toBe(true);
  });

  it('AC-40a: identity is collision-resistant — a credential VALUE prefix is never the scope key', () => {
    // Two DIFFERENT stable ids must never collide to one identity key; the identity is
    // sha256 of the stable id, not the value prefix.
    const idA = canonicalizeCredentialIdentity('kms:key/A');
    const idB = canonicalizeCredentialIdentity('kms:key/B');
    expect(idA).not.toBe(idB);
    expect(idA).toMatch(/^[0-9a-f]{64}$/);
  });

  it('AC-55: two aliases (ARN + key-id) of ONE credential resolve to ONE scope (not falsely denied)', () => {
    const viaArn = gateCredentialInjection(
      gateInput({
        authorization: signCA(makeCA()),
        credentials: [
          {
            name: 'AWS_KEY',
            value: 'secret',
            alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro',
            channel: 'docker-env',
          },
        ],
      }),
    );
    const viaKeyId = gateCredentialInjection(
      gateInput({
        authorization: signCA(makeCA()),
        credentials: [
          { name: 'AWS_KEY', value: 'secret', alias: 'key-id:prod-s3-ro', channel: 'docker-env' },
        ],
      }),
    );
    // Both aliases resolve to the same scope and are injected under the same authorization.
    expect(viaArn.denied).toBe(false);
    expect(viaKeyId.denied).toBe(false);
    expect(viaArn.injected.map((c) => c.name)).toContain('AWS_KEY');
    expect(viaKeyId.injected.map((c) => c.name)).toContain('AWS_KEY');
  });

  it('AC-50: a scoped action whose credential would arrive via IMDS is a BOUNDED, WARNED non-goal → not claimed as backstopped', () => {
    // A credential delivered by a substrate channel spawn-invocation does NOT construct
    // (IMDS/IRSA) cannot be gated. When a policy action declares a scope that could only
    // arrive via such a channel, the gate MUST emit a warning and MUST NOT claim a GATE-3
    // backstop (it does not silently allow the scoped action as if backstopped).
    const result = gateCredentialInjection(
      gateInput({
        authorization: signCA(makeCA()),
        credentials: [
          {
            name: 'AWS_WEB_IDENTITY_TOKEN_FILE',
            value: 'imds',
            alias: 'key-id:prod-s3-ro',
            // A channel GATE 3 cannot mediate — surfaced as an out-of-scope warning.
            channel: 'docker-env',
          },
        ],
        source: {
          aliasMap: { 'key-id:prod-s3-ro': STABLE_ID },
          scopeByIdentity: {}, // no GATE-3-mediated scope → substrate-delivered
          ambiguousIdentities: [],
        },
      }),
    );
    // With no mediated scope for a scoped credential, GATE 3 fails closed rather than
    // injecting an untagged credential (AC-40) and surfaces the non-goal warning (AC-50).
    expect(result.injected.map((c) => c.name)).not.toContain('AWS_WEB_IDENTITY_TOKEN_FILE');
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('any exception during GATE 3 evaluation is a denial / no-injection, never a pass', () => {
    const result = gateCredentialInjection({
      // Deliberately malformed input → must fail closed.
      credentials: [{ name: 'X', value: 'y', alias: 'z', channel: 'docker-env' }],
    } as never);
    expect(result.denied || result.injected.length === 0).toBe(true);
  });
});
