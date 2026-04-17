/**
 * breakpointHelpers.test.ts
 *
 * TDD tests for breakpoint display formatting, status color mapping,
 * and option generation helpers.
 *
 * Phase 4: Breakpoint & Interaction UI (GAP-UX-001c)
 *
 * All functions imported from ../helpers.js (Red phase — not yet implemented).
 */

import { describe, it, expect } from "vitest";
import {
  formatBreakpointPrompt,
  getBreakpointStatusColor,
  formatBreakpointOptions,
} from "../helpers.js";
import type { BreakpointState } from "../types.js";

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

function makeBp(overrides: Partial<BreakpointState> = {}): BreakpointState {
  return {
    breakpointId: "bp-001",
    title: "Confirm deployment",
    approved: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatBreakpointPrompt
// ---------------------------------------------------------------------------

describe("formatBreakpointPrompt", () => {
  it("shows pending icon and status for approved: null", () => {
    const result = formatBreakpointPrompt(makeBp({ approved: null }));
    expect(result).toContain("\u23F8");
    expect(result).toContain("Confirm deployment");
    expect(result).toContain("Awaiting approval");
  });

  it("shows approved icon and status for approved: true", () => {
    const result = formatBreakpointPrompt(makeBp({ approved: true }));
    expect(result).toContain("\u2713");
    expect(result).toContain("Confirm deployment");
    expect(result).toContain("Approved");
  });

  it("shows rejected icon and status for approved: false", () => {
    const result = formatBreakpointPrompt(makeBp({ approved: false }));
    expect(result).toContain("\u2717");
    expect(result).toContain("Confirm deployment");
    expect(result).toContain("Rejected");
  });

  it("appends feedback when present", () => {
    const result = formatBreakpointPrompt(
      makeBp({ approved: null, feedback: "Needs review" }),
    );
    expect(result).toContain("(feedback: Needs review)");
  });

  it("appends expert name when present (string)", () => {
    const result = formatBreakpointPrompt(
      makeBp({ approved: null, expert: "alice" }),
    );
    expect(result).toContain("[expert: alice]");
  });

  it("appends expert names when present (array)", () => {
    const result = formatBreakpointPrompt(
      makeBp({ approved: null, expert: ["alice", "bob"] }),
    );
    expect(result).toContain("[expert: alice, bob]");
  });

  it("appends tags as hashtags when present", () => {
    const result = formatBreakpointPrompt(
      makeBp({ approved: null, tags: ["deploy", "prod"] }),
    );
    expect(result).toContain("#deploy");
    expect(result).toContain("#prod");
  });

  it("appends auto-approve recommendation when recommended", () => {
    const result = formatBreakpointPrompt(
      makeBp({
        approved: null,
        autoApproval: { recommended: true, reason: "pattern match" },
      }),
    );
    expect(result).toContain("(auto-approve recommended)");
  });

  it("does not append auto-approve text when not recommended", () => {
    const result = formatBreakpointPrompt(
      makeBp({
        approved: null,
        autoApproval: { recommended: false, reason: "no match" },
      }),
    );
    expect(result).not.toContain("auto-approve");
  });

  it("combines multiple annotations", () => {
    const result = formatBreakpointPrompt(
      makeBp({
        approved: true,
        feedback: "LGTM",
        expert: "ops-team",
        tags: ["critical"],
        autoApproval: { recommended: true, reason: "rule" },
      }),
    );
    expect(result).toContain("\u2713");
    expect(result).toContain("Approved");
    expect(result).toContain("(feedback: LGTM)");
    expect(result).toContain("[expert: ops-team]");
    expect(result).toContain("#critical");
    expect(result).toContain("(auto-approve recommended)");
  });

  it("handles empty tags array without extra markers", () => {
    const result = formatBreakpointPrompt(
      makeBp({ approved: null, tags: [] }),
    );
    expect(result).not.toContain("#");
  });

  it("handles breakpoint with only required fields", () => {
    const result = formatBreakpointPrompt(makeBp());
    expect(result).toContain("\u23F8");
    expect(result).toContain("Confirm deployment");
    expect(result).toContain("Awaiting approval");
    expect(result).not.toContain("feedback");
    expect(result).not.toContain("expert");
    expect(result).not.toContain("#");
  });
});

// ---------------------------------------------------------------------------
// getBreakpointStatusColor
// ---------------------------------------------------------------------------

describe("getBreakpointStatusColor", () => {
  it("returns 'warning' for null (pending)", () => {
    expect(getBreakpointStatusColor(null)).toBe("warning");
  });

  it("returns 'success' for true (approved)", () => {
    expect(getBreakpointStatusColor(true)).toBe("success");
  });

  it("returns 'error' for false (rejected)", () => {
    expect(getBreakpointStatusColor(false)).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// formatBreakpointOptions
// ---------------------------------------------------------------------------

describe("formatBreakpointOptions", () => {
  it("always includes Approve and Reject", () => {
    const options = formatBreakpointOptions(makeBp());
    expect(options).toContain("Approve");
    expect(options).toContain("Reject");
  });

  it("includes 'Always Approve' when autoApproval is recommended", () => {
    const options = formatBreakpointOptions(
      makeBp({
        autoApproval: { recommended: true, reason: "match" },
      }),
    );
    expect(options).toContain("Always Approve");
  });

  it("does not include 'Always Approve' when autoApproval is not recommended", () => {
    const options = formatBreakpointOptions(
      makeBp({
        autoApproval: { recommended: false, reason: "no match" },
      }),
    );
    expect(options).not.toContain("Always Approve");
  });

  it("does not include 'Always Approve' when no autoApproval", () => {
    const options = formatBreakpointOptions(makeBp());
    expect(options).not.toContain("Always Approve");
  });

  it("includes 'Approve with feedback' when feedback from previous attempt exists", () => {
    const options = formatBreakpointOptions(
      makeBp({ feedback: "Previous rejection reason" }),
    );
    expect(options).toContain("Approve with feedback");
  });

  it("does not include 'Approve with feedback' when no feedback", () => {
    const options = formatBreakpointOptions(makeBp());
    expect(options).not.toContain("Approve with feedback");
  });

  it("includes both 'Always Approve' and 'Approve with feedback' when applicable", () => {
    const options = formatBreakpointOptions(
      makeBp({
        feedback: "Retry after fix",
        autoApproval: { recommended: true, reason: "rule" },
      }),
    );
    expect(options).toContain("Approve");
    expect(options).toContain("Reject");
    expect(options).toContain("Always Approve");
    expect(options).toContain("Approve with feedback");
  });

  it("Approve and Reject are always the first two options", () => {
    const options = formatBreakpointOptions(
      makeBp({
        feedback: "retry",
        autoApproval: { recommended: true, reason: "rule" },
      }),
    );
    expect(options[0]).toBe("Approve");
    expect(options[1]).toBe("Reject");
  });
});
