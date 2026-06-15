import { describe, it, expect } from "vitest";
import { evaluateAutoApproval } from "../evaluator";
import type { BreakpointRule } from "../types";

function makeRule(overrides: Partial<BreakpointRule> & { pattern: string; action: BreakpointRule["action"] }): BreakpointRule {
  return {
    id: overrides.id ?? `rule-${Math.random().toString(36).slice(2, 8)}`,
    pattern: overrides.pattern,
    action: overrides.action,
    createdAt: "2026-01-01T00:00:00Z",
    createdBy: "test",
    ...overrides,
  };
}

describe("evaluateAutoApproval", () => {
  it("returns recommended: false when no rules match", () => {
    const result = evaluateAutoApproval({
      breakpointId: "confirm.star-repo",
      rules: [],
    });
    expect(result.recommended).toBe(false);
    expect(result.reason).toContain("No matching");
  });

  it("auto-approve rule matches breakpointId", () => {
    const result = evaluateAutoApproval({
      breakpointId: "confirm.star-repo",
      rules: [makeRule({ id: "r1", pattern: "confirm.*", action: "auto-approve" })],
    });
    expect(result.recommended).toBe(true);
    expect(result.matchedRule).toBe("r1");
  });

  it("never-auto-approve wins over auto-approve", () => {
    const result = evaluateAutoApproval({
      breakpointId: "confirm.star-repo",
      rules: [
        makeRule({ id: "r1", pattern: "confirm.*", action: "auto-approve" }),
        makeRule({ id: "r2", pattern: "confirm.star-repo", action: "never-auto-approve" }),
      ],
    });
    expect(result.recommended).toBe(false);
    expect(result.matchedRule).toBe("r2");
    expect(result.reason).toContain("never-auto-approve");
  });

  it("alwaysBreakOn tags override auto-approve rules", () => {
    const result = evaluateAutoApproval({
      breakpointId: "confirm.deploy",
      tags: ["critical"],
      rules: [makeRule({ id: "r1", pattern: "confirm.*", action: "auto-approve" })],
      profileConfig: { global: "moderate", alwaysBreakOn: ["critical"] },
    });
    expect(result.recommended).toBe(false);
    expect(result.reason).toContain("alwaysBreakOn");
  });

  it("alwaysBreakOn does not trigger without matching tags", () => {
    const result = evaluateAutoApproval({
      breakpointId: "confirm.deploy",
      tags: ["routine"],
      rules: [makeRule({ id: "r1", pattern: "confirm.*", action: "auto-approve" })],
      profileConfig: { global: "moderate", alwaysBreakOn: ["critical"] },
    });
    expect(result.recommended).toBe(true);
  });

  it("autoApproveAfterN threshold triggers when consecutive approvals met", () => {
    const result = evaluateAutoApproval({
      breakpointId: "confirm.star-repo",
      rules: [],
      consecutiveApprovals: 5,
      autoApproveAfterN: 3,
    });
    expect(result.recommended).toBe(true);
    expect(result.reason).toContain("consecutive approvals");
    expect(result.consecutiveApprovals).toBe(5);
  });

  it("autoApproveAfterN does not trigger below threshold", () => {
    const result = evaluateAutoApproval({
      breakpointId: "confirm.star-repo",
      rules: [],
      consecutiveApprovals: 2,
      autoApproveAfterN: 3,
    });
    expect(result.recommended).toBe(false);
  });

  it("autoApproveAfterN disabled when -1", () => {
    const result = evaluateAutoApproval({
      breakpointId: "confirm.star-repo",
      rules: [],
      consecutiveApprovals: 100,
      autoApproveAfterN: -1,
    });
    expect(result.recommended).toBe(false);
  });

  it("never-auto-approve beats autoApproveAfterN", () => {
    const result = evaluateAutoApproval({
      breakpointId: "confirm.star-repo",
      rules: [makeRule({ id: "r1", pattern: "confirm.*", action: "never-auto-approve" })],
      consecutiveApprovals: 100,
      autoApproveAfterN: 1,
    });
    expect(result.recommended).toBe(false);
    expect(result.matchedRule).toBe("r1");
  });

  it("pattern with attribute predicates works in evaluation", () => {
    const result = evaluateAutoApproval({
      breakpointId: "code.review",
      tags: ["design"],
      rules: [makeRule({ id: "r1", pattern: "*.review(tags contains 'design')", action: "auto-approve" })],
    });
    expect(result.recommended).toBe(true);
    expect(result.matchedRule).toBe("r1");
  });

  // --- GAP-SEC-005: Posture-aware evaluation ---

  describe("posture enforcement", () => {
    it("destroy category blocks auto-approval regardless of rules", () => {
      const result = evaluateAutoApproval({
        breakpointId: "destroy.important-files",
        rules: [makeRule({ id: "r1", pattern: "destroy.*", action: "auto-approve" })],
      });
      expect(result.recommended).toBe(false);
      expect(result.blockedByPosture).toBe(true);
      expect(result.effectiveCategory).toBe("destroy");
      expect(result.reason).toContain("requires explicit human approval");
    });

    it("auth category blocks auto-approval", () => {
      const result = evaluateAutoApproval({
        breakpointId: "auth.token-refresh",
        rules: [makeRule({ id: "r1", pattern: "auth.*", action: "auto-approve" })],
      });
      expect(result.recommended).toBe(false);
      expect(result.blockedByPosture).toBe(true);
      expect(result.effectiveCategory).toBe("auth");
    });

    it("execute category requires explicit rule — blocks without one", () => {
      const result = evaluateAutoApproval({
        breakpointId: "exec.npm-install",
        rules: [],
        consecutiveApprovals: 100,
        autoApproveAfterN: 1,
      });
      expect(result.recommended).toBe(false);
      expect(result.blockedByPosture).toBe(true);
      expect(result.effectiveCategory).toBe("execute");
      expect(result.reason).toContain("requires an explicit auto-approve rule");
    });

    it("execute category allows auto-approve with explicit rule", () => {
      const result = evaluateAutoApproval({
        breakpointId: "exec.npm-install",
        rules: [makeRule({ id: "r1", pattern: "exec.*", action: "auto-approve" })],
      });
      expect(result.recommended).toBe(true);
      expect(result.matchedRule).toBe("r1");
      expect(result.effectiveCategory).toBe("execute");
    });

    it("write category clamps autoApproveAfterN to posture minimum", () => {
      // write posture has minConsecutiveApprovalsForAutoN = 3
      const result = evaluateAutoApproval({
        breakpointId: "write.config-update",
        rules: [],
        consecutiveApprovals: 2,
        autoApproveAfterN: 1, // would normally trigger at 1, but clamped to 3
      });
      expect(result.recommended).toBe(false);
      expect(result.effectiveCategory).toBe("write");
    });

    it("write category allows autoApproveAfterN when clamped threshold met", () => {
      const result = evaluateAutoApproval({
        breakpointId: "write.config-update",
        rules: [],
        consecutiveApprovals: 3,
        autoApproveAfterN: 1, // clamped to 3
      });
      expect(result.recommended).toBe(true);
      expect(result.effectiveCategory).toBe("write");
    });

    it("read category does not clamp autoApproveAfterN (min is 0)", () => {
      const result = evaluateAutoApproval({
        breakpointId: "read.file-contents",
        rules: [],
        consecutiveApprovals: 1,
        autoApproveAfterN: 1,
      });
      expect(result.recommended).toBe(true);
      expect(result.effectiveCategory).toBe("read");
    });

    it("explicit actionCategory overrides prefix-derived category", () => {
      const result = evaluateAutoApproval({
        breakpointId: "confirm.star-repo", // no known prefix
        actionCategory: "destroy",
        rules: [makeRule({ id: "r1", pattern: "confirm.*", action: "auto-approve" })],
      });
      expect(result.recommended).toBe(false);
      expect(result.blockedByPosture).toBe(true);
      expect(result.effectiveCategory).toBe("destroy");
    });

    it("postureOverride replaces default posture for category", () => {
      // Override destroy to allow auto-approve
      const result = evaluateAutoApproval({
        breakpointId: "destroy.test-data",
        rules: [makeRule({ id: "r1", pattern: "destroy.*", action: "auto-approve" })],
        postureOverride: {
          name: "custom-permissive",
          allowAutoApprove: true,
          minConsecutiveApprovalsForAutoN: 0,
          requireExplicitRule: false,
          requiredApproverLevel: "any",
        },
      });
      expect(result.recommended).toBe(true);
      expect(result.matchedRule).toBe("r1");
    });

    it("skipPostureEnforcement bypasses posture entirely", () => {
      const result = evaluateAutoApproval({
        breakpointId: "destroy.important-files",
        rules: [makeRule({ id: "r1", pattern: "destroy.*", action: "auto-approve" })],
        skipPostureEnforcement: true,
      });
      expect(result.recommended).toBe(true);
      expect(result.matchedRule).toBe("r1");
    });

    it("profileConfig.disablePostureEnforcement bypasses posture", () => {
      const result = evaluateAutoApproval({
        breakpointId: "destroy.important-files",
        rules: [makeRule({ id: "r1", pattern: "destroy.*", action: "auto-approve" })],
        profileConfig: { global: "moderate", disablePostureEnforcement: true },
      });
      expect(result.recommended).toBe(true);
      expect(result.matchedRule).toBe("r1");
    });

    it("profileConfig.postureOverrides merge into default posture", () => {
      const result = evaluateAutoApproval({
        breakpointId: "write.config-update",
        rules: [],
        consecutiveApprovals: 1,
        autoApproveAfterN: 1,
        profileConfig: {
          global: "moderate",
          postureOverrides: {
            write: { minConsecutiveApprovalsForAutoN: 0 },
          },
        },
      });
      expect(result.recommended).toBe(true);
      expect(result.effectiveCategory).toBe("write");
    });

    it("unknown prefix has no posture enforcement — backward compatible", () => {
      const result = evaluateAutoApproval({
        breakpointId: "confirm.star-repo",
        rules: [makeRule({ id: "r1", pattern: "confirm.*", action: "auto-approve" })],
      });
      expect(result.recommended).toBe(true);
      expect(result.matchedRule).toBe("r1");
      expect(result.blockedByPosture).toBeUndefined();
    });

    it("never-auto-approve still wins over posture allowance", () => {
      const result = evaluateAutoApproval({
        breakpointId: "read.file-contents",
        rules: [
          makeRule({ id: "r1", pattern: "read.*", action: "auto-approve" }),
          makeRule({ id: "r2", pattern: "read.file-contents", action: "never-auto-approve" }),
        ],
      });
      expect(result.recommended).toBe(false);
      expect(result.matchedRule).toBe("r2");
      expect(result.effectiveCategory).toBe("read");
    });

    it("posture with minConsecutiveApprovalsForAutoN -1 disables autoApproveAfterN", () => {
      // Use a custom posture that allows auto-approve but disables threshold-based approval
      const result = evaluateAutoApproval({
        breakpointId: "net.outbound-call", // network category
        rules: [],
        consecutiveApprovals: 999,
        autoApproveAfterN: 1,
        postureOverride: {
          name: "test-no-auto-n",
          allowAutoApprove: true,
          minConsecutiveApprovalsForAutoN: -1, // disables autoApproveAfterN
          requireExplicitRule: false,
          requiredApproverLevel: "any",
        },
      });
      expect(result.recommended).toBe(false);
      expect(result.reason).toContain("No matching");
    });
  });
});
