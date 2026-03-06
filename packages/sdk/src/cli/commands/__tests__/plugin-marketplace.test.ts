/**
 * Tests for marketplace CLI command handlers.
 *
 * Covers: handlePluginAddMarketplace, handlePluginUpdateMarketplace, handlePluginListPlugins
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import type { MarketplacePluginEntry } from "../../../plugins/types";

// Mock the marketplace module before importing handlers
vi.mock("../../../plugins/marketplace", () => ({
  cloneMarketplace: vi.fn(),
  updateMarketplace: vi.fn(),
  listMarketplacePlugins: vi.fn(),
  resolvePluginPackagePath: vi.fn(),
  readMarketplaceManifest: vi.fn(),
}));

import {
  handlePluginAddMarketplace,
  handlePluginUpdateMarketplace,
  handlePluginListPlugins,
} from "../plugin";

import {
  cloneMarketplace,
  updateMarketplace,
  listMarketplacePlugins,
} from "../../../plugins/marketplace";

const mockedClone = vi.mocked(cloneMarketplace);
const mockedUpdate = vi.mocked(updateMarketplace);
const mockedList = vi.mocked(listMarketplacePlugins);

describe("marketplace CLI command handlers", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // ==========================================================================
  // handlePluginAddMarketplace
  // ==========================================================================

  describe("handlePluginAddMarketplace", () => {
    it("returns 1 when marketplaceUrl is missing", async () => {
      const result = await handlePluginAddMarketplace({
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("--marketplace-url is required")
      );
    });

    it("returns 1 with JSON error when marketplaceUrl is missing and --json is set", async () => {
      const result = await handlePluginAddMarketplace({
        scope: "global",
        json: true,
      });

      expect(result).toBe(1);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.error).toBe("missing_argument");
      expect(output.message).toContain("--marketplace-url is required");
    });

    it("returns 1 when scope is missing", async () => {
      const result = await handlePluginAddMarketplace({
        marketplaceUrl: "https://github.com/example/marketplace",
        json: false,
      });

      expect(result).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("--scope (global|project) is required")
      );
    });

    it("returns 1 with JSON error when scope is missing and --json is set", async () => {
      const result = await handlePluginAddMarketplace({
        marketplaceUrl: "https://github.com/example/marketplace",
        json: true,
      });

      expect(result).toBe(1);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.error).toBe("missing_argument");
      expect(output.message).toContain("--scope");
    });

    it("calls cloneMarketplace with correct args and returns 0 on success", async () => {
      mockedClone.mockResolvedValue("/path/to/cloned/marketplace");

      const result = await handlePluginAddMarketplace({
        marketplaceUrl: "https://github.com/example/marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(mockedClone).toHaveBeenCalledWith(
        "https://github.com/example/marketplace",
        "global",
        undefined
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Marketplace cloned successfully")
      );
    });

    it("passes projectDir as cwd when scope is project", async () => {
      mockedClone.mockResolvedValue("/project/.a5c/marketplaces/example");

      const result = await handlePluginAddMarketplace({
        marketplaceUrl: "https://github.com/example/marketplace",
        scope: "project",
        json: false,
      });

      expect(result).toBe(0);
      expect(mockedClone).toHaveBeenCalledWith(
        "https://github.com/example/marketplace",
        "project",
        process.cwd()
      );
    });

    it("outputs JSON when --json flag is set on success", async () => {
      mockedClone.mockResolvedValue("/path/to/cloned/marketplace");

      const result = await handlePluginAddMarketplace({
        marketplaceUrl: "https://github.com/example/marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(0);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.success).toBe(true);
      expect(output.url).toBe("https://github.com/example/marketplace");
      expect(output.scope).toBe("global");
      expect(output.directory).toBe("/path/to/cloned/marketplace");
    });

    it("returns 1 when cloneMarketplace throws", async () => {
      mockedClone.mockRejectedValue(new Error("git clone failed"));

      const result = await handlePluginAddMarketplace({
        marketplaceUrl: "https://github.com/example/marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("git clone failed")
      );
    });

    it("returns 1 with JSON error when cloneMarketplace throws and --json is set", async () => {
      mockedClone.mockRejectedValue(new Error("git clone failed"));

      const result = await handlePluginAddMarketplace({
        marketplaceUrl: "https://github.com/example/marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(1);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.error).toBe("clone_failed");
      expect(output.message).toBe("git clone failed");
    });
  });

  // ==========================================================================
  // handlePluginUpdateMarketplace
  // ==========================================================================

  describe("handlePluginUpdateMarketplace", () => {
    it("returns 1 when marketplaceName is missing", async () => {
      const result = await handlePluginUpdateMarketplace({
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("--marketplace-name is required")
      );
    });

    it("returns 1 with JSON error when marketplaceName is missing and --json is set", async () => {
      const result = await handlePluginUpdateMarketplace({
        scope: "global",
        json: true,
      });

      expect(result).toBe(1);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.error).toBe("missing_argument");
      expect(output.message).toContain("--marketplace-name is required");
    });

    it("returns 1 when scope is missing", async () => {
      const result = await handlePluginUpdateMarketplace({
        marketplaceName: "my-marketplace",
        json: false,
      });

      expect(result).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("--scope (global|project) is required")
      );
    });

    it("calls updateMarketplace and returns 0 on success", async () => {
      mockedUpdate.mockResolvedValue(undefined as unknown as string);

      const result = await handlePluginUpdateMarketplace({
        marketplaceName: "my-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(mockedUpdate).toHaveBeenCalledWith(
        "my-marketplace",
        "global",
        undefined
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('"my-marketplace" updated successfully')
      );
    });

    it("outputs JSON on success when --json is set", async () => {
      mockedUpdate.mockResolvedValue(undefined as unknown as string);

      const result = await handlePluginUpdateMarketplace({
        marketplaceName: "my-marketplace",
        scope: "project",
        json: true,
      });

      expect(result).toBe(0);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.success).toBe(true);
      expect(output.marketplace).toBe("my-marketplace");
      expect(output.scope).toBe("project");
    });

    it("returns 1 when updateMarketplace throws (git pull failure)", async () => {
      mockedUpdate.mockRejectedValue(new Error("git pull failed: network error"));

      const result = await handlePluginUpdateMarketplace({
        marketplaceName: "my-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("git pull failed: network error")
      );
    });

    it("returns 1 with JSON error when updateMarketplace throws and --json is set", async () => {
      mockedUpdate.mockRejectedValue(new Error("git pull failed"));

      const result = await handlePluginUpdateMarketplace({
        marketplaceName: "my-marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(1);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.error).toBe("update_failed");
      expect(output.message).toBe("git pull failed");
    });
  });

  // ==========================================================================
  // handlePluginListPlugins
  // ==========================================================================

  describe("handlePluginListPlugins", () => {
    const samplePlugins: MarketplacePluginEntry[] = [
      {
        name: "plugin-alpha",
        latestVersion: "1.2.0",
        description: "Alpha plugin for testing",
        versions: ["1.2.0", "1.1.0", "1.0.0"],
        packagePath: "plugins/plugin-alpha",
      },
      {
        name: "plugin-beta",
        latestVersion: "0.5.1",
        description: "Beta plugin for experiments",
        versions: ["0.5.1", "0.5.0"],
        packagePath: "plugins/plugin-beta",
      },
    ];

    it("returns 1 when marketplaceName is missing", async () => {
      const result = await handlePluginListPlugins({
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("--marketplace-name is required")
      );
    });

    it("returns 1 with JSON error when marketplaceName is missing and --json is set", async () => {
      const result = await handlePluginListPlugins({
        scope: "global",
        json: true,
      });

      expect(result).toBe(1);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.error).toBe("missing_argument");
    });

    it("returns 1 when scope is missing", async () => {
      const result = await handlePluginListPlugins({
        marketplaceName: "my-marketplace",
        json: false,
      });

      expect(result).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("--scope (global|project) is required")
      );
    });

    it("calls listMarketplacePlugins and outputs formatted results", async () => {
      mockedList.mockResolvedValue(samplePlugins);

      const result = await handlePluginListPlugins({
        marketplaceName: "my-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(mockedList).toHaveBeenCalledWith(
        "my-marketplace",
        "global",
        undefined
      );

      // Check that the header and plugin rows were output
      const allOutput = logSpy.mock.calls.map((c) => c[0]).join("\n");
      expect(allOutput).toContain("plugin-alpha");
      expect(allOutput).toContain("1.2.0");
      expect(allOutput).toContain("plugin-beta");
      expect(allOutput).toContain("0.5.1");
      expect(allOutput).toContain("2 plugin(s) available");
    });

    it("outputs JSON array when --json flag is set", async () => {
      mockedList.mockResolvedValue(samplePlugins);

      const result = await handlePluginListPlugins({
        marketplaceName: "my-marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(0);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.marketplace).toBe("my-marketplace");
      expect(output.scope).toBe("global");
      expect(output.count).toBe(2);
      expect(output.plugins).toHaveLength(2);
      expect(output.plugins[0].name).toBe("plugin-alpha");
      expect(output.plugins[1].name).toBe("plugin-beta");
    });

    it("returns 0 with empty list when no plugins found", async () => {
      mockedList.mockResolvedValue([]);

      const result = await handlePluginListPlugins({
        marketplaceName: "empty-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      const allOutput = logSpy.mock.calls.map((c) => c[0]).join("\n");
      expect(allOutput).toContain("No plugins found");
    });

    it("returns 0 with empty JSON list when no plugins and --json is set", async () => {
      mockedList.mockResolvedValue([]);

      const result = await handlePluginListPlugins({
        marketplaceName: "empty-marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(0);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.count).toBe(0);
      expect(output.plugins).toEqual([]);
    });

    it("returns 1 when listMarketplacePlugins throws", async () => {
      mockedList.mockRejectedValue(new Error("manifest not found"));

      const result = await handlePluginListPlugins({
        marketplaceName: "broken-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("manifest not found")
      );
    });

    it("returns 1 with JSON error when listMarketplacePlugins throws and --json is set", async () => {
      mockedList.mockRejectedValue(new Error("manifest not found"));

      const result = await handlePluginListPlugins({
        marketplaceName: "broken-marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(1);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.error).toBe("list_failed");
      expect(output.message).toBe("manifest not found");
    });
  });
});
