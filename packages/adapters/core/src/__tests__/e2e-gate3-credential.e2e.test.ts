/**
 * Milestone E — END-TO-END: GATE 3 credential backstop on a REAL spawn (§9.3 / AC-23a /
 * AC-40 / AC-49 / AC-50). Carry-forward from Milestone D, exercised end-to-end here.
 *
 * Frozen tests authored STRICTLY from docs/design/proof-based-policy-enforcement.md. GATE 3
 * is the LAST point before exec (§9.3): with a VALID CommandAuthorization whose
 * credentialScope matches, the scoped credential IS delivered by its channel; with
 * none/invalid, the scoped credential is NOT delivered (env dropped, `-v` mount omitted,
 * secret/serviceaccount ref stripped), and if required the spawn is denied.
 *
 * This drives the REAL wired spawn path: it constructs a real signed authorization + a real
 * trusted credential→scope source, builds a `Gate3Options`, and feeds it into the SHIPPED
 * `buildInvocationCommand` (docker / k8s), asserting the credential is (or is not) present in
 * the emitted invocation across env AND mount/serviceaccount channels — the policyGate3 /
 * scopedEnvKeys surface. Uses real Ed25519 keys + the shipped envelope primitives; no mocks.
 *
 * MODULE PATHS: shipped primitives import from `@a5c-ai/policy-adapter` + `@a5c-ai/genty-core`;
 * the GATE-3 spawn surface imports from `../spawn-invocation.js`. Resolution may fail until
 * the wiring lands — expected. NO syntax errors.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { IdentityKeyPair, SignedEnvelope } from '@a5c-ai/genty-core/trust';
import {
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  canonicalizeCredentialIdentity,
  type CommandAuthorizationPayload,
  type CredentialScopeSource,
  type TrustRoot,
} from '@a5c-ai/policy-adapter';

import { buildInvocationCommand, CredentialGateDenied, type Gate3Options } from '../spawn-invocation.js';
import type { SpawnArgs } from '../adapter.js';

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

const TOOL = 'Bash';
const TOOL_CALL_ID = 'call_aws_rm';
const COMMAND = 'aws s3 rm s3://prod-bucket/secret';
const ARGS = { command: COMMAND };
const CRED_SCOPE = 'aws:prod:s3-rw';
const POLICY_DOC_HASH = sha256('policy-doc-bytes');
const CONFIG_EPOCH = 5;
const MIN_EPOCH = 5;

// The trusted out-of-agent credential→scope source (AC-40 / AC-40a / AC-55). Keyed by the
// COLLISION-RESISTANT canonical identity (sha256 of the stable secret-store id). Two aliases
// (ARN + key-id) of ONE physical credential resolve to one identity → one scope (AC-55).
const STABLE_ID = 'kms:key/prod-s3-rw';
const IDENTITY = canonicalizeCredentialIdentity(STABLE_ID);
const CRED_ALIAS = 'arn:aws:kms:us-east-1:123:key/prod-s3-rw';
const CRED_SOURCE: CredentialScopeSource = {
  aliasMap: {
    [CRED_ALIAS]: STABLE_ID,
    'key-id:prod-s3-rw': STABLE_ID,
  },
  scopeByIdentity: { [IDENTITY]: CRED_SCOPE },
  ambiguousIdentities: [],
};

const ISSUER: IdentityKeyPair = createKeyPair();
const ISSUER_ROOT: TrustRoot = {
  fingerprint: ISSUER.fingerprint,
  kind: 'engine',
  publicKey: ISSUER.publicKey,
  label: 'policy-adapter-issuer',
};

/**
 * A REAL, signed CommandAuthorization bound to the exact tool call + command + scope.
 * `issuedAt` is back-dated a few seconds so the gate's `now >= issuedAt` bound holds even
 * when the gate's `now` was captured slightly before this envelope was signed (avoids a
 * millisecond-boundary flake); `expiresAt` stays well in the future.
 */
