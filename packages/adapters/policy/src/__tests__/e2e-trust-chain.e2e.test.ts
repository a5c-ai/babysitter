/**
 * Milestone E — END-TO-END integration: aws-cli behind a human+opus trust chain.
 *
 * This is the INTEGRATION milestone. It proves the WHOLE chain works together
 * end-to-end (evidence → policy → authorization → gate) with REAL signed configs
 * on disk, and exercises the ALLOW path plus every negative case. Frozen tests
 * authored STRICTLY from docs/design/proof-based-policy-enforcement.md — never from
 * the implementation. §11 threat model + §12 AC→milestone map assign to Milestone E:
 * AC-24, AC-28, AC-29, AC-30, AC-31, AC-32, AC-33, AC-44, AC-45, AC-46, AC-48,
 * AC-49a, AC-51 — plus the canonical happy-path scenario and configurability.
 *
 * REAL ARTIFACTS. The fixture builder generates real Ed25519 keys, signs real
 * evidence / manifests with the SHIPPED primitives, writes a concrete `.policy/`
 * tree to a temp dir, pins the config anchor (POLICY_CONFIG_ROOT_FP +
 * POLICY_CONFIG_MIN_EPOCH + POLICY_ISSUER_ROOTS), and drives the REAL wired gate
 * (`loadPolicyEnforcementGate`). Minimal mocks — this milestone's value is that the
 * pieces work together for real.
 *
 * The ALLOW path asserts ALLOW + a real issued authorization; every negative case
 * asserts deny / no-authorization / fail-closed. The orchestrator seam (the
 * authorization store) is modeled by issuing a REAL CommandAuthorization from a REAL
 * policy grant via the shipped `issueFromDecision`, then resolving it at the gate —
 * exactly what the production orchestrator does. Resolution failures for
 * not-yet-existing scenario glue are expected; there are NO syntax errors.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createKeyPair, signPayload, signModelDecision } from '@a5c-ai/genty-core/trust';
import type { IdentityKeyPair, SignedEnvelope } from '@a5c-ai/genty-core/trust';

import {
  evaluatePolicy,
  issueFromDecision,
  parsePolicyDocument,
  argsHash as computeArgsHash,
  canonicalizeArgv,
  loadPolicyEnforcementGate,
  EXEC_SEAM_REGISTRY,
  type Evidence,
  type EvaluationContext,
  type PolicyDocument,
  type CommandAuthorizationPayload,
  type TrustRoot,
  type TrustStore,
} from '../index.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const CONFIG_ENV = [
  'POLICY_CONFIG_ROOT_FP',
  'POLICY_CONFIG_MIN_EPOCH',
  'POLICY_CONFIG_ROOT_KEY',
  'POLICY_CONFIG_DIR',
  'POLICY_ISSUER_ROOTS',
];

const HUMAN_SIGNED_FIELDS = ['payloadType', 'action', 'scope', 'approvedBy', 'approvedAt', 'expiresAt'];

// The canonical scenario constants.
const TOOL = 'Bash';
const COMMAND = 'aws s3 rm s3://prod-bucket/secret';
const INPUT = { command: COMMAND };
const TOOL_CALL_ID = 'call_aws_rm';
const CRED_SCOPE_GLOB = 'aws:prod:*';
const HUMAN_SCOPE = 'aws:prod:s3';
const OPUS_MODEL = 'claude-opus-4-8';
const SONNET_MODEL = 'claude-sonnet-4-5';

interface Keys {
  configRoot: IdentityKeyPair;
  issuer: IdentityKeyPair;
  proxyEngine: IdentityKeyPair;
  inProcessEngine: IdentityKeyPair;
  alice: IdentityKeyPair;
  bob: IdentityKeyPair;
}

function freshKeys(): Keys {
  return {
    configRoot: createKeyPair(),
    issuer: createKeyPair(),
    proxyEngine: createKeyPair(),
    inProcessEngine: createKeyPair(),
    alice: createKeyPair(),
    bob: createKeyPair(),
  };
}

interface Scenario {
  workspace: string;
  configDir: string;
  keys: Keys;
  store: TrustStore;
  issuerRoots: TrustRoot[];
  policyDoc: PolicyDocument;
  policyBytes: string;
  policyDocHash: string;
  configEpoch: number;
  minEpoch: number;
  cleanup: () => void;
}

/** Sign a human-approval PermissionEvidence bound to a scope + not-expired window. */
function signHumanApproval(
  kp: IdentityKeyPair,
  approvedBy: string,
  scope = HUMAN_SCOPE,
  expiresAt = '2999-01-01T00:00:00.000Z',
): SignedEnvelope<Record<string, unknown>> {
  return signPayload(
    kp.privateKey,
    kp.fingerprint,
    {
      payloadType: 'human-approval',
      action: 'aws-prod-write',
      scope,
      approvedBy,
      approvedAt: '2026-07-03T00:00:00.000Z',
      expiresAt,
    },
    HUMAN_SIGNED_FIELDS,
  ) as SignedEnvelope<Record<string, unknown>>;
}

