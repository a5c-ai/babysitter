import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createKeyPair, signPayload } from '@a5c-ai/trust-core';
import type { SignedEnvelope } from '@a5c-ai/trust-core';
import {
  issueCommandAuthorization,
  canonicalizeCredentialIdentity,
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  type TrustRoot,
  type CommandAuthorizationPayload,
} from '@a5c-ai/policy-adapter';
import { resolveSpawnGate3, resolveSpawnGate3FromConfig, __resetSpawnGateCache } from '../policy-spawn-gate.js';
import { buildInvocationCommand } from '../spawn-invocation.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

/**
 * Milestone D — GATE 3 PRODUCTION spawn wiring (§9.3 / AC-23a / AC-50).
 *
 * Proves the fix for adversarial-review defect #1: the spawn path resolves a
 * `Gate3Options` from the SAME manifest-verified config that drives GATE 1, and passes it
 * to `buildInvocationCommand` so a scoped credential without a valid CommandAuthorization is
 * dropped on the LIVE spawn. Here we drive `resolveSpawnGate3` directly and feed its result
 * into `buildInvocationCommand`.
 */
describe('Milestone D — GATE 3 spawn wiring (resolveSpawnGate3)', () => {
  const prevFp = process.env.POLICY_CONFIG_ROOT_FP;

  beforeEach(() => {
    __resetSpawnGateCache();
    delete process.env.POLICY_CONFIG_ROOT_FP;
  });
  afterEach(() => {
    __resetSpawnGateCache();
    if (prevFp === undefined) delete process.env.POLICY_CONFIG_ROOT_FP;
    else process.env.POLICY_CONFIG_ROOT_FP = prevFp;
  });

  const binding = {
    toolName: 'Bash',
    toolCallId: 'call_1',
    command: 'claude',
    args: { command: 'claude' },
    resolveAuthorization: () => undefined,
  };

  it('no scoped credentials declared → no Gate3Options (channels emit unchanged)', async () => {
    const gate3 = await resolveSpawnGate3('/ws', {}, binding);
    expect(gate3).toBeUndefined();
  });

  it('anchor UNPINNED → no Gate3Options even with scoped credentials (back-compat)', async () => {
    const gate3 = await resolveSpawnGate3(
      '/ws',
      { scopedEnvKeys: { AWS_SESSION_TOKEN: { alias: 'arn:x' } } },
      binding,
    );
    expect(gate3).toBeUndefined();
  });

  it('anchor PINNED + scoped credential → Gate3Options that DROPS the unauthorized credential on the live spawn', async () => {
    // Pin the anchor but with no valid config → the resolved context has no issuer roots /
    // no trusted credential source, so a scoped credential fails authorization (fail closed).
    process.env.POLICY_CONFIG_ROOT_FP = 'deadbeef'.repeat(8);
    __resetSpawnGateCache();

    const gate3 = await resolveSpawnGate3(
      '/nonexistent-ws-abc',
      { scopedEnvKeys: { AWS_SESSION_TOKEN: { alias: 'arn:aws:kms:key/prod' } } },
      binding,
    );
    expect(gate3).toBeDefined();

    // Feed it into a docker spawn: the scoped credential must be OMITTED from the -e channel.
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'i:1' },
      {
        command: 'claude',
        args: ['--print', 'hi'],
        env: { AWS_SESSION_TOKEN: 'the-secret', FOO: 'bar' },
        cwd: '/repo',
        usePty: false,
      },
      'claude',
      gate3,
    );
    expect(out.args).not.toContain('AWS_SESSION_TOKEN=the-secret');
    // The ordinary (non-credential) env var still passes through.
    expect(out.args).toContain('FOO=bar');
  });
});

/**
 * Milestone E — GATE 3 AUTO-ACTIVATION from the SIGNED config, no test-injected gate3
 * (§9.3 / AC-23a / AC-40 / AC-50). The scoped-credential DECLARATION lives in the
 * manifest-verified `credential-scope-source.json` (`scopedCredentials`) — deployment config,
 * NOT agent input — so a real scoped-credential spawn is gated end-to-end from config alone.
 */
