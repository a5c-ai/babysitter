import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  createPolicyEngine,
  matchCondition,
} from "../engine";
import {
  maxIterationsPolicy,
  taskKindPolicy,
  rateLimitPolicy,
} from "../builtins";
import { logPolicyDecision, readPolicyDecisionLog } from "../logging";
import { breakpointRulesToPolicies } from "../bridge";
import { isStatefulRule } from "../types";
import type {
  PolicyRule,
  PolicyCondition,
  PolicyEvaluationContext,
  PolicyDecision,
  PolicyDecisionLog,
} from "../types";

describe("GAP-SEC-001: Governance Policy Layer", () => {
  describe("PolicyRule types", () => {
    it("constructs a valid deny rule", () => {
      const rule: PolicyRule = {
        id: "deny-shell",
        kind: "permission",
        condition: { field: "effectKind", op: "eq", value: "shell" },
        action: "deny",
        priority: 100,
      };
      expect(rule.id).toBe("deny-shell");
      expect(rule.kind).toBe("permission");
      expect(rule.action).toBe("deny");
    });

    it("constructs a warn rule with metadata", () => {
      const rule: PolicyRule = {
        id: "warn-slow",
        kind: "rate-limit",
        condition: { field: "effectKind", op: "eq", value: "agent" },
        action: "warn",
        priority: 50,
        metadata: { reason: "Agent tasks are slow" },
      };
      expect(rule.metadata).toEqual({ reason: "Agent tasks are slow" });
    });

    it("supports all rule kinds", () => {
      const kinds = ["rate-limit", "permission", "resource-limit", "trust-level"] as const;
      for (const kind of kinds) {
        const rule: PolicyRule = {
          id: `test-${kind}`,
          kind,
          condition: { field: "effectKind", op: "eq", value: "any" },
          action: "allow",
          priority: 0,
        };
        expect(rule.kind).toBe(kind);
      }
    });
  });

  describe("matchCondition", () => {
    it("matches eq operator", () => {
      const cond: PolicyCondition = { field: "effectKind", op: "eq", value: "shell" };
      expect(matchCondition(cond, { effectKind: "shell" })).toBe(true);
      expect(matchCondition(cond, { effectKind: "agent" })).toBe(false);
    });

    it("matches neq operator", () => {
      const cond: PolicyCondition = { field: "effectKind", op: "neq", value: "shell" };
      expect(matchCondition(cond, { effectKind: "agent" })).toBe(true);
      expect(matchCondition(cond, { effectKind: "shell" })).toBe(false);
    });

    it("matches gt/lt/gte/lte for numeric fields", () => {
      const gt: PolicyCondition = { field: "iteration", op: "gt", value: "10" };
      expect(matchCondition(gt, { effectKind: "shell", iteration: 15 })).toBe(true);
      expect(matchCondition(gt, { effectKind: "shell", iteration: 5 })).toBe(false);

      const lte: PolicyCondition = { field: "iteration", op: "lte", value: "10" };
      expect(matchCondition(lte, { effectKind: "shell", iteration: 10 })).toBe(true);
      expect(matchCondition(lte, { effectKind: "shell", iteration: 11 })).toBe(false);
    });

    it("matches contains operator on labels", () => {
      const cond: PolicyCondition = { field: "labels", op: "contains", value: "dangerous" };
      expect(matchCondition(cond, { effectKind: "shell", labels: ["safe", "dangerous"] })).toBe(true);
      expect(matchCondition(cond, { effectKind: "shell", labels: ["safe"] })).toBe(false);
    });

    it("matches regex with matches operator", () => {
      const cond: PolicyCondition = { field: "taskId", op: "matches", value: "^deploy-.*" };
      expect(matchCondition(cond, { effectKind: "shell", taskId: "deploy-prod" })).toBe(true);
      expect(matchCondition(cond, { effectKind: "shell", taskId: "build-app" })).toBe(false);
    });

    it("returns false when field is missing from context", () => {
      const cond: PolicyCondition = { field: "taskId", op: "eq", value: "test" };
      expect(matchCondition(cond, { effectKind: "shell" })).toBe(false);
    });

    it("handles invalid regex gracefully in matches", () => {
      const cond: PolicyCondition = { field: "taskId", op: "matches", value: "[invalid" };
      expect(matchCondition(cond, { effectKind: "shell", taskId: "anything" })).toBe(false);
    });

    it("contains on string value checks substring", () => {
      const cond: PolicyCondition = { field: "effectKind", op: "contains", value: "hel" };
      expect(matchCondition(cond, { effectKind: "shell" })).toBe(true);
      expect(matchCondition(cond, { effectKind: "agent" })).toBe(false);
    });

    it("gte matches equal values", () => {
      const cond: PolicyCondition = { field: "iteration", op: "gte", value: "10" };
      expect(matchCondition(cond, { effectKind: "shell", iteration: 10 })).toBe(true);
      expect(matchCondition(cond, { effectKind: "shell", iteration: 9 })).toBe(false);
    });

    it("lt matches strictly less", () => {
      const cond: PolicyCondition = { field: "iteration", op: "lt", value: "5" };
      expect(matchCondition(cond, { effectKind: "shell", iteration: 4 })).toBe(true);
      expect(matchCondition(cond, { effectKind: "shell", iteration: 5 })).toBe(false);
    });
  });

  describe("createPolicyEngine", () => {
    it("returns engine with rules property", () => {
      const rules: PolicyRule[] = [
        { id: "r1", kind: "permission", condition: { field: "effectKind", op: "eq", value: "shell" }, action: "allow", priority: 0 },
      ];
      const engine = createPolicyEngine(rules);
      expect(engine.rules).toHaveLength(1);
    });

    it("allows by default when no rules match", () => {
      const engine = createPolicyEngine([]);
      const decision = engine.evaluate({ effectKind: "shell" });
      expect(decision.allowed).toBe(true);
      expect(decision.reason).toContain("default");
    });

    it("deny rules take precedence over allow rules", () => {
      const rules: PolicyRule[] = [
        { id: "allow-all", kind: "permission", condition: { field: "effectKind", op: "eq", value: "shell" }, action: "allow", priority: 10 },
        { id: "deny-shell", kind: "permission", condition: { field: "effectKind", op: "eq", value: "shell" }, action: "deny", priority: 10 },
      ];
      const engine = createPolicyEngine(rules);
      const decision = engine.evaluate({ effectKind: "shell" });
      expect(decision.allowed).toBe(false);
      expect(decision.rule?.id).toBe("deny-shell");
    });

    it("collects warnings without blocking", () => {
      const rules: PolicyRule[] = [
        { id: "warn-agent", kind: "rate-limit", condition: { field: "effectKind", op: "eq", value: "agent" }, action: "warn", priority: 50 },
        { id: "warn-slow", kind: "resource-limit", condition: { field: "effectKind", op: "eq", value: "agent" }, action: "warn", priority: 40 },
      ];
      const engine = createPolicyEngine(rules);
      const decision = engine.evaluate({ effectKind: "agent" });
      expect(decision.allowed).toBe(true);
      expect(decision.warnings).toHaveLength(2);
    });

    it("higher priority deny wins over lower priority allow", () => {
      const rules: PolicyRule[] = [
        { id: "allow-shell", kind: "permission", condition: { field: "effectKind", op: "eq", value: "shell" }, action: "allow", priority: 10 },
        { id: "deny-high", kind: "trust-level", condition: { field: "effectKind", op: "eq", value: "shell" }, action: "deny", priority: 100 },
      ];
      const engine = createPolicyEngine(rules);
      const decision = engine.evaluate({ effectKind: "shell" });
      expect(decision.allowed).toBe(false);
    });

    it("freezes rules array to prevent mutation", () => {
      const rules: PolicyRule[] = [
        { id: "r1", kind: "permission", condition: { field: "effectKind", op: "eq", value: "shell" }, action: "allow", priority: 0 },
      ];
      const engine = createPolicyEngine(rules);
      expect(() => { (engine.rules as PolicyRule[]).push({} as PolicyRule); }).toThrow();
    });

    it("evaluates conditions against context metadata", () => {
      const rules: PolicyRule[] = [
        { id: "deny-prod", kind: "trust-level", condition: { field: "metadata.env", op: "eq", value: "production" }, action: "deny", priority: 100 },
      ];
      const engine = createPolicyEngine(rules);
      const denied = engine.evaluate({ effectKind: "shell", metadata: { env: "production" } });
      expect(denied.allowed).toBe(false);

      const allowed = engine.evaluate({ effectKind: "shell", metadata: { env: "staging" } });
      expect(allowed.allowed).toBe(true);
    });
  });

  describe("Built-in policies", () => {
    it("maxIterationsPolicy denies when iteration exceeds limit", () => {
      const rule = maxIterationsPolicy(10);
      const engine = createPolicyEngine([rule]);

      const ok = engine.evaluate({ effectKind: "shell", iteration: 5 });
      expect(ok.allowed).toBe(true);

      const denied = engine.evaluate({ effectKind: "shell", iteration: 15 });
      expect(denied.allowed).toBe(false);
    });

    it("taskKindPolicy denies disallowed task kinds", () => {
      const rule = taskKindPolicy(["shell", "node"]);
      const engine = createPolicyEngine([rule]);

      const ok = engine.evaluate({ effectKind: "shell" });
      expect(ok.allowed).toBe(true);

      const denied = engine.evaluate({ effectKind: "agent" });
      expect(denied.allowed).toBe(false);
    });

    it("rateLimitPolicy denies when rate exceeded", () => {
      const rule = rateLimitPolicy(1000, 2); // 2 per 1000ms
      const engine = createPolicyEngine([rule]);

      // First two should pass
      expect(engine.evaluate({ effectKind: "shell" }).allowed).toBe(true);
      expect(engine.evaluate({ effectKind: "shell" }).allowed).toBe(true);

      // Third should be denied
      expect(engine.evaluate({ effectKind: "shell" }).allowed).toBe(false);
    });

    it("rateLimitPolicy is a StatefulPolicyRule", () => {
      const rule = rateLimitPolicy(1000, 5);
      expect(isStatefulRule(rule)).toBe(true);
    });

    it("rateLimitPolicy resets after window expires", () => {
      vi.useFakeTimers();
      try {
        const rule = rateLimitPolicy(1000, 2);
        const engine = createPolicyEngine([rule]);

        expect(engine.evaluate({ effectKind: "shell" }).allowed).toBe(true);
        expect(engine.evaluate({ effectKind: "shell" }).allowed).toBe(true);
        expect(engine.evaluate({ effectKind: "shell" }).allowed).toBe(false);

        // Advance past the window
        vi.advanceTimersByTime(1100);

        // Should be allowed again
        expect(engine.evaluate({ effectKind: "shell" }).allowed).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it("taskKindPolicy handles special regex chars in kind names", () => {
      const rule = taskKindPolicy(["node.js", "c++"]);
      const engine = createPolicyEngine([rule]);

      expect(engine.evaluate({ effectKind: "node.js" }).allowed).toBe(true);
      expect(engine.evaluate({ effectKind: "c++" }).allowed).toBe(true);
      expect(engine.evaluate({ effectKind: "python" }).allowed).toBe(false);
    });

    it("bridge converts empty rules array", () => {
      const policies = breakpointRulesToPolicies([]);
      expect(policies).toEqual([]);
    });
  });

  describe("Policy decision logging", () => {
    let testDir: string;

    beforeEach(async () => {
      testDir = path.join(os.tmpdir(), `policy-log-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
    });

    it("appends decision to JSONL log", async () => {
      const entry: PolicyDecisionLog = {
        timestamp: "2026-01-01T00:00:00Z",
        context: { effectKind: "shell" },
        decision: { allowed: true, reason: "default allow", warnings: [] },
      };
      await logPolicyDecision(testDir, entry);

      const entries = await readPolicyDecisionLog(testDir);
      expect(entries).toHaveLength(1);
      expect(entries[0].decision.allowed).toBe(true);
    });

    it("appends multiple decisions", async () => {
      const base: PolicyDecisionLog = {
        timestamp: "2026-01-01T00:00:00Z",
        context: { effectKind: "shell" },
        decision: { allowed: true, reason: "ok", warnings: [] },
      };
      await logPolicyDecision(testDir, base);
      await logPolicyDecision(testDir, { ...base, timestamp: "2026-01-01T00:01:00Z" });

      const entries = await readPolicyDecisionLog(testDir);
      expect(entries).toHaveLength(2);
    });

    it("includes ruleId when present", async () => {
      const entry: PolicyDecisionLog = {
        timestamp: "2026-01-01T00:00:00Z",
        context: { effectKind: "shell" },
        decision: { allowed: false, reason: "denied by deny-shell", warnings: [], rule: { id: "deny-shell" } as PolicyRule },
        ruleId: "deny-shell",
      };
      await logPolicyDecision(testDir, entry);

      const entries = await readPolicyDecisionLog(testDir);
      expect(entries[0].ruleId).toBe("deny-shell");
    });
  });

  describe("Breakpoint rules bridge", () => {
    it("converts auto-approve to allow policy", () => {
      const bpRules = [
        { id: "bp-1", pattern: "deploy.*", action: "auto-approve" as const, createdAt: "2026-01-01", createdBy: "test" },
      ];
      const policies = breakpointRulesToPolicies(bpRules);
      expect(policies).toHaveLength(1);
      expect(policies[0].action).toBe("allow");
      expect(policies[0].kind).toBe("permission");
    });

    it("converts never-auto-approve to deny policy", () => {
      const bpRules = [
        { id: "bp-2", pattern: "danger.*", action: "never-auto-approve" as const, createdAt: "2026-01-01", createdBy: "test" },
      ];
      const policies = breakpointRulesToPolicies(bpRules);
      expect(policies).toHaveLength(1);
      expect(policies[0].action).toBe("deny");
    });

    it("preserves rule id in converted policy", () => {
      const bpRules = [
        { id: "bp-3", pattern: "test.*", action: "auto-approve" as const, createdAt: "2026-01-01", createdBy: "test" },
      ];
      const policies = breakpointRulesToPolicies(bpRules);
      expect(policies[0].id).toContain("bp-3");
    });
  });

  describe("Integration: engine + builtins + logging + bridge", () => {
    let testDir: string;

    beforeEach(async () => {
      testDir = path.join(os.tmpdir(), `policy-integration-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
    });

    it("evaluates mixed rules and logs decisions", async () => {
      const bpRules = [
        { id: "bp-deny", pattern: "deploy*", action: "never-auto-approve" as const, createdAt: "2026-01-01", createdBy: "admin" },
      ];
      const bridged = breakpointRulesToPolicies(bpRules);
      const builtins = [maxIterationsPolicy(100), taskKindPolicy(["shell", "agent"])];
      const engine = createPolicyEngine([...bridged, ...builtins]);

      // Normal shell task — allowed
      const d1 = engine.evaluate({ effectKind: "shell", taskId: "build-app", iteration: 5 });
      expect(d1.allowed).toBe(true);
      await logPolicyDecision(testDir, { timestamp: "2026-01-01T00:00:00Z", context: { effectKind: "shell" }, decision: d1 });

      // Deploy task — denied by bridge rule
      const d2 = engine.evaluate({ effectKind: "shell", taskId: "deploy-prod", iteration: 5 });
      expect(d2.allowed).toBe(false);
      await logPolicyDecision(testDir, { timestamp: "2026-01-01T00:01:00Z", context: { effectKind: "shell", taskId: "deploy-prod" }, decision: d2, ruleId: d2.rule?.id });

      // Over iteration limit — denied by builtin
      const d3 = engine.evaluate({ effectKind: "shell", taskId: "build-app", iteration: 150 });
      expect(d3.allowed).toBe(false);

      // Check audit log
      const log = await readPolicyDecisionLog(testDir);
      expect(log).toHaveLength(2);
      expect(log[1].ruleId).toContain("bp-deny");
    });
  });
});
