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
});
