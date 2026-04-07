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
