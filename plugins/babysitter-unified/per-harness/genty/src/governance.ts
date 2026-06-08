/**
 * BabysitterGovernanceProvider — implements the GovernanceProvider interface
 * with breakpoint evaluation backed by babysitter-sdk policy primitives.
 */

import type {
  GovernanceProvider,
  PendingEffect,
  ApprovalPosture,
  BreakpointDecision,
} from "@a5c-ai/genty-platform/orchestration";

export class BabysitterGovernanceProvider implements GovernanceProvider {
  private posture: ApprovalPosture = "ask";

  async evaluateBreakpoint(
    effect: PendingEffect,
    _context: Record<string, unknown>,
  ): Promise<BreakpointDecision> {
    // Default implementation: breakpoints always require user approval
    // unless the effect is non-interactive (e.g., a sleep)
    if (effect.kind === "sleep") {
      return { autoApprove: true, reason: "sleep effects are auto-approved" };
    }

    return { autoApprove: false, reason: "requires user approval" };
  }

  getApprovalPosture(): ApprovalPosture {
    return this.posture;
  }

  /** Configure the approval posture (for testing or runtime reconfiguration). */
  setApprovalPosture(posture: ApprovalPosture): void {
    this.posture = posture;
  }
}
