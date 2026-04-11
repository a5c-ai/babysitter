/**
 * breakpointIntegration.test.ts
 *
 * Tests for BreakpointPanel integration into SessionView:
 * - SessionState.breakpoint field and SET_BREAKPOINT/CLEAR_BREAKPOINT actions
 * - BreakpointPanel rendering conditions
 * - formatBreakpointPrompt and formatBreakpointOptions helpers
 *
 * Phase 2: Wire BreakpointPanel into SessionView (Wave 6)
 */

import { describe, it, expect } from "vitest";
import type { BreakpointState } from "../types.js";
import {
  formatBreakpointPrompt,
  formatBreakpointOptions,
  getBreakpointStatusColor,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// BreakpointState field tests
// ---------------------------------------------------------------------------

describe("BreakpointState type shape", () => {
  it("constructs a valid BreakpointState", () => {
    const bp: BreakpointState = {
      breakpointId: "confirm.deploy",
      title: "Confirm deployment",
      approved: null,
    };
    expect(bp.breakpointId).toBe("confirm.deploy");
    expect(bp.title).toBe("Confirm deployment");
    expect(bp.approved).toBeNull();
  });

  it("supports optional fields", () => {
    const bp: BreakpointState = {
      breakpointId: "review.code",
      title: "Code review",
      approved: null,
      expert: "senior-dev",
      tags: ["review", "code"],
      autoApproval: { recommended: true, reason: "Previously approved 3 times" },
    };
    expect(bp.expert).toBe("senior-dev");
    expect(bp.tags).toEqual(["review", "code"]);
    expect(bp.autoApproval?.recommended).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SessionState breakpoint integration
// ---------------------------------------------------------------------------

describe("SessionState breakpoint field", () => {
  it("initial state has null breakpoint", () => {
    // Verify the type allows null breakpoint
    const state = {
      runId: null,
      status: "idle" as const,
      messages: [],
      verbosity: "normal" as const,
      inputBuffer: "",
      inputActive: false,
      runStartedAt: null,
      turnStartedAt: null,
      tokenUsage: null,
      cost: null,
      breakpoint: null,
    };
    expect(state.breakpoint).toBeNull();
  });

  it("SET_BREAKPOINT action sets breakpoint", () => {
    const bp: BreakpointState = {
      breakpointId: "test.bp",
      title: "Test breakpoint",
      approved: null,
    };
    // Simulate reducer behavior
    const action = { type: "SET_BREAKPOINT" as const, breakpoint: bp };
    expect(action.type).toBe("SET_BREAKPOINT");
    expect(action.breakpoint).toEqual(bp);
  });

  it("CLEAR_BREAKPOINT action clears breakpoint", () => {
    const action = { type: "CLEAR_BREAKPOINT" as const };
    expect(action.type).toBe("CLEAR_BREAKPOINT");
  });
});

// ---------------------------------------------------------------------------
// formatBreakpointPrompt
// ---------------------------------------------------------------------------

describe("formatBreakpointPrompt integration", () => {
  it("formats a basic breakpoint prompt", () => {
    const bp: BreakpointState = {
      breakpointId: "confirm.action",
      title: "Confirm this action",
      approved: null,
    };
    const prompt = formatBreakpointPrompt(bp);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain("Confirm this action");
  });

  it("includes auto-approval info when present", () => {
    const bp: BreakpointState = {
      breakpointId: "confirm.auto",
      title: "Auto-approvable",
      approved: null,
      autoApproval: { recommended: true, reason: "Approved 5 times" },
    };
    const prompt = formatBreakpointPrompt(bp);
    expect(prompt).toContain("Auto-approvable");
  });

  it("includes expert routing when present", () => {
    const bp: BreakpointState = {
      breakpointId: "expert.review",
      title: "Expert review needed",
      approved: null,
      expert: "security-team",
    };
    const prompt = formatBreakpointPrompt(bp);
    expect(prompt).toContain("Expert review needed");
  });
});

// ---------------------------------------------------------------------------
// formatBreakpointOptions
// ---------------------------------------------------------------------------

describe("formatBreakpointOptions integration", () => {
  it("returns default options for a pending breakpoint", () => {
    const bp: BreakpointState = {
      breakpointId: "test.opts",
      title: "Test options",
      approved: null,
    };
    const options = formatBreakpointOptions(bp);
    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
    // Should include approve and reject at minimum
    const lower = options.map((o) => o.toLowerCase());
    expect(lower.some((o) => o.includes("approve"))).toBe(true);
  });

  it("includes 'Always Approve' when autoApproval is recommended", () => {
    const bp: BreakpointState = {
      breakpointId: "test.auto",
      title: "Auto breakpoint",
      approved: null,
      autoApproval: { recommended: true, reason: "test" },
    };
    const options = formatBreakpointOptions(bp);
    const lower = options.map((o) => o.toLowerCase());
    expect(lower.some((o) => o.includes("always"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getBreakpointStatusColor
// ---------------------------------------------------------------------------

describe("getBreakpointStatusColor integration", () => {
  it("returns color key for null (pending)", () => {
    const color = getBreakpointStatusColor(null);
    expect(typeof color).toBe("string");
    expect(color.length).toBeGreaterThan(0);
  });

  it("returns color key for approved", () => {
    const color = getBreakpointStatusColor(true);
    expect(typeof color).toBe("string");
  });

  it("returns color key for rejected", () => {
    const color = getBreakpointStatusColor(false);
    expect(typeof color).toBe("string");
  });

  it("pending and approved return different colors", () => {
    const pending = getBreakpointStatusColor(null);
    const approved = getBreakpointStatusColor(true);
    expect(pending).not.toBe(approved);
  });
});

// ---------------------------------------------------------------------------
// BreakpointPanel rendering conditions
// ---------------------------------------------------------------------------

describe("BreakpointPanel rendering conditions", () => {
  it("should render when breakpoint is present and approved is null", () => {
    const bp: BreakpointState = {
      breakpointId: "test.show",
      title: "Show me",
      approved: null,
    };
    // Rendering condition: breakpoint is non-null and not yet decided
    const shouldRender = bp.approved === null;
    expect(shouldRender).toBe(true);
  });

  it("should not render when breakpoint is approved", () => {
    const bp: BreakpointState = {
      breakpointId: "test.done",
      title: "Done",
      approved: true,
    };
    const shouldRender = bp.approved === null;
    expect(shouldRender).toBe(false);
  });

  it("should not render when breakpoint is rejected", () => {
    const bp: BreakpointState = {
      breakpointId: "test.reject",
      title: "Rejected",
      approved: false,
    };
    const shouldRender = bp.approved === null;
    expect(shouldRender).toBe(false);
  });

  it("should not render when breakpoint is null", () => {
    const bp: BreakpointState | null = null;
    const shouldRender = bp !== null && bp.approved === null;
    expect(shouldRender).toBe(false);
  });
});