function signAuthorization(over: Partial<CommandAuthorizationPayload> = {}): SignedEnvelope<CommandAuthorizationPayload> {
  const now = Date.now();
  const payload: CommandAuthorizationPayload = {
    payloadType: 'command-authorization',
    policyId: 'aws-prod-write',
    policyDocHash: POLICY_DOC_HASH,
    configEpoch: CONFIG_EPOCH,
    matchedChainId: 'human-plus-opus',
    toolName: TOOL,
    toolCallId: TOOL_CALL_ID,
    commandHash: computeCommandHash(COMMAND),
    argsHash: computeArgsHash(ARGS),
    credentialScope: CRED_SCOPE,
    evidenceFingerprints: ['fp-human', 'fp-proxy'],
    evidenceEnvelopeHashes: [sha256('human-env'), sha256('model-env')],
    evidenceStepBindings: [
      { stepIndex: 0, requiredKind: 'human-approval', envelopeHash: sha256('human-env') },
      { stepIndex: 1, requiredKind: 'model-decision', envelopeHash: sha256('model-env') },
    ],
    issuedAt: new Date(now - 5_000).toISOString(),
    expiresAt: new Date(now + 120_000).toISOString(),
    ...over,
  };
  return signPayload(ISSUER.privateKey, ISSUER.fingerprint, payload, CA_FIELDS);
}

/** Return a resolver that always yields the SAME pre-signed authorization (stable issuedAt). */
function constant(
  auth: SignedEnvelope<CommandAuthorizationPayload>,
): () => SignedEnvelope<CommandAuthorizationPayload> {
  return () => auth;
}

/** A Gate3Options that gates the scoped env var + a scoped docker `-v` mount. */
function makeGate3(
  resolveAuthorization: () => SignedEnvelope<CommandAuthorizationPayload> | undefined,
  scoped: Partial<Pick<Gate3Options, 'scopedEnvKeys' | 'scopedMounts' | 'scopedServiceAccount'>> = {},
): Gate3Options {
  return {
    issuerRoots: [ISSUER_ROOT],
    policyDocHash: POLICY_DOC_HASH,
    currentConfigEpoch: CONFIG_EPOCH,
    minEpochFloor: MIN_EPOCH,
    now: Date.now(),
    toolName: TOOL,
    toolCallId: TOOL_CALL_ID,
    command: COMMAND,
    args: ARGS,
    credentialSource: CRED_SOURCE,
    resolveAuthorization,
    scopedEnvKeys: scoped.scopedEnvKeys ?? { AWS_SESSION_TOKEN: { alias: CRED_ALIAS } },
    ...(scoped.scopedMounts ? { scopedMounts: scoped.scopedMounts } : {}),
    ...(scoped.scopedServiceAccount ? { scopedServiceAccount: scoped.scopedServiceAccount } : {}),
  };
}

/** A fresh mutable SpawnArgs per call (avoids readonly-array assignability issues). */
function spawnArgs(env: Record<string, string> = { AWS_SESSION_TOKEN: 'the-secret', PATH: '/usr/bin' }): SpawnArgs {
  return {
    command: 'claude',
    args: ['--print', 'hi'],
    env: { ...env },
    cwd: '/repo',
    usePty: false,
  };
}

