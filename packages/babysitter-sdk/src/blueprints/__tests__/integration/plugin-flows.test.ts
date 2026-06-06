/**
 * Plugin Management Integration Tests
 *
 * These tests exercise complete workflows across multiple plugin modules
 * using real filesystem operations in temporary directories.
 * Git operations are mocked since we cannot actually clone repositories.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  readMarketplaceManifest,
  listMarketplacePlugins,
  deriveMarketplaceName,
} from "../../marketplace";

import {
  readInstallInstructions,
  readUninstallInstructions,
  readConfigureInstructions,
  readPluginPackage,
  listMigrations,
  readMigration,
} from "../../packageReader";

import {
  readPluginRegistry,
  writePluginRegistry,
  upsertPluginEntry,
  removePluginEntry,
  listPluginEntries,
  getPluginEntry,
} from "../../registry";

import {
  resolveMigrationChain,
  findMigrationPath,
  listMigrations as listMigrationsFromDir,
  parseMigrationFilename,
  buildMigrationGraph,
} from "../../migrations";

import type {
  PluginRegistry,
  PluginRegistryEntry,
  MarketplaceManifest,
} from "../../types";

import { PLUGIN_REGISTRY_SCHEMA_VERSION } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a temp directory with a unique prefix and returns its absolute path. */
async function createTempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), `babysitter-test-${prefix}-`));
}

/** Writes a JSON file at the given path, creating parent dirs as needed. */
async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/** Writes a text file at the given path, creating parent dirs as needed. */
async function writeText(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

/** Creates a realistic marketplace manifest fixture. */
function createMarketplaceManifest(
  overrides: Partial<MarketplaceManifest> = {}
): MarketplaceManifest {
  return {
    name: "test-marketplace",
    description: "A test marketplace for integration tests",
    url: "https://github.com/test-org/test-marketplace.git",
    owner: "test-org",
    plugins: {
      "plugin-alpha@test-org": {
        name: "plugin-alpha@test-org",
        description: "Alpha plugin for testing",
        latestVersion: "1.2.0",
        versions: ["1.2.0", "1.1.0", "1.0.0"],
        packagePath: "plugins/plugin-alpha",
        tags: ["testing", "alpha"],
        author: "test-org",
      },
      "plugin-beta@test-org": {
        name: "plugin-beta@test-org",
        description: "Beta plugin for data processing",
        latestVersion: "2.0.0",
        versions: ["2.0.0", "1.0.0"],
        packagePath: "plugins/plugin-beta",
        tags: ["data", "beta"],
        author: "test-org",
      },
    },
    ...overrides,
  };
}

/** Creates a plugin registry entry fixture. */
function createRegistryEntry(
  overrides: Partial<PluginRegistryEntry> = {}
): PluginRegistryEntry {
  const now = new Date().toISOString();
  return {
    name: "plugin-alpha@test-org",
    version: "1.0.0",
    marketplace: "test-marketplace",
    scope: "project",
    installedAt: now,
    updatedAt: now,
    packagePath: "/tmp/plugins/plugin-alpha",
    metadata: {},
    ...overrides,
  };
}

/** Creates an empty registry fixture. */
function createEmptyRegistry(): PluginRegistry {
  return {
    schemaVersion: PLUGIN_REGISTRY_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    plugins: {},
  };
}

// ---------------------------------------------------------------------------
// Flow 1: Add marketplace then list plugins
// ---------------------------------------------------------------------------

describe("Flow 1: Add marketplace then list plugins", () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createTempDir("flow1");
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it("reads a marketplace manifest and lists its plugins", async () => {
    // Arrange: create a marketplace directory structure with manifest
    const marketplacesDir = path.join(projectDir, ".a5c", "marketplaces");
    const marketplaceDir = path.join(marketplacesDir, "test-marketplace");
    const manifest = createMarketplaceManifest();

    await writeJson(
      path.join(marketplaceDir, "marketplace.json"),
      manifest
    );

    // Act: read the manifest
    const readManifest = await readMarketplaceManifest(
      "test-marketplace",
      "project",
      projectDir
    );

    // Assert: manifest matches what we wrote
    expect(readManifest.name).toBe("test-marketplace");
    expect(readManifest.description).toBe("A test marketplace for integration tests");
    expect(readManifest.url).toBe("https://github.com/test-org/test-marketplace.git");
    expect(Object.keys(readManifest.plugins)).toHaveLength(2);
    expect(readManifest.plugins["plugin-alpha@test-org"]).toBeDefined();
    expect(readManifest.plugins["plugin-beta@test-org"]).toBeDefined();
  });

  it("lists marketplace plugins sorted by name", async () => {
    // Arrange
    const marketplaceDir = path.join(
      projectDir, ".a5c", "marketplaces", "test-marketplace"
    );
    await writeJson(
      path.join(marketplaceDir, "marketplace.json"),
      createMarketplaceManifest()
    );

    // Act
    const plugins = await listMarketplacePlugins(
      "test-marketplace",
      "project",
      projectDir
    );

    // Assert: plugins are sorted alphabetically by name
    expect(plugins).toHaveLength(2);
    expect(plugins[0].name).toBe("plugin-alpha@test-org");
    expect(plugins[0].latestVersion).toBe("1.2.0");
    expect(plugins[0].tags).toEqual(["testing", "alpha"]);
    expect(plugins[1].name).toBe("plugin-beta@test-org");
    expect(plugins[1].latestVersion).toBe("2.0.0");
    expect(plugins[1].tags).toEqual(["data", "beta"]);
  });

  it("includes all version history for each plugin", async () => {
    const marketplaceDir = path.join(
      projectDir, ".a5c", "marketplaces", "test-marketplace"
    );
    await writeJson(
      path.join(marketplaceDir, "marketplace.json"),
      createMarketplaceManifest()
    );

    const plugins = await listMarketplacePlugins(
      "test-marketplace",
      "project",
      projectDir
    );

    const alpha = plugins.find((p) => p.name === "plugin-alpha@test-org");
    expect(alpha?.versions).toEqual(["1.2.0", "1.1.0", "1.0.0"]);

    const beta = plugins.find((p) => p.name === "plugin-beta@test-org");
    expect(beta?.versions).toEqual(["2.0.0", "1.0.0"]);
  });
});

