/**
 * Milestone D — GATE 1 (ToolDispatcher.beforeToolUse) policy verifier.
 *
 * Frozen tests authored strictly from docs/design/proof-based-policy-enforcement.md:
 *   §9.1 / AC-23  — GATE 1 is the beforeToolUse injection point; a covered call with no
 *                   valid CommandAuthorization returns { decision: 'deny', reason }.
 *   §9   / AC-23  — uniform gate contract: for a COVERED action, resolve evidence,
 *                   evaluate policy, obtain/verify the CommandAuthorization with the exact
 *                   toolCallId / argsHash / commandHash / credentialScope about to execute
 *                   (recomputed at THIS gate); any failure or throw → deny (fail closed).
 *                   For an UNCOVERED action: non-command-bearing → pass-through UNLESS a
 *                   defaultDeny scope matches; command-bearing → deny unless
 *                   commandDefaultAllow.
 *   §9.4 / AC-49  — GATE 1 is the LOAD-BEARING, un-bypassable blocking gate for ALL
 *                   covered actions (credential-bearing or not).
 *   §5   / AC-10  — the authorization must bind toolName + toolCallId + commandHash +
 *                   argsHash + credentialScope + configEpoch, verified via
 *                   verifyCommandAuthorization; invalid/missing/expired/mutated/
 *                   wrong-epoch → deny.
 *   §14  / AC-53  — a covered action whose INPUT a GATE-1 hook mutates AFTER attestation
 *                   MUST fail closed (deny).
 *
 * Adversarial cases are MANDATORY and each asserts deny / short-circuit.
 *
 * MODULE PATHS: shipped Milestone-A/B primitives import from `@a5c-ai/policy-adapter`;
 * the intended Milestone-D bridge imports from `../policy-verifier-hook.js`. Resolution
 * may fail until Milestone D lands — expected. NO syntax errors.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/trust-core';
import type { SignedEnvelope } from '@a5c-ai/trust-core';
import {
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  type CommandAuthorizationPayload,
  type TrustRoot,
} from '@a5c-ai/policy-adapter';

import type { ToolCallContext, ToolDescriptor } from '../types.js';
// Intended Milestone-D GATE-1 verifier bridge (§9.1 PolicyVerifierHookBridge).
import { PolicyVerifierHookBridge } from '../policy-verifier-hook.js';

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

// A covered Bash command with a bound credential scope.
const COMMAND = 'aws s3 cp a b';
const ARGS = { command: COMMAND };
const TOOL_NAME = 'Bash';
const TOOL_CALL_ID = 'call_A';
const CRED_SCOPE = 'aws:prod:s3-ro';
const POLICY_DOC_HASH = sha256('policy-doc-bytes');
const CONFIG_EPOCH = 5;

function makeCA(overrides: Partial<CommandAuthorizationPayload> = {}): CommandAuthorizationPayload {
  const now = Date.now();
  return {
    payloadType: 'command-authorization',
    policyId: 'aws-prod-write',
    policyDocHash: POLICY_DOC_HASH,
    configEpoch: CONFIG_EPOCH,
    matchedChainId: 'human-plus-opus',
    toolName: TOOL_NAME,
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
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 120_000).toISOString(),
    ...overrides,
  };
}

function signCA(
  payload: CommandAuthorizationPayload,
  fields: string[] = CA_FIELDS,
): SignedEnvelope<CommandAuthorizationPayload> {
  return signPayload(ISSUER.privateKey, ISSUER.fingerprint, payload, fields);
}

const DESCRIPTOR: ToolDescriptor = { name: TOOL_NAME } as ToolDescriptor;

function ctx(overrides: Partial<ToolCallContext> = {}): ToolCallContext {
  return {
    toolName: TOOL_NAME,
    input: ARGS,
    runId: 'run-1',
    sessionId: 'sess-1',
    // The ACTUAL executing tool-call id (AC-34a). Defect #3 removed the fallback-to-
    // authorization tautology, so a covered action MUST carry the real executing id (as
    // production now threads through the dispatch layer); binding to the authorization's
    // own id is forbidden.
    toolCallId: TOOL_CALL_ID,
    ...overrides,
  };
}

/**
 * Build a GATE-1 bridge for a covered `Bash aws s3 cp` action. The bridge is configured
 * with: the integrity-verified policy doc hash + config epoch/floor, the issuer roots,
 * and a resolver that returns the CommandAuthorization for this tool call (or none).
 */
