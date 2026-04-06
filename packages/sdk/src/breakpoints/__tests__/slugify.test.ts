import { describe, it, expect } from "vitest";
import { slugifyBreakpointId } from "../../runtime/intrinsics/breakpoint";

describe("slugifyBreakpointId", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugifyBreakpointId("Star Repository")).toBe("star-repository");
  });

  it("preserves dots (namespace separators)", () => {
    expect(slugifyBreakpointId("confirm.Star Repo")).toBe("confirm.star-repo");
  });

  it("replaces special characters with hyphens", () => {
    expect(slugifyBreakpointId("Review: Bug Report!")).toBe("review-bug-report");
  });

  it("collapses multiple hyphens", () => {
    expect(slugifyBreakpointId("foo  --  bar")).toBe("foo-bar");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugifyBreakpointId("  Hello World  ")).toBe("hello-world");
  });

  it("returns 'breakpoint' for empty/whitespace-only input", () => {
    expect(slugifyBreakpointId("")).toBe("breakpoint");
    expect(slugifyBreakpointId("   ")).toBe("breakpoint");
  });

  it("preserves already-slugified ids", () => {
    expect(slugifyBreakpointId("confirm.star-repo")).toBe("confirm.star-repo");
  });
});
