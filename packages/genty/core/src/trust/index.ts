/**
 * Back-compat re-export surface for `@a5c-ai/genty-core/trust`.
 *
 * The pure trust/crypto primitives were extracted into the support-systems leaf
 * package `@a5c-ai/trust-core` so that dispatch-layer packages (e.g.
 * `@a5c-ai/transport-adapter`) can depend on them without reaching into the
 * orchestration-core `@a5c-ai/genty-core` package (which would violate the
 * dispatch-core → orchestration-core architecture boundary). Existing importers
 * of `@a5c-ai/genty-core/trust` keep working via this re-export.
 *
 * The in-process attestation producer stays here because it depends on
 * genty-core's `ToolExecutionContext` type.
 */
export {
  createKeyPair,
  signPayload,
  verifySignature,
  createAgentIdentity,
  createToolIdentity,
  signModelResponse,
  verifyModelResponse,
  signModelDecision,
  verifyModelDecision,
  MODEL_DECISION_SIGNED_FIELDS,
  signAgentRequest,
  verifyAgentRequest,
  signPrompt,
  verifyPrompt,
  hashContent,
  signToolResult,
  verifyToolResult,
  signPermissionEvidence,
  verifyPermissionEvidence,
  isPermissionValid,
  verifyTrustChain,
} from '@a5c-ai/trust-core';
export type {
  SignedEnvelope,
  IdentityKeyPair,
  AgentIdentity,
  ToolIdentity,
  DelegationChainLink,
  Identity,
  ModelResponsePayload,
  ModelDecisionPayload,
  SignedToolCall,
  AgentRequestPayload,
  PromptPayload,
  ToolResultPayload,
  PermissionEvidencePayload,
  TrustChainLink,
  ChainVerificationResult,
} from '@a5c-ai/trust-core';
export {
  signInProcessModelDecision,
  attachAttestationToContext,
  IN_PROCESS_ATTESTATION_PRODUCER,
} from './in-process-attestation.js';
export type {
  InProcessAttestationInput,
  NormalizedToolCallLike,
} from './in-process-attestation.js';