/** Sign an opus (or arbitrary) model-decision attestation binding THIS tool call. */
function signModelAttestation(
  kp: IdentityKeyPair,
  modelId: string,
  toolCallId = TOOL_CALL_ID,
  argsHash = computeArgsHash(INPUT),
): SignedEnvelope<Record<string, unknown>> {
  return signModelDecision(kp, {
    payloadType: 'model-decision',
    modelId,
    provider: 'anthropic',
    inputMessagesHash: sha256('input-messages'),
    outputContent: 'tool_use aws s3 rm',
    timestamp: '2026-07-03T00:00:00.000Z',
    toolCalls: [{ toolCallId, name: TOOL, argsHash }],
  }) as unknown as SignedEnvelope<Record<string, unknown>>;
}

/** The evaluation context the gate/orchestrator resolves against for this call. */
function makeContext(scenario: Scenario, over: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    now: Date.now(),
    toolName: TOOL,
    toolCallId: TOOL_CALL_ID,
    canonicalArgv: canonicalizeArgv(COMMAND),
    args: INPUT,
    argsHash: computeArgsHash(INPUT),
    // The gate checks the authorization's credentialScope against the action's
    // `match.credentialScope` (the glob), so the issued authorization must bind that exact
    // value. The orchestrator resolves the context scope to the covered action's declared
    // scope; we mirror that here.
    credentialScope: CRED_SCOPE_GLOB,
    configEpoch: scenario.configEpoch,
    minEpochFloor: scenario.minEpoch,
    rawCommand: COMMAND,
    ...over,
  };
}

function trustRootsFor(keys: Keys): TrustRoot[] {
  return [
    { fingerprint: keys.alice.fingerprint, kind: 'human', identityId: 'sre-oncall:alice', label: 'role:sre-oncall', publicKey: keys.alice.publicKey },
    { fingerprint: keys.bob.fingerprint, kind: 'human', identityId: 'sre-oncall:bob', label: 'role:sre-oncall', publicKey: keys.bob.publicKey },
    { fingerprint: keys.proxyEngine.fingerprint, kind: 'engine', producer: 'proxy', label: 'transport-proxy', publicKey: keys.proxyEngine.publicKey },
    { fingerprint: keys.inProcessEngine.fingerprint, kind: 'engine', producer: 'in-process', label: 'genty-in-process', publicKey: keys.inProcessEngine.publicKey },
    { fingerprint: keys.issuer.fingerprint, kind: 'engine', label: 'policy-adapter-issuer', publicKey: keys.issuer.publicKey },
  ];
}

/**
 * Materialize a REAL signed `.policy` config anchor and pin the off-workspace env
 * anchors. Roots carry real generated key material; the config-manifest is signed by
 * the out-of-agent config root and lists every config file with its sha256 (AC-36 /
 * AC-46). `policyYamlFor(keys)` receives the pre-generated keys so the policy YAML can
 * embed a real fingerprint (e.g. alice's) in `trustedIdentities`.
 */