// ---------------------------------------------------------------------------
// Flow 2: Install plugin from marketplace
// ---------------------------------------------------------------------------

describe("Flow 2: Install plugin from marketplace", () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createTempDir("flow2");
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it("reads install instructions and tracks plugin in registry", async () => {
    // Arrange: create marketplace with plugin package containing install.md
    const marketplaceDir = path.join(
      projectDir, ".a5c", "marketplaces", "test-marketplace"
    );
    const pluginPackageDir = path.join(marketplaceDir, "plugins", "plugin-alpha");

    await writeJson(
      path.join(marketplaceDir, "marketplace.json"),
      createMarketplaceManifest()
    );
    await writeText(
      path.join(pluginPackageDir, "install.md"),
      "# Install Plugin Alpha\n\n1. Add the plugin to your settings.json\n2. Restart your editor\n"
    );

    // Act: read install instructions
    const instructions = await readInstallInstructions(pluginPackageDir);

    // Assert: instructions content matches
    expect(instructions).toBeDefined();
    expect(instructions).toContain("# Install Plugin Alpha");
    expect(instructions).toContain("Add the plugin to your settings.json");

    // Act: check registry is initially empty
    const emptyRegistry = await readPluginRegistry("project", projectDir);
    expect(Object.keys(emptyRegistry.plugins)).toHaveLength(0);

    // Act: upsert plugin entry
    const entry = createRegistryEntry({
      name: "plugin-alpha@test-org",
      version: "1.2.0",
      marketplace: "test-marketplace",
      scope: "project",
      packagePath: pluginPackageDir,
    });
    const updatedRegistry = upsertPluginEntry(emptyRegistry, entry);

    // Act: persist registry to disk
    await writePluginRegistry(updatedRegistry, "project", projectDir);

    // Act: read registry back from disk
    const rereadRegistry = await readPluginRegistry("project", projectDir);

    // Assert: plugin is tracked in the persisted registry
    expect(Object.keys(rereadRegistry.plugins)).toHaveLength(1);
    const tracked = rereadRegistry.plugins["plugin-alpha@test-org"];
    expect(tracked).toBeDefined();
    expect(tracked.version).toBe("1.2.0");
    expect(tracked.marketplace).toBe("test-marketplace");
    expect(tracked.packagePath).toBe(pluginPackageDir);
  });

  it("returns undefined when install.md is absent", async () => {
    const emptyPackageDir = path.join(projectDir, "empty-plugin");
    await mkdir(emptyPackageDir, { recursive: true });

    const instructions = await readInstallInstructions(emptyPackageDir);
    expect(instructions).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Flow 3: Update plugin with migrations
// ---------------------------------------------------------------------------

describe("Flow 3: Update plugin with migrations", () => {
  let projectDir: string;
  let pluginPackageDir: string;

  beforeEach(async () => {
    projectDir = await createTempDir("flow3");
    pluginPackageDir = path.join(projectDir, "plugin-alpha");

    // Create migration files
    const migrationsDir = path.join(pluginPackageDir, "migrations");
    await writeText(
      path.join(migrationsDir, "1.0.0_to_1.1.0.md"),
      "# Migration 1.0.0 to 1.1.0\n\n- Update config schema\n- Add new field `enableBeta`\n"
    );
    await writeText(
      path.join(migrationsDir, "1.1.0_to_2.0.0.md"),
      "# Migration 1.1.0 to 2.0.0\n\n- Breaking: rename `enableBeta` to `betaMode`\n- Remove deprecated `legacyField`\n"
    );
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it("resolves a 2-step migration chain from 1.0.0 to 2.0.0", async () => {
    // Act
    const chain = await resolveMigrationChain(
      pluginPackageDir,
      "1.0.0",
      "2.0.0"
    );

    // Assert: chain has 2 steps in correct order
    expect(chain).toBeDefined();
    expect(chain).toHaveLength(2);

    // First step: 1.0.0 -> 1.1.0
    expect(chain![0].descriptor.from).toBe("1.0.0");
    expect(chain![0].descriptor.to).toBe("1.1.0");
    expect(chain![0].descriptor.file).toBe("1.0.0_to_1.1.0.md");
    expect(chain![0].descriptor.type).toBe("md");
    expect(chain![0].content).toContain("Migration 1.0.0 to 1.1.0");
    expect(chain![0].content).toContain("enableBeta");

    // Second step: 1.1.0 -> 2.0.0
    expect(chain![1].descriptor.from).toBe("1.1.0");
    expect(chain![1].descriptor.to).toBe("2.0.0");
    expect(chain![1].descriptor.file).toBe("1.1.0_to_2.0.0.md");
    expect(chain![1].descriptor.type).toBe("md");
    expect(chain![1].content).toContain("Migration 1.1.0 to 2.0.0");
    expect(chain![1].content).toContain("betaMode");
  });

  it("resolves a single-step migration from 1.0.0 to 1.1.0", async () => {
    const chain = await resolveMigrationChain(
      pluginPackageDir,
      "1.0.0",
      "1.1.0"
    );

    expect(chain).toBeDefined();
    expect(chain).toHaveLength(1);
    expect(chain![0].descriptor.from).toBe("1.0.0");
    expect(chain![0].descriptor.to).toBe("1.1.0");
  });

  it("returns empty chain when from equals to", async () => {
    const chain = await resolveMigrationChain(
      pluginPackageDir,
      "1.0.0",
      "1.0.0"
    );

    expect(chain).toBeDefined();
    expect(chain).toHaveLength(0);
  });

  it("returns undefined when no migration path exists", async () => {
    const chain = await resolveMigrationChain(
      pluginPackageDir,
      "1.0.0",
      "3.0.0" // no migration to 3.0.0
    );

    expect(chain).toBeUndefined();
  });

  it("handles a 3-step migration chain", async () => {
    // Arrange: add a third migration step
    const migrationsDir = path.join(pluginPackageDir, "migrations");
    await writeText(
      path.join(migrationsDir, "2.0.0_to_3.0.0.md"),
      "# Migration 2.0.0 to 3.0.0\n\n- New plugin API\n"
    );

    // Act
    const chain = await resolveMigrationChain(
      pluginPackageDir,
      "1.0.0",
      "3.0.0"
    );

    // Assert
    expect(chain).toBeDefined();
    expect(chain).toHaveLength(3);
    expect(chain![0].descriptor.from).toBe("1.0.0");
    expect(chain![1].descriptor.from).toBe("1.1.0");
    expect(chain![2].descriptor.from).toBe("2.0.0");
    expect(chain![2].descriptor.to).toBe("3.0.0");
  });

  it("lists all migrations from the package directory via packageReader", async () => {
    const migrations = await listMigrations(pluginPackageDir);

    expect(migrations).toHaveLength(2);
    // Sorted by from version
    expect(migrations[0].from).toBe("1.0.0");
    expect(migrations[0].to).toBe("1.1.0");
    expect(migrations[1].from).toBe("1.1.0");
    expect(migrations[1].to).toBe("2.0.0");
  });

  it("reads a specific migration file by from/to version", async () => {
    const content = await readMigration(pluginPackageDir, "1.0.0", "1.1.0");
    expect(content).toContain("Migration 1.0.0 to 1.1.0");
    expect(content).toContain("enableBeta");
  });
});

// ---------------------------------------------------------------------------
// Flow 4: Uninstall plugin and cleanup
// ---------------------------------------------------------------------------

describe("Flow 4: Uninstall plugin and cleanup", () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createTempDir("flow4");
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it("reads uninstall instructions, removes plugin from registry, and persists", async () => {
    // Arrange: create a plugin package with uninstall.md
    const pluginPackageDir = path.join(projectDir, "plugin-package");
    await writeText(
      path.join(pluginPackageDir, "uninstall.md"),
      "# Uninstall Plugin Alpha\n\n1. Remove the plugin entry from settings.json\n2. Delete cached data from .a5c/cache/\n"
    );

    // Arrange: create a registry with the plugin entry
    const entry = createRegistryEntry({
      name: "plugin-alpha@test-org",
      version: "1.2.0",
      packagePath: pluginPackageDir,
    });
    const registry: PluginRegistry = {
      schemaVersion: PLUGIN_REGISTRY_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      plugins: {
        "plugin-alpha@test-org": entry,
      },
    };
    await writePluginRegistry(registry, "project", projectDir);

    // Act: read uninstall instructions
    const instructions = await readUninstallInstructions(pluginPackageDir);
    expect(instructions).toBeDefined();
    expect(instructions).toContain("# Uninstall Plugin Alpha");
    expect(instructions).toContain("Remove the plugin entry from settings.json");

    // Act: remove plugin from registry
    const currentRegistry = await readPluginRegistry("project", projectDir);
    expect(Object.keys(currentRegistry.plugins)).toHaveLength(1);

    const updatedRegistry = removePluginEntry(
      currentRegistry,
      "plugin-alpha@test-org"
    );

    // Act: persist the updated registry
    await writePluginRegistry(updatedRegistry, "project", projectDir);

    // Assert: plugin is no longer in the registry
    const finalRegistry = await readPluginRegistry("project", projectDir);
    expect(Object.keys(finalRegistry.plugins)).toHaveLength(0);
    expect(finalRegistry.plugins["plugin-alpha@test-org"]).toBeUndefined();
  });

  it("throws when removing a plugin that does not exist", async () => {
    const registry = createEmptyRegistry();

    expect(() =>
      removePluginEntry(registry, "nonexistent-plugin")
    ).toThrow('Plugin "nonexistent-plugin" is not present in the registry');
  });

  it("returns undefined when uninstall.md is absent", async () => {
    const emptyPackageDir = path.join(projectDir, "empty-plugin");
    await mkdir(emptyPackageDir, { recursive: true });

    const instructions = await readUninstallInstructions(emptyPackageDir);
    expect(instructions).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Flow 5: Configure plugin
// ---------------------------------------------------------------------------

describe("Flow 5: Configure plugin", () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createTempDir("flow5");
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it("reads configure instructions from plugin package", async () => {
    // Arrange
    const pluginPackageDir = path.join(projectDir, "plugin-alpha");
    await writeText(
      path.join(pluginPackageDir, "configure.md"),
      "# Configure Plugin Alpha\n\n## Settings\n\n- `apiKey`: Your API key for the service\n- `timeout`: Request timeout in milliseconds (default: 30000)\n- `retries`: Number of retry attempts (default: 3)\n"
    );

    // Act
    const instructions = await readConfigureInstructions(pluginPackageDir);

    // Assert
    expect(instructions).toBeDefined();
    expect(instructions).toContain("# Configure Plugin Alpha");
    expect(instructions).toContain("apiKey");
    expect(instructions).toContain("timeout");
    expect(instructions).toContain("retries");
  });

  it("returns undefined when configure.md is absent", async () => {
    const emptyPackageDir = path.join(projectDir, "empty-plugin");
    await mkdir(emptyPackageDir, { recursive: true });

    const instructions = await readConfigureInstructions(emptyPackageDir);
    expect(instructions).toBeUndefined();
  });

  it("reads full plugin package info including configure instructions", async () => {
    // Arrange: create a complete plugin package
    const pluginPackageDir = path.join(projectDir, "plugin-full");
    await writeText(
      path.join(pluginPackageDir, "install.md"),
      "# Install\n\nRun the setup wizard.\n"
    );
    await writeText(
      path.join(pluginPackageDir, "uninstall.md"),
      "# Uninstall\n\nRemove all config files.\n"
    );
    await writeText(
      path.join(pluginPackageDir, "configure.md"),
      "# Configure\n\nSet your preferences.\n"
    );
    await writeJson(
      path.join(pluginPackageDir, "package.json"),
      { name: "plugin-full@test-org", version: "1.0.0" }
    );

    // Act
    const pkgInfo = await readPluginPackage(pluginPackageDir);

    // Assert
    expect(pkgInfo.name).toBe("plugin-full@test-org");
    expect(pkgInfo.installInstructions).toContain("# Install");
    expect(pkgInfo.uninstallInstructions).toContain("# Uninstall");
    expect(pkgInfo.configureInstructions).toContain("# Configure");
    expect(pkgInfo.migrations).toHaveLength(0);
    expect(pkgInfo.processFiles).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Flow 6: List installed plugins
// ---------------------------------------------------------------------------

describe("Flow 6: List installed plugins", () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createTempDir("flow6");
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it("lists 3 installed plugins sorted by name", async () => {
    // Arrange: create a registry with 3 plugins
    const now = new Date().toISOString();
    const registry: PluginRegistry = {
      schemaVersion: PLUGIN_REGISTRY_SCHEMA_VERSION,
      updatedAt: now,
      plugins: {
        "zeta-plugin@org": createRegistryEntry({
          name: "zeta-plugin@org",
          version: "3.0.0",
          marketplace: "marketplace-a",
        }),
        "alpha-plugin@org": createRegistryEntry({
          name: "alpha-plugin@org",
          version: "1.0.0",
          marketplace: "marketplace-b",
        }),
        "mu-plugin@org": createRegistryEntry({
          name: "mu-plugin@org",
          version: "2.5.0",
          marketplace: "marketplace-a",
        }),
      },
    };

    await writePluginRegistry(registry, "project", projectDir);

    // Act: read back and list
    const readRegistry = await readPluginRegistry("project", projectDir);
    const entries = listPluginEntries(readRegistry);

    // Assert: sorted alphabetically by name
    expect(entries).toHaveLength(3);
    expect(entries[0].name).toBe("alpha-plugin@org");
    expect(entries[0].version).toBe("1.0.0");
    expect(entries[1].name).toBe("mu-plugin@org");
    expect(entries[1].version).toBe("2.5.0");
    expect(entries[2].name).toBe("zeta-plugin@org");
    expect(entries[2].version).toBe("3.0.0");
  });

  it("returns empty array when no plugins are installed", async () => {
    const registry = await readPluginRegistry("project", projectDir);
    const entries = listPluginEntries(registry);

    expect(entries).toHaveLength(0);
    expect(entries).toEqual([]);
  });

  it("preserves all entry fields through write/read cycle", async () => {
    const installedAt = "2026-01-15T10:30:00.000Z";
    const updatedAt = "2026-02-20T14:45:00.000Z";

    const entry = createRegistryEntry({
      name: "detailed-plugin@org",
      version: "1.5.0",
      marketplace: "main-marketplace",
      scope: "project",
      installedAt,
      updatedAt,
      packagePath: "/some/path/to/plugin",
      metadata: { customKey: "customValue", nested: { deep: true } },
    });

    const registry: PluginRegistry = {
      schemaVersion: PLUGIN_REGISTRY_SCHEMA_VERSION,
      updatedAt,
      plugins: { "detailed-plugin@org": entry },
    };

    await writePluginRegistry(registry, "project", projectDir);
    const readBack = await readPluginRegistry("project", projectDir);
    const readEntry = readBack.plugins["detailed-plugin@org"];

    expect(readEntry.name).toBe("detailed-plugin@org");
    expect(readEntry.version).toBe("1.5.0");
    expect(readEntry.marketplace).toBe("main-marketplace");
    expect(readEntry.scope).toBe("project");
    expect(readEntry.installedAt).toBe(installedAt);
    expect(readEntry.updatedAt).toBe(updatedAt);
    expect(readEntry.packagePath).toBe("/some/path/to/plugin");
    expect(readEntry.metadata).toEqual({
      customKey: "customValue",
      nested: { deep: true },
    });
  });
});

// ---------------------------------------------------------------------------
// Flow 7: Update registry tracking
// ---------------------------------------------------------------------------

describe("Flow 7: Update registry tracking", () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createTempDir("flow7");
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it("tracks multiple upserts and removals across write/read cycles", async () => {
    // Step 1: Start with empty registry
    let registry = await readPluginRegistry("project", projectDir);
    expect(Object.keys(registry.plugins)).toHaveLength(0);

    // Step 2: Upsert plugin A at v1.0.0
    const entryA = createRegistryEntry({
      name: "plugin-a@org",
      version: "1.0.0",
      marketplace: "test-marketplace",
    });
    registry = upsertPluginEntry(registry, entryA);
    await writePluginRegistry(registry, "project", projectDir);

    // Verify A is tracked
    registry = await readPluginRegistry("project", projectDir);
    expect(Object.keys(registry.plugins)).toHaveLength(1);
    expect(registry.plugins["plugin-a@org"].version).toBe("1.0.0");

    // Step 3: Upsert plugin B at v2.0.0
    const entryB = createRegistryEntry({
      name: "plugin-b@org",
      version: "2.0.0",
      marketplace: "test-marketplace",
    });
    registry = upsertPluginEntry(registry, entryB);
    await writePluginRegistry(registry, "project", projectDir);

    // Verify both tracked
    registry = await readPluginRegistry("project", projectDir);
    expect(Object.keys(registry.plugins)).toHaveLength(2);

    // Step 4: Upsert plugin A at v1.1.0 (update)
    const entryAUpdated = createRegistryEntry({
      name: "plugin-a@org",
      version: "1.1.0",
      marketplace: "test-marketplace",
    });
    registry = upsertPluginEntry(registry, entryAUpdated);
    await writePluginRegistry(registry, "project", projectDir);

    // Verify A was updated, B unchanged
    registry = await readPluginRegistry("project", projectDir);
    expect(Object.keys(registry.plugins)).toHaveLength(2);
    expect(registry.plugins["plugin-a@org"].version).toBe("1.1.0");
    expect(registry.plugins["plugin-b@org"].version).toBe("2.0.0");

    // Step 5: Remove plugin A
    registry = removePluginEntry(registry, "plugin-a@org");
    await writePluginRegistry(registry, "project", projectDir);

    // Verify only B remains
    registry = await readPluginRegistry("project", projectDir);
    expect(Object.keys(registry.plugins)).toHaveLength(1);
    expect(registry.plugins["plugin-a@org"]).toBeUndefined();
    expect(registry.plugins["plugin-b@org"]).toBeDefined();
    expect(registry.plugins["plugin-b@org"].version).toBe("2.0.0");
  });

  it("upsert updates the registry updatedAt timestamp", async () => {
    let registry = createEmptyRegistry();
    const originalUpdatedAt = registry.updatedAt;

    // Small delay to ensure timestamps differ
    await new Promise((resolve) => setTimeout(resolve, 10));

    const entry = createRegistryEntry({ name: "plugin-x@org" });
    registry = upsertPluginEntry(registry, entry);

    expect(registry.updatedAt).not.toBe(originalUpdatedAt);
  });

  it("upsert updates the entry updatedAt timestamp", async () => {
    const originalTime = "2026-01-01T00:00:00.000Z";
    let registry = createEmptyRegistry();

    const entry = createRegistryEntry({
      name: "plugin-x@org",
      updatedAt: originalTime,
    });
    registry = upsertPluginEntry(registry, entry);

    // The upsert should have set a new updatedAt
    expect(registry.plugins["plugin-x@org"].updatedAt).not.toBe(originalTime);
  });

  it("getPluginEntry returns undefined for missing plugins", async () => {
    const registry = createEmptyRegistry();
    const result = getPluginEntry(registry, "nonexistent");
    expect(result).toBeUndefined();
  });

  it("getPluginEntry returns the correct entry", async () => {
    const entry = createRegistryEntry({
      name: "my-plugin@org",
      version: "5.0.0",
    });
    const registry: PluginRegistry = {
      schemaVersion: PLUGIN_REGISTRY_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      plugins: { "my-plugin@org": entry },
    };

    const result = getPluginEntry(registry, "my-plugin@org");
    expect(result).toBeDefined();
    expect(result!.name).toBe("my-plugin@org");
    expect(result!.version).toBe("5.0.0");
  });
});

// ---------------------------------------------------------------------------
// Bonus: Cross-module integration (marketplace + packageReader + migrations)
// ---------------------------------------------------------------------------

describe("Cross-module: full plugin package with all artifacts", () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createTempDir("cross");
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it("reads a complete plugin package with instructions, migrations, and process files", async () => {
    // Arrange: build a fully-featured plugin package
    const pluginDir = path.join(projectDir, "complete-plugin");

    await writeJson(path.join(pluginDir, "package.json"), {
      name: "complete-plugin@test-org",
      version: "2.0.0",
    });
    await writeText(
      path.join(pluginDir, "install.md"),
      "# Install\n\nFollow the setup guide.\n"
    );
    await writeText(
      path.join(pluginDir, "uninstall.md"),
      "# Uninstall\n\nRemove configuration.\n"
    );
    await writeText(
      path.join(pluginDir, "configure.md"),
      "# Configure\n\nSet environment variables.\n"
    );
    await writeText(
      path.join(pluginDir, "migrations", "1.0.0_to_1.5.0.md"),
      "# Migrate 1.0 to 1.5\n\nUpdate schema.\n"
    );
    await writeText(
      path.join(pluginDir, "migrations", "1.5.0_to_2.0.0.md"),
      "# Migrate 1.5 to 2.0\n\nBreaking changes.\n"
    );
    await writeText(
      path.join(pluginDir, "process", "main.js"),
      "module.exports = async function process(inputs, ctx) { /* ... */ };\n"
    );
    await writeText(
      path.join(pluginDir, "process", "helpers", "util.js"),
      "module.exports = { helper: () => {} };\n"
    );

    // Act: read the full plugin package
    const pkgInfo = await readPluginPackage(pluginDir);

    // Assert
    expect(pkgInfo.name).toBe("complete-plugin@test-org");
    expect(pkgInfo.installInstructions).toContain("Follow the setup guide");
    expect(pkgInfo.uninstallInstructions).toContain("Remove configuration");
    expect(pkgInfo.configureInstructions).toContain("Set environment variables");

    // Migrations
    expect(pkgInfo.migrations).toHaveLength(2);
    expect(pkgInfo.migrations[0].from).toBe("1.0.0");
    expect(pkgInfo.migrations[0].to).toBe("1.5.0");
    expect(pkgInfo.migrations[1].from).toBe("1.5.0");
    expect(pkgInfo.migrations[1].to).toBe("2.0.0");

    // Process files (relative paths with forward slashes)
    expect(pkgInfo.processFiles).toHaveLength(2);
    expect(pkgInfo.processFiles).toContain("process/helpers/util.js");
    expect(pkgInfo.processFiles).toContain("process/main.js");
  });

  it("derives marketplace name from various URL formats", async () => {
    expect(
      deriveMarketplaceName("https://github.com/org/my-marketplace.git")
    ).toBe("my-marketplace");

    expect(
      deriveMarketplaceName("https://github.com/org/repo")
    ).toBe("repo");

    expect(
      deriveMarketplaceName("https://github.com/org/repo/")
    ).toBe("repo");
  });

  it("builds migration graph and finds path using BFS", async () => {
    // Arrange: migration descriptors for a diamond-shaped graph
    //   1.0.0 -> 1.1.0 -> 2.0.0
    //   1.0.0 -> 1.5.0 -> 2.0.0
    const migrations = [
      { from: "1.0.0", to: "1.1.0", file: "1.0.0_to_1.1.0.md", type: "md" as const },
      { from: "1.1.0", to: "2.0.0", file: "1.1.0_to_2.0.0.md", type: "md" as const },
      { from: "1.0.0", to: "1.5.0", file: "1.0.0_to_1.5.0.md", type: "md" as const },
      { from: "1.5.0", to: "2.0.0", file: "1.5.0_to_2.0.0.md", type: "md" as const },
    ];

    const graph = buildMigrationGraph(migrations);
    expect(graph.get("1.0.0")).toHaveLength(2);
    expect(graph.get("1.1.0")).toHaveLength(1);
    expect(graph.get("1.5.0")).toHaveLength(1);

    // BFS should find a 2-step path (either route)
    const migrationPath = findMigrationPath(migrations, "1.0.0", "2.0.0");
    expect(migrationPath).toBeDefined();
    expect(migrationPath).toHaveLength(2);
    expect(migrationPath![0].from).toBe("1.0.0");
    expect(migrationPath![1].to).toBe("2.0.0");
  });

  it("parses migration filenames correctly", async () => {
    const valid = parseMigrationFilename("1.0.0_to_1.1.0.md");
    expect(valid).toBeDefined();
    expect(valid!.from).toBe("1.0.0");
    expect(valid!.to).toBe("1.1.0");
    expect(valid!.type).toBe("md");

    const jsFile = parseMigrationFilename("2.0.0-beta_to_2.0.0.js");
    expect(jsFile).toBeDefined();
    expect(jsFile!.from).toBe("2.0.0-beta");
    expect(jsFile!.to).toBe("2.0.0");
    expect(jsFile!.type).toBe("js");

    const invalid = parseMigrationFilename("not-a-migration.txt");
    expect(invalid).toBeUndefined();
  });
});
