import { describe, it, expect } from "vitest";
import { renderBreakpointApproval, stripAnsi } from "../index";

describe("GAP-UX-001c: BreakpointApproval", () => {
  const baseProps = {
    breakpointId: "confirm.deploy",
    title: "Deploy to production?",
    options: [
      { label: "Approve", value: "approve", description: "Proceed with deployment" },
      { label: "Deny", value: "deny", description: "Cancel deployment" },
    ],
  };

  it("renders title and breakpoint ID", () => {
    const result = stripAnsi(renderBreakpointApproval(baseProps));
    expect(result).toContain("Deploy to production?");
    expect(result).toContain("confirm.deploy");
  });

  it("renders options", () => {
    const result = stripAnsi(renderBreakpointApproval(baseProps));
    expect(result).toContain("Approve");
    expect(result).toContain("Deny");
  });

  it("renders description", () => {
    const result = stripAnsi(renderBreakpointApproval({
      ...baseProps,
      description: "This will deploy v2.0 to all regions.",
    }));
    expect(result).toContain("This will deploy v2.0 to all regions.");
  });

  it("renders auto-approval recommendation", () => {
    const result = stripAnsi(renderBreakpointApproval({
      ...baseProps,
      autoApproval: {
        recommended: true,
        reason: "Previously approved 5 times",
        matchedRule: "confirm.*",
        consecutiveApprovals: 5,
      },
    }));
    expect(result).toContain("AUTO-APPROVE");
    expect(result).toContain("Previously approved 5 times");
    expect(result).toContain("confirm.*");
    expect(result).toContain("5");
  });

  it("renders manual review recommendation", () => {
    const result = stripAnsi(renderBreakpointApproval({
      ...baseProps,
      autoApproval: { recommended: false, reason: "First time seeing this breakpoint" },
    }));
    expect(result).toContain("MANUAL REVIEW");
  });

  it("renders risk indicator", () => {
    const result = stripAnsi(renderBreakpointApproval({ ...baseProps, risk: "high" }));
    expect(result).toContain("HIGH");
  });

  it("renders tags", () => {
    const result = stripAnsi(renderBreakpointApproval({
      ...baseProps,
      tags: ["deploy", "production"],
    }));
    expect(result).toContain("[deploy]");
    expect(result).toContain("[production]");
  });

  it("renders previous feedback", () => {
    const result = stripAnsi(renderBreakpointApproval({
      ...baseProps,
      previousFeedback: "Please add rollback plan first",
    }));
    expect(result).toContain("Previous feedback:");
    expect(result).toContain("Please add rollback plan first");
  });

  it("renders expert field", () => {
    const result = stripAnsi(renderBreakpointApproval({
      ...baseProps,
      expert: "devops-lead",
    }));
    expect(result).toContain("devops-lead");
  });

  it("renders selected option with marker", () => {
    const result = stripAnsi(renderBreakpointApproval({
      ...baseProps,
      selectedIndex: 0,
    }));
    expect(result).toContain("\u25B8"); // ▸ pointer
  });

  it("renders with minimal props", () => {
    const result = stripAnsi(renderBreakpointApproval({
      breakpointId: "test",
      title: "Simple",
      options: [{ label: "OK", value: "ok" }],
    }));
    expect(result).toContain("Simple");
    expect(result).toContain("OK");
  });
});
