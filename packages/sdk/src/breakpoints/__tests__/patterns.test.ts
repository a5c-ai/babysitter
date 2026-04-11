import { describe, it, expect } from "vitest";
import { parsePattern, matchPattern } from "../patterns";

describe("parsePattern", () => {
  it("parses a simple glob", () => {
    const p = parsePattern("confirm.*");
    expect(p.idGlob).toBe("confirm.*");
    expect(p.predicates).toEqual([]);
  });

  it("parses glob with single predicate", () => {
    const p = parsePattern("*.review(tags contains 'design')");
    expect(p.idGlob).toBe("*.review");
    expect(p.predicates).toEqual([
      { attr: "tags", op: "contains", value: "design" },
    ]);
  });

  it("parses glob with AND combinator", () => {
    const p = parsePattern("gate.*(tags contains 'prerequisites' AND expert = 'owner')");
    expect(p.idGlob).toBe("gate.*");
    expect(p.predicates).toHaveLength(2);
    expect(p.predicates[0]).toEqual({ attr: "tags", op: "contains", value: "prerequisites" });
    expect(p.predicates[1]).toEqual({ attr: "expert", op: "=", value: "owner" });
  });

  it("parses exact id without predicates", () => {
    const p = parsePattern("confirm.star-repo");
    expect(p.idGlob).toBe("confirm.star-repo");
    expect(p.predicates).toEqual([]);
  });

  it("throws on unmatched parenthesis", () => {
    expect(() => parsePattern("foo(bar")).toThrow("unmatched parenthesis");
  });

  it("throws on invalid predicate syntax", () => {
    expect(() => parsePattern("foo(bar baz)")).toThrow("Invalid predicate");
  });
});

describe("matchPattern", () => {
  it("matches exact breakpointId", () => {
    const p = parsePattern("confirm.star-repo");
    expect(matchPattern(p, "confirm.star-repo", {})).toBe(true);
    expect(matchPattern(p, "confirm.other", {})).toBe(false);
  });

  it("matches wildcard glob", () => {
    const p = parsePattern("confirm.*");
    expect(matchPattern(p, "confirm.star-repo", {})).toBe(true);
    expect(matchPattern(p, "confirm.fork-repo", {})).toBe(true);
    expect(matchPattern(p, "review.design", {})).toBe(false);
  });

  it("matches leading wildcard", () => {
    const p = parsePattern("*.review");
    expect(matchPattern(p, "design.review", {})).toBe(true);
    expect(matchPattern(p, "code.review", {})).toBe(true);
    expect(matchPattern(p, "review", {})).toBe(false);
  });

  it("matches with tags contains predicate", () => {
    const p = parsePattern("*.review(tags contains 'design')");
    expect(matchPattern(p, "code.review", { tags: ["design", "ui"] })).toBe(true);
    expect(matchPattern(p, "code.review", { tags: ["backend"] })).toBe(false);
    expect(matchPattern(p, "code.review", {})).toBe(false);
  });

  it("matches with expert = predicate", () => {
    const p = parsePattern("gate.*(expert = 'owner')");
    expect(matchPattern(p, "gate.deploy", { expert: "owner" })).toBe(true);
    expect(matchPattern(p, "gate.deploy", { expert: "reviewer" })).toBe(false);
  });

  it("matches with AND combinator (all must match)", () => {
    const p = parsePattern("gate.*(tags contains 'prerequisites' AND expert = 'owner')");
    expect(matchPattern(p, "gate.deploy", { tags: ["prerequisites"], expert: "owner" })).toBe(true);
    expect(matchPattern(p, "gate.deploy", { tags: ["prerequisites"], expert: "reviewer" })).toBe(false);
    expect(matchPattern(p, "gate.deploy", { tags: ["other"], expert: "owner" })).toBe(false);
  });

  it("returns false when id glob doesn't match", () => {
    const p = parsePattern("confirm.*(tags contains 'design')");
    expect(matchPattern(p, "review.code", { tags: ["design"] })).toBe(false);
  });
});
