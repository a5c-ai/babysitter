import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveSpawnGate3, __resetSpawnGateCache } from '../policy-spawn-gate.js';
import { buildInvocationCommand } from '../spawn-invocation.js';

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
