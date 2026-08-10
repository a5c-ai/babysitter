/**
 * Milestone D — PRODUCTION wiring seam test (§9 / AC-49 / AC-45 / AC-23 / AC-38b).
 *
 * These tests prove the gate runs on the REAL path WITHOUT the caller injecting config:
 * they materialize a signed `.policy` config anchor on disk, set the off-workspace pins
 * (POLICY_CONFIG_ROOT_FP / _MIN_EPOCH / _KEY / _DIR / POLICY_ISSUER_ROOTS), call
 * `loadPolicyEnforcementGate(workspace)` exactly as production does, and assert:
 *   - with the anchor pinned, a COVERED action with NO valid authorization is DENIED, and
 *     with a VALID authorization is ALLOWED (AC-49);
 *   - an UNCOVERED command-bearing action is denied (AC-38b default-deny);
 *   - a corrupt/untrusted manifest denies every covered action (AC-45 fail-closed);
 *   - with NO anchor pinned, enforcement is inactive (back-compat).
 *
 * strengthenedTests note: this file did not exist before — the primitives shipped
 * un-wired. It corrects the gap the adversarial review (score 22) flagged: the gate now
 * runs on the real path with no caller wiring.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createKeyPair, signPayload } from '@a5c-ai/trust-core';
import type { SignedEnvelope } from '@a5c-ai/trust-core';

import { loadPolicyEnforcementGate } from '../policy-enforcement-wiring.js';
import {
  issueCommandAuthorization,
  type CommandAuthorizationPayload,
} from '../index.js';
import type { TrustRoot } from '../verify-envelope-trusted.js';
import { argsHash as computeArgsHash, commandHash as computeCommandHash } from '../canonicalize-args.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const CONFIG_ENV = [
  'POLICY_CONFIG_ROOT_FP',
  'POLICY_CONFIG_MIN_EPOCH',
  'POLICY_CONFIG_ROOT_KEY',
  'POLICY_CONFIG_DIR',
  'POLICY_ISSUER_ROOTS',
];

// A minimal policy: covers `Bash` running `aws s3 rm` under a human-approval chain. The
// chain shape does not matter for the wiring test (issuance is faked with a valid
// authorization) — what matters is COVERAGE + the requiredStepCount from the chain.
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
  configRoot: ReturnType<typeof createKeyPair>;
  issuerKp: ReturnType<typeof createKeyPair>;
  issuerRoots: TrustRoot[];
  configEpoch: number;
  minEpoch: number;
  policyDocHash: string;
  cleanup: () => void;
}

/** Materialize a signed `.policy` anchor on disk and set the off-workspace env pins. */
function materializeAnchor(): Anchor {
  const workspace = mkdtempSync(join(tmpdir(), 'policy-wiring-'));
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
  const issuerRoots: TrustRoot[] = [
    { fingerprint: issuerKp.fingerprint, kind: 'engine', publicKey: issuerKp.publicKey, label: 'issuer' },
  ];

  process.env.POLICY_CONFIG_ROOT_FP = configRoot.fingerprint;
  process.env.POLICY_CONFIG_MIN_EPOCH = String(minEpoch);
  process.env.POLICY_CONFIG_ROOT_KEY = configRoot.publicKey;
  process.env.POLICY_CONFIG_DIR = configDir;
  process.env.POLICY_ISSUER_ROOTS = JSON.stringify(issuerRoots);

  return {
    workspace,
    configRoot,
    issuerKp,
    issuerRoots,
    configEpoch,
    minEpoch,
    policyDocHash: sha256(policyBytes),
    cleanup: () => rmSync(workspace, { recursive: true, force: true }),
  };
}

