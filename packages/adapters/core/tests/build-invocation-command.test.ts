/**
 * Tests for buildInvocationCommand — pure transform of SpawnArgs per
 * InvocationMode (local/docker/ssh/k8s).
 */
import { describe, it, expect } from 'vitest';

import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';
import {
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  canonicalizeCredentialIdentity,
  type CommandAuthorizationPayload,
  type CredentialScopeSource,
  type TrustRoot,
} from '@a5c-ai/policy-adapter';

import { buildInvocationCommand } from '../src/spawn-runner.js';
import { CredentialGateDenied, type Gate3Options } from '../src/spawn-invocation.js';
import type { SpawnArgs } from '../src/adapter.js';

const baseSpawn: SpawnArgs = {
  command: 'claude',
  args: ['--print', 'hello'],
  env: { ANTHROPIC_API_KEY: 'secret', FOO: 'bar' },
  cwd: '/repo/my-project',
  usePty: false,
};

describe('buildInvocationCommand', () => {
  it('local mode returns the spawn args unchanged', () => {
    const out = buildInvocationCommand({ mode: 'local' }, baseSpawn, 'claude');
    expect(out.command).toBe('claude');
    expect(out.args).toEqual(['--print', 'hello']);
    expect(out.env).toEqual({ ANTHROPIC_API_KEY: 'secret', FOO: 'bar' });
    expect(out.cwd).toBe('/repo/my-project');
  });

  it('undefined invocation defaults to local', () => {
    const out = buildInvocationCommand(undefined, baseSpawn, 'claude');
    expect(out.command).toBe('claude');
    expect(out.args).toEqual(['--print', 'hello']);
  });

  it('docker mode wraps the spawn in `docker run --rm -i -v cwd:/workspace -w /workspace ... <image> <cmd> <args>`', () => {
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'ghcr.io/anthropics/claude-code:latest' },
      baseSpawn,
      'claude',
    );
    expect(out.command).toBe('docker');
    expect(out.args[0]).toBe('run');
    expect(out.args).toContain('--rm');
    expect(out.args).toContain('-i');
    // Volume mount
    const vIdx = out.args.indexOf('-v');
    expect(vIdx).toBeGreaterThanOrEqual(0);
    expect(out.args[vIdx + 1]).toBe('/repo/my-project:/workspace');
    // Workdir
    const wIdx = out.args.indexOf('-w');
    expect(out.args[wIdx + 1]).toBe('/workspace');
    // Env pass-through
    expect(out.args).toContain('-e');
    expect(out.args).toContain('ANTHROPIC_API_KEY=secret');
    expect(out.args).toContain('FOO=bar');
    // Image then command then args
    const imgIdx = out.args.indexOf('ghcr.io/anthropics/claude-code:latest');
    expect(imgIdx).toBeGreaterThanOrEqual(0);
    expect(out.args.slice(imgIdx + 1)).toEqual(['claude', '--print', 'hello']);
  });

  it('docker mode falls back to catalog image when image not specified', () => {
    const out = buildInvocationCommand({ mode: 'docker' }, baseSpawn, 'claude');
    expect(out.args).toContain('ghcr.io/anthropics/claude-code');
  });

  it('docker mode throws if no image resolvable', () => {
    expect(() =>
      buildInvocationCommand({ mode: 'docker' }, baseSpawn, 'unknown-agent-xyz'),
    ).toThrow(/no image/i);
  });

  it('docker mode honours extra volumes and network', () => {
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'img:1', volumes: ['/a:/b', '/c:/d'], network: 'host' },
      baseSpawn,
      'claude',
    );
    // Both extra volumes appear
    expect(out.args.filter((a) => a === '/a:/b')).toHaveLength(1);
    expect(out.args.filter((a) => a === '/c:/d')).toHaveLength(1);
    const nIdx = out.args.indexOf('--network');
    expect(out.args[nIdx + 1]).toBe('host');
  });

  it('ssh mode transforms to `ssh host -- cd <cwd> && K=V cmd args`', () => {
    const out = buildInvocationCommand(
      { mode: 'ssh', host: 'deploy@remote.example.com' },
      baseSpawn,
      'claude',
    );
    expect(out.command).toBe('ssh');
    expect(out.args).toContain('deploy@remote.example.com');
    expect(out.args).toContain('--');
    const remote = out.args[out.args.length - 1]!;
    expect(remote).toContain('cd ');
    expect(remote).toContain('/repo/my-project');
    expect(remote).toContain('ANTHROPIC_API_KEY=secret');
    expect(remote).toContain('FOO=bar');
    expect(remote).toContain('claude --print hello');
  });

  it('ssh mode includes port and identity file when provided', () => {
    const out = buildInvocationCommand(
      { mode: 'ssh', host: 'h', port: 2200, identityFile: '/home/u/.ssh/id_rsa' },
      baseSpawn,
      'claude',
    );
    const pIdx = out.args.indexOf('-p');
    expect(out.args[pIdx + 1]).toBe('2200');
    const iIdx = out.args.indexOf('-i');
    expect(out.args[iIdx + 1]).toBe('/home/u/.ssh/id_rsa');
  });

  it('k8s mode transforms to `kubectl [-n ns] exec -i <pod> -- env K=V cmd args`', () => {
    const prev = process.env['AGENT_MUX_K8S_POD'];
    process.env['AGENT_MUX_K8S_POD'] = 'claude-pod-1';
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', namespace: 'agents' },
        baseSpawn,
        'claude',
      );
      expect(out.command).toBe('kubectl');
      expect(out.args).toContain('-n');
      expect(out.args).toContain('agents');
      expect(out.args).toContain('exec');
      expect(out.args).toContain('-i');
      expect(out.args).toContain('claude-pod-1');
      expect(out.args).toContain('--');
      // env prefix
      expect(out.args).toContain('env');
      expect(out.args).toContain('ANTHROPIC_API_KEY=secret');
      expect(out.args).toContain('FOO=bar');
      // final cmd + args
      const tail = out.args.slice(-3);
      expect(tail).toEqual(['claude', '--print', 'hello']);
    } finally {
      if (prev === undefined) delete process.env['AGENT_MUX_K8S_POD'];
      else process.env['AGENT_MUX_K8S_POD'] = prev;
    }
  });

  it('k8s mode falls back to agent name when no AGENT_MUX_K8S_POD env set', () => {
    const prev = process.env['AGENT_MUX_K8S_POD'];
    delete process.env['AGENT_MUX_K8S_POD'];
    try {
      const out = buildInvocationCommand({ mode: 'k8s' }, baseSpawn, 'claude');
      expect(out.args).toContain('claude');
    } finally {
      if (prev !== undefined) process.env['AGENT_MUX_K8S_POD'] = prev;
    }
  });

  it('k8s mode includes --context when provided', () => {
    const out = buildInvocationCommand(
      { mode: 'k8s', context: 'prod-cluster' },
      baseSpawn,
      'claude',
    );
    const cIdx = out.args.indexOf('--context');
    expect(out.args[cIdx + 1]).toBe('prod-cluster');
  });

  // ---- SSH signal-propagation wrapper (TBD 2 / spec 11) --------------------
  it('ssh mode includes pseudo-tty flag exactly once for signal propagation', () => {
    const out = buildInvocationCommand(
      { mode: 'ssh', host: 'h' },
      baseSpawn,
      'claude',
    );
    expect(out.args.filter((a) => a === '-t')).toHaveLength(1);
  });

  it('ssh mode wraps remote command in a PID-forwarding trap', () => {
    const out = buildInvocationCommand(
      { mode: 'ssh', host: 'h' },
      baseSpawn,
      'claude',
    );
    const remote = out.args[out.args.length - 1]!;
    // Wrapper is present exactly once.
    expect(remote.match(/exec \/bin\/sh -c/g) ?? []).toHaveLength(1);
    expect(remote).toMatch(/trap .*kill -TERM \$pid.* TERM INT/);
    expect(remote).toContain('wait $pid');
    expect(remote).toContain('claude --print hello');
  });

  // ---- K8s ephemeral pod lifecycle (TBD 3 / spec 13) -----------------------
  it('k8s ephemeral mode uses `kubectl run --rm -i --restart=Never`', () => {
    const prev = process.env['AGENT_MUX_K8S_POD'];
    delete process.env['AGENT_MUX_K8S_POD'];
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', ephemeral: true, namespace: 'agents', image: 'my/img:1' },
        baseSpawn,
        'claude',
      );
      expect(out.command).toBe('kubectl');
      expect(out.args).toContain('run');
      expect(out.args).toContain('--rm');
      expect(out.args).toContain('-i');
      expect(out.args).toContain('--restart=Never');
      expect(out.args).toContain('--image=my/img:1');
      expect(out.args).toContain('-n');
      expect(out.args).toContain('agents');
      // command + its args are tail-positioned after `--`.
      const dashIdx = out.args.lastIndexOf('--');
      expect(out.args.slice(dashIdx + 1)).toEqual(['claude', '--print', 'hello']);
    } finally {
      if (prev !== undefined) process.env['AGENT_MUX_K8S_POD'] = prev;
    }
  });

  it('k8s ephemeral mode propagates resources, serviceAccount, and timeout', () => {
    const out = buildInvocationCommand(
      {
        mode: 'k8s',
        ephemeral: true,
        image: 'my/img:1',
        resources: { cpu: '500m', memory: '512Mi' },
        serviceAccount: 'agent-sa',
        podStartupTimeoutMs: 90000,
      },
      baseSpawn,
      'claude',
    );
    expect(out.args).toContain('--limits=cpu=500m,memory=512Mi');
    expect(out.args).toContain('--serviceaccount=agent-sa');
    expect(out.args).toContain('--timeout=90s');
    // Env is forwarded via --env flags.
    expect(out.args).toContain('--env=ANTHROPIC_API_KEY=secret');
    expect(out.args).toContain('--env=FOO=bar');
  });

  it('k8s ephemeral mode attaches a delete-pod cleanup hook', () => {
    const out = buildInvocationCommand(
      { mode: 'k8s', ephemeral: true, image: 'my/img:1', namespace: 'agents' },
      baseSpawn,
      'claude',
    );
    expect(out.cleanup).toBeDefined();
    expect(out.cleanup!.command).toBe('kubectl');
    expect(out.cleanup!.args).toContain('delete');
    expect(out.cleanup!.args).toContain('pod');
    expect(out.cleanup!.args).toContain('--grace-period=0');
    expect(out.cleanup!.args).toContain('-n');
    expect(out.cleanup!.args).toContain('agents');
  });

  it('k8s mode with explicit `pod` uses exec (no cleanup)', () => {
    const prev = process.env['AGENT_MUX_K8S_POD'];
    delete process.env['AGENT_MUX_K8S_POD'];
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', pod: 'fixed-pod', ephemeral: false, namespace: 'agents' },
        baseSpawn,
        'claude',
      );
      expect(out.args).toContain('exec');
      expect(out.args).toContain('fixed-pod');
      expect(out.args).not.toContain('run');
      expect(out.cleanup).toBeUndefined();
    } finally {
      if (prev !== undefined) process.env['AGENT_MUX_K8S_POD'] = prev;
    }
  });
});

