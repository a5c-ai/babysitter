/**
 * @a5c-ai/policy-adapter — proof-based policy enforcement trust core (Milestone A).
 *
 * Depends ONLY on @a5c-ai/genty-core (trust primitives) + @a5c-ai/tasks-adapter
 * (proven bridge) + Node built-ins, so genty and every adapter can consume it
 * without a cycle (design §8).
 */
export {
  verifyEnvelopeTrusted,
  verifyCommandAuthorization,
  verifyTrustChainTrusted,
  REQUIRED_SIGNED_FIELDS,
  EXPECTED_PAYLOAD_TYPE,
} from './verify-envelope-trusted.js';
export type {
  EvidenceKind,
  TrustRoot,
  TrustRootKind,
  TrustStore,
  TrustedVerification,
  CommandAuthorizationPayload,
  CommandAuthorizationGateContext,
  CommandAuthorizationVerification,
  EvidenceStepBinding,
  TrustedChainStep,
  ChainVerification,
} from './verify-envelope-trusted.js';

export { verifyConfigManifest } from './config-manifest.js';
export type {
  ConfigManifestPayload,
  ConfigManifestFileEntry,
  ConfigManifestVerifyContext,
  ConfigManifestVerification,
} from './config-manifest.js';

export { bridgeProvenAnswer } from './proven-bridge.js';
export type {
  BridgeResult,
  BridgeOptions,
  DerivedEvidence,
  DerivedHumanApprovalPayload,
} from './proven-bridge.js';

// ── Milestone B — policy engine ─────────────────────────────────────────────

export {
  canonicalizeArgs,
  canonicalizeArgv,
  argsHash,
  commandHash,
} from './canonicalize-args.js';

export { matchArgv } from './argv-matcher.js';
export type { ArgvMatch, ArgvMatchScope, ArgvMatchResult } from './argv-matcher.js';

export { parsePolicyDocument, loadTrustStore } from './policy-schema.js';
export type {
  PolicyDocument,
  PolicyActionDoc,
  ActionMatch,
  ChainDoc,
  ChainRequirement,
  TypedStep,
  QuorumRequirement,
  StepConditions,
  EvidenceStepKind,
} from './policy-schema.js';

export { evaluatePolicy } from './policy-evaluator.js';
export type {
  Evidence,
  EvaluationContext,
  PolicyDecision as PolicyEvaluationDecision,
  EvaluateInput,
} from './policy-evaluator.js';

export { issueCommandAuthorization, issueFromDecision } from './authorization-issuer.js';
export type {
  IssueRequest,
  IssueResult,
  IssueEvidence,
  IssueFromDecisionRequest,
} from './authorization-issuer.js';

// ── Milestone E — PRODUCTION authorization store (ALLOW path, AC-9 / AC-49) ────

export { createAuthorizationStore } from './authorization-store.js';
export type {
  AuthorizationStore,
  StoreAuthorizationResolver,
  AuthorizationResolveContext,
  InsertFromDecisionRequest,
  InsertResult,
} from './authorization-store.js';

export {
  canonicalizeCredentialIdentity,
  resolveCredentialScope,
} from './credential-identity.js';
export type {
  CredentialScopeSource,
  CredentialAliasMap,
  CredentialScopeResolution,
  ScopedCredentialDeclaration,
} from './credential-identity.js';

// ── Milestone D — tool-layer enforcement (exec-seam registry, AC-56) ─────────

export { EXEC_SEAM_REGISTRY } from './exec-seam-registry.js';
export type { ExecSeamEntry, ExecSeamRole } from './exec-seam-registry.js';

// ── Milestone D — PRODUCTION wiring seam (AC-49 / AC-45 / AC-23) ──────────────

export { loadPolicyEnforcementGate, argvScopesOf } from './policy-enforcement-wiring.js';
export type {
  PolicyEnforcementGate,
  LoadPolicyEnforcementResult,
  AuthorizationResolver,
  GateCallContext,
  GateDecision,
  Gate3Context,
} from './policy-enforcement-wiring.js';
