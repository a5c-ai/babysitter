/**
 * Tests for plugin lifecycle CLI commands:
 * handlePluginInstall, handlePluginUninstall, handlePluginUpdate, handlePluginConfigure
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../plugins/marketplace", () => ({
  updateMarketplace: vi.fn(),
  resolvePluginPackagePath: vi.fn(),
  readMarketplaceManifest: vi.fn(),
  cloneMarketplace: vi.fn(),
  listMarketplacePlugins: vi.fn(),
}));

vi.mock("../../../plugins/registry", () => ({
  readPluginRegistry: vi.fn(),
  getPluginEntry: vi.fn(),
  listPluginEntries: vi.fn(),
  upsertPluginEntry: vi.fn(),
  removePluginEntry: vi.fn(),
  writePluginRegistry: vi.fn(),
}));

vi.mock("../../../plugins/packageReader", () => ({
  readInstallInstructions: vi.fn(),
  readUninstallInstructions: vi.fn(),
  readConfigureInstructions: vi.fn(),
}));

vi.mock("../../../plugins/migrations", () => ({
  resolveMigrationChain: vi.fn(),
}));

// Mock node:fs to avoid real filesystem access for process file checks
vi.mock("node:fs", () => ({
  promises: {
    access: vi.fn().mockRejectedValue(new Error("ENOENT")),
  },
}));

import {
  handlePluginInstall,
  handlePluginUninstall,
  handlePluginUpdate,
  handlePluginConfigure,
} from "../plugin";

import {
  updateMarketplace,
  resolvePluginPackagePath,
  readMarketplaceManifest,
} from "../../../plugins/marketplace";

import {
  readPluginRegistry,
  getPluginEntry,
} from "../../../plugins/registry";

import {
  readInstallInstructions,
  readUninstallInstructions,
  readConfigureInstructions,
} from "../../../plugins/packageReader";

import { resolveMigrationChain } from "../../../plugins/migrations";

describe("plugin lifecycle commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // ==========================================================================
  // handlePluginInstall
  // ==========================================================================
  describe("handlePluginInstall", () => {
    it("returns error when pluginName is missing", async () => {
      const result = await handlePluginInstall({
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:install] --plugin-name is required"
      );
    });

    it("returns error when marketplaceName is missing", async () => {
      const result = await handlePluginInstall({
        pluginName: "test-plugin",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:install] --marketplace-name is required"
      );
    });

    it("returns error when scope is missing", async () => {
      const result = await handlePluginInstall({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:install] --scope (global|project) is required"
      );
    });

    it("calls updateMarketplace, resolvePluginPackagePath, readInstallInstructions on success", async () => {
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {
          "test-plugin": {
            name: "test-plugin",
            latestVersion: "1.0.0",
            description: "A test plugin",
          },
        },
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readInstallInstructions).mockResolvedValue(
        "Run npm install"
      );

      const result = await handlePluginInstall({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(updateMarketplace).toHaveBeenCalledWith(
        "test-marketplace",
        "global",
        undefined
      );
      expect(resolvePluginPackagePath).toHaveBeenCalledWith(
        "test-marketplace",
        "test-plugin",
        "global",
        undefined
      );
      expect(readInstallInstructions).toHaveBeenCalledWith(
        "/fake/path/test-plugin"
      );
    });

    it("returns install instructions and version in output", async () => {
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {
          "test-plugin": {
            name: "test-plugin",
            latestVersion: "2.1.0",
            description: "A test plugin",
          },
        },
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readInstallInstructions).mockResolvedValue(
        "Step 1: configure\nStep 2: restart"
      );

      const result = await handlePluginInstall({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(console.log).toHaveBeenCalledWith(
        "Plugin: test-plugin v2.1.0"
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Step 1: configure")
      );
    });

    it("outputs JSON when --json flag is set", async () => {
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {
          "test-plugin": {
            name: "test-plugin",
            latestVersion: "1.0.0",
            description: "A test plugin",
          },
        },
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readInstallInstructions).mockResolvedValue("Install it");

      const result = await handlePluginInstall({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(0);
      const logSpy = vi.mocked(console.log);
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output.plugin).toBe("test-plugin");
      expect(output.version).toBe("1.0.0");
      expect(output.instructions).toBe("Install it");
    });

    it("returns 1 when plugin not found in marketplace", async () => {
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {},
      } as never);

      const result = await handlePluginInstall({
        pluginName: "nonexistent-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("not found in marketplace")
      );
    });

    it("returns JSON error when plugin not found and --json is set", async () => {
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {},
      } as never);

      const result = await handlePluginInstall({
        pluginName: "nonexistent-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(1);
      const logSpy = vi.mocked(console.log);
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output.error).toBe("install_failed");
    });

    it("uses provided pluginVersion instead of reading manifest", async () => {
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readInstallInstructions).mockResolvedValue(null as never);

      const result = await handlePluginInstall({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        pluginVersion: "3.0.0",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(readMarketplaceManifest).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        "Plugin: test-plugin v3.0.0"
      );
    });
  });

  // ==========================================================================
  // handlePluginUninstall
  // ==========================================================================
  describe("handlePluginUninstall", () => {
    it("returns error when pluginName is missing", async () => {
      const result = await handlePluginUninstall({
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:uninstall] --plugin-name is required"
      );
    });

    it("returns error when scope is missing", async () => {
      const result = await handlePluginUninstall({
        pluginName: "test-plugin",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:uninstall] --scope (global|project) is required"
      );
    });

    it("reads registry to find installed plugin entry", async () => {
      const fakeRegistry = { plugins: {} };
      vi.mocked(readPluginRegistry).mockResolvedValue(fakeRegistry as never);
      vi.mocked(getPluginEntry).mockReturnValue({
        name: "test-plugin",
        version: "1.0.0",
        marketplace: "test-marketplace",
        scope: "global",
        installedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        packagePath: "/fake/path",
        metadata: {},
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readUninstallInstructions).mockResolvedValue(
        "Remove config files"
      );

      const result = await handlePluginUninstall({
        pluginName: "test-plugin",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(readPluginRegistry).toHaveBeenCalledWith("global", undefined);
      expect(getPluginEntry).toHaveBeenCalledWith(fakeRegistry, "test-plugin");
    });

    it("returns error when plugin not in registry", async () => {
      vi.mocked(readPluginRegistry).mockResolvedValue({ plugins: {} } as never);
      vi.mocked(getPluginEntry).mockReturnValue(null as never);

      const result = await handlePluginUninstall({
        pluginName: "unknown-plugin",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("is not installed")
      );
    });

    it("calls readUninstallInstructions on success", async () => {
      vi.mocked(readPluginRegistry).mockResolvedValue({ plugins: {} } as never);
      vi.mocked(getPluginEntry).mockReturnValue({
        name: "test-plugin",
        version: "1.0.0",
        marketplace: "test-marketplace",
        scope: "global",
        installedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        packagePath: "/fake/path",
        metadata: {},
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readUninstallInstructions).mockResolvedValue(
        "Remove all configs"
      );

      await handlePluginUninstall({
        pluginName: "test-plugin",
        scope: "global",
        json: false,
      });

      expect(readUninstallInstructions).toHaveBeenCalledWith(
        "/fake/path/test-plugin"
      );
    });

    it("returns uninstall instructions in output", async () => {
      vi.mocked(readPluginRegistry).mockResolvedValue({ plugins: {} } as never);
      vi.mocked(getPluginEntry).mockReturnValue({
        name: "test-plugin",
        version: "1.0.0",
        marketplace: "test-marketplace",
        scope: "global",
        installedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        packagePath: "/fake/path",
        metadata: {},
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readUninstallInstructions).mockResolvedValue(
        "Step 1: remove files\nStep 2: cleanup"
      );

      const result = await handlePluginUninstall({
        pluginName: "test-plugin",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Step 1: remove files")
      );
    });

    it("outputs JSON when --json flag is set", async () => {
      vi.mocked(readPluginRegistry).mockResolvedValue({ plugins: {} } as never);
      vi.mocked(getPluginEntry).mockReturnValue({
        name: "test-plugin",
        version: "1.0.0",
        marketplace: "test-marketplace",
        scope: "global",
        installedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        packagePath: "/fake/path",
        metadata: {},
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readUninstallInstructions).mockResolvedValue("Uninstall it");

      const result = await handlePluginUninstall({
        pluginName: "test-plugin",
        scope: "global",
        json: true,
      });

      expect(result).toBe(0);
      const logSpy = vi.mocked(console.log);
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output.plugin).toBe("test-plugin");
      expect(output.instructions).toBe("Uninstall it");
    });
  });

  // ==========================================================================
  // handlePluginUpdate
  // ==========================================================================
  describe("handlePluginUpdate", () => {
    it("returns error when pluginName is missing", async () => {
      const result = await handlePluginUpdate({
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:update] --plugin-name is required"
      );
    });

    it("returns error when marketplaceName is missing", async () => {
      const result = await handlePluginUpdate({
        pluginName: "test-plugin",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:update] --marketplace-name is required"
      );
    });

    it("returns error when scope is missing", async () => {
      const result = await handlePluginUpdate({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:update] --scope (global|project) is required"
      );
    });

    it("reads registry for installed version", async () => {
      const fakeRegistry = { plugins: {} };
      vi.mocked(readPluginRegistry).mockResolvedValue(fakeRegistry as never);
      vi.mocked(getPluginEntry).mockReturnValue({
        name: "test-plugin",
        version: "1.0.0",
        marketplace: "test-marketplace",
        scope: "global",
        installedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        packagePath: "/fake/path",
        metadata: {},
      } as never);
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {
          "test-plugin": {
            name: "test-plugin",
            latestVersion: "2.0.0",
            description: "A test plugin",
          },
        },
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(resolveMigrationChain).mockResolvedValue([
        {
          descriptor: {
            from: "1.0.0",
            to: "2.0.0",
            file: "migrate-1-to-2.md",
            type: "md",
          },
          content: "Migration instructions here",
        },
      ] as never);

      await handlePluginUpdate({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(readPluginRegistry).toHaveBeenCalledWith("global", undefined);
      expect(getPluginEntry).toHaveBeenCalledWith(fakeRegistry, "test-plugin");
    });

    it("returns error when plugin not installed", async () => {
      vi.mocked(readPluginRegistry).mockResolvedValue({ plugins: {} } as never);
      vi.mocked(getPluginEntry).mockReturnValue(null as never);

      const result = await handlePluginUpdate({
        pluginName: "unknown-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("is not installed")
      );
    });

    it("calls resolveMigrationChain with correct versions", async () => {
      vi.mocked(readPluginRegistry).mockResolvedValue({ plugins: {} } as never);
      vi.mocked(getPluginEntry).mockReturnValue({
        name: "test-plugin",
        version: "1.0.0",
        marketplace: "test-marketplace",
        scope: "global",
        installedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        packagePath: "/fake/path",
        metadata: {},
      } as never);
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {
          "test-plugin": {
            name: "test-plugin",
            latestVersion: "3.0.0",
            description: "A test plugin",
          },
        },
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(resolveMigrationChain).mockResolvedValue([
        {
          descriptor: {
            from: "1.0.0",
            to: "3.0.0",
            file: "migrate-1-to-3.md",
            type: "md",
          },
          content: "Big migration",
        },
      ] as never);

      await handlePluginUpdate({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(resolveMigrationChain).toHaveBeenCalledWith(
        "/fake/path/test-plugin",
        "1.0.0",
        "3.0.0"
      );
    });

    it("returns migration chain in output", async () => {
      vi.mocked(readPluginRegistry).mockResolvedValue({ plugins: {} } as never);
      vi.mocked(getPluginEntry).mockReturnValue({
        name: "test-plugin",
        version: "1.0.0",
        marketplace: "test-marketplace",
        scope: "global",
        installedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        packagePath: "/fake/path",
        metadata: {},
      } as never);
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {
          "test-plugin": {
            name: "test-plugin",
            latestVersion: "2.0.0",
            description: "A test plugin",
          },
        },
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(resolveMigrationChain).mockResolvedValue([
        {
          descriptor: {
            from: "1.0.0",
            to: "2.0.0",
            file: "migrate-1-to-2.md",
            type: "md",
          },
          content: "Apply migration step",
        },
      ] as never);

      const result = await handlePluginUpdate({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(0);
      const logSpy = vi.mocked(console.log);
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output.fromVersion).toBe("1.0.0");
      expect(output.toVersion).toBe("2.0.0");
      expect(output.migrations).toHaveLength(1);
      expect(output.migrations[0].from).toBe("1.0.0");
      expect(output.migrations[0].to).toBe("2.0.0");
      expect(output.migrations[0].instructions).toBe("Apply migration step");
    });

    it("handles case when no migration path exists", async () => {
      vi.mocked(readPluginRegistry).mockResolvedValue({ plugins: {} } as never);
      vi.mocked(getPluginEntry).mockReturnValue({
        name: "test-plugin",
        version: "1.0.0",
        marketplace: "test-marketplace",
        scope: "global",
        installedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        packagePath: "/fake/path",
        metadata: {},
      } as never);
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {
          "test-plugin": {
            name: "test-plugin",
            latestVersion: "5.0.0",
            description: "A test plugin",
          },
        },
      } as never);
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(resolveMigrationChain).mockResolvedValue(null as never);

      const result = await handlePluginUpdate({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("No migration path found")
      );
    });

    it("handles already at target version", async () => {
      vi.mocked(readPluginRegistry).mockResolvedValue({ plugins: {} } as never);
      vi.mocked(getPluginEntry).mockReturnValue({
        name: "test-plugin",
        version: "2.0.0",
        marketplace: "test-marketplace",
        scope: "global",
        installedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        packagePath: "/fake/path",
        metadata: {},
      } as never);
      vi.mocked(updateMarketplace).mockResolvedValue(undefined);
      vi.mocked(readMarketplaceManifest).mockResolvedValue({
        plugins: {
          "test-plugin": {
            name: "test-plugin",
            latestVersion: "2.0.0",
            description: "A test plugin",
          },
        },
      } as never);

      const result = await handlePluginUpdate({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("already at version")
      );
      expect(resolveMigrationChain).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // handlePluginConfigure
  // ==========================================================================
  describe("handlePluginConfigure", () => {
    it("returns error when pluginName is missing", async () => {
      const result = await handlePluginConfigure({
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:configure] --plugin-name is required"
      );
    });

    it("returns error when marketplaceName is missing", async () => {
      const result = await handlePluginConfigure({
        pluginName: "test-plugin",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:configure] --marketplace-name is required"
      );
    });

    it("returns error when scope is missing", async () => {
      const result = await handlePluginConfigure({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:configure] --scope (global|project) is required"
      );
    });

    it("calls readConfigureInstructions on success", async () => {
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readConfigureInstructions).mockResolvedValue(
        "Set API_KEY in .env"
      );

      const result = await handlePluginConfigure({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(readConfigureInstructions).toHaveBeenCalledWith(
        "/fake/path/test-plugin"
      );
    });

    it("returns configure instructions in output", async () => {
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readConfigureInstructions).mockResolvedValue(
        "Step 1: Set API key\nStep 2: Restart"
      );

      const result = await handlePluginConfigure({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(0);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Step 1: Set API key")
      );
    });

    it("outputs JSON when --json flag is set", async () => {
      vi.mocked(resolvePluginPackagePath).mockResolvedValue(
        "/fake/path/test-plugin"
      );
      vi.mocked(readConfigureInstructions).mockResolvedValue("Configure it");

      const result = await handlePluginConfigure({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: true,
      });

      expect(result).toBe(0);
      const logSpy = vi.mocked(console.log);
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output.plugin).toBe("test-plugin");
      expect(output.instructions).toBe("Configure it");
    });

    it("returns error when resolvePluginPackagePath fails", async () => {
      vi.mocked(resolvePluginPackagePath).mockRejectedValue(
        new Error("Package not found")
      );

      const result = await handlePluginConfigure({
        pluginName: "test-plugin",
        marketplaceName: "test-marketplace",
        scope: "global",
        json: false,
      });

      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        "[plugin:configure] Package not found"
      );
    });
  });
});
