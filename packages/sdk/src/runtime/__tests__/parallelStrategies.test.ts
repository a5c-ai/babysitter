import { describe, expect, it } from "vitest";
import { applyStrategy } from "../parallelStrategies";

describe("parallelStrategies (GAP-PAR-009)", () => {
  describe("all-or-nothing", () => {
    it("returns all results when all succeed", () => {
      const out = applyStrategy("all-or-nothing", [1, 2, 3], []);
      expect(out.results).toEqual([1, 2, 3]);
      expect(out.successCount).toBe(3);
      expect(out.totalCount).toBe(3);
      expect(out.errors).toEqual([]);
      expect(out.strategy).toBe("all-or-nothing");
    });

    it("throws when any effect failed", () => {
      expect(() =>
        applyStrategy("all-or-nothing", [1, undefined, 3], [{ index: 1, error: new Error("boom") }]),
      ).toThrow("boom");
    });

    it("throws first error when multiple fail", () => {
      expect(() =>
        applyStrategy("all-or-nothing", [undefined, undefined], [
          { index: 0, error: new Error("first") },
          { index: 1, error: new Error("second") },
        ]),
      ).toThrow("first");
    });
  });

  describe("best-effort", () => {
    it("returns partial results and errors on mixed outcomes", () => {
      const out = applyStrategy("best-effort", [10, undefined, 30], [
        { index: 1, error: new Error("fail") },
      ]);
      expect(out.results).toEqual([10, undefined, 30]);
      expect(out.errors).toHaveLength(1);
      expect(out.successCount).toBe(2);
      expect(out.totalCount).toBe(3);
    });

    it("returns empty results and full errors when all fail", () => {
      const out = applyStrategy("best-effort", [undefined, undefined], [
        { index: 0, error: new Error("a") },
        { index: 1, error: new Error("b") },
      ]);
      expect(out.successCount).toBe(0);
      expect(out.errors).toHaveLength(2);
    });

    it("does not throw on failures", () => {
      expect(() =>
        applyStrategy("best-effort", [undefined], [{ index: 0, error: new Error("fail") }]),
      ).not.toThrow();
    });
  });

  describe("first-success", () => {
    it("returns first successful result", () => {
      const out = applyStrategy("first-success", [undefined, 42, 99], [
        { index: 0, error: new Error("nope") },
      ]);
      expect(out.results).toEqual([42]);
      expect(out.successCount).toBe(1);
    });

    it("throws when all fail", () => {
      expect(() =>
        applyStrategy("first-success", [undefined, undefined], [
          { index: 0, error: new Error("a") },
          { index: 1, error: new Error("b") },
        ]),
      ).toThrow();
    });

    it("returns first non-undefined result even if no errors", () => {
      const out = applyStrategy("first-success", [undefined, "hello"], []);
      expect(out.results).toEqual(["hello"]);
    });
  });

  describe("quorum", () => {
    it("passes when enough results meet threshold", () => {
      const out = applyStrategy("quorum", [1, 2, 3, undefined, undefined], [
        { index: 3, error: new Error("a") },
        { index: 4, error: new Error("b") },
      ], {
        quorumThreshold: 0.5,
      });
      expect(out.successCount).toBe(3);
      expect(out.totalCount).toBe(5);
    });

    it("fails when quorum not met", () => {
      expect(() =>
        applyStrategy("quorum", [1, undefined, undefined, undefined, undefined], [
          { index: 1, error: new Error("a") },
          { index: 2, error: new Error("b") },
          { index: 3, error: new Error("c") },
          { index: 4, error: new Error("d") },
        ], {
          quorumThreshold: 0.6,
        }),
      ).toThrow(/quorum/i);
    });

    it("throws for empty results array", () => {
      expect(() => applyStrategy("quorum", [], [])).toThrow(/quorum/i);
    });

    it("defaults quorum threshold to 0.5 when not provided", () => {
      const out = applyStrategy("quorum", [1, 2, undefined], [
        { index: 2, error: new Error("x") },
      ]);
      expect(out.successCount).toBe(2);
    });
  });

  it("throws TypeError for unknown strategy", () => {
    expect(() => applyStrategy("unknown" as never, [], [])).toThrow(TypeError);
  });

  it("strategy field always matches input strategy name", () => {
    for (const name of ["all-or-nothing", "best-effort", "first-success", "quorum"] as const) {
      expect(applyStrategy(name, [1], []).strategy).toBe(name);
    }
  });
});
