/**
 * Status: Integrated with agent-platform breakpoint governance.
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-BRK-001: Breakpoint Approval Chains.
 *
 * Multi-stage approval chains for breakpoints. Define approval
 * sequences (e.g., reviewer then approver), quorum rules,
 * and escalation paths. Pure functions, no I/O.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApprovalChainStep {
  stepId: string;
  expert: string | string[];
  label: string;
  tags?: string[];
  timeoutMs?: number;
  escalateTo?: string;
}

export interface QuorumConfig {
  experts: string[];
  required: number;
  strategy: "first-response-wins" | "collect-all" | "quorum";
}

export interface ApprovalChainDefinition {
  chainId: string;
  steps: ApprovalChainStep[];
  quorum?: QuorumConfig;
}

export interface CompletedChainStep {
  stepId: string;
  approved: boolean;
  respondedBy?: string;
  response?: string;
  completedAt: string;
}

export interface ApprovalChainState {
  chainId: string;
  currentStepIndex: number;
  completedSteps: CompletedChainStep[];
  status: "pending" | "approved" | "rejected" | "escalated";
  startedAt: string;
}

export interface ChainEvaluationResult {
  status: "approved" | "rejected" | "pending" | "escalated";
  nextStep: ApprovalChainStep | undefined;
  escalationTarget: ApprovalChainStep | undefined;
  completedSteps: CompletedChainStep[];
  reason: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create initial chain state at step 0.
 */
export function initChainState(chainId: string): ApprovalChainState {
  return {
    chainId,
    currentStepIndex: 0,
    completedSteps: [],
    status: "pending",
    startedAt: new Date().toISOString(),
  };
}

/**
 * Advance chain state by appending a completed step result.
 * Returns new state (does not mutate input).
 */
export function advanceChainStep(
  state: ApprovalChainState,
  stepResult: CompletedChainStep,
): ApprovalChainState {
  return {
    ...state,
    currentStepIndex: state.currentStepIndex + 1,
    completedSteps: [...state.completedSteps, stepResult],
  };
}

/**
 * Evaluate the current state of an approval chain.
 * Determines next step, checks for rejections, and handles quorum logic.
 */
export function evaluateApprovalChain(
  chain: ApprovalChainDefinition,
  state: ApprovalChainState,
): ChainEvaluationResult {
  const { completedSteps } = state;

  // Check for any rejection — short-circuit
  const rejected = completedSteps.find((s) => !s.approved);
  if (rejected) {
    return {
      status: "rejected",
      nextStep: undefined,
      escalationTarget: undefined,
      completedSteps,
      reason: `Step '${rejected.stepId}' was rejected`,
    };
  }

  // Handle quorum logic
  if (chain.quorum) {
    const approvalCount = completedSteps.filter((s) => s.approved).length;
    if (approvalCount >= chain.quorum.required) {
      return {
        status: "approved",
        nextStep: undefined,
        escalationTarget: undefined,
        completedSteps,
        reason: `Quorum met: ${approvalCount}/${chain.quorum.required} approvals`,
      };
    }
    // Quorum not yet met — still pending
    const nextStep = chain.steps[Math.min(state.currentStepIndex, chain.steps.length - 1)];
    return {
      status: "pending",
      nextStep,
      escalationTarget: undefined,
      completedSteps,
      reason: `Quorum pending: ${approvalCount}/${chain.quorum.required} approvals`,
    };
  }

  // Sequential chain: check if all steps completed
  if (state.currentStepIndex >= chain.steps.length) {
    // All steps completed and all approved (rejections caught above)
    return {
      status: "approved",
      nextStep: undefined,
      escalationTarget: undefined,
      completedSteps,
      reason: `All ${chain.steps.length} steps approved`,
    };
  }

  // More steps to go
  const nextStep = chain.steps[state.currentStepIndex];
  return {
    status: "pending",
    nextStep,
    escalationTarget: undefined,
    completedSteps,
    reason: `Pending step '${nextStep.stepId}' (${state.currentStepIndex + 1}/${chain.steps.length})`,
  };
}

/**
 * Resolve escalation path from a given step.
 * Returns the target step definition, or undefined if no escalation configured.
 */
export function resolveEscalationPath(
  chain: ApprovalChainDefinition,
  fromStepId: string,
): ApprovalChainStep | undefined {
  const fromStep = chain.steps.find((s) => s.stepId === fromStepId);
  if (!fromStep?.escalateTo) return undefined;

  return chain.steps.find((s) => s.stepId === fromStep.escalateTo);
}
