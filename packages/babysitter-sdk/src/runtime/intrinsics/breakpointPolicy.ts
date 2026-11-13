import type { BreakpointDeclaration } from "../types";

const protectedTags = new Set(["destructive", "destroy", "approval-gate"]);

/** Routing to an expert or an explicit approval/destruction tag requires a human by default. */
export function requiresInteractiveApproval(gate: BreakpointDeclaration): boolean {
  const experts = Array.isArray(gate.expert) ? gate.expert : gate.expert ? [gate.expert] : [];
  return experts.some((expert) => expert.trim().length > 0)
    || (gate.tags ?? []).some((tag) => protectedTags.has(tag.toLowerCase()));
}
