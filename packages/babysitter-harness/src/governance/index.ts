/**
 * Governance Policy Layer module (GAP-SEC-001).
 * Centralized policy engine for evaluating security rules at effect dispatch.
 */

// Types
export type {
  PolicyRuleKind,
  PolicyConditionOp,
  PolicyAction,
  PolicyCondition,
  PolicyRule,
  StatefulPolicyRule,
  PolicyEvaluationContext,
  PolicyDecision,
  PolicyDecisionLog,
  PolicyEngine,
} from './types';

export { isStatefulRule } from './types';

// Engine
export { createPolicyEngine, matchCondition } from './engine';

// Built-in policies
export { maxIterationsPolicy, taskKindPolicy, rateLimitPolicy } from './builtins';

// Audit logging
export { logPolicyDecision, readPolicyDecisionLog } from './logging';

// Breakpoint bridge
export { breakpointRulesToPolicies } from './bridge';

// Decision trail (GAP-OBS-004)
export {
  buildDecisionTrailEntry,
  summarizeDecisionTrail,
  type DecisionTrailEntry,
  type DecisionTrailOptions,
  type DecisionTrailSummary,
  type PolicyEvalRecord,
} from './decisionTrail';

// Mandate system
export {
  createMandate,
  activateMandate,
  revokeMandate,
  deriveMandate,
  validateMandateForContext,
  mandateToPolicy,
  type ExecutionMandate,
  type MandateScope,
  type MandateLifecycle,
  type MandateProvenance,
  type MandateValidationResult,
} from './mandate';

// Authority chain
export {
  createAuthorityChain,
  validateAuthorityChain,
  attenuateScope,
  traceAuthorityToHuman,
  type AuthorityPrincipal,
  type AuthorityGrant,
  type AuthorityChain,
  type AuthorityChainLink,
  type AuthorityTrace,
  type AuthorityChainValidationResult,
} from './authority';

// Categorized policy engine
export {
  categorizePolicyRule,
  createCategorizedEngine,
  inferPolicyCategory,
  type PolicyCategory,
  type CategorizedPolicyRule,
  type CategoryEnforcementBehavior,
  type CategorizedPolicyDecision,
  type CategorizedPolicyEngine,
} from './categories';

// Posture-to-policy bridge
export {
  postureToPolicyRules,
  allPosturesToPolicies,
} from './postureBridge';

// Sandbox policy (GAP-SEC-002)
export {
  evaluateSandboxAccess,
  matchesPattern,
  composeSandboxPolicies,
  attenuateSandboxPolicy,
  type SandboxOperationKind,
  type SandboxRule,
  type SandboxPolicy,
  type SandboxDecision,
  type SandboxOperation,
} from './sandboxPolicy';

// Sandbox bridge (GAP-SEC-002)
export {
  sandboxDecisionToInteraction,
  buildSandboxEvent,
  inheritSandboxPolicy,
  type SandboxEvent,
} from './sandboxBridge';

// Permission events
export {
  createPermissionEvent,
  aggregateChainEvents,
  filterEvents,
  type PermissionEvent,
  type PermissionEventSource,
  type CreatePermissionEventOptions,
  type FilterCriteria,
} from './permissionEvents';

// Permission propagation
export {
  formatPermissionForTui,
  formatPermissionForJsonStream,
  formatPermissionForCli,
  createPropagationConfig,
  shouldPropagate,
  type PropagationTarget,
  type PropagationConfig,
} from './permissionPropagation';