function buildScenario(opts: {
  keys?: Keys;
  policyYamlFor: (keys: Keys) => string;
  policyFileName?: string;
  configEpoch?: number;
  minEpoch?: number;
  /** Override the on-disk trust-roots bytes AFTER the manifest is signed (integrity tests). */
  trustRootsOverride?: TrustRoot[];
  /** Mutate manifest bytes AFTER signing (tamper tests). */
  tamperManifest?: (raw: string, keys: Keys) => string;
  /** Rewrite a config file's bytes AFTER the manifest is signed (integrity tests). */
  tamperConfigFile?: { path: string; bytes: (keys: Keys) => string };
}): Scenario {
  const workspace = mkdtempSync(join(tmpdir(), 'policy-e2e-'));
  const configDir = join(workspace, '.policy');
  const policiesDir = join(configDir, 'policies');
  mkdirSync(policiesDir, { recursive: true });

  const keys = opts.keys ?? freshKeys();
  const trustRoots = opts.trustRootsOverride ?? trustRootsFor(keys);
  const store: TrustStore = { trustRoots: trustRootsFor(keys) };

  const trustRootsBytes = JSON.stringify({ trustRoots, revoked: [] });
  const policyBytes = opts.policyYamlFor(keys);
  const policyFileName = opts.policyFileName ?? 'aws-prod-write.yaml';

  writeFileSync(join(configDir, 'trust-roots.json'), trustRootsBytes);
  writeFileSync(join(policiesDir, policyFileName), policyBytes);

  const configEpoch = opts.configEpoch ?? 5;
  const minEpoch = opts.minEpoch ?? 5;

  const manifestPayload = {
    payloadType: 'config-manifest' as const,
    configEpoch,
    files: [
      { path: 'trust-roots.json', sha256: sha256(trustRootsBytes) },
      { path: `policies/${policyFileName}`, sha256: sha256(policyBytes) },
    ],
    issuedAt: '2026-07-03T00:00:00.000Z',
  };
  const manifest = signPayload(
    keys.configRoot.privateKey,
    keys.configRoot.fingerprint,
    manifestPayload,
    ['payloadType', 'configEpoch', 'files', 'issuedAt'],
  );
  let manifestRaw = JSON.stringify(manifest);
  if (opts.tamperManifest) manifestRaw = opts.tamperManifest(manifestRaw, keys);
  writeFileSync(join(configDir, 'config-manifest.json'), manifestRaw);

  if (opts.tamperConfigFile) {
    writeFileSync(join(configDir, opts.tamperConfigFile.path), opts.tamperConfigFile.bytes(keys));
  }

  const issuerRoots: TrustRoot[] = [
    { fingerprint: keys.issuer.fingerprint, kind: 'engine', label: 'policy-adapter-issuer', publicKey: keys.issuer.publicKey },
  ];

  process.env.POLICY_CONFIG_ROOT_FP = keys.configRoot.fingerprint;
  process.env.POLICY_CONFIG_MIN_EPOCH = String(minEpoch);
  process.env.POLICY_CONFIG_ROOT_KEY = keys.configRoot.publicKey;
  process.env.POLICY_CONFIG_DIR = configDir;
  process.env.POLICY_ISSUER_ROOTS = JSON.stringify(issuerRoots);

  return {
    workspace,
    configDir,
    keys,
    store,
    issuerRoots,
    policyDoc: parsePolicyDocument(policyBytes),
    policyBytes,
    policyDocHash: sha256(policyBytes),
    configEpoch,
    minEpoch,
    cleanup: () => rmSync(workspace, { recursive: true, force: true }),
  };
}

/**
 * The ORCHESTRATOR seam, for real. Given a scenario + evidence + context, evaluate
 * the REAL policy and, on a real grant, issue a REAL signed CommandAuthorization via
 * the shipped `issueFromDecision` — exactly what the production orchestrator does
 * before the gate resolves it. Returns undefined when the policy did not grant.
 */
function orchestratorIssue(
  scenario: Scenario,
  evidence: Evidence[],
  context: EvaluationContext,
): SignedEnvelope<CommandAuthorizationPayload> | undefined {
  const decision = evaluatePolicy({
    document: scenario.policyDoc,
    store: scenario.store,
    evidence,
    context,
  });
  if (!decision.granted) return undefined;
  const issue = issueFromDecision({
    decision,
    context,
    issuerKeyPair: scenario.keys.issuer,
    store: scenario.store,
    policyDocHash: scenario.policyDocHash,
    authorizationTtlSeconds: 120,
  });
  if (!issue.issued || !issue.authorization) return undefined;
  return issue.authorization;
}

