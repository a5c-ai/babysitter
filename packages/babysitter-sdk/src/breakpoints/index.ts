export type {
  BreakpointRule,
  BreakpointRuleAction,
  BreakpointRulesFile,
  AutoApprovalResult,
  BreakpointPattern,
  AttributePredicate,
  PredicateOp,
  InteractionKind,
  ActionCategory,
  ApprovalPosture,
} from "./types";
export { BREAKPOINT_RULES_SCHEMA_VERSION } from "./types";
export { parsePattern, matchPattern } from "./patterns";
export { readRules, writeRules, addRule, removeRule, listRules } from "./rules";
export { evaluateAutoApproval } from "./evaluator";
export type { EvaluateAutoApprovalOptions } from "./evaluator";
export { verifyBreakpointResult, hasSignatureFields } from "./proven-verification";
export type {
  BreakpointVerificationConfig,
  BreakpointVerificationResult,
} from "./proven-verification";
