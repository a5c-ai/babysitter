/**
 * Milestone D — genty dispatcher / session enforcement seam.
 *
 * Frozen tests authored strictly from docs/design/proof-based-policy-enforcement.md:
 *   §9.4 / AC-23b — the genty MCP dispatcher seam (effects.ts:561-601 dispatcher.dispatch)
 *                   and the genty session tool-execution point (session.ts:1251
 *                   definition.execute) VERIFY authorization BEFORE execution, using the
 *                   in-process model attestation carried on ToolExecutionContext.
 *   §9.4 / AC-49  — the genty dispatcher/session seam is a LOAD-BEARING, un-bypassable
 *                   blocking gate for EVERY covered action: a covered action WITHOUT a
 *                   valid authorization is denied before execution.
 *   §6.2 / AC-39  — the in-process genty attestation is correlation-grade only (agent-held
 *                   key); a credential-touching action defaults to requireProxyAttestation
 *                   and MUST reject the in-process attestation unless explicitly opted out.
 *
 * MODULE PATHS: shipped primitives import from `@a5c-ai/policy-adapter`; the intended
 * Milestone-D genty-seam verifier imports from `../policy-dispatch-gate.js`. Resolution
 * may fail until Milestone D lands — expected. NO syntax errors. The orchestration
 * registry default-provider gotcha does not apply here: this seam test does not
 * instantiate the orchestration registry, so no `fs`/`babysitter` default is triggered.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createKeyPair, signPayload } from '@a5c-ai/genty-core/trust';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';
import {
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  type CommandAuthorizationPayload,
  type TrustRoot,
} from '@a5c-ai/policy-adapter';

// Intended Milestone-D genty dispatcher/session policy gate (§9.4, AC-23b).
import { verifyDispatchAuthorization } from '../policy-dispatch-gate.js';

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

const TOOL_NAME = 'mcp__aws__s3';
const ARGS = { bucket: 'prod', op: 'cp' };
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
    toolCallId: 'call_A',
    commandHash: computeCommandHash(''),
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

function dispatchCtx(opts: {
  authorization?: SignedEnvelope<CommandAuthorizationPayload> | undefined;
  covered?: boolean;
  toolCallId?: string;
  args?: unknown;
  credentialScope?: string;
}) {
  return {
    issuerRoots: [ISSUER_ROOT],
    policyDocHash: POLICY_DOC_HASH,
    currentConfigEpoch: CONFIG_EPOCH,
    minEpochFloor: CONFIG_EPOCH,
    now: Date.now(),
    toolName: TOOL_NAME,
    toolCallId: opts.toolCallId ?? 'call_A',
    commandHash: computeCommandHash(''),
    args: opts.args ?? ARGS,
    credentialScope: opts.credentialScope ?? CRED_SCOPE,
    isCovered: () => opts.covered ?? true,
    resolveAuthorization: () => opts.authorization,
  };
}

describe('Milestone D — genty dispatcher/session enforcement seam (AC-23b, AC-49)', () => {
  it('AC-23b: a covered MCP dispatch WITH a valid authorization is ALLOWED', () => {
    const res = verifyDispatchAuthorization(dispatchCtx({ authorization: signCA(makeCA()) }));
    expect(res.allowed).toBe(true);
  });

  it('AC-23b/AC-49: a covered MCP dispatch with NO valid authorization → deny before execution', () => {
    const res = verifyDispatchAuthorization(dispatchCtx({ authorization: undefined }));
    expect(res.allowed).toBe(false);
    expect(res.reason).toBeTruthy();
  });

  it('AC-23b: a covered dispatch with an EXPIRED authorization → deny', () => {
    const past = Date.now() - 10_000;
    const res = verifyDispatchAuthorization(
      dispatchCtx({
        authorization: signCA(
          makeCA({
            issuedAt: new Date(past - 120_000).toISOString(),
            expiresAt: new Date(past).toISOString(),
          }),
        ),
      }),
    );
    expect(res.allowed).toBe(false);
  });

  it('AC-34a: an authorization bound to a DIFFERENT toolCallId (sibling call, same turn) → deny', () => {
    const res = verifyDispatchAuthorization(
      dispatchCtx({ authorization: signCA(makeCA({ toolCallId: 'call_A' })), toolCallId: 'call_B' }),
    );
    expect(res.allowed).toBe(false);
  });

  it('AC-32: args MUTATED between authorization and dispatch → argsHash mismatch → deny (TOCTOU)', () => {
    const res = verifyDispatchAuthorization(
      dispatchCtx({ authorization: signCA(makeCA()), args: { bucket: 'prod', op: 'rm' } }),
    );
    expect(res.allowed).toBe(false);
  });

  it('AC-10.1: an authorization signed by a NON-issuer engine key → deny', () => {
    const rogue = createKeyPair();
    const forged = signPayload(rogue.privateKey, rogue.fingerprint, makeCA(), CA_FIELDS);
    const res = verifyDispatchAuthorization(dispatchCtx({ authorization: forged }));
    expect(res.allowed).toBe(false);
  });

  it('any exception during genty-seam verification is a denial, never a pass', () => {
    const res = verifyDispatchAuthorization({ toolName: TOOL_NAME } as never);
    expect(res.allowed).toBe(false);
  });
});