/** A valid CommandAuthorization for `Bash` running `aws s3 rm x` bound to toolCallId. */
function validAuthorization(anchor: Anchor, toolCallId: string, input: unknown, command: string) {
  // One human-approval evidence, verified against a store that trusts it, bound to step 0.
  const humanKp = createKeyPair();
  const humanRoot: TrustRoot = {
    fingerprint: humanKp.fingerprint,
    kind: 'human',
    publicKey: humanKp.publicKey,
    label: 'alice',
  };
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

describe('Milestone D — production wiring seam (AC-49 / AC-45 / AC-38b)', () => {
  let anchor: Anchor | undefined;

  beforeEach(() => {
    for (const k of CONFIG_ENV) delete process.env[k];
  });
  afterEach(() => {
    anchor?.cleanup();
    anchor = undefined;
    for (const k of CONFIG_ENV) delete process.env[k];
  });

  it('no anchor pinned → enforcement inactive (back-compat, path unchanged)', async () => {
    const result = await loadPolicyEnforcementGate('/tmp/no-anchor');
    expect(result.enforcementActive).toBe(false);
  });

  it('AC-49: anchor pinned, COVERED action with NO authorization → DENY on the real path', async () => {
    anchor = materializeAnchor();
    // No authorization store → resolver returns undefined.
    const gate = await loadPolicyEnforcementGate(anchor.workspace);
    expect(gate.enforcementActive).toBe(true);
    if (gate.enforcementActive !== true) return;

    const decision = gate.policyToolGate({
      toolName: 'Bash',
      toolCallId: 'call-1',
      input: { command: 'aws s3 rm s3://bucket/key' },
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/no CommandAuthorization/i);
  });

  it('AC-49: anchor pinned, COVERED action with a VALID authorization → ALLOW', async () => {
    anchor = materializeAnchor();
    const input = { command: 'aws s3 rm s3://bucket/key' };
    const toolCallId = 'call-allow';
    const auth = validAuthorization(anchor, toolCallId, input, input.command);

    const gate = await loadPolicyEnforcementGate(anchor.workspace, () => auth);
    expect(gate.enforcementActive).toBe(true);
    if (gate.enforcementActive !== true) return;

    const decision = gate.policyToolGate({ toolName: 'Bash', toolCallId, input });
    expect(decision.allowed, decision.reason).toBe(true);
  });

  it('AC-34a: a valid authorization does NOT verify for a DIFFERENT executing toolCallId', async () => {
    anchor = materializeAnchor();
    const input = { command: 'aws s3 rm s3://bucket/key' };
    const auth = validAuthorization(anchor, 'call-A', input, input.command);

    // Resolver returns the same authorization, but the executing id is a sibling call.
    const gate = await loadPolicyEnforcementGate(anchor.workspace, () => auth);
    if (gate.enforcementActive !== true) throw new Error('expected active');

    const decision = gate.policyToolGate({ toolName: 'Bash', toolCallId: 'call-B', input });
    expect(decision.allowed).toBe(false);
  });

  it('AC-38b: an UNCOVERED command-bearing action is denied (default-deny)', async () => {
    anchor = materializeAnchor();
    const gate = await loadPolicyEnforcementGate(anchor.workspace);
    if (gate.enforcementActive !== true) throw new Error('expected active');

    const decision = gate.policyToolGate({
      toolName: 'Bash',
      toolCallId: 'call-x',
      input: { command: 'rm -rf /tmp/whatever' },
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/default-deny/i);
  });

  it('AC-45: a corrupt/tampered manifest denies every covered action (fail closed)', async () => {
    anchor = materializeAnchor();
    // Tamper the manifest on disk AFTER signing so its signature no longer verifies.
    const manifestPath = join(anchor.workspace, '.policy', 'config-manifest.json');
    writeFileSync(manifestPath, '{"payload":{"payloadType":"config-manifest"},"signature":"bad"}');

    const gate = await loadPolicyEnforcementGate(anchor.workspace);
    expect(gate.enforcementActive).toBe(true);
    if (gate.enforcementActive !== true) return;
    expect(gate.configError).toBeDefined();

    const decision = gate.policyToolGate({
      toolName: 'Bash',
      toolCallId: 'call-y',
      input: { command: 'aws s3 rm s3://bucket/key' },
    });
    expect(decision.allowed).toBe(false);
  });

  it('AC-49: the MCP dispatcher gate denies a covered dispatch with no authorization', async () => {
    anchor = materializeAnchor();
    const gate = await loadPolicyEnforcementGate(anchor.workspace);
    if (gate.enforcementActive !== true) throw new Error('expected active');

    // An MCP tool named to match a covered action but with no authorization.
    const decision = gate.mcpPolicyGate({
      toolName: 'Bash',
      input: { command: 'aws s3 cp a b' },
      runId: 'r1',
      sessionId: 's1',
    });
    expect(decision.allowed).toBe(false);
  });
});
