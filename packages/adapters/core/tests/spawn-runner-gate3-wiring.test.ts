/**
 * Milestone E — PRODUCTION WIRING regression guard for spawn-runner's GATE-3 auto-activation
 * (§9.3 / AC-23a / AC-40 / AC-50).
 *
 * `resolveSpawnGate3FromConfig` is unit-tested directly (policy-spawn-gate.test.ts), but the
 * SHIPPED test never drives it THROUGH `spawn-runner`. The runner's else-branch (~L143-154)
 * is the only production caller: when no `RunOptions.policyGate3` is supplied it auto-activates
 * GATE 3 from the signed, manifest-verified `credential-scope-source.json`. Reverting that
 * branch to `gate3 = undefined` leaves every core test green — the deletable wiring this test
 * closes.
 *
 * This test materializes a REAL signed `.policy` anchor whose credential-scope source DECLARES
 * a scoped env credential, pins the off-workspace anchor, and drives the REAL `startSpawnLoop`
 * with a docker invocation and NO `policyGate3` / NO authorization store. Because GATE 3
 * auto-activates through the runner and no authorization exists, the scoped credential is
 * DROPPED from the docker `-e` channel of the actually-spawned command; the ordinary
 * (non-credential) env var still passes through. If the runner's auto-activation branch is
 * reverted to `gate3 = undefined`, the scoped credential is emitted unchanged and the
 * `not.toContain` assertion fails — which is the whole point.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createKeyPair, signPayload } from '@a5c-ai/trust-core';
import type { SignedEnvelope } from '@a5c-ai/trust-core';
import { canonicalizeCredentialIdentity, type CredentialScopeSource } from '@a5c-ai/policy-adapter';

class FakeChild extends EventEmitter {
  stdout = new PassThrough();
  stderr = new PassThrough();
  stdin = { destroyed: false, write: vi.fn(), end: vi.fn() };
  kill = vi.fn();
  pid: number | undefined = 4321;
}

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return { ...actual, spawn: spawnMock };
});

import { RunHandleImpl } from '../src/run-handle-impl.js';
import { startSpawnLoop } from '../src/spawn-runner.js';
import { __resetSpawnGateCache } from '../src/policy-spawn-gate.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const CONFIG_ENV = ['POLICY_CONFIG_ROOT_FP', 'POLICY_CONFIG_MIN_EPOCH', 'POLICY_CONFIG_ROOT_KEY', 'POLICY_CONFIG_DIR', 'POLICY_ISSUER_ROOTS'];

// The scoped env credential this deployment declares (signed config, NOT agent input).
const SCOPED_ENV_KEY = 'AWS_SESSION_TOKEN';
const SCOPED_ENV_VALUE = 'the-secret';
const STABLE_ID = 'kms:key/prod-session-token';
const CRED_ALIAS = 'arn:aws:kms:us-east-1:123:key/prod-session-token';

interface Anchor {
  workspace: string;
  cleanup: () => void;
}

/** Materialize a signed `.policy` anchor whose credential source DECLARES a scoped env cred. */
function materializeAnchor(): Anchor {
  const workspace = mkdtempSync(join(tmpdir(), 'spawn-gate3-wiring-'));
  const configDir = join(workspace, '.policy');
  mkdirSync(configDir, { recursive: true });

  const trustRootsBytes = JSON.stringify({ trustRoots: [] });

  const credSource: CredentialScopeSource = {
    aliasMap: { [CRED_ALIAS]: STABLE_ID },
    scopeByIdentity: { [canonicalizeCredentialIdentity(STABLE_ID)]: 'aws:prod:token' },
    ambiguousIdentities: [],
    // DEPLOYMENT-CONFIG: this is what makes the runner AUTO-ACTIVATE GATE 3 for the spawn.
    scopedCredentials: { scopedEnvKeys: { [SCOPED_ENV_KEY]: { alias: CRED_ALIAS } } },
  };
  const credSourceBytes = JSON.stringify(credSource);

  writeFileSync(join(configDir, 'trust-roots.json'), trustRootsBytes);
  writeFileSync(join(configDir, 'credential-scope-source.json'), credSourceBytes);

  const configRoot = createKeyPair();
  const configEpoch = 9;
  const minEpoch = 9;

  const manifestPayload = {
    payloadType: 'config-manifest' as const,
    configEpoch,
    files: [
      { path: 'trust-roots.json', sha256: sha256(trustRootsBytes) },
      { path: 'credential-scope-source.json', sha256: sha256(credSourceBytes) },
    ],
    issuedAt: '2026-07-03T00:00:00.000Z',
  };
  const manifest: SignedEnvelope<typeof manifestPayload> = signPayload(
    configRoot.privateKey,
    configRoot.fingerprint,
    manifestPayload,
    ['payloadType', 'configEpoch', 'files', 'issuedAt'],
  );
  writeFileSync(join(configDir, 'config-manifest.json'), JSON.stringify(manifest));

  process.env.POLICY_CONFIG_ROOT_FP = configRoot.fingerprint;
  process.env.POLICY_CONFIG_MIN_EPOCH = String(minEpoch);
  process.env.POLICY_CONFIG_ROOT_KEY = configRoot.publicKey;
  process.env.POLICY_CONFIG_DIR = configDir;
  process.env.POLICY_ISSUER_ROOTS = JSON.stringify([]);

  return { workspace, cleanup: () => rmSync(workspace, { recursive: true, force: true }) };
}

