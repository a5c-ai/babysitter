/**
 * Tests for GAP-OBS-004: Policy Decision Trail.
 */

import { describe, it, expect } from "vitest";
import {
  buildDecisionTrailEntry,
  summarizeDecisionTrail,
  type DecisionTrailEntry,
  type DecisionTrailOptions,
  type DecisionTrailSummary,
  type PolicyEvalRecord,
} from "../decisionTrail";

function makeOptions(
  overrides: Partial<DecisionTrailOptions> = {},
): DecisionTrailOptions {
  return {
    effectId: "eff-001",
    effectKind: "breakpoint",
    rulesEvaluated: [],
    finalDecision: { allowed: true, reason: "No rules", warnings: [] },
    ...overrides,
  };
}

describe("decisionTrail (GAP-OBS-004)", () => {
  describe("buildDecisionTrailEntry", () => {
    it("creates entry with effectId, effectKind, and evaluatedAt", () => {
      const entry = buildDecisionTrailEntry(makeOptions());
      expect(entry.effectId).toBe("eff-001");
      expect(entry.effectKind).toBe("breakpoint");
      expect(entry.evaluatedAt).toBeDefined();
      // evaluatedAt should be a valid ISO timestamp
      expect(new Date(entry.evaluatedAt).toISOString()).toBe(entry.evaluatedAt);
    });

    it("records all evaluated rules in policies array", () => {
      const entry = buildDecisionTrailEntry(makeOptions({
        rulesEvaluated: [
          { id: "r1", kind: "rate-limit", action: "allow", priority: 1, condition: { field: "effectKind", op: "eq", value: "task" }, metadata: {} },
          { id: "r2", kind: "permission", action: "deny", priority: 2, condition: { field: "effectKind", op: "eq", value: "breakpoint" }, metadata: {} },
        ],
        matchedRuleId: "r2",
      }));
      expect(entry.policies).toHaveLength(2);
      const r1 = entry.policies.find((p) => p.ruleId === "r1");
      const r2 = entry.policies.find((p) => p.ruleId === "r2");
      expect(r1?.matched).toBe(false);
      expect(r2?.matched).toBe(true);
    });

    it("marks the matched rule as matched=true", () => {
      const entry = buildDecisionTrailEntry(makeOptions({
        rulesEvaluated: [
          { id: "auto-1", kind: "permission", action: "allow", priority: 1, condition: { field: "effectKind", op: "eq", value: "task" } },
        ],
        matchedRuleId: "auto-1",
        finalDecision: { allowed: true, reason: "Matched auto-approve rule: auto-1", warnings: [], rule: { id: "auto-1", kind: "permission", action: "allow", priority: 1, condition: { field: "effectKind", op: "eq", value: "task" } } },
      }));
      expect(entry.policies[0].matched).toBe(true);
      expect(entry.policies[0].ruleId).toBe("auto-1");
    });

    it("sets finalOutcome=allow when decision.allowed is true", () => {
      const entry = buildDecisionTrailEntry(makeOptions({
        finalDecision: { allowed: true, reason: "Auto-approved", warnings: [] },
      }));
      expect(entry.finalOutcome).toBe("allow");
      expect(entry.reason).toBe("Auto-approved");
    });

    it("sets finalOutcome=deny when decision.allowed is false", () => {
      const entry = buildDecisionTrailEntry(makeOptions({
        finalDecision: { allowed: false, reason: "Blocked by rule x", warnings: [] },
      }));
      expect(entry.finalOutcome).toBe("deny");
    });

    it("includes runId and stepId when provided", () => {
      const entry = buildDecisionTrailEntry(makeOptions({
        runId: "run-abc",
        stepId: "S000001",
      }));
      expect(entry.runId).toBe("run-abc");
      expect(entry.stepId).toBe("S000001");
    });

    it("includes warnings from the decision", () => {
      const entry = buildDecisionTrailEntry(makeOptions({
        finalDecision: { allowed: true, reason: "ok", warnings: ["rate limit approaching"] },
      }));
      expect(entry.warnings).toEqual(["rate limit approaching"]);
    });

    it("handles empty rulesEvaluated", () => {
      const entry = buildDecisionTrailEntry(makeOptions({
        rulesEvaluated: [],
      }));
      expect(entry.policies).toEqual([]);
      expect(entry.decidingRuleId).toBeUndefined();
    });
  });

  describe("summarizeDecisionTrail", () => {
    const entries: DecisionTrailEntry[] = [
      buildDecisionTrailEntry(makeOptions({
        effectId: "e1",
        finalDecision: { allowed: true, reason: "Rule r1", warnings: [], rule: { id: "r1", kind: "permission", action: "allow", priority: 1, condition: { field: "effectKind", op: "eq", value: "task" } } },
        matchedRuleId: "r1",
        rulesEvaluated: [{ id: "r1", kind: "permission", action: "allow", priority: 1, condition: { field: "effectKind", op: "eq", value: "task" } }],
      })),
      buildDecisionTrailEntry(makeOptions({
        effectId: "e2",
        finalDecision: { allowed: true, reason: "Rule r1", warnings: [], rule: { id: "r1", kind: "permission", action: "allow", priority: 1, condition: { field: "effectKind", op: "eq", value: "task" } } },
        matchedRuleId: "r1",
        rulesEvaluated: [{ id: "r1", kind: "permission", action: "allow", priority: 1, condition: { field: "effectKind", op: "eq", value: "task" } }],
      })),
      buildDecisionTrailEntry(makeOptions({
        effectId: "e3",
        finalDecision: { allowed: false, reason: "Blocked", warnings: [] },
      })),
    ];

    it("correctly counts allow/deny totals", () => {
      const summary = summarizeDecisionTrail(entries);
      expect(summary.totalEffects).toBe(3);
      expect(summary.allowCount).toBe(2);
      expect(summary.denyCount).toBe(1);
    });

    it("returns top deciding rules sorted by frequency", () => {
      const summary = summarizeDecisionTrail(entries);
      expect(summary.topDecidingRules.length).toBeGreaterThan(0);
      expect(summary.topDecidingRules[0].ruleId).toBe("r1");
      expect(summary.topDecidingRules[0].count).toBe(2);
    });

    it("handles empty entries", () => {
      const summary = summarizeDecisionTrail([]);
      expect(summary.totalEffects).toBe(0);
      expect(summary.allowCount).toBe(0);
      expect(summary.denyCount).toBe(0);
      expect(summary.topDecidingRules).toEqual([]);
    });
  });
});
