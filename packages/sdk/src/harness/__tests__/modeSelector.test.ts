import { describe, it, expect, beforeEach } from "vitest";
import {
  getActiveMode,
  getActiveModeConfig,
  switchMode,
  getModeConfig,
  getAvailableModes,
  resetMode,
  shouldAutoApprove,
  shouldShowPlan,
  isParallelEnabled,
  formatModeInfo,
} from "../modeSelector";

describe("GAP-UX-014: Mode Selector", () => {
  beforeEach(() => {
    resetMode();
  });

  describe("default state", () => {
    it("defaults to interactive mode", () => {
      expect(getActiveMode()).toBe("interactive");
    });

    it("interactive mode requires breakpoint approval", () => {
      const config = getActiveModeConfig();
      expect(config.breakpointApproval).toBe("always");
    });
  });

  describe("switchMode", () => {
    it("switches to autonomous mode", () => {
      const config = switchMode("autonomous");
      expect(config.mode).toBe("autonomous");
      expect(getActiveMode()).toBe("autonomous");
    });

    it("switches to plan mode", () => {
      switchMode("plan");
      expect(getActiveMode()).toBe("plan");
    });

    it("switches to fast mode", () => {
      switchMode("fast");
      expect(getActiveMode()).toBe("fast");
    });
  });

  describe("getModeConfig", () => {
    it("returns config for any mode", () => {
      const config = getModeConfig("autonomous");
      expect(config.label).toBe("Autonomous");
      expect(config.parallelism).toBe(true);
    });
  });

  describe("getAvailableModes", () => {
    it("returns all 4 modes", () => {
      const modes = getAvailableModes();
      expect(modes).toHaveLength(4);
      expect(modes.map((m) => m.mode)).toEqual(
        expect.arrayContaining(["interactive", "autonomous", "plan", "fast"]),
      );
    });
  });

  describe("shouldAutoApprove", () => {
    it("returns false in interactive mode", () => {
      expect(shouldAutoApprove()).toBe(false);
    });

    it("returns true in autonomous mode", () => {
      switchMode("autonomous");
      expect(shouldAutoApprove()).toBe(true);
    });

    it("returns true in fast mode", () => {
      switchMode("fast");
      expect(shouldAutoApprove()).toBe(true);
    });
  });

  describe("shouldShowPlan", () => {
    it("returns true in interactive mode", () => {
      expect(shouldShowPlan()).toBe(true);
    });

    it("returns false in autonomous mode", () => {
      switchMode("autonomous");
      expect(shouldShowPlan()).toBe(false);
    });

    it("returns true in plan mode", () => {
      switchMode("plan");
      expect(shouldShowPlan()).toBe(true);
    });
  });

  describe("isParallelEnabled", () => {
    it("returns false in interactive mode", () => {
      expect(isParallelEnabled()).toBe(false);
    });

    it("returns true in autonomous mode", () => {
      switchMode("autonomous");
      expect(isParallelEnabled()).toBe(true);
    });
  });

  describe("formatModeInfo", () => {
    it("formats active mode info", () => {
      const info = formatModeInfo();
      expect(info).toContain("Interactive");
      expect(info).toContain("Breakpoints: always");
    });

    it("formats specific mode info", () => {
      const info = formatModeInfo("fast");
      expect(info).toContain("Fast");
      expect(info).toContain("Parallelism: enabled");
    });
  });

  describe("resetMode", () => {
    it("resets to interactive", () => {
      switchMode("autonomous");
      resetMode();
      expect(getActiveMode()).toBe("interactive");
    });
  });
});
