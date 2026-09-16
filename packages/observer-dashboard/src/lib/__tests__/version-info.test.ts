import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getVersionInfo,
  detectCliVersion,
  resetVersionInfoCache,
} from "../version-info";

const MIN = 60 * 1000;

describe("version-info", () => {
  beforeEach(() => {
    resetVersionInfoCache();
  });

  describe("detectCliVersion", () => {
    it("extracts a semver from plain output", () => {
      expect(detectCliVersion("babysitter --version", () => "6.0.2\n")).toBe("6.0.2");
    });

    it("extracts a semver from noisy output", () => {
      expect(
        detectCliVersion("babysitter --version", () => "babysitter v6.0.2 (node 22)")
      ).toBe("6.0.2");
    });

    it("returns N/A when the command fails", () => {
      expect(
        detectCliVersion("babysitter --version", () => {
          throw new Error("command not found");
        })
      ).toBe("N/A");
    });

    it("returns N/A for empty output", () => {
      expect(detectCliVersion("babysitter --version", () => "")).toBe("N/A");
    });
  });

  describe("getVersionInfo caching", () => {
    const readPackageJson = () => JSON.stringify({ version: "0.12.3" });

    it("reports app and babysitter versions", () => {
      const info = getVersionInfo({
        now: () => 1_000_000,
        execCommand: () => "6.0.2",
        readPackageJson,
      });
      expect(info).toEqual({ app: "0.12.3", babysitter: "6.0.2" });
    });

    it("serves from cache within the TTL when polling continuously", () => {
      const execCommand = vi.fn(() => "6.0.2");
      let t = 0;
      getVersionInfo({ now: () => t, execCommand, readPackageJson });
      t += 30 * 1000; // 30s later: within TTL, no idle gap
      getVersionInfo({ now: () => t, execCommand, readPackageJson });
      expect(execCommand).toHaveBeenCalledTimes(1);
    });

    it("QA F6 regression: a CLI upgrade is picked up after an idle gap instead of the stale forever-cache", () => {
      // Long-lived server first detected an ancient CLI...
      const execCommand = vi.fn(() => "0.0.187");
      let t = 0;
      const stale = getVersionInfo({ now: () => t, execCommand, readPackageJson });
      expect(stale.babysitter).toBe("0.0.187");

      // ...the user upgrades babysitter and comes back later (> idle threshold).
      execCommand.mockReturnValue("6.0.2");
      t += 2 * MIN;
      const fresh = getVersionInfo({ now: () => t, execCommand, readPackageJson });
      expect(fresh.babysitter).toBe("6.0.2");
    });

    it("refreshes after TTL expiry even under continuous polling (no idle gap)", () => {
      const execCommand = vi.fn(() => "6.0.2");
      let t = 0;
      // Poll every 30s for 6 minutes: idle gap never exceeds the threshold.
      for (; t <= 6 * MIN; t += 30 * 1000) {
        getVersionInfo({ now: () => t, execCommand, readPackageJson });
      }
      // Initial detection + at least one TTL-driven refresh past the 5 min mark.
      expect(execCommand.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("falls back to NEXT_PUBLIC_APP_VERSION when package.json is unreadable", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "9.9.9");
      const info = getVersionInfo({
        now: () => 0,
        execCommand: () => "6.0.2",
        readPackageJson: () => {
          throw new Error("ENOENT");
        },
      });
      expect(info.app).toBe("9.9.9");
      vi.unstubAllEnvs();
    });
  });
});