describe('Milestone E — GATE 3 auto-activation from signed config (resolveSpawnGate3FromConfig)', () => {
  const CONFIG_ENV = [
    'POLICY_CONFIG_ROOT_FP',
    'POLICY_CONFIG_MIN_EPOCH',
    'POLICY_CONFIG_ROOT_KEY',
    'POLICY_CONFIG_DIR',
    'POLICY_ISSUER_ROOTS',
  ];

  const TOOL = 'Bash';
  const CRED_SCOPE = 'aws:prod:s3-rw';
  const STABLE_ID = 'kms:key/prod-s3-rw';
  const CRED_ALIAS = 'arn:aws:kms:us-east-1:123:key/prod-s3-rw';

  const POLICY_YAML = `version: 1
commandDefaultAllow: false
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv:
        program: "aws"
        subcommandEquals: ["s3 rm", "s3 cp"]
      credentialScope: "aws:prod:*"
    chains:
      - id: human-only
        requirements:
          - step:
              kind: human-approval
`;

  interface Anchor {
    workspace: string;
    issuerKp: ReturnType<typeof createKeyPair>;
    issuerRoots: TrustRoot[];
    policyDocHash: string;
    epoch: number;
    cleanup: () => void;
  }

  function materialize(): Anchor {
    const workspace = mkdtempSync(join(tmpdir(), 'gate3-auto-'));
    const configDir = join(workspace, '.policy');
    const policiesDir = join(configDir, 'policies');
    mkdirSync(policiesDir, { recursive: true });

    const trustRootsBytes = JSON.stringify({ trustRoots: [] });
    const identity = canonicalizeCredentialIdentity(STABLE_ID);
    const credSource = {
      aliasMap: { [CRED_ALIAS]: STABLE_ID },
      scopeByIdentity: { [identity]: CRED_SCOPE },
      ambiguousIdentities: [],
      // The DEPLOYMENT-CONFIG scoped-credential declaration (signed into the manifest).
      scopedCredentials: {
        scopedEnvKeys: { AWS_SESSION_TOKEN: { alias: CRED_ALIAS } },
      },
    };
    const credSourceBytes = JSON.stringify(credSource);

    writeFileSync(join(configDir, 'trust-roots.json'), trustRootsBytes);
    writeFileSync(join(policiesDir, 'aws.yaml'), POLICY_YAML);
    writeFileSync(join(configDir, 'credential-scope-source.json'), credSourceBytes);

    const configRoot = createKeyPair();
    const epoch = 5;
    const manifestPayload = {
      payloadType: 'config-manifest' as const,
      configEpoch: epoch,
      files: [
        { path: 'trust-roots.json', sha256: sha256(trustRootsBytes) },
        { path: 'policies/aws.yaml', sha256: sha256(POLICY_YAML) },
        { path: 'credential-scope-source.json', sha256: sha256(credSourceBytes) },
      ],
      issuedAt: '2026-07-03T00:00:00.000Z',
    };
    const manifest = signPayload(
      configRoot.privateKey,
      configRoot.fingerprint,
      manifestPayload,
      ['payloadType', 'configEpoch', 'files', 'issuedAt'],
    );
    writeFileSync(join(configDir, 'config-manifest.json'), JSON.stringify(manifest));

    const issuerKp = createKeyPair();
    const issuerRoots: TrustRoot[] = [
      { fingerprint: issuerKp.fingerprint, kind: 'engine', publicKey: issuerKp.publicKey, label: 'issuer' },
    ];

    process.env.POLICY_CONFIG_ROOT_FP = configRoot.fingerprint;
    process.env.POLICY_CONFIG_MIN_EPOCH = String(epoch);
    process.env.POLICY_CONFIG_ROOT_KEY = configRoot.publicKey;
    process.env.POLICY_CONFIG_DIR = configDir;
    process.env.POLICY_ISSUER_ROOTS = JSON.stringify(issuerRoots);

    return {
      workspace,
      issuerKp,
      issuerRoots,
      policyDocHash: sha256(POLICY_YAML),
      epoch,
      cleanup: () => rmSync(workspace, { recursive: true, force: true }),
    };
  }

  function validAuth(a: Anchor, toolCallId: string, command: string): SignedEnvelope<CommandAuthorizationPayload> {
    const humanKp = createKeyPair();
    const humanRoot: TrustRoot = { fingerprint: humanKp.fingerprint, kind: 'human', publicKey: humanKp.publicKey, label: 'alice' };
    const evidence = signPayload(
      humanKp.privateKey,
      humanKp.fingerprint,
      { payloadType: 'human-approval', action: 'aws-prod-write', scope: 'aws:prod:s3', approvedBy: 'alice', approvedAt: '2026-07-03T00:00:00.000Z' },
      ['payloadType', 'action', 'scope', 'approvedBy', 'approvedAt'],
    );
    const result = issueCommandAuthorization({
      issuerKeyPair: a.issuerKp,
      store: { trustRoots: [...a.issuerRoots, humanRoot] },
      policyId: 'aws-prod-write',
      policyDocHash: a.policyDocHash,
      matchedChainId: 'human-only',
      configEpoch: a.epoch,
      minEpochFloor: a.epoch,
      toolName: TOOL,
      toolCallId,
      commandHash: computeCommandHash(command),
      argsHash: computeArgsHash({ command }),
      credentialScope: CRED_SCOPE,
      authorizationTtlSeconds: 120,
      requiredStepCount: 1,
      evidenceUsed: [{ kind: 'human-approval', envelope: evidence, stepIndex: 0 }],
    });
    if (!result.issued || !result.authorization) throw new Error(`issue failed: ${result.reason}`);
    return result.authorization;
  }

  let anchor: Anchor | undefined;

  beforeEach(() => {
    __resetSpawnGateCache();
    for (const k of CONFIG_ENV) delete process.env[k];
  });
  afterEach(() => {
    anchor?.cleanup();
    anchor = undefined;
    __resetSpawnGateCache();
    for (const k of CONFIG_ENV) delete process.env[k];
  });

  const spawnEnv = () => ({
    command: 'claude',
    args: ['--print', 'hi'],
    env: { AWS_SESSION_TOKEN: 'the-secret', PATH: '/usr/bin' },
    cwd: '/repo',
    usePty: false,
  });

  it('anchor unpinned → no auto GATE 3 (undefined, back-compat)', async () => {
    const gate3 = await resolveSpawnGate3FromConfig('/ws', {
      toolName: TOOL,
      toolCallId: 'c1',
      command: 'aws s3 rm s3://b/k',
      args: { command: 'aws s3 rm s3://b/k' },
    });
    expect(gate3).toBeUndefined();
  });

  it('DENY (auto): pinned + signed declaration + NO authorization → scoped credential DROPPED on the live spawn', async () => {
    anchor = materialize();
    const command = 'aws s3 rm s3://prod-bucket/secret';
    const gate3 = await resolveSpawnGate3FromConfig(anchor.workspace, {
      toolName: TOOL,
      toolCallId: 'c-deny',
      command,
      args: { command },
      resolveAuthorization: () => undefined,
    });
    expect(gate3, 'GATE 3 must auto-activate from the signed declaration').toBeDefined();

    const out = buildInvocationCommand({ mode: 'docker', image: 'i:1' }, spawnEnv(), 'claude', gate3);
    expect(out.args).not.toContain('AWS_SESSION_TOKEN=the-secret');
    expect(out.args).toContain('PATH=/usr/bin');
  });

  it('ALLOW (auto): pinned + signed declaration + VALID authorization → scoped credential INJECTED', async () => {
    anchor = materialize();
    const command = 'aws s3 rm s3://prod-bucket/secret';
    const toolCallId = 'c-allow';
    const auth = validAuth(anchor, toolCallId, command);
    const gate3 = await resolveSpawnGate3FromConfig(anchor.workspace, {
      toolName: TOOL,
      toolCallId,
      command,
      args: { command },
      resolveAuthorization: () => auth,
    });
    expect(gate3).toBeDefined();

    const out = buildInvocationCommand({ mode: 'docker', image: 'i:1' }, spawnEnv(), 'claude', gate3);
    expect(out.args, 'a valid authorization delivers the scoped credential').toContain('AWS_SESSION_TOKEN=the-secret');
  });
});