/**
 * Milestone D — GATE 3 wiring into buildInvocationCommand (defect #2: gateCredentialInjection
 * was dead code; the emitters unconditionally emitted docker -e / ssh K=V / k8s env). These
 * tests prove the gate is now INVOKED before each channel: a scoped credential is emitted only
 * with a valid CommandAuthorization; with none it is DROPPED (channel omitted); a REQUIRED
 * scoped credential with no authorization DENIES the spawn (throws CredentialGateDenied).
 *
 * strengthenedTests note: these tests are additive — they prove the CALL SITE wiring the
 * adversarial review (score 22) found missing; the gate primitive itself was already tested.
 */
describe('buildInvocationCommand — GATE 3 credential wiring (AC-23a/AC-50, defect #2)', () => {
  const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');
  const CA_FIELDS = [
    'payloadType', 'policyId', 'policyDocHash', 'configEpoch', 'matchedChainId', 'toolName',
    'toolCallId', 'commandHash', 'argsHash', 'credentialScope', 'evidenceFingerprints',
    'evidenceEnvelopeHashes', 'evidenceStepBindings', 'issuedAt', 'expiresAt',
  ];
  const ISSUER = createKeyPair();
  const ISSUER_ROOT: TrustRoot = {
    fingerprint: ISSUER.fingerprint, kind: 'engine', publicKey: ISSUER.publicKey, label: 'issuer',
  };
  const COMMAND = 'claude';
  const TOOL_CALL_ID = 'call_gate3';
  const CRED_SCOPE = 'aws:prod:s3-ro';
  const CONFIG_EPOCH = 5;
  const POLICY_DOC_HASH = sha256('policy-doc-bytes');
  const STABLE_ID = 'kms:key/prod-s3-ro';
  const IDENTITY = canonicalizeCredentialIdentity(STABLE_ID);
  const CRED_SOURCE: CredentialScopeSource = {
    aliasMap: { 'arn:aws:kms:us-east-1:123:key/prod-s3-ro': STABLE_ID },
    scopeByIdentity: { [IDENTITY]: CRED_SCOPE },
    ambiguousIdentities: [],
  };

  // The spawn whose docker `-e` channel carries a scoped credential env var.
  const spawn: SpawnArgs = {
    command: COMMAND,
    args: ['--print', 'hi'],
    env: { AWS_SESSION_TOKEN: 'the-scoped-secret', FOO: 'bar' },
    cwd: '/repo',
    usePty: false,
  };
  const SCOPED_ARGS = { command: `${COMMAND} --print hi` };

  function makeAuthorization(scopeMatches: boolean): SignedEnvelope<CommandAuthorizationPayload> {
    const now = Date.now();
    const payload: CommandAuthorizationPayload = {
      payloadType: 'command-authorization',
      policyId: 'aws-prod-write',
      policyDocHash: POLICY_DOC_HASH,
      configEpoch: CONFIG_EPOCH,
      matchedChainId: 'human-only',
      toolName: 'Bash',
      toolCallId: TOOL_CALL_ID,
      // GATE 3 recomputes command/args hashes from the EXACT spawn; bind to them.
      commandHash: computeCommandHash(spawn.command),
      argsHash: computeArgsHash(SCOPED_ARGS),
      credentialScope: scopeMatches ? CRED_SCOPE : 'aws:dev:other',
      evidenceFingerprints: ['fp'],
      evidenceEnvelopeHashes: [sha256('e')],
      evidenceStepBindings: [{ stepIndex: 0, requiredKind: 'human-approval', envelopeHash: sha256('e') }],
      // Back-date issuedAt a few seconds so the gate's `now >= issuedAt` bound holds even
      // when the gate captures its `now` before this resolver re-signs (else a
      // millisecond-boundary flake drops the credential); expiresAt stays well in the future.
      issuedAt: new Date(now - 5_000).toISOString(),
      expiresAt: new Date(now + 120_000).toISOString(),
    };
    return signPayload(ISSUER.privateKey, ISSUER.fingerprint, payload, CA_FIELDS);
  }

  function gate3(overrides: Partial<Gate3Options> = {}): Gate3Options {
    return {
      issuerRoots: [ISSUER_ROOT],
      policyDocHash: POLICY_DOC_HASH,
      currentConfigEpoch: CONFIG_EPOCH,
      minEpochFloor: CONFIG_EPOCH,
      now: Date.now(),
      toolName: 'Bash',
      toolCallId: TOOL_CALL_ID,
      command: spawn.command,
      args: SCOPED_ARGS,
      credentialSource: CRED_SOURCE,
      scopedEnvKeys: {
        AWS_SESSION_TOKEN: { alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro' },
      },
      ...overrides,
    };
  }

  it('no gate → all env emitted (back-compat, path unchanged)', () => {
    const out = buildInvocationCommand({ mode: 'docker', image: 'i:1' }, spawn, 'claude');
    expect(out.args).toContain('-e');
    expect(out.args).toContain('AWS_SESSION_TOKEN=the-scoped-secret');
    expect(out.args).toContain('FOO=bar');
  });

  it('scoped credential with a VALID matching authorization is emitted on the docker -e channel', () => {
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'i:1' }, spawn, 'claude',
      gate3({ resolveAuthorization: () => makeAuthorization(true) }),
    );
    expect(out.args).toContain('AWS_SESSION_TOKEN=the-scoped-secret');
    // The non-scoped env var always passes through.
    expect(out.args).toContain('FOO=bar');
  });

  it('scoped credential with NO authorization is DROPPED from the docker -e channel', () => {
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'i:1' }, spawn, 'claude',
      gate3({ resolveAuthorization: () => undefined }),
    );
    // The scoped credential is omitted; the ordinary env var is unaffected.
    expect(out.args).not.toContain('AWS_SESSION_TOKEN=the-scoped-secret');
    expect(out.args).toContain('FOO=bar');
  });

  it('scoped credential with a WRONG-SCOPE authorization is DROPPED (fail closed)', () => {
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'i:1' }, spawn, 'claude',
      gate3({ resolveAuthorization: () => makeAuthorization(false) }),
    );
    expect(out.args).not.toContain('AWS_SESSION_TOKEN=the-scoped-secret');
  });

  it('a REQUIRED scoped credential with no authorization DENIES the spawn (throws)', () => {
    expect(() =>
      buildInvocationCommand(
        { mode: 'docker', image: 'i:1' }, spawn, 'claude',
        gate3({
          resolveAuthorization: () => undefined,
          scopedEnvKeys: {
            AWS_SESSION_TOKEN: { alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro', required: true },
          },
        }),
      ),
    ).toThrow(CredentialGateDenied);
  });

  it('the ssh K=V channel drops an unauthorized scoped credential', () => {
    const out = buildInvocationCommand(
      { mode: 'ssh', host: 'h' }, spawn, 'claude',
      gate3({ resolveAuthorization: () => undefined }),
    );
    const remote = out.args[out.args.length - 1]!;
    expect(remote).not.toContain('AWS_SESSION_TOKEN=');
    expect(remote).toContain('FOO=bar');
  });

  it('the k8s ephemeral --env channel drops an unauthorized scoped credential', () => {
    const prev = process.env['AGENT_MUX_K8S_POD'];
    delete process.env['AGENT_MUX_K8S_POD'];
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', ephemeral: true, image: 'i:1' }, spawn, 'claude',
        gate3({ resolveAuthorization: () => undefined }),
      );
      expect(out.args).not.toContain('--env=AWS_SESSION_TOKEN=the-scoped-secret');
      expect(out.args).toContain('--env=FOO=bar');
    } finally {
      if (prev !== undefined) process.env['AGENT_MUX_K8S_POD'] = prev;
    }
  });

  // ── AC-50 — the NON-ENV credential channels (docker -v mount, k8s serviceaccount) ──

  const SCOPED_MOUNT = '/host/creds:/creds:ro';
  const ORDINARY_MOUNT = '/host/data:/data';

  it('a scoped docker -v mount with a VALID authorization is emitted (AC-50)', () => {
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'i:1', volumes: [SCOPED_MOUNT, ORDINARY_MOUNT] }, spawn, 'claude',
      gate3({
        resolveAuthorization: () => makeAuthorization(true),
        scopedMounts: { [SCOPED_MOUNT]: { alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro' } },
      }),
    );
    // Both the scoped (authorized) and ordinary mounts are present.
    expect(out.args).toContain(SCOPED_MOUNT);
    expect(out.args).toContain(ORDINARY_MOUNT);
  });

  it('a scoped docker -v mount with NO authorization is OMITTED; the ordinary mount stays (AC-50)', () => {
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'i:1', volumes: [SCOPED_MOUNT, ORDINARY_MOUNT] }, spawn, 'claude',
      gate3({
        resolveAuthorization: () => undefined,
        // No scoped ENV keys here — isolate the mount channel.
        scopedEnvKeys: {},
        scopedMounts: { [SCOPED_MOUNT]: { alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro' } },
      }),
    );
    expect(out.args).not.toContain(SCOPED_MOUNT);
    expect(out.args).toContain(ORDINARY_MOUNT);
  });

  it('a REQUIRED scoped docker -v mount with no authorization DENIES the spawn (AC-50)', () => {
    expect(() =>
      buildInvocationCommand(
        { mode: 'docker', image: 'i:1', volumes: [SCOPED_MOUNT] }, spawn, 'claude',
        gate3({
          resolveAuthorization: () => undefined,
          scopedEnvKeys: {},
          scopedMounts: { [SCOPED_MOUNT]: { alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro', required: true } },
        }),
      ),
    ).toThrow(CredentialGateDenied);
  });

  it('a scoped k8s --serviceaccount with a VALID authorization is emitted (AC-50)', () => {
    const prev = process.env['AGENT_MUX_K8S_POD'];
    delete process.env['AGENT_MUX_K8S_POD'];
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', ephemeral: true, image: 'i:1', serviceAccount: 'prod-sa' }, spawn, 'claude',
        gate3({
          resolveAuthorization: () => makeAuthorization(true),
          scopedEnvKeys: {},
          scopedServiceAccount: { name: 'prod-sa', alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro' },
        }),
      );
      expect(out.args).toContain('--serviceaccount=prod-sa');
    } finally {
      if (prev !== undefined) process.env['AGENT_MUX_K8S_POD'] = prev;
    }
  });

  it('a scoped k8s --serviceaccount with NO authorization is STRIPPED (AC-50)', () => {
    const prev = process.env['AGENT_MUX_K8S_POD'];
    delete process.env['AGENT_MUX_K8S_POD'];
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', ephemeral: true, image: 'i:1', serviceAccount: 'prod-sa' }, spawn, 'claude',
        gate3({
          resolveAuthorization: () => undefined,
          scopedEnvKeys: {},
          scopedServiceAccount: { name: 'prod-sa', alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro' },
        }),
      );
      expect(out.args.some((a) => a.startsWith('--serviceaccount='))).toBe(false);
    } finally {
      if (prev !== undefined) process.env['AGENT_MUX_K8S_POD'] = prev;
    }
  });

  it('a REQUIRED scoped k8s --serviceaccount with no authorization DENIES the spawn (AC-50)', () => {
    const prev = process.env['AGENT_MUX_K8S_POD'];
    delete process.env['AGENT_MUX_K8S_POD'];
    try {
      expect(() =>
        buildInvocationCommand(
          { mode: 'k8s', ephemeral: true, image: 'i:1', serviceAccount: 'prod-sa' }, spawn, 'claude',
          gate3({
            resolveAuthorization: () => undefined,
            scopedEnvKeys: {},
            scopedServiceAccount: { name: 'prod-sa', alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro', required: true },
          }),
        ),
      ).toThrow(CredentialGateDenied);
    } finally {
      if (prev !== undefined) process.env['AGENT_MUX_K8S_POD'] = prev;
    }
  });

  it('a non-scoped serviceaccount passes through unchanged (only the SCOPED name is gated)', () => {
    const prev = process.env['AGENT_MUX_K8S_POD'];
    delete process.env['AGENT_MUX_K8S_POD'];
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', ephemeral: true, image: 'i:1', serviceAccount: 'unrelated-sa' }, spawn, 'claude',
        gate3({
          resolveAuthorization: () => undefined,
          scopedEnvKeys: {},
          scopedServiceAccount: { name: 'prod-sa', alias: 'arn:aws:kms:us-east-1:123:key/prod-s3-ro' },
        }),
      );
      // The invocation's SA is not the scoped one, so it is untouched.
      expect(out.args).toContain('--serviceaccount=unrelated-sa');
    } finally {
      if (prev !== undefined) process.env['AGENT_MUX_K8S_POD'] = prev;
    }
  });
});
