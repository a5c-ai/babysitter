import { describe, it, expect } from "vitest";
import { renderProgressBar, renderProgressLabel } from "../components/ProgressBar";

describe("GAP-SUBOBS-002: ProgressBar component", () => {
  describe("renderProgressBar", () => {
    it("renders a half-filled bar at 50%", () => {
      const bar = renderProgressBar(50);
      // Should contain both filled (█) and empty (░) characters
      expect(bar).toContain("\u2588");
      expect(bar).toContain("\u2591");
      expect(bar).toContain("50%");
    });

    it("renders a full bar at 100%", () => {
      const bar = renderProgressBar(100);
      expect(bar).toContain("100%");
      // Should have no empty blocks
      expect(bar).not.toContain("\u2591");
    });

    it("renders an empty bar at 0%", () => {
      const bar = renderProgressBar(0);
      expect(bar).toContain("0%");
      // Should have no filled blocks
      expect(bar).not.toContain("\u2588");
    });

    it("clamps negative values to 0%", () => {
      const bar = renderProgressBar(-10);
      expect(bar).toContain("0%");
    });

    it("clamps values over 100 to 100%", () => {
      const bar = renderProgressBar(150);
      expect(bar).toContain("100%");
    });

    it("respects custom width option", () => {
      const bar = renderProgressBar(50, { width: 10 });
      // Strip ANSI codes to count characters
      const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
      // 10 bar chars + space + "50%" = ~14 visible chars
      expect(stripped).toMatch(/^[█░]{10}\s+50%$/);
    });

    it("can hide percent display", () => {
      const bar = renderProgressBar(75, { showPercent: false });
      expect(bar).not.toContain("%");
    });

    it("rounds percentage to nearest integer", () => {
      const bar = renderProgressBar(33.7);
      expect(bar).toContain("34%");
    });
  });

  describe("renderProgressLabel", () => {
    it("renders label with percent bar", () => {
      const label = renderProgressLabel("step 3 of 10", 30);
      expect(label).toContain("30%");
      expect(label).toContain("step 3 of 10");
    });

    it("renders label without percent", () => {
      const label = renderProgressLabel("processing files");
      expect(label).toContain("processing files");
      expect(label).not.toContain("%");
    });
  });
});
