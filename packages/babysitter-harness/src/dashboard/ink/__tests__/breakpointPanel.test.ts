/**
 * breakpointPanel.test.ts
 *
 * Integration tests for Breakpoint Approval UI wiring.
 * Verifies that formatBreakpointPrompt, formatBreakpointOptions,
 * and getBreakpointStatusColor work correctly in the BreakpointPanel pipeline.
 */

import { describe, it, expect } from "vitest";
import type { BreakpointState } from "../types.js";
import {
  formatBreakpointPrompt,
  formatBreakpointOptions,
  getBreakpointStatusColor,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const pendingBp: BreakpointState = {
  breakpointId: "confirm.deploy",
  title: "Deploy to production",
  approved: null,
};

const approvedBp: BreakpointState = {
  breakpointId: "confirm.deploy",
  title: "Deploy to production",
  approved: true,
  response: "Ship it",
};

const rejectedBp: BreakpointState = {
  breakpointId: "confirm.deploy",
  title: "Deploy to production",
  approved: false,
  feedback: "Not ready yet",
};

const richBp: BreakpointState = {
  breakpointId: "confirm.arch-review",
  title: "Architecture review",
  approved: null,
  expert: ["alice", "bob"],
  tags: ["architecture", "critical"],
  autoApproval: { recommended: true, reason: "Matched rule" },
  feedback: "Previous attempt rejected",
};

// ---------------------------------------------------------------------------
// formatBreakpointPrompt
// ---------------------------------------------------------------------------

describe("formatBreakpointPrompt", () => {
  it("shows awaiting status for pending breakpoint", () => {
    const prompt = formatBreakpointPrompt(pendingBp);
    expect(prompt).toContain("Deploy to production");
    expect(prompt).toContain("Awaiting approval");
  });

  it("shows approved status with checkmark", () => {
    const prompt = formatBreakpointPrompt(approvedBp);
    expect(prompt).toContain("\u2713");
    expect(prompt).toContain("Approved");
  });

  it("shows rejected status with cross", () => {
    const prompt = formatBreakpointPrompt(rejectedBp);
    expect(prompt).toContain("\u2717");
    expect(prompt).toContain("Rejected");
    expect(prompt).toContain("Not ready yet");
  });

  it("includes expert, tags, and auto-approve info", () => {
    const prompt = formatBreakpointPrompt(richBp);
    expect(prompt).toContain("alice, bob");
    expect(prompt).toContain("#architecture");
    expect(prompt).toContain("#critical");
    expect(prompt).toContain("auto-approve recommended");
    expect(prompt).toContain("Previous attempt rejected");
  });
});

// ---------------------------------------------------------------------------
// getBreakpointStatusColor
// ---------------------------------------------------------------------------

describe("getBreakpointStatusColor", () => {
  it("returns warning for pending (null)", () => {
    expect(getBreakpointStatusColor(null)).toBe("warning");
  });

  it("returns success for approved", () => {
    expect(getBreakpointStatusColor(true)).toBe("success");
  });

  it("returns error for rejected", () => {
    expect(getBreakpointStatusColor(false)).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// formatBreakpointOptions
// ---------------------------------------------------------------------------

describe("formatBreakpointOptions", () => {
  it("always includes Approve and Reject", () => {
    const options = formatBreakpointOptions(pendingBp);
    expect(options).toContain("Approve");
    expect(options).toContain("Reject");
    expect(options).toHaveLength(2);
  });

  it("adds Always Approve when auto-approval recommended", () => {
    const options = formatBreakpointOptions(richBp);
    expect(options).toContain("Always Approve");
  });

  it("adds Approve with feedback when feedback exists", () => {
    const options = formatBreakpointOptions(richBp);
    expect(options).toContain("Approve with feedback");
  });
});

// ---------------------------------------------------------------------------
// Pipeline integration: state -> prompt + options + color
// ---------------------------------------------------------------------------

describe("breakpoint rendering pipeline", () => {
  it("produces complete rendering data from a single BreakpointState", () => {
    const prompt = formatBreakpointPrompt(richBp);
    const options = formatBreakpointOptions(richBp);
    const color = getBreakpointStatusColor(richBp.approved);

    // All three produce useful output
    expect(prompt.length).toBeGreaterThan(0);
    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(color).toBe("warning"); // pending

    // Options are internally consistent with the breakpoint state
    expect(options).toContain("Always Approve"); // because auto-approve recommended
    expect(options).toContain("Approve with feedback"); // because feedback exists
  });

  it("handles minimal breakpoint state", () => {
    const minimal: BreakpointState = {
      breakpointId: "bp-1",
      title: "Simple gate",
      approved: null,
    };
    const prompt = formatBreakpointPrompt(minimal);
    const options = formatBreakpointOptions(minimal);
    const color = getBreakpointStatusColor(minimal.approved);

    expect(prompt).toContain("Simple gate");
    expect(options).toEqual(["Approve", "Reject"]);
    expect(color).toBe("warning");
  });
});
