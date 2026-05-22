/**
 * GAP-HADAPT-008: Harness Selection Policies.
 *
 * Configurable policies for harness selection: cost-optimized,
 * latency-optimized, capability-first, user-preferred.
 * Policy evaluator scores candidates using selectHarness from capabilityRouter.
 */

import {
  selectHarness,
  type TaskRequirements,
  type HarnessCandidate,
  type RoutingResult,
} from "./capabilityRouter";
import { HarnessCapability as Cap } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PolicyName =
  | "cost-optimized"
  | "latency-optimized"
  | "capability-first"
  | "user-preferred";

export interface SelectionPolicy {
  name: PolicyName;
  description: string;
  evaluate(
    candidates: HarnessCandidate[],
    requirements: Partial<TaskRequirements>,
    options?: PolicyEvaluatorOptions,
  ): PolicyEvaluatorResult;
}

export interface PolicyEvaluatorResult {
  selected: HarnessCandidate | null;
  policyName: PolicyName;
  score: number;
  reason: string;
  routingResult: RoutingResult | null;
}

export interface PolicyEvaluatorOptions {
  preferredHarness?: string;
}

// ---------------------------------------------------------------------------
// Policy implementations
// ---------------------------------------------------------------------------

const capabilityFirstPolicy: SelectionPolicy = {
  name: "capability-first",
  description: "Select the harness with the highest capability score",
  evaluate(candidates, requirements): PolicyEvaluatorResult {
    const result = selectHarness(requirements, candidates);
    if (!result) {
      return { selected: null, policyName: "capability-first", score: 0, reason: "No candidate met threshold", routingResult: null };
    }
    return {
      selected: result.selected,
      policyName: "capability-first",
      score: result.score,
      reason: `Selected ${result.selected.name} with score ${result.score}`,
      routingResult: result,
    };
  },
};

const costOptimizedPolicy: SelectionPolicy = {
  name: "cost-optimized",
  description: "Prefer harnesses with fewer capabilities (proxy for lower cost)",
  evaluate(candidates, requirements): PolicyEvaluatorResult {
    const result = selectHarness(requirements, candidates);
    if (!result) {
      return { selected: null, policyName: "cost-optimized", score: 0, reason: "No candidate met threshold", routingResult: null };
    }

    // Among eligible candidates (those that passed the threshold), pick the one
    // with the fewest capabilities — a proxy for cost
    const eligible = result.scores
      .filter((s) => !s.disqualified && s.total >= 50)
      .map((s) => s.name);

    const eligibleCandidates = candidates.filter((c) =>
      eligible.includes(c.name),
    );

    if (eligibleCandidates.length === 0) {
      return { selected: null, policyName: "cost-optimized", score: 0, reason: "No eligible candidate", routingResult: result };
    }

    // Sort by fewest capabilities ascending
    const sorted = [...eligibleCandidates].sort(
      (a, b) => a.capabilities.length - b.capabilities.length,
    );
    const pick = sorted[0];
    const pickScore = result.scores.find((s) => s.name === pick.name);

    return {
      selected: pick,
      policyName: "cost-optimized",
      score: pickScore?.total ?? 0,
      reason: `Selected ${pick.name} (fewest capabilities: ${pick.capabilities.length})`,
      routingResult: result,
    };
  },
};

const latencyOptimizedPolicy: SelectionPolicy = {
  name: "latency-optimized",
  description: "Prefer harnesses with Programmatic + StopHook for lowest latency",
  evaluate(candidates, requirements): PolicyEvaluatorResult {
    const result = selectHarness(requirements, candidates);
    if (!result) {
      return { selected: null, policyName: "latency-optimized", score: 0, reason: "No candidate met threshold", routingResult: null };
    }

    const eligible = result.scores
      .filter((s) => !s.disqualified && s.total >= 50)
      .map((s) => s.name);

    const eligibleCandidates = candidates.filter((c) =>
      eligible.includes(c.name),
    );

    if (eligibleCandidates.length === 0) {
      return { selected: null, policyName: "latency-optimized", score: 0, reason: "No eligible candidate", routingResult: result };
    }

    // Score: +2 for StopHook, +2 for Programmatic, +1 for SessionBinding
    const latencyScore = (c: HarnessCandidate): number => {
      let s = 0;
      if (c.capabilities.includes(Cap.StopHook)) s += 2;
      if (c.capabilities.includes(Cap.Programmatic)) s += 2;
      if (c.capabilities.includes(Cap.SessionBinding)) s += 1;
      return s;
    };

    const sorted = [...eligibleCandidates].sort(
      (a, b) => latencyScore(b) - latencyScore(a),
    );
    const pick = sorted[0];
    const pickScore = result.scores.find((s) => s.name === pick.name);

    return {
      selected: pick,
      policyName: "latency-optimized",
      score: pickScore?.total ?? 0,
      reason: `Selected ${pick.name} (latency-optimized: StopHook+Programmatic)`,
      routingResult: result,
    };
  },
};

const userPreferredPolicy: SelectionPolicy = {
  name: "user-preferred",
  description: "Select the user-preferred harness if it qualifies, else fall back to capability-first",
  evaluate(candidates, requirements, options?): PolicyEvaluatorResult {
    const preferred = options?.preferredHarness;

    if (preferred) {
      // Try routing with the preferred harness hint
      const augmented: Partial<TaskRequirements> = {
        ...requirements,
        preferredHarness: preferred,
      };
      const result = selectHarness(augmented, candidates);

      if (result && result.selected.name === preferred) {
        return {
          selected: result.selected,
          policyName: "user-preferred",
          score: result.score,
          reason: `Selected user-preferred harness ${preferred}`,
          routingResult: result,
        };
      }
    }

    // Fall back to capability-first
    const fallback = capabilityFirstPolicy.evaluate(candidates, requirements);
    return {
      ...fallback,
      policyName: "user-preferred",
      reason: preferred
        ? `Preferred harness '${preferred}' not available, fell back to ${fallback.selected?.name ?? "none"}`
        : fallback.reason,
    };
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const POLICIES: Record<PolicyName, SelectionPolicy> = {
  "capability-first": capabilityFirstPolicy,
  "cost-optimized": costOptimizedPolicy,
  "latency-optimized": latencyOptimizedPolicy,
  "user-preferred": userPreferredPolicy,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getDefaultPolicy(): SelectionPolicy {
  return POLICIES["capability-first"];
}

export function getPolicyByName(name: PolicyName): SelectionPolicy {
  const policy = POLICIES[name];
  if (!policy) {
    throw new TypeError(`Unknown selection policy: ${String(name)}`);
  }
  return policy;
}

export function createPolicyEvaluator(
  policy: SelectionPolicy,
): (
  candidates: HarnessCandidate[],
  requirements: Partial<TaskRequirements>,
  options?: PolicyEvaluatorOptions,
) => PolicyEvaluatorResult {
  return (candidates, requirements, options?) =>
    policy.evaluate(candidates, requirements, options);
}

export function evaluatePolicy(
  policyName: PolicyName,
  candidates: HarnessCandidate[],
  requirements: Partial<TaskRequirements>,
  options?: PolicyEvaluatorOptions,
): PolicyEvaluatorResult {
  const policy = getPolicyByName(policyName);
  return policy.evaluate(candidates, requirements, options);
}
