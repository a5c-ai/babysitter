/**
 * Tests for plugin registry CLI command handlers:
 *   handlePluginListInstalled
 *   handlePluginUpdateRegistry
 *   handlePluginRemoveFromRegistry
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PluginRegistry, PluginRegistryEntry } from "../../../plugins/types";
import { PLUGIN_REGISTRY_SCHEMA_VERSION } from "../../../plugins/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../../../plugins/registry", () => ({
  readPluginRegistry: vi.fn(),
  getPluginEntry: vi.fn(),
  listPluginEntries: vi.fn(),
  upsertPluginEntry: vi.fn(),
  removePluginEntry: vi.fn(),
  writePluginRegistry: vi.fn(),
}));

vi.mock("../../../plugins/marketplace", () => ({
  resolvePluginPackagePath: vi.fn(),
}));

import {
  readPluginRegistry,
  getPluginEntry,
  listPluginEntries,
  upsertPluginEntry,
  removePluginEntry,
  writePluginRegistry,
} from "../../../plugins/registry";

import { resolvePluginPackagePath } from "../../../plugins/marketplace";

import {
  handlePluginListInstalled,
  handlePluginUpdateRegistry,
  handlePluginRemoveFromRegistry,
} from "../plugin";

// Cast mocks for convenience
const mockReadPluginRegistry = vi.mocked(readPluginRegistry);
const mockGetPluginEntry = vi.mocked(getPluginEntry);
const mockListPluginEntries = vi.mocked(listPluginEntries);
const mockUpsertPluginEntry = vi.mocked(upsertPluginEntry);
const mockRemovePluginEntry = vi.mocked(removePluginEntry);
const mockWritePluginRegistry = vi.mocked(writePluginRegistry);
const mockResolvePluginPackagePath = vi.mocked(resolvePluginPackagePath);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyRegistry(): PluginRegistry {
  return {
    schemaVersion: PLUGIN_REGISTRY_SCHEMA_VERSION,
    updatedAt: "2026-01-01T00:00:00.000Z",
    plugins: {},
  };
}

function makeEntry(overrides: Partial<PluginRegistryEntry> = {}): PluginRegistryEntry {
  return {
    name: "test-plugin@example.com",
    version: "1.0.0",
    marketplace: "example-marketplace",
    scope: "global",
    installedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    packagePath: "/path/to/plugin",
    metadata: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// handlePluginListInstalled
// ---------------------------------------------------------------------------

describe("handlePluginListInstalled", () => {
  it("returns error when scope is missing", async () => {
    const code = await handlePluginListInstalled({ json: false });
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--global or --project")
    );
  });

  it("returns JSON error when scope is missing and --json is set", async () => {
    const code = await handlePluginListInstalled({ json: true });
    expect(code).toBe(1);
    const output = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.error).toBe("missing_argument");
  });

  it("reads registry and lists all entries", async () => {
    const entry = makeEntry();
    const registry = emptyRegistry();
    registry.plugins[entry.name] = entry;

    mockReadPluginRegistry.mockResolvedValue(registry);
    mockListPluginEntries.mockReturnValue([entry]);

    const code = await handlePluginListInstalled({ scope: "global", json: false });
    expect(code).toBe(0);
    expect(mockReadPluginRegistry).toHaveBeenCalledWith("global", undefined);
    expect(mockListPluginEntries).toHaveBeenCalledWith(registry);
  });

  it("outputs formatted table in human mode", async () => {
    const entry = makeEntry();
    mockReadPluginRegistry.mockResolvedValue(emptyRegistry());
    mockListPluginEntries.mockReturnValue([entry]);

    await handlePluginListInstalled({ scope: "global", json: false });

    const allOutput = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(allOutput).toContain("Installed plugins");
    expect(allOutput).toContain(entry.name);
    expect(allOutput).toContain(entry.version);
    expect(allOutput).toContain(entry.marketplace);
    expect(allOutput).toContain("1 plugin(s) installed.");
  });

  it("outputs JSON array when --json flag is set", async () => {
    const entry = makeEntry();
    mockReadPluginRegistry.mockResolvedValue(emptyRegistry());
    mockListPluginEntries.mockReturnValue([entry]);

    const code = await handlePluginListInstalled({ scope: "global", json: true });
    expect(code).toBe(0);

    const output = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe(entry.name);
    expect(parsed[0].version).toBe(entry.version);
    expect(parsed[0].marketplace).toBe(entry.marketplace);
    expect(parsed[0].installedAt).toBe(entry.installedAt);
    expect(parsed[0].updatedAt).toBe(entry.updatedAt);
  });

  it("handles empty registry (no plugins)", async () => {
    mockReadPluginRegistry.mockResolvedValue(emptyRegistry());
    mockListPluginEntries.mockReturnValue([]);

    const code = await handlePluginListInstalled({ scope: "project", json: false });
    expect(code).toBe(0);

    const allOutput = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(allOutput).toContain("No plugins installed");
  });
});

// ---------------------------------------------------------------------------
// handlePluginUpdateRegistry
// ---------------------------------------------------------------------------

describe("handlePluginUpdateRegistry", () => {
  it("returns error when pluginName is missing", async () => {
    const code = await handlePluginUpdateRegistry({
      pluginVersion: "1.0.0",
      marketplaceName: "mp",
      scope: "global",
      json: false,
    });
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--plugin-name")
    );
  });

  it("returns error when pluginVersion is missing", async () => {
    const code = await handlePluginUpdateRegistry({
      pluginName: "p",
      marketplaceName: "mp",
      scope: "global",
      json: false,
    });
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--plugin-version")
    );
  });

  it("returns error when marketplaceName is missing", async () => {
    const code = await handlePluginUpdateRegistry({
      pluginName: "p",
      pluginVersion: "1.0.0",
      scope: "global",
      json: false,
    });
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--marketplace-name")
    );
  });

  it("returns error when scope is missing", async () => {
    const code = await handlePluginUpdateRegistry({
      pluginName: "p",
      pluginVersion: "1.0.0",
      marketplaceName: "mp",
      json: false,
    });
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--global or --project")
    );
  });

  it("reads registry, upserts entry, and writes back", async () => {
    const registry = emptyRegistry();
    const updatedRegistry = { ...registry, updatedAt: "2026-03-06T00:00:00.000Z" };

    mockReadPluginRegistry.mockResolvedValue(registry);
    mockGetPluginEntry.mockReturnValue(undefined);
    mockResolvePluginPackagePath.mockResolvedValue("/resolved/path");
    mockUpsertPluginEntry.mockReturnValue(updatedRegistry);
    mockWritePluginRegistry.mockResolvedValue(undefined);

    const code = await handlePluginUpdateRegistry({
      pluginName: "my-plugin",
      pluginVersion: "2.0.0",
      marketplaceName: "mp",
      scope: "global",
      json: false,
    });

    expect(code).toBe(0);
    expect(mockReadPluginRegistry).toHaveBeenCalledWith("global", undefined);
    expect(mockResolvePluginPackagePath).toHaveBeenCalledWith("mp", "my-plugin", "global", undefined);
    expect(mockUpsertPluginEntry).toHaveBeenCalledWith(
      registry,
      expect.objectContaining({
        name: "my-plugin",
        version: "2.0.0",
        marketplace: "mp",
        packagePath: "/resolved/path",
      })
    );
    expect(mockWritePluginRegistry).toHaveBeenCalledWith(updatedRegistry, "global", undefined);
  });

  it("preserves installedAt for existing entries", async () => {
    const existingEntry = makeEntry({
      name: "my-plugin",
      installedAt: "2025-06-15T10:00:00.000Z",
    });
    const registry = emptyRegistry();

    mockReadPluginRegistry.mockResolvedValue(registry);
    mockGetPluginEntry.mockReturnValue(existingEntry);
    mockResolvePluginPackagePath.mockResolvedValue("/resolved/path");
    mockUpsertPluginEntry.mockReturnValue(registry);
    mockWritePluginRegistry.mockResolvedValue(undefined);

    await handlePluginUpdateRegistry({
      pluginName: "my-plugin",
      pluginVersion: "2.0.0",
      marketplaceName: "mp",
      scope: "global",
      json: false,
    });

    const upsertCall = mockUpsertPluginEntry.mock.calls[0][1];
    expect(upsertCall.installedAt).toBe("2025-06-15T10:00:00.000Z");
  });

  it("sets new installedAt for new entries", async () => {
    const registry = emptyRegistry();

    mockReadPluginRegistry.mockResolvedValue(registry);
    mockGetPluginEntry.mockReturnValue(undefined);
    mockResolvePluginPackagePath.mockResolvedValue("/resolved/path");
    mockUpsertPluginEntry.mockReturnValue(registry);
    mockWritePluginRegistry.mockResolvedValue(undefined);

    const before = new Date().toISOString();

    await handlePluginUpdateRegistry({
      pluginName: "new-plugin",
      pluginVersion: "1.0.0",
      marketplaceName: "mp",
      scope: "global",
      json: false,
    });

    const after = new Date().toISOString();
    const upsertCall = mockUpsertPluginEntry.mock.calls[0][1];
    // installedAt should be a new ISO timestamp between before and after
    expect(upsertCall.installedAt >= before).toBe(true);
    expect(upsertCall.installedAt <= after).toBe(true);
  });

  it("succeeds when marketplace is unavailable (resolvePluginPackagePath fails)", async () => {
    const registry = emptyRegistry();

    mockReadPluginRegistry.mockResolvedValue(registry);
    mockGetPluginEntry.mockReturnValue(undefined);
    mockResolvePluginPackagePath.mockRejectedValue(
      new Error('Marketplace manifest not found at /nonexistent. Is "mp" a valid marketplace?')
    );
    mockUpsertPluginEntry.mockReturnValue(registry);
    mockWritePluginRegistry.mockResolvedValue(undefined);

    const code = await handlePluginUpdateRegistry({
      pluginName: "my-plugin",
      pluginVersion: "1.0.0",
      marketplaceName: "mp",
      scope: "global",
      json: false,
    });

    // Should succeed even though marketplace resolution failed
    expect(code).toBe(0);
    expect(mockUpsertPluginEntry).toHaveBeenCalledWith(
      registry,
      expect.objectContaining({
        name: "my-plugin",
        version: "1.0.0",
        marketplace: "mp",
      })
    );
    expect(mockWritePluginRegistry).toHaveBeenCalled();
  });

  it("uses empty string as packagePath when marketplace is unavailable", async () => {
    const registry = emptyRegistry();

    mockReadPluginRegistry.mockResolvedValue(registry);
    mockGetPluginEntry.mockReturnValue(undefined);
    mockResolvePluginPackagePath.mockRejectedValue(
      new Error("Plugin not found in marketplace")
    );
    mockUpsertPluginEntry.mockReturnValue(registry);
    mockWritePluginRegistry.mockResolvedValue(undefined);

    await handlePluginUpdateRegistry({
      pluginName: "my-plugin",
      pluginVersion: "1.0.0",
      marketplaceName: "mp",
      scope: "global",
      json: true,
    });

    const upsertCall = mockUpsertPluginEntry.mock.calls[0][1];
    expect(upsertCall.packagePath).toBe("");
  });

  it("outputs the upserted entry as JSON", async () => {
    const registry = emptyRegistry();

    mockReadPluginRegistry.mockResolvedValue(registry);
    mockGetPluginEntry.mockReturnValue(undefined);
    mockResolvePluginPackagePath.mockResolvedValue("/resolved/path");
    mockUpsertPluginEntry.mockReturnValue(registry);
    mockWritePluginRegistry.mockResolvedValue(undefined);

    const code = await handlePluginUpdateRegistry({
      pluginName: "my-plugin",
      pluginVersion: "2.0.0",
      marketplaceName: "mp",
      scope: "global",
      json: true,
    });

    expect(code).toBe(0);
    const output = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.name).toBe("my-plugin");
    expect(parsed.version).toBe("2.0.0");
    expect(parsed.marketplace).toBe("mp");
    expect(parsed.packagePath).toBe("/resolved/path");
  });
});

// ---------------------------------------------------------------------------
// handlePluginRemoveFromRegistry
// ---------------------------------------------------------------------------

describe("handlePluginRemoveFromRegistry", () => {
  it("returns error when pluginName is missing", async () => {
    const code = await handlePluginRemoveFromRegistry({
      scope: "global",
      json: false,
    });
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--plugin-name")
    );
  });

  it("returns error when scope is missing", async () => {
    const code = await handlePluginRemoveFromRegistry({
      pluginName: "p",
      json: false,
    });
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--global or --project")
    );
  });

  it("reads registry, removes entry, and writes back", async () => {
    const registry = emptyRegistry();
    const updatedRegistry = emptyRegistry();

    mockReadPluginRegistry.mockResolvedValue(registry);
    mockRemovePluginEntry.mockReturnValue(updatedRegistry);
    mockWritePluginRegistry.mockResolvedValue(undefined);

    const code = await handlePluginRemoveFromRegistry({
      pluginName: "my-plugin",
      scope: "global",
      json: false,
    });

    expect(code).toBe(0);
    expect(mockReadPluginRegistry).toHaveBeenCalledWith("global", undefined);
    expect(mockRemovePluginEntry).toHaveBeenCalledWith(registry, "my-plugin");
    expect(mockWritePluginRegistry).toHaveBeenCalledWith(updatedRegistry, "global", undefined);
  });

  it("returns 1 when plugin not found in registry", async () => {
    const registry = emptyRegistry();

    mockReadPluginRegistry.mockResolvedValue(registry);
    mockRemovePluginEntry.mockImplementation(() => {
      throw new Error('Plugin "unknown-plugin" is not present in the registry');
    });

    const code = await handlePluginRemoveFromRegistry({
      pluginName: "unknown-plugin",
      scope: "global",
      json: false,
    });

    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("not present in the registry")
    );
  });

  it("outputs confirmation on success", async () => {
    mockReadPluginRegistry.mockResolvedValue(emptyRegistry());
    mockRemovePluginEntry.mockReturnValue(emptyRegistry());
    mockWritePluginRegistry.mockResolvedValue(undefined);

    const code = await handlePluginRemoveFromRegistry({
      pluginName: "my-plugin",
      scope: "global",
      json: false,
    });

    expect(code).toBe(0);
    const allOutput = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(allOutput).toContain("my-plugin");
    expect(allOutput).toContain("removed from registry");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockReadPluginRegistry.mockResolvedValue(emptyRegistry());
    mockRemovePluginEntry.mockReturnValue(emptyRegistry());
    mockWritePluginRegistry.mockResolvedValue(undefined);

    const code = await handlePluginRemoveFromRegistry({
      pluginName: "my-plugin",
      scope: "global",
      json: true,
    });

    expect(code).toBe(0);
    const output = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.removed).toBe(true);
    expect(parsed.plugin).toBe("my-plugin");
  });
});