describe('Milestone E — GATE 3 credential backstop on a real spawn (AC-23a / AC-40 / AC-50)', () => {
  it('ALLOW path: a VALID authorization → the scoped credential IS injected into the docker -e channel', () => {
    const gate3 = makeGate3(constant(signAuthorization()));
    const out = buildInvocationCommand({ mode: 'docker', image: 'img:1' }, spawnArgs(), 'claude', gate3);
    // The scoped credential is delivered.
    expect(out.args).toContain('AWS_SESSION_TOKEN=the-secret');
    // The ordinary (non-credential) env var still passes through.
    expect(out.args).toContain('PATH=/usr/bin');
  });

  it('DENY (env): NO authorization → the scoped env credential is NOT injected (channel omitted)', () => {
    const gate3 = makeGate3(() => undefined);
    const out = buildInvocationCommand({ mode: 'docker', image: 'img:1' }, spawnArgs(), 'claude', gate3);
    expect(out.args).not.toContain('AWS_SESSION_TOKEN=the-secret');
    // Non-credential env passes through — only the scoped credential is dropped.
    expect(out.args).toContain('PATH=/usr/bin');
  });

  it('DENY (env): an authorization for a DIFFERENT scope → the scoped env credential is NOT injected', () => {
    // The authorization binds a broader/other scope than the trusted source resolves for the
    // credential (AC-40: the agent cannot relabel a broad credential as the narrow scope).
    const gate3 = makeGate3(constant(signAuthorization({ credentialScope: 'aws:prod:other' })));
    const out = buildInvocationCommand({ mode: 'docker', image: 'img:1' }, spawnArgs(), 'claude', gate3);
    expect(out.args).not.toContain('AWS_SESSION_TOKEN=the-secret');
  });

  it('DENY (env): a TAMPERED command after issuance → hash mismatch → scoped credential NOT injected (TOCTOU, AC-32)', () => {
    // The authorization binds COMMAND, but the gate context now spawns a DIFFERENT command.
    const gate3: Gate3Options = { ...makeGate3(constant(signAuthorization())), command: 'aws s3 rm s3://prod-bucket/OTHER' };
    const out = buildInvocationCommand({ mode: 'docker', image: 'img:1' }, spawnArgs(), 'claude', gate3);
    expect(out.args).not.toContain('AWS_SESSION_TOKEN=the-secret');
  });

  it('ALLOW + DENY (mount, AC-50): a scoped docker -v mount is injected with a valid auth and OMITTED without', () => {
    const MOUNT = '/host/creds:/creds:ro';
    const scoped = { scopedMounts: { [MOUNT]: { alias: CRED_ALIAS } } };

    const allowed = buildInvocationCommand(
      { mode: 'docker', image: 'img:1', volumes: [MOUNT] },
      spawnArgs({}),
      'claude',
      makeGate3(constant(signAuthorization()), scoped),
    );
    expect(allowed.args).toContain(MOUNT);

    const denied = buildInvocationCommand(
      { mode: 'docker', image: 'img:1', volumes: [MOUNT] },
      spawnArgs({}),
      'claude',
      makeGate3(() => undefined, scoped),
    );
    expect(denied.args).not.toContain(MOUNT);
  });

  it('DENY (required): a REQUIRED scoped credential with no authorization → the spawn is DENIED (CredentialGateDenied)', () => {
    const gate3 = makeGate3(() => undefined, { scopedEnvKeys: { AWS_SESSION_TOKEN: { alias: CRED_ALIAS, required: true } } });
    expect(() =>
      buildInvocationCommand({ mode: 'docker', image: 'img:1' }, spawnArgs(), 'claude', gate3),
    ).toThrow(CredentialGateDenied);
  });

  it('AC-40 (untrusted alias): a credential whose alias is NOT in the trusted source → NOT injected (fail closed)', () => {
    const gate3 = makeGate3(constant(signAuthorization()), {
      scopedEnvKeys: { AWS_SESSION_TOKEN: { alias: 'agent-supplied-unknown-alias' } },
    });
    const out = buildInvocationCommand({ mode: 'docker', image: 'img:1' }, spawnArgs(), 'claude', gate3);
    expect(out.args).not.toContain('AWS_SESSION_TOKEN=the-secret');
  });

  it('back-compat: with NO gate3 (anchor unpinned) every channel emits unchanged', () => {
    const out = buildInvocationCommand({ mode: 'docker', image: 'img:1' }, spawnArgs(), 'claude', undefined);
    // Without a gate, the scoped credential is NOT dropped (no enforcement, pre-Milestone-D posture).
    expect(out.args).toContain('AWS_SESSION_TOKEN=the-secret');
  });
});
