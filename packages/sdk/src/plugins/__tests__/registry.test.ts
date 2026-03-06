import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  readPluginRegistry,
  writePluginRegistry,
  getPluginEntry,
  upsertPluginEntry,
  removePluginEntry,
  listPluginEntries,
} from "../registry";
import {
  PluginRegistry,
  PluginRegistryEntry,
  PLUGIN_REGISTRY_SCHEMA_VERSION,
} from "../types";

// Mock fs and atomic writer
vi.mock("node:fs", () => {
  const actual = vi.importActual("node:fs");
  return {
    ...actual,
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
    },
  };
});

vi.mock("../../storage/atomic", () => ({
  writeFileAtomic: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("node:os", () => ({
  homedir: () => "/mock/home",
}));

import { promises as fs } from "node:fs";
import { writeFileAtomic } from "../../storage/atomic";

const mockedReadFile = vi.mocked(fs.readFile);
const mockedWriteFileAtomic = vi.mocked(writeFileAtomic);

function makeEntry(name: string, overrides?: Partial<PluginRegistryEntry>): PluginRegistryEntry {
  return {
    name,
    version: "1.0.0",
    marketplace: "default",
    scope: "global",
    installedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    packagePath: `/plugins/${name}`,
    metadata: {},
    ...overrides,
  };
}

function makeRegistry(
  plugins: Record<string, PluginRegistryEntry> = {}
): PluginRegistry {
  return {
    schemaVersion: PLUGIN_REGISTRY_SCHEMA_VERSION,
    updatedAt: "2026-01-01T00:00:00.000Z",
    plugins,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("readPluginRegistry", () => {
  it("returns empty registry when file does not exist", async () => {
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReadFile.mockRejectedValueOnce(err);

    const registry = await readPluginRegistry("global");
    expect(registry.schemaVersion).toBe(PLUGIN_REGISTRY_SCHEMA_VERSION);
    expect(registry.plugins).toEqual({});
  });

  it("reads and parses valid JSON from file", async () => {
    const entry = makeEntry("test-plugin");
    const data = makeRegistry({ "test-plugin": entry });
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(data));

    const registry = await readPluginRegistry("global");
    expect(registry.plugins["test-plugin"]).toBeDefined();
    expect(registry.plugins["test-plugin"].name).toBe("test-plugin");
  });

  it("rethrows non-ENOENT errors", async () => {
    const err = new Error("EACCES") as NodeJS.ErrnoException;
    err.code = "EACCES";
    mockedReadFile.mockRejectedValueOnce(err);

    await expect(readPluginRegistry("global")).rejects.toThrow("EACCES");
  });
});

describe("writePluginRegistry", () => {
  it("writes registry using atomic write", async () => {
    const registry = makeRegistry();
    await writePluginRegistry(registry, "global");

    expect(mockedWriteFileAtomic).toHaveBeenCalledTimes(1);
    const [writtenPath, writtenData] = mockedWriteFileAtomic.mock.calls[0];
    expect(writtenPath).toContain("plugin-registry.json");
    const parsed = JSON.parse(writtenData as string);
    expect(parsed.schemaVersion).toBe(PLUGIN_REGISTRY_SCHEMA_VERSION);
  });
});

describe("getPluginEntry", () => {
  it("finds an existing entry by name", () => {
    const entry = makeEntry("my-plugin");
    const registry = makeRegistry({ "my-plugin": entry });

    const result = getPluginEntry(registry, "my-plugin");
    expect(result).toEqual(entry);
  });

  it("returns undefined for missing entries", () => {
    const registry = makeRegistry();
    const result = getPluginEntry(registry, "nonexistent");
    expect(result).toBeUndefined();
  });
});

describe("upsertPluginEntry", () => {
  it("creates new entry with updatedAt timestamp", () => {
    const registry = makeRegistry();
    const entry = makeEntry("new-plugin");

    const result = upsertPluginEntry(registry, entry);
    expect(result.plugins["new-plugin"]).toBeDefined();
    expect(result.plugins["new-plugin"].name).toBe("new-plugin");
    // updatedAt should be set to a recent timestamp
    expect(result.updatedAt).toBeDefined();
    expect(result.plugins["new-plugin"].updatedAt).toBe(result.updatedAt);
  });

  it("updates existing entry without removing others", () => {
    const existing = makeEntry("existing-plugin");
    const registry = makeRegistry({ "existing-plugin": existing });
    const updated = makeEntry("existing-plugin", { version: "2.0.0" });

    const result = upsertPluginEntry(registry, updated);
    expect(result.plugins["existing-plugin"].version).toBe("2.0.0");
  });

  it("does not mutate the original registry", () => {
    const entry = makeEntry("a-plugin");
    const registry = makeRegistry({ "a-plugin": entry });
    const newEntry = makeEntry("b-plugin");

    const result = upsertPluginEntry(registry, newEntry);
    expect(result).not.toBe(registry);
    expect(registry.plugins["b-plugin"]).toBeUndefined();
    expect(result.plugins["b-plugin"]).toBeDefined();
  });
});

describe("removePluginEntry", () => {
  it("removes an existing entry", () => {
    const entry = makeEntry("remove-me");
    const registry = makeRegistry({ "remove-me": entry });

    const result = removePluginEntry(registry, "remove-me");
    expect(result.plugins["remove-me"]).toBeUndefined();
  });

  it("throws when plugin is not in registry", () => {
    const registry = makeRegistry();
    expect(() => removePluginEntry(registry, "ghost")).toThrow(
      'Plugin "ghost" is not present in the registry'
    );
  });

  it("does not mutate the original registry", () => {
    const entry = makeEntry("keep-me");
    const other = makeEntry("remove-me");
    const registry = makeRegistry({ "keep-me": entry, "remove-me": other });

    const result = removePluginEntry(registry, "remove-me");
    expect(registry.plugins["remove-me"]).toBeDefined();
    expect(result.plugins["keep-me"]).toBeDefined();
  });
});

describe("listPluginEntries", () => {
  it("returns sorted array of entries", () => {
    const entryB = makeEntry("beta-plugin");
    const entryA = makeEntry("alpha-plugin");
    const entryC = makeEntry("charlie-plugin");
    const registry = makeRegistry({
      "beta-plugin": entryB,
      "alpha-plugin": entryA,
      "charlie-plugin": entryC,
    });

    const list = listPluginEntries(registry);
    expect(list).toHaveLength(3);
    expect(list[0].name).toBe("alpha-plugin");
    expect(list[1].name).toBe("beta-plugin");
    expect(list[2].name).toBe("charlie-plugin");
  });

  it("returns empty array for empty registry", () => {
    const registry = makeRegistry();
    const list = listPluginEntries(registry);
    expect(list).toEqual([]);
  });
});
