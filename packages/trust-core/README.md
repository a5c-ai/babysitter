# @a5c-ai/trust-core

Pure, dependency-free trust and cryptography primitives shared across the proof-based
policy-enforcement trust boundary.

This package holds the self-contained Ed25519 signing, signed-envelope, model-decision,
tool/agent-signing, and trust-chain building blocks. It has no runtime dependency on any
other workspace package (only `node:crypto`), which lets dispatch-layer packages (e.g.
`@a5c-ai/transport-adapter`) depend on the trust primitives without reaching into the
orchestration-core `@a5c-ai/genty-core` package.

## Surface

- `createKeyPair`, `signPayload`, `verifySignature`
- `signModelResponse`, `verifyModelResponse`
- `signModelDecision`, `verifyModelDecision`, `MODEL_DECISION_SIGNED_FIELDS`
- `signAgentRequest`, `verifyAgentRequest`, `signPrompt`, `verifyPrompt`, `hashContent`
- `signToolResult`, `verifyToolResult`, `signPermissionEvidence`, `verifyPermissionEvidence`, `isPermissionValid`
- `createAgentIdentity`, `createToolIdentity`
- `verifyTrustChain`
- Types: `SignedEnvelope`, `IdentityKeyPair`, `AgentIdentity`, `ToolIdentity`, `DelegationChainLink`, `Identity`, `ModelResponsePayload`, `ModelDecisionPayload`, `SignedToolCall`, `AgentRequestPayload`, `PromptPayload`, `ToolResultPayload`, `PermissionEvidencePayload`, `TrustChainLink`, `ChainVerificationResult`

`@a5c-ai/genty-core/trust` re-exports this package for back-compat; the in-process
attestation producer remains in `@a5c-ai/genty-core`.

## Status

Internal (`private: true`) support-systems leaf package. Not published.
