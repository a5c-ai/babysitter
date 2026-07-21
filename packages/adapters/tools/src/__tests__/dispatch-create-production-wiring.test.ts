/**
 * Milestone D — PRODUCTION WIRING regression guard for `ToolDispatcher.create` (§9.1 / AC-49).
 *
 * The GATE-1 primitive (`PolicyVerifierHookBridge`) and the `composePolicyBridge`/
 * `loadPolicyVerifierBridge` seam are individually tested, but the shipped
 * `policy-verifier-wiring.test.ts` hand-injects a `FakePolicyBridge` — a MOCK of the very
 * thing under test — and drives `composePolicyBridge` directly. Nothing exercised the REAL
 * `ToolDispatcher.create` factory end-to-end, so neutering its body (e.g. `return new
 * ToolDispatcher(options)`, never loading/composing the policy bridge) left every test green.
 *
 * This test closes that gap. It builds a REAL signed `.policy` config anchor on disk, pins the
 * off-workspace env anchor exactly as production does, then constructs the dispatcher through
 * the REAL `ToolDispatcher.create(options)` — NO `new ToolDispatcher(...)`, NO injected fake
 * bridge — so the deny is produced by the genuine `loadPolicyEnforcementGate` gate loaded by
 * `loadPolicyVerifierBridge` + `composePolicyBridge`. If `ToolDispatcher.create`'s
 * bridge-loading body is removed, no GATE-1 bridge is installed, the covered call executes, and
 * these assertions fail — which is the whole point.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createKeyPair, signPayload } from '@a5c-ai/trust-core';
import type { SignedEnvelope } from '@a5c-ai/trust-core';
import {
  issueCommandAuthorization,
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  type CommandAuthorizationPayload,
} from '@a5c-ai/policy-adapter';

import { ToolDispatcher } from '../dispatch.js';
import { ToolRegistry } from '../registry.js';
import { NoopToolHookBridge } from '../hooks.js';
import type { ToolDescriptor } from '../types.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const CONFIG_ENV = [
  'POLICY_CONFIG_ROOT_FP',
  'POLICY_CONFIG_MIN_EPOCH',
  'POLICY_CONFIG_ROOT_KEY',
  'POLICY_CONFIG_DIR',
  'POLICY_ISSUER_ROOTS',
];

// Covers `Bash` running `aws s3 rm` / `aws s3 cp` under a single human-approval chain.
const POLICY_YAML = `version: 1
commandDefaultAllow: false
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv:
        program: "aws"
        subcommandEquals: ["s3 rm", "s3 cp"]
    chains:
      - id: human-only
        requirements:
          - step:
              kind: human-approval
`;

interface Anchor {
  workspace: string;
  issuerKp: ReturnType<typeof createKeyPair>;
  issuerRoots: { fingerprint: string; kind: 'engine'; publicKey: string; label: string }[];
  configEpoch: number;
  minEpoch: number;
  policyDocHash: string;
  cleanup: () => void;
}

/** Materialize a signed `.policy` anchor on disk and set the off-workspace env pins. */
function materializeAnchor(): Anchor {
  const workspace = mkdtempSync(join(tmpdir(), 'tools-create-wiring-'));
  const configDir = join(workspace, '.policy');
  const policiesDir = join(configDir, 'policies');
  mkdirSync(policiesDir, { recursive: true });

  const trustRootsBytes = JSON.stringify({ trustRoots: [] });
  const policyBytes = POLICY_YAML;

  writeFileSync(join(configDir, 'trust-roots.json'), trustRootsBytes);
  writeFileSync(join(policiesDir, 'aws.yaml'), policyBytes);

  const configRoot = createKeyPair();
  const configEpoch = 7;
  const minEpoch = 7;

  const manifestPayload = {
    payloadType: 'config-manifest' as const,
    configEpoch,
    files: [
      { path: 'trust-roots.json', sha256: sha256(trustRootsBytes) },
      { path: 'policies/aws.yaml', sha256: sha256(policyBytes) },
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

  const issuerKp = createKeyPair();
  const issuerRoots = [
    { fingerprint: issuerKp.fingerprint, kind: 'engine' as const, publicKey: issuerKp.publicKey, label: 'issuer' },
  ];

  process.env.POLICY_CONFIG_ROOT_FP = configRoot.fingerprint;
  process.env.POLICY_CONFIG_MIN_EPOCH = String(minEpoch);
  process.env.POLICY_CONFIG_ROOT_KEY = configRoot.publicKey;
  process.env.POLICY_CONFIG_DIR = configDir;
  process.env.POLICY_ISSUER_ROOTS = JSON.stringify(issuerRoots);

  return {
    workspace,
    issuerKp,
    issuerRoots,
    configEpoch,
    minEpoch,
    policyDocHash: sha256(policyBytes),
    cleanup: () => rmSync(workspace, { recursive: true, force: true }),
  };
}

/** A real, signed CommandAuthorization for `Bash` running the given command, bound to toolCallId. */
function validAuthorization(
  anchor: Anchor,
  toolCallId: string,
  input: unknown,
  command: string,
): SignedEnvelope<CommandAuthorizationPayload> {
  const humanKp = createKeyPair();
  const humanRoot = { fingerprint: humanKp.fingerprint, kind: 'human' as const, publicKey: humanKp.publicKey, label: 'alice' };
  const evidence = signPayload(
    humanKp.privateKey,
    humanKp.fingerprint,
    {
      payloadType: 'human-approval',
      action: 'aws-prod-write',
      scope: 'aws:prod:s3',
      approvedBy: 'alice',
      approvedAt: '2026-07-03T00:00:00.000Z',
    },
    ['payloadType', 'action', 'scope', 'approvedBy', 'approvedAt'],
  );

  const result = issueCommandAuthorization({
    issuerKeyPair: anchor.issuerKp,
    store: { trustRoots: [...anchor.issuerRoots, humanRoot] },
    policyId: 'aws-prod-write',
    policyDocHash: anchor.policyDocHash,
    matchedChainId: 'human-only',
    configEpoch: anchor.configEpoch,
    minEpochFloor: anchor.minEpoch,
    toolName: 'Bash',
    toolCallId,
    commandHash: computeCommandHash(command),
    argsHash: computeArgsHash(input),
    credentialScope: '',
    authorizationTtlSeconds: 120,
    requiredStepCount: 1,
    evidenceUsed: [{ kind: 'human-approval', envelope: evidence, stepIndex: 0 }],
  });
  if (!result.issued || !result.authorization) throw new Error(`issue failed: ${result.reason}`);
  return result.authorization as SignedEnvelope<CommandAuthorizationPayload>;
}

function registryWith(tools: string[]): ToolRegistry {
  const reg = new ToolRegistry();
  for (const name of tools) {
    const descriptor: ToolDescriptor = { name, description: name, parameters: { type: 'object' }, source: 'builtin' };
    reg.register(descriptor);
  }
  return reg;
}

describe('ToolDispatcher.create — GATE 1 production wiring (real factory, no injected bridge)', () => {
  let anchor: Anchor | undefined;

  beforeEach(() => {
    for (const k of CONFIG_ENV) delete process.env[k];
  });
  afterEach(() => {
    anchor?.cleanup();
    anchor = undefined;
    for (const k of CONFIG_ENV) delete process.env[k];
  });

  it('a covered unauthorized call is DENIED by the bridge the REAL factory loads — executor never runs', async () => {
    anchor = materializeAnchor();
    const registry = registryWith(['Bash']);

    // REAL factory: loads @a5c-ai/policy-adapter's gate via loadPolicyVerifierBridge and composes
    // it in front of the caller hooks via composePolicyBridge. No FakePolicyBridge, no `new`.
    const dispatcher = await ToolDispatcher.create({
      registry,
      policyProjectRoot: anchor.workspace,
      // An "existing" allow-everything bridge proves the policy deny is un-bypassable AND that
      // the factory really installed the policy bridge IN FRONT of it.
      hooks: new NoopToolHookBridge(),
    });

    let executed = false;
    const result = await dispatcher.dispatch(
      { toolName: 'Bash', input: { command: 'aws s3 rm s3://prod/secret' }, toolCallId: 'call-deny-1' },
      async () => {
        executed = true;
        return 'ran';
      },
    );

    // If create()'s bridge-loading body is neutered, no GATE-1 bridge exists → executed=true and
    // no deny surfaces → these three assertions all fail.
    expect(executed).toBe(false);
    expect(result.output).toBeNull();
    expect(result.error).toContain('CommandAuthorization');
  });

  it('the same covered call WITH a valid CommandAuthorization is ALLOWED through the real gate', async () => {
    anchor = materializeAnchor();
    const registry = registryWith(['Bash']);
    const input = { command: 'aws s3 rm s3://prod/secret' };
    const toolCallId = 'call-allow-1';
    const auth = validAuthorization(anchor, toolCallId, input, input.command);

    const dispatcher = await ToolDispatcher.create({
      registry,
      policyProjectRoot: anchor.workspace,
      // The run's authorization store — the ALLOW path threaded through the real GATE-1 bridge.
      policyResolveAuthorization: () => auth,
    });

    let executed = false;
    const result = await dispatcher.dispatch(
      { toolName: 'Bash', input, toolCallId },
      async () => {
        executed = true;
        return 'ran';
      },
    );

    expect(executed, result.error ? String(result.error) : 'expected allow').toBe(true);
    expect(result.output).toBe('ran');
    expect(result.error).toBeUndefined();
  });

  it('an UNCOVERED tool passes through the real factory-built dispatcher and executes', async () => {
    anchor = materializeAnchor();
    const registry = registryWith(['Read']);

    const dispatcher = await ToolDispatcher.create({ registry, policyProjectRoot: anchor.workspace });

    let executed = false;
    const result = await dispatcher.dispatch(
      { toolName: 'Read', input: { path: 'README.md' }, toolCallId: 'call-read-1' },
      async () => {
        executed = true;
        return 'file contents';
      },
    );
    expect(executed).toBe(true);
    expect(result.output).toBe('file contents');
  });
});
