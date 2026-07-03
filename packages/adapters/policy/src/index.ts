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