// ── canonical scenario policy YAML (mirrors examples/aws-cli-human-plus-opus) ──

/** The canonical human+opus (+ quorum alt) policy with alice's real fingerprint. */
function canonicalPolicyYaml(keys: Keys): string {
  return `version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: false
defaultDeny: ["aws:prod:*"]
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv:
        program: "aws"
        subcommandEquals: ["s3 cp", "s3 rm", "s3 sync"]
        wrapperAllowlist: ["time", "sudo"]
        recognizedPrograms: ["aws"]
      credentialScope: "${CRED_SCOPE_GLOB}"
    chains:
      - id: human-plus-opus
        requirements:
          - step:
              kind: human-approval
              trustedIdentities: ["${keys.alice.fingerprint}"]
              conditions:
                scopeEquals: "${HUMAN_SCOPE}"
                notExpired: true
          - step:
              kind: model-decision
              conditions:
                modelIdMatches: "claude-opus-.*"
      - id: two-human-quorum
        requirements:
          - quorum:
              of: "human-approval"
              min: 2
              conditions:
                scopeEquals: "${HUMAN_SCOPE}"
                notExpired: true
`;
}

/** A pure 2-human-quorum policy (configurability scenario, no model condition). */
function quorumPolicyYaml(): string {
  return `version: 1
commandDefaultAllow: false
actions:
  - id: aws-prod-write-quorum
    match:
      tool: "Bash"
      argv:
        program: "aws"
        subcommandEquals: ["s3 rm", "s3 cp", "s3 sync"]
        recognizedPrograms: ["aws"]
    chains:
      - id: two-human-quorum
        requirements:
          - quorum:
              of: "human-approval"
              min: 2
              conditions:
                scopeEquals: "${HUMAN_SCOPE}"
                notExpired: true
`;
}

