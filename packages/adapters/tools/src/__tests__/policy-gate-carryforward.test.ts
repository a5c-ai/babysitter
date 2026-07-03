/**
 * Milestone D — carry-forward acceptance tests routed through the GATE-1 verifier.
 *
 * Frozen tests authored strictly from docs/design/proof-based-policy-enforcement.md:
 *   §6.5 / AC-18 / AC-44(ii) — a covered action requiring proxy attestation, routed through
 *                   PASSTHROUGH proxy mode (no completionEngine → no attestation produced),
 *                   MUST be DENIED on that path (fail closed). Passthrough model calls cannot
 *                   satisfy a proxy-attestation requirement.
 *   §11  / AC-44(i) — for a non-blocking GATE-2 adapter, a covered-but-unauthorized call is
 *                   still denied by GATE 1 — the overall system is fail-closed even when
 *                   GATE 2 is advisory. (The GATE-2 suite asserts the advisory classification;
 *                   this asserts GATE 1 catches it regardless of GATE 2 mode.)
 *   §10.1/ AC-45 — off-workspace POLICY_CONFIG_DIR is the documented default; an on-disk
 *                   `.policy` tamper is caught by the manifest signature — a gate honoring a
 *                   config whose manifest verification failed MUST deny-all (no authorization).
 *   §14  / AC-53 note — a streamed `outputContent` being unattested is DOCUMENTED (not a gate
 *                   failure): the gate resolves attestation by toolCallId + argsHash binding,
 *                   independent of streamed output content.
 *
 * MODULE PATHS: the intended Milestone-D GATE-1 verifier imports from
 * `../policy-verifier-hook.js`. Resolution may fail until Milestone D lands — expected.
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

import type { ToolCallContext, ToolDescriptor } from '../types.js';
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

const COMMAND = 'aws s3 cp a b';
const ARGS = { command: COMMAND };
const TOOL_NAME = 'Bash';
const CRED_SCOPE = 'aws:prod:s3-ro';
const POLICY_DOC_HASH = sha256('policy-doc-bytes');
const CONFIG_EPOCH = 5;
const DESCRIPTOR: ToolDescriptor = { name: TOOL_NAME } as ToolDescriptor;

function ctx(overrides: Partial<ToolCallContext> = {}): ToolCallContext {
  // Defect #3: the fallback-to-authorization toolCallId tautology was removed, so a
  // covered action MUST carry the ACTUAL executing tool-call id (matching the CA's
  // `call_A`), as production now threads through the dispatch layer.
  return { toolName: TOOL_NAME, input: ARGS, runId: 'run-1', sessionId: 'sess-1', toolCallId: 'call_A', ...overrides };
}

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

function signCA(payload: CommandAuthorizationPayload): SignedEnvelope<CommandAuthorizationPayload> {
  return signPayload(ISSUER.privateKey, ISSUER.fingerprint, payload, CA_FIELDS);
}

describe('Milestone D carry-forward — GATE-1 fail-closed behaviors (AC-44, AC-45, AC-53 note)', () => {
  it('AC-44(ii)/AC-18: a covered action requiring proxy attestation on PASSTHROUGH mode → deny', () => {
    // Passthrough proxy mode produces NO attestation, so no authorization can be issued for
    // a credential-touching action (requireProxyAttestation defaults true). The resolver
    // returns no authorization → deny.
    const bridge = new PolicyVerifierHookBridge({
      issuerRoots: [ISSUER_ROOT],
      policyDocHash: POLICY_DOC_HASH,
      currentConfigEpoch: CONFIG_EPOCH,
      minEpochFloor: CONFIG_EPOCH,
      isCovered: () => true,
      credentialScopeFor: () => CRED_SCOPE,
      commandDefaultAllow: false,
      defaultDenyScopes: [],
      // Passthrough: no proxy attestation → no valid authorization for this call.
      resolveAuthorization: () => undefined,
    });
    return bridge.beforeToolUse(ctx(), DESCRIPTOR).then((result) => {
      expect(result?.decision).toBe('deny');
    });
  });

  it('AC-44(i): even with GATE 2 advisory, a covered-but-unauthorized call is denied by GATE 1', () => {
    // GATE 1 does not depend on GATE 2 mode; a covered call with no authorization denies
    // here regardless of whether GATE 2 was advisory (non-blocking) or blocking.
    const bridge = new PolicyVerifierHookBridge({
      issuerRoots: [ISSUER_ROOT],
      policyDocHash: POLICY_DOC_HASH,
      currentConfigEpoch: CONFIG_EPOCH,
      minEpochFloor: CONFIG_EPOCH,
      isCovered: () => true,
      credentialScopeFor: () => CRED_SCOPE,
      commandDefaultAllow: false,
      defaultDenyScopes: [],
      resolveAuthorization: () => undefined,
    });
    return bridge.beforeToolUse(ctx(), DESCRIPTOR).then((result) => {
      expect(result?.decision).toBe('deny');
    });
  });

  it('AC-45: a gate whose config-manifest verification FAILED denies-all (no authorization honored)', () => {
    // If the on-disk `.policy` config was tampered (manifest signature invalid), the gate
    // must deny-all — even a well-formed authorization is not honored under untrusted config.
    const bridge = new PolicyVerifierHookBridge({
      issuerRoots: [ISSUER_ROOT],
      policyDocHash: POLICY_DOC_HASH,
      currentConfigEpoch: CONFIG_EPOCH,
      minEpochFloor: CONFIG_EPOCH,
      isCovered: () => true,
      credentialScopeFor: () => CRED_SCOPE,
      commandDefaultAllow: false,
      defaultDenyScopes: [],
      // The config manifest failed to verify (tampered `.policy`) → deny-all.
      configTrusted: false,
      resolveAuthorization: () => signCA(makeCA()),
    });
    return bridge.beforeToolUse(ctx(), DESCRIPTOR).then((result) => {
      expect(result?.decision).toBe('deny');
    });
  });

  it('AC-53 note: attestation resolution uses toolCallId+argsHash binding regardless of streamed outputContent', () => {
    // A valid authorization bound to this call's toolCallId + argsHash is honored even
    // though streamed `outputContent` is unattested (documented; not a gate failure). The
    // gate does not require outputContent attestation — only the toolCallId+argsHash binding.
    const bridge = new PolicyVerifierHookBridge({
      issuerRoots: [ISSUER_ROOT],
      policyDocHash: POLICY_DOC_HASH,
      currentConfigEpoch: CONFIG_EPOCH,
      minEpochFloor: CONFIG_EPOCH,
      isCovered: () => true,
      credentialScopeFor: () => CRED_SCOPE,
      commandDefaultAllow: false,
      defaultDenyScopes: [],
      configTrusted: true,
      resolveAuthorization: () => signCA(makeCA()),
    });
    return bridge.beforeToolUse(ctx(), DESCRIPTOR).then((result) => {
      expect(result?.decision).not.toBe('deny');
    });
  });
});
