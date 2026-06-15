import { describe, it, expect } from "vitest";
import { isProcessAlive } from "../processLiveness";

describe("isProcessAlive", () => {
  it("returns true for the current process", () => {
    expect(isProcessAlive(process.pid)).toBe(true);
  });

  it("returns false for a pid that is almost certainly dead", () => {
    // 999999 is well beyond typical pid ranges on most OSes without wrap.
    expect(isProcessAlive(999999)).toBe(false);
  });

  it("returns false for a negative pid", () => {
    expect(isProcessAlive(-1)).toBe(false);
  });

  it("returns false for pid 0", () => {
    expect(isProcessAlive(0)).toBe(false);
  });

  it("returns false for NaN", () => {
    expect(isProcessAlive(Number.NaN)).toBe(false);
  });
});