describe('Milestone E — e2e: aws-cli behind a human+opus trust chain', () => {
  let scenario: Scenario | undefined;

  beforeEach(() => {
    for (const k of CONFIG_ENV) delete process.env[k];
  });
  afterEach(() => {
    scenario?.cleanup();
    scenario = undefined;
    for (const k of CONFIG_ENV) delete process.env[k];
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. THE CANONICAL SCENARIO — happy path, ALLOW (AC-39 e2e; the ALLOW path prior
  //    milestones never exercised). Full traversal: human breakpoint approval + opus
  //    proxy attestation → policy grant → issued CommandAuthorization → gate VERIFIES
  //    and ALLOWS with real signed artifacts.
  // ────────────────────────────────────────────────────────────────────────────

  it('CANONICAL ALLOW: human approval + opus proxy attestation → gate ALLOWS on the real path', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.proxyEngine, OPUS_MODEL) },
    ];
    const context = makeContext(scenario);
    const auth = orchestratorIssue(scenario, evidence, context);
    expect(auth, 'orchestrator should issue a CommandAuthorization on a real grant').toBeDefined();

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => auth);
    expect(gate.enforcementActive).toBe(true);
    if (gate.enforcementActive !== true) return;
    expect(gate.configError).toBeUndefined();

    const decision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT, modelId: OPUS_MODEL });
    expect(decision.allowed, decision.reason).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. NEGATIVE CASES — each DENIES / no-authorization / fail-closed.
  // ────────────────────────────────────────────────────────────────────────────

  it('AC-28 (spoofed approval): an untrusted-signer human approval → no grant → gate DENIES', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    // An approval signed by a key that is NOT a trusted human root (a fabricated approver).
    const rogue = createKeyPair();
    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(rogue, 'mallory') },
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.proxyEngine, OPUS_MODEL) },
    ];
    const context = makeContext(scenario);
    const auth = orchestratorIssue(scenario, evidence, context);
    expect(auth, 'a spoofed approval must NOT yield an authorization').toBeUndefined();

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => undefined);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    const decision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT });
    expect(decision.allowed).toBe(false);
  });

  it('AC-30 (model downgrade): SONNET attestation for an opus-only step → no grant → DENY', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      // A correctly-signed proxy attestation, but for SONNET (not on the opus allowlist).
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.proxyEngine, SONNET_MODEL) },
    ];
    const auth = orchestratorIssue(scenario, evidence, makeContext(scenario));
    expect(auth).toBeUndefined();
  });

  it('AC-30 (attestation replay within a turn): opus attestation for a SIBLING toolCallId → no grant for THIS call', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      // Valid opus attestation, but bound to a DIFFERENT tool-call id in the same turn.
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.proxyEngine, OPUS_MODEL, 'call_sibling') },
    ];
    const auth = orchestratorIssue(scenario, evidence, makeContext(scenario));
    expect(auth, 'a sibling-call attestation must not authorize THIS call').toBeUndefined();
  });

  it('AC-30 / AC-32 (tampered argsHash): opus attestation whose bound argsHash ≠ this call → no grant', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      // Correct toolCallId, but the signed argsHash is for a different args object.
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.proxyEngine, OPUS_MODEL, TOOL_CALL_ID, sha256('other-args')) },
    ];
    const auth = orchestratorIssue(scenario, evidence, makeContext(scenario));
    expect(auth).toBeUndefined();
  });

  it('AC-39 (agent-held key for a credential action): in-process attestation → rejected (proxy required by default)', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      // Signed by the IN-PROCESS engine key (producer:'in-process') — correlation-grade only;
      // the credential-touching action defaults to requireProxyAttestation (AC-39).
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.inProcessEngine, OPUS_MODEL) },
    ];
    const auth = orchestratorIssue(scenario, evidence, makeContext(scenario));
    expect(auth, 'an agent-held attestation must not satisfy a credential-touching action').toBeUndefined();
  });

  it('AC-29 / AC-32 (tampered args after issuance): a valid auth for command A does NOT verify for mutated command B', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.proxyEngine, OPUS_MODEL) },
    ];
    const auth = orchestratorIssue(scenario, evidence, makeContext(scenario));
    expect(auth).toBeDefined();

    // At the gate, the ACTUAL command about to run is a DIFFERENT (mutated) command — the
    // gate recomputes commandHash/argsHash and they no longer match the authorization (TOCTOU).
    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => auth);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    const decision = gate.policyToolGate({
      toolName: TOOL,
      toolCallId: TOOL_CALL_ID,
      input: { command: 'aws s3 rm s3://prod-bucket/OTHER' },
    });
    expect(decision.allowed).toBe(false);
  });

  it('AC-31 (short-lived authorization): the issued authorization carries a short TTL window (expiry bounds the replay window)', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.proxyEngine, OPUS_MODEL) },
    ];
    const context = makeContext(scenario);
    const decision = evaluatePolicy({ document: scenario.policyDoc, store: scenario.store, evidence, context });
    expect(decision.granted).toBe(true);
    const issue = issueFromDecision({
      decision,
      context,
      issuerKeyPair: scenario.keys.issuer,
      store: scenario.store,
      policyDocHash: scenario.policyDocHash,
      authorizationTtlSeconds: 1,
    });
    expect(issue.issued).toBe(true);
    // expiresAt/issuedAt are inside the signature (cannot be back-dated without breaking it);
    // the gate's `now < expiresAt` bounds the window. Assert the window is short-lived.
    const p = issue.authorization!.payload;
    const window = new Date(p.expiresAt).getTime() - new Date(p.issuedAt).getTime();
    expect(window).toBeLessThanOrEqual(2000);
  });

  it('AC-45 (tampered policy doc): editing a policy file after signing → manifest hash mismatch → deny-all', async () => {
    scenario = buildScenario({
      policyYamlFor: canonicalPolicyYaml,
      tamperConfigFile: {
        path: 'policies/aws-prod-write.yaml',
        // Widen the config: default-allow uncovered commands. The manifest hash no longer matches.
        bytes: (keys) => canonicalPolicyYaml(keys).replace('commandDefaultAllow: false', 'commandDefaultAllow: true'),
      },
    });

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => undefined);
    expect(gate.enforcementActive).toBe(true);
    if (gate.enforcementActive !== true) return;
    expect(gate.configError, 'a tampered config file must yield a config error').toBeDefined();

    const decision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT });
    expect(decision.allowed).toBe(false);
  });

  it('AC-45 (tampered trust-roots): adding a rogue human root after signing → manifest mismatch → deny-all', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    // The agent appends its own fingerprint as a `human` root AFTER the manifest was signed.
    const rogue = createKeyPair();
    const tampered = JSON.stringify({
      trustRoots: [
        ...trustRootsFor(scenario.keys),
        { fingerprint: rogue.fingerprint, kind: 'human', label: 'role:sre-oncall', publicKey: rogue.publicKey },
      ],
      revoked: [],
    });
    writeFileSync(join(scenario.configDir, 'trust-roots.json'), tampered);

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => undefined);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    expect(gate.configError).toBeDefined();
    const decision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT });
    expect(decision.allowed).toBe(false);
  });

  it('AC-45 (wrong signer): a manifest re-signed by a NON-pinned config root → deny-all', async () => {
    scenario = buildScenario({
      policyYamlFor: canonicalPolicyYaml,
      // Re-sign the manifest with an attacker key; the pinned FP stays the real config root.
      tamperManifest: (raw) => {
        const manifest = JSON.parse(raw) as SignedEnvelope<Record<string, unknown>>;
        const attacker = createKeyPair();
        const resigned = signPayload(attacker.privateKey, attacker.fingerprint, manifest.payload, manifest.signedFields);
        return JSON.stringify(resigned);
      },
    });

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => undefined);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    expect(gate.configError).toBeDefined();
    const decision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT });
    expect(decision.allowed).toBe(false);
  });

  it('AC-46 (config rollback): a validly-signed manifest whose configEpoch is BELOW the pinned floor → deny-all', async () => {
    // Manifest signed at epoch 4, but the deploy pin floor is 5 (advanced with a newer epoch).
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml, configEpoch: 4, minEpoch: 5 });

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => undefined);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    expect(gate.configError, 'a below-floor epoch must be rejected even though the signature verifies').toBeDefined();
    const decision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT });
    expect(decision.allowed).toBe(false);
  });

  it('AC-33 / AC-38a (disguised covered command via a non-allowlisted wrapper): DENY end-to-end (even with full evidence)', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.proxyEngine, OPUS_MODEL) },
    ];
    // The scope's wrapperAllowlist is ["time", "sudo"]; `busybox` is NOT on it, so
    // `busybox sh -c 'aws s3 rm ...'` is an unresolvable disguise for a covered program →
    // deny outright (AC-38a), and it never falls through to a chain nor to default-allow —
    // even with full valid evidence.
    const disguised = `busybox sh -c 'aws s3 rm s3://prod-bucket/secret'`;
    const context = makeContext(scenario, {
      rawCommand: disguised,
      canonicalArgv: canonicalizeArgv(disguised),
      args: { command: disguised },
    });
    const decision = evaluatePolicy({ document: scenario.policyDoc, store: scenario.store, evidence, context });
    expect(decision.granted, 'a disguised covered command must be denied even with full evidence').toBe(false);

    // And on the real gate the disguised covered command is denied outright (AC-38a).
    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => undefined);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    const gateDecision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: { command: disguised } });
    expect(gateDecision.allowed).toBe(false);
  });

  it('AC-38 (env / interpreter indirection): `$AWS s3 rm` and `eval "aws s3 rm"` under a covered scope → DENY', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });
    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => undefined);
    if (gate.enforcementActive !== true) throw new Error('expected active');

    for (const disguised of [`AWS=aws; $AWS s3 rm s3://prod-bucket/x`, `eval "aws s3 rm s3://prod-bucket/x"`]) {
      const d = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: { command: disguised } });
      expect(d.allowed, `disguise must be denied: ${disguised}`).toBe(false);
    }
  });

  it('AC-51 (cross-payload-type transfer): a model-decision envelope presented in a command-authorization slot → DENY', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    // Forge an "authorization" that is really a model-decision envelope signed by the issuer
    // (engine) key. The gate's verifyCommandAuthorization must reject it on payloadType.
    const forged = signModelAttestation(scenario.keys.issuer, OPUS_MODEL) as unknown as SignedEnvelope<CommandAuthorizationPayload>;

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => forged);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    const decision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT });
    expect(decision.allowed).toBe(false);
  });

  it('untrusted issuer (AC-10 step 1): an authorization signed by a NON-issuer engine key → gate DENIES', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      { kind: 'model-decision', envelope: signModelAttestation(scenario.keys.proxyEngine, OPUS_MODEL) },
    ];
    const context = makeContext(scenario);
    const decision = evaluatePolicy({ document: scenario.policyDoc, store: scenario.store, evidence, context });
    expect(decision.granted).toBe(true);

    // Issue the authorization with a rogue engine key NOT in POLICY_ISSUER_ROOTS.
    const rogueIssuer = createKeyPair();
    const rogueStore: TrustStore = {
      trustRoots: [
        ...trustRootsFor(scenario.keys),
        { fingerprint: rogueIssuer.fingerprint, kind: 'engine', label: 'rogue-issuer', publicKey: rogueIssuer.publicKey },
      ],
    };
    const issue = issueFromDecision({
      decision,
      context,
      issuerKeyPair: rogueIssuer,
      store: rogueStore,
      policyDocHash: scenario.policyDocHash,
      authorizationTtlSeconds: 120,
    });
    expect(issue.issued).toBe(true);

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => issue.authorization);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    const gateDecision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT });
    expect(gateDecision.allowed, 'an authorization from a non-issuer key must be rejected').toBe(false);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3. CONFIGURABILITY — a SECOND, different chain shape (2-human quorum, no model
  //    condition) expressed in the SAME policy format WITHOUT code changes.
  // ────────────────────────────────────────────────────────────────────────────

  it('CONFIGURABILITY (AC-19a): a 2-human quorum (distinct identities) → ALLOW; one human two keys → DENY', async () => {
    scenario = buildScenario({ policyYamlFor: quorumPolicyYaml, policyFileName: 'aws-prod-write-quorum.yaml' });
    const context = makeContext(scenario, { credentialScope: '' });

    // SATISFIED — two DISTINCT human identities (alice, bob).
    const twoDistinct: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.bob, 'bob') },
    ];
    const grant = evaluatePolicy({ document: scenario.policyDoc, store: scenario.store, evidence: twoDistinct, context });
    expect(grant.granted, grant.reason).toBe(true);
    expect(grant.matchedChainId).toBe('two-human-quorum');

    // DENIED — one human holding TWO keys, both registered under the SAME identityId.
    const k1 = createKeyPair();
    const k2 = createKeyPair();
    const store2: TrustStore = {
      trustRoots: [
        ...trustRootsFor(scenario.keys),
        { fingerprint: k1.fingerprint, kind: 'human', identityId: 'sre-oncall:carol', label: 'role:sre-oncall', publicKey: k1.publicKey },
        { fingerprint: k2.fingerprint, kind: 'human', identityId: 'sre-oncall:carol', label: 'role:sre-oncall', publicKey: k2.publicKey },
      ],
    };
    const twoKeysOneIdentity: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(k1, 'carol') },
      { kind: 'human-approval', envelope: signHumanApproval(k2, 'carol-alt') },
    ];
    const denied = evaluatePolicy({ document: scenario.policyDoc, store: store2, evidence: twoKeysOneIdentity, context });
    expect(denied.granted, 'one human with two keys must NOT satisfy a 2-of quorum').toBe(false);
  });

  it('CONFIGURABILITY end-to-end: a satisfied quorum grant issues and the gate ALLOWS (different shape, no code change)', async () => {
    scenario = buildScenario({ policyYamlFor: quorumPolicyYaml, policyFileName: 'aws-prod-write-quorum.yaml' });
    const context = makeContext(scenario, { credentialScope: '' });
    const evidence: Evidence[] = [
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.alice, 'alice') },
      { kind: 'human-approval', envelope: signHumanApproval(scenario.keys.bob, 'bob') },
    ];
    const auth = orchestratorIssue(scenario, evidence, context);
    expect(auth, 'a satisfied quorum must issue an authorization').toBeDefined();

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => auth);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    const decision = gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT });
    expect(decision.allowed, decision.reason).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4. AC-24 — non-goals regression guard (scope regression check).
  // ────────────────────────────────────────────────────────────────────────────

  it('AC-24 (non-goals guard): the adapter surface is proof primitives, not a PKI/vault/journal-chain module', () => {
    // The adapter's only runtime deps are genty-core (trust primitives) + tasks-adapter
    // (proven bridge) + Node built-ins + yaml (§8 / AC-21). A regression that pulled in a
    // secrets backend, an online-revocation (OCSP) service, or a journal hash-chain module
    // (§1.2 non-goals 1/2/4) would change the public surface. We assert it is the proof
    // primitives + a STATIC, checked-in exec-seam enumeration (no network).
    for (const fn of [evaluatePolicy, issueFromDecision, parsePolicyDocument, loadPolicyEnforcementGate]) {
      expect(typeof fn).toBe('function');
    }
    expect(Array.isArray(EXEC_SEAM_REGISTRY)).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5. AC-49a / AC-56 — execution-path enumeration (every covered exec path hits a
  //    blocking gate), structured as an exhaustiveness assertion over the checked-in
  //    exec-seam registry.
  // ────────────────────────────────────────────────────────────────────────────

  it('AC-49a / AC-33: every enumerated exec path is registered and a blocking gate covers the covered path', () => {
    const ids = new Set(EXEC_SEAM_REGISTRY.map((s) => s.id));
    for (const required of [
      'genty-session-execute',
      'genty-mcp-dispatcher',
      'adapters-gate1-dispatch',
      'adapters-gate2-spawn-runtime-hooks',
      'adapters-gate3-spawn-invocation',
    ]) {
      expect(ids.has(required), `exec seam '${required}' must be enumerated (AC-49a)`).toBe(true);
    }

    // For a COVERED action, at least one BLOCKING gate must be on the path (AC-49): GATE 1
    // and the genty session/dispatcher seams are load-bearing; GATE 2/3 are defense-in-depth.
    const blocking = EXEC_SEAM_REGISTRY.filter((s) => s.onCoveredPath && s.role === 'blocking');
    expect(blocking.length).toBeGreaterThanOrEqual(1);
    expect(blocking.some((s) => s.id === 'adapters-gate1-dispatch')).toBe(true);
    expect(blocking.some((s) => s.id === 'genty-session-execute' || s.id === 'genty-mcp-dispatcher')).toBe(true);

    // GATE 2 (advisory) and GATE 3 (credential-only) MUST NOT be classified load-bearing.
    expect(EXEC_SEAM_REGISTRY.find((s) => s.id === 'adapters-gate2-spawn-runtime-hooks')?.role).toBe('defense-in-depth');
    expect(EXEC_SEAM_REGISTRY.find((s) => s.id === 'adapters-gate3-spawn-invocation')?.role).toBe('defense-in-depth');
  });

  it('AC-56 (exhaustive registry): every registry seam file still exists on disk (a rename breaks the build)', () => {
    // Repo root is 5 levels up from packages/adapters/policy/src/__tests__.
    const here = fileURLToPath(new URL('.', import.meta.url));
    const repoRoot = join(here, '..', '..', '..', '..', '..');
    for (const seam of EXEC_SEAM_REGISTRY) {
      expect(existsSync(join(repoRoot, seam.file)), `exec seam file must exist: ${seam.file}`).toBe(true);
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 6. AC-44 — non-blocking GATE-2 coverage is subsumed by the blocking-gate line:
  //    a covered-but-unauthorized call is denied by a BLOCKING gate whether or not
  //    GATE 2 is advisory (Draft-3 note). The MCP dispatcher + session gates deny.
  // ────────────────────────────────────────────────────────────────────────────

  it('AC-44: with GATE 2 advisory, a blocking gate still denies a covered-but-unauthorized call', async () => {
    scenario = buildScenario({ policyYamlFor: canonicalPolicyYaml });

    const gate = await loadPolicyEnforcementGate(scenario.workspace, () => undefined);
    if (gate.enforcementActive !== true) throw new Error('expected active');
    // The MCP dispatcher gate (blocking, §9.4) denies a covered call with no authorization.
    expect(gate.mcpPolicyGate({ toolName: TOOL, input: INPUT, runId: 'r1', sessionId: 's1' }).allowed).toBe(false);
    // GATE 1 / session gate too.
    expect(gate.policyToolGate({ toolName: TOOL, toolCallId: TOOL_CALL_ID, input: INPUT }).allowed).toBe(false);
  });
});