function dockerAdapter() {
  return {
    agent: 'claude',
    capabilities: { supportsStdinInjection: false },
    buildSpawnArgs: () => ({
      command: 'claude',
      args: ['--print', 'hi'],
      env: { [SCOPED_ENV_KEY]: SCOPED_ENV_VALUE, PATH: '/usr/bin' },
      cwd: process.cwd(),
      usePty: false,
    }),
    parseEvent: () => null,
  } as any;
}

async function waitForSpawn(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if (spawnMock.mock.calls.length > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe('spawn-runner — GATE 3 auto-activation from signed config (real runner)', () => {
  let anchor: Anchor | undefined;

  beforeEach(() => {
    spawnMock.mockReset();
    spawnMock.mockReturnValue(new FakeChild());
    __resetSpawnGateCache();
    for (const k of CONFIG_ENV) delete process.env[k];
  });
  afterEach(() => {
    anchor?.cleanup();
    anchor = undefined;
    __resetSpawnGateCache();
    for (const k of CONFIG_ENV) delete process.env[k];
  });

  it('drops the scoped credential from the docker -e channel when GATE 3 auto-activates via the runner', async () => {
    anchor = materializeAnchor();
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-gate3', agent: 'claude' });

    // NO policyGate3, NO policyResolveAuthorization → the runner's AUTO-ACTIVATION else-branch
    // (resolveSpawnGate3FromConfig) is the only thing that can build gate3 here.
    startSpawnLoop(handle, dockerAdapter(), {
      agent: 'claude',
      prompt: 'go',
      cwd: anchor.workspace,
      invocation: { mode: 'docker', image: 'img:1' },
    } as any);

    await waitForSpawn();
    expect(spawnMock).toHaveBeenCalledTimes(1);

    const [command, args] = spawnMock.mock.calls[0] as [string, string[], unknown];
    expect(command).toBe('docker');
    // GATE 3 active + no authorization → the scoped credential channel is OMITTED.
    expect(args).not.toContain(`${SCOPED_ENV_KEY}=${SCOPED_ENV_VALUE}`);
    // The ordinary (non-credential) env var still passes through — proves it is GATE 3
    // dropping ONLY the scoped credential, not the env being empty for another reason.
    expect(args).toContain('PATH=/usr/bin');

    child.emit('exit', 0, null);
  });

  it('back-compat: with NO anchor pinned the scoped env passes through unchanged (gate inactive)', async () => {
    // No materializeAnchor() → POLICY_CONFIG_ROOT_FP unset → resolveSpawnGate3FromConfig returns
    // undefined and the docker -e channel emits every env var. This distinguishes the pinned
    // enforcement path from the default deployment.
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-gate3-unpinned', agent: 'claude' });
    startSpawnLoop(handle, dockerAdapter(), {
      agent: 'claude',
      prompt: 'go',
      cwd: mkdtempSync(join(tmpdir(), 'spawn-gate3-unpinned-')),
      invocation: { mode: 'docker', image: 'img:1' },
    } as any);

    await waitForSpawn();
    const [command, args] = spawnMock.mock.calls[0] as [string, string[], unknown];
    expect(command).toBe('docker');
    expect(args).toContain(`${SCOPED_ENV_KEY}=${SCOPED_ENV_VALUE}`);

    child.emit('exit', 0, null);
  });
});