function makeBridge(opts: {
  authorization?: SignedEnvelope<CommandAuthorizationPayload> | undefined;
  covered?: boolean;
  commandDefaultAllow?: boolean;
  defaultDenyScopes?: string[];
  minEpochFloor?: number;
  currentConfigEpoch?: number;
  credentialScope?: string;
}): PolicyVerifierHookBridge {
  return new PolicyVerifierHookBridge({
    issuerRoots: [ISSUER_ROOT],
    policyDocHash: POLICY_DOC_HASH,
    currentConfigEpoch: opts.currentConfigEpoch ?? CONFIG_EPOCH,
    minEpochFloor: opts.minEpochFloor ?? CONFIG_EPOCH,
    // The gate matches coverage on the canonicalized argv (AC-23/AC-38); the fixture
    // marks `Bash aws s3 cp` as covered with credential scope CRED_SCOPE.
    isCovered: () => opts.covered ?? true,
    credentialScopeFor: () => opts.credentialScope ?? CRED_SCOPE,
    commandDefaultAllow: opts.commandDefaultAllow ?? false,
    defaultDenyScopes: opts.defaultDenyScopes ?? [],
    // The authorization resolver returns the (possibly missing) CA bound to this call.
    resolveAuthorization: () => opts.authorization,
  });
}

