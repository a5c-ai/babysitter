/**
 * statusBarHelpers.test.ts
 *
 * Tests for pure formatting helper functions for the enhanced StatusBar:
 *
 *   formatTokenCount(count: number): string
 *   formatCost(cost: number): string
 *
 * Imports the real implementations from StatusBar.tsx and helpers.ts.
 */

import { describe, it, expect } from "vitest";
import { formatTokenCount } from "../components/StatusBar.js";
import { formatCost } from "../helpers.js";

// ---------------------------------------------------------------------------
// formatTokenCount
// ---------------------------------------------------------------------------

describe("formatTokenCount", () => {
  describe("below 1000", () => {
    it("returns plain number for 0", () => {
      expect(formatTokenCount(0)).toBe("0");
    });

    it("returns plain number for 1", () => {
      expect(formatTokenCount(1)).toBe("1");
    });

    it("returns plain number for 500", () => {
      expect(formatTokenCount(500)).toBe("500");
    });

    it("returns plain number for 999", () => {
      expect(formatTokenCount(999)).toBe("999");
    });
  });

  describe("thousands (1k-999k)", () => {
    it("formats 1000 as 1.0k", () => {
      expect(formatTokenCount(1000)).toBe("1.0k");
    });

    it("formats 1500 as 1.5k", () => {
      expect(formatTokenCount(1500)).toBe("1.5k");
    });

    it("formats 10000 as 10.0k", () => {
      expect(formatTokenCount(10000)).toBe("10.0k");
    });

    it("formats 999000 as 999.0k", () => {
      expect(formatTokenCount(999000)).toBe("999.0k");
    });

    it("formats 2500 as 2.5k", () => {
      expect(formatTokenCount(2500)).toBe("2.5k");
    });
  });

  describe("millions (1M+)", () => {
    it("formats 1000000 as 1.0M", () => {
      expect(formatTokenCount(1000000)).toBe("1.0M");
    });

    it("formats 1500000 as 1.5M", () => {
      expect(formatTokenCount(1500000)).toBe("1.5M");
    });

    it("formats 10000000 as 10.0M", () => {
      expect(formatTokenCount(10000000)).toBe("10.0M");
    });
  });

  describe("return type", () => {
    it("always returns a string", () => {
      const values = [0, 500, 1000, 1500000, 10000000];
      for (const v of values) {
        expect(typeof formatTokenCount(v)).toBe("string");
      }
    });
  });
});

// ---------------------------------------------------------------------------
// formatCost
// ---------------------------------------------------------------------------

describe("formatCost", () => {
  describe("sub-dollar amounts (< $1)", () => {
    it("formats 0 as $0.0000", () => {
      expect(formatCost(0)).toBe("$0.0000");
    });

    it("formats 0.1234 as $0.1234", () => {
      expect(formatCost(0.1234)).toBe("$0.1234");
    });

    it("formats 0.0001 with 4 decimal places", () => {
      expect(formatCost(0.0001)).toBe("$0.0001");
    });

    it("formats 0.5 with 4 decimal places", () => {
      expect(formatCost(0.5)).toBe("$0.5000");
    });

    it("formats 0.9999 with 4 decimal places", () => {
      expect(formatCost(0.9999)).toBe("$0.9999");
    });
  });

  describe("dollar amounts (>= $1)", () => {
    it("formats 1 as $1.00", () => {
      expect(formatCost(1)).toBe("$1.00");
    });

    it("formats 1.5 as $1.50", () => {
      expect(formatCost(1.5)).toBe("$1.50");
    });

    it("formats 10.123 as $10.12", () => {
      expect(formatCost(10.123)).toBe("$10.12");
    });

    it("formats 100 as $100.00", () => {
      expect(formatCost(100)).toBe("$100.00");
    });

    it("formats 99.999 as $100.00 (rounding)", () => {
      expect(formatCost(99.999)).toBe("$100.00");
    });
  });

  describe("boundary at $1", () => {
    it("formats 0.9999 with 4 decimal places (sub-dollar)", () => {
      expect(formatCost(0.9999)).toBe("$0.9999");
    });

    it("formats 1.0 with 2 decimal places (dollar)", () => {
      expect(formatCost(1.0)).toBe("$1.00");
    });
  });

  describe("return type", () => {
    it("always starts with $", () => {
      const values = [0, 0.1, 0.5, 1, 10, 100];
      for (const v of values) {
        expect(formatCost(v).startsWith("$")).toBe(true);
      }
    });

    it("always returns a string", () => {
      const values = [0, 0.1234, 1.5, 10.123];
      for (const v of values) {
        expect(typeof formatCost(v)).toBe("string");
      }
    });
  });
});