describe('Milestone D — GATE 1 policy verifier (AC-23, AC-10, AC-49, AC-53)', () => {
  it('AC-23: a covered action with a valid authorization is ALLOWED (no deny)', async () => {
    const bridge = makeBridge({ authorization: signCA(makeCA()) });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).not.toBe('deny');
  });

  it('AC-23/AC-49: a COVERED action with NO authorization → deny short-circuit', async () => {
    const bridge = makeBridge({ authorization: undefined });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).toBe('deny');
    expect(result?.reason).toBeTruthy();
  });

  it('AC-10.1: an authorization signed by a NON-issuer key → deny', async () => {
    const rogue = createKeyPair();
    const forged = signPayload(rogue.privateKey, rogue.fingerprint, makeCA(), CA_FIELDS);
    const bridge = makeBridge({ authorization: forged });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });

  it('AC-10.2: an EXPIRED authorization → deny', async () => {
    const past = Date.now() - 10_000;
    const expired = signCA(
      makeCA({
        issuedAt: new Date(past - 120_000).toISOString(),
        expiresAt: new Date(past).toISOString(),
      }),
    );
    const bridge = makeBridge({ authorization: expired });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });

  it('AC-2/AC-8: an authorization missing toolCallId from signedFields → deny', async () => {
    const partial = CA_FIELDS.filter((f) => f !== 'toolCallId');
    const bridge = makeBridge({ authorization: signCA(makeCA(), partial) });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });

  it('AC-10.3a: authorization bound to a DIFFERENT toolCallId (replay within turn) → deny', async () => {
    // Authorization issued for call_A; this gate executes sibling call_B in the same turn.
    // The executing tool-call id MUST be carried on the context so the gate can bind it;
    // a CA bound to call_A must not authorize the execution of call_B.
    const bridge = makeBridge({ authorization: signCA(makeCA({ toolCallId: 'call_A' })) });
    const executingCtxB = { ...ctx(), toolCallId: 'call_B' } as ToolCallContext;
    const result = await bridge.beforeToolUse(executingCtxB, DESCRIPTOR);
    expect(result?.decision).toBe('deny');
    expect(result?.reason).toBeTruthy();
    // Sanity: the SAME gate with the matching executing id (call_A) does NOT deny,
    // proving the deny above is due to the toolCallId mismatch, not an unrelated cause.
    const executingCtxA = { ...ctx(), toolCallId: 'call_A' } as ToolCallContext;
    const resA = await bridge.beforeToolUse(executingCtxA, DESCRIPTOR);
    expect(resA?.decision).not.toBe('deny');
  });

  it('AC-10.5/AC-32: args MUTATED between authorization and the gate → deny (TOCTOU)', async () => {
    // Authorization binds argsHash over ARGS; the gate recomputes over MUTATED input.
    const bridge = makeBridge({ authorization: signCA(makeCA()) });
    const mutated = ctx({ input: { command: 'aws s3 rm --recursive s3://prod' } });
    const result = await bridge.beforeToolUse(mutated, DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });

  it('AC-10.4/AC-32: command MUTATED after issuance → commandHash mismatch → deny (TOCTOU)', async () => {
    // Authorization commandHash is for `aws s3 cp a b`; execute a different command.
    const bridge = makeBridge({
      authorization: signCA(makeCA({ commandHash: computeCommandHash('aws s3 cp a b') })),
    });
    const result = await bridge.beforeToolUse(
      ctx({ input: { command: 'aws s3 rm s3://prod' } }),
      DESCRIPTOR,
    );
    expect(result?.decision).toBe('deny');
  });

  it('AC-10.10/AC-46: authorization configEpoch != current honored manifest epoch → deny', async () => {
    const bridge = makeBridge({
      authorization: signCA(makeCA({ configEpoch: 5 })),
      currentConfigEpoch: 6,
      minEpochFloor: 6,
    });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });

  it('AC-47: authorization configEpoch BELOW the off-workspace floor → deny (anti-rollback)', async () => {
    const bridge = makeBridge({
      authorization: signCA(makeCA({ configEpoch: 3 })),
      currentConfigEpoch: 3,
      minEpochFloor: 5,
    });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });

  it('AC-10.6: authorization credentialScope does not match the gate scope → deny', async () => {
    const bridge = makeBridge({
      authorization: signCA(makeCA({ credentialScope: 'aws:prod:s3-ro' })),
      credentialScope: 'aws:prod:*',
    });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });

  it('AC-23: UNCOVERED command-bearing action denied when commandDefaultAllow=false', async () => {
    const bridge = makeBridge({
      covered: false,
      commandDefaultAllow: false,
      authorization: undefined,
    });
    const result = await bridge.beforeToolUse(
      ctx({ input: { command: 'curl http://evil' } }),
      DESCRIPTOR,
    );
    expect(result?.decision).toBe('deny');
  });

  it('AC-23: UNCOVERED command-bearing action passes through only when commandDefaultAllow=true', async () => {
    const bridge = makeBridge({
      covered: false,
      commandDefaultAllow: true,
      authorization: undefined,
    });
    const result = await bridge.beforeToolUse(
      ctx({ input: { command: 'echo hi' } }),
      DESCRIPTOR,
    );
    expect(result?.decision).not.toBe('deny');
  });

  it('AC-23c: UNCOVERED action whose credentialScope matches a defaultDeny glob → deny', async () => {
    const bridge = makeBridge({
      covered: false,
      commandDefaultAllow: true,
      defaultDenyScopes: ['aws:prod:*'],
      credentialScope: 'aws:prod:secrets',
      authorization: undefined,
    });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });

  it('AC-49: a COVERED NON-credential action (no scope) with no authorization still → deny', async () => {
    // A covered `Bash rm -rf` that injects NO scoped credential must still be blocked by
    // GATE 1 — the load-bearing gate, not GATE 3 (which only sees credential injection).
    const bridge = makeBridge({
      covered: true,
      credentialScope: '', // no credential scope for this covered action
      authorization: undefined,
    });
    const result = await bridge.beforeToolUse(
      ctx({ input: { command: 'rm -rf /workspace/prod' } }),
      DESCRIPTOR,
    );
    expect(result?.decision).toBe('deny');
  });

  it('AC-53: a covered action whose input a hook MUTATES after attestation fails closed', async () => {
    // Attestation/authorization binds argsHash over the ORIGINAL input. A benign
    // input-mutating GATE-1 hook that changes the args AFTER attestation makes the
    // gate-recomputed argsHash diverge → deny (covered actions must not silently break).
    const authorization = signCA(makeCA());
    const bridge = makeBridge({ authorization });
    const mutatedInputCtx = ctx({ input: { command: 'aws s3 cp a DIFFERENT' } });
    const result = await bridge.beforeToolUse(mutatedInputCtx, DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });

  it('any exception during GATE 1 verification is a denial, never a pass', async () => {
    // A malformed authorization envelope (not an object) must deny, not throw through.
    const bridge = makeBridge({
      authorization: 'not-an-envelope' as unknown as SignedEnvelope<CommandAuthorizationPayload>,
    });
    const result = await bridge.beforeToolUse(ctx(), DESCRIPTOR);
    expect(result?.decision).toBe('deny');
  });
});
