import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "node:path";

vi.mock("node:fs", () => {
  const actual = vi.importActual("node:fs");
  return {
    ...actual,
    promises: {
      readFile: vi.fn(),
      readdir: vi.fn(),
      mkdir: vi.fn(),
      access: vi.fn(),
      writeFile: vi.fn(),
    },
  };
});

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("node:util", async () => {
  const actual = await vi.importActual<typeof import("node:util")>("node:util");
  return {
    ...actual,
    promisify: () => vi.fn().mockResolvedValue({ stdout: "", stderr: "" }),
  };
});

vi.mock("node:os", () => ({
  homedir: () => "/mock/home",
}));

import { promises as fs } from "node:fs";
import {
  deriveMarketplaceName,
  readMarketplaceManifest,
  listMarketplacePlugins,
  resolvePluginPackagePath,
  listMarketplaces,
} from "../marketplace";
import type { MarketplaceManifest } from "../types";

const mockedReadFile = vi.mocked(fs.readFile);
const mockedAccess = vi.mocked(fs.access);
const mockedReaddir = vi.mocked(fs.readdir);

const enoent = () => {
  const err = new Error("ENOENT") as NodeJS.ErrnoException;
  err.code = "ENOENT";
  return err;
};

/**
 * Sets up mocks so that resolveManifestPath finds the manifest at the root.
 * Call order: readFile(.babysitter-manifest-path) → ENOENT, access(root marketplace.json) → OK
 * Then the caller's readFile for the actual manifest content.
 */
function mockRootManifest(manifestJson: string): void {
  // 1. readFile for .babysitter-manifest-path → not found
  mockedReadFile.mockRejectedValueOnce(enoent());
  // 2. access for root marketplace.json → success
  mockedAccess.mockResolvedValueOnce(undefined);
  // 3. readFile for root marketplace.json content
  mockedReadFile.mockResolvedValueOnce(manifestJson);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deriveMarketplaceName", () => {
  it("extracts name from HTTPS URL with .git suffix", () => {
    const name = deriveMarketplaceName(
      "https://github.com/a5c-ai/marketplace.git"
    );
    expect(name).toBe("marketplace");
  });

  it("extracts name from HTTPS URL without .git suffix", () => {
    const name = deriveMarketplaceName(
      "https://github.com/org/repo"
    );
    expect(name).toBe("repo");
  });

  it("extracts name from URL with trailing slash", () => {
    const name = deriveMarketplaceName(
      "https://github.com/org/my-plugins/"
    );
    expect(name).toBe("my-plugins");
  });

  it("extracts name from SSH-style URL", () => {
    const name = deriveMarketplaceName(
      "git@github.com:a5c-ai/my-plugins.git"
    );
    expect(name).toBe("my-plugins");
  });

  it("throws on empty derivation", () => {
    expect(() =>
      deriveMarketplaceName("")
    ).toThrow("Unable to derive marketplace name from URL");
  });
});

describe("readMarketplaceManifest", () => {
  const sampleManifest: MarketplaceManifest = {
    name: "test-marketplace",
    description: "A test marketplace",
    url: "https://github.com/org/test-marketplace.git",
    owner: "org",
    plugins: {
      "plugin-a": {
        name: "plugin-a",
        description: "Plugin A",
        latestVersion: "1.0.0",
        versions: ["1.0.0"],
        packagePath: "plugins/plugin-a",
        tags: ["test"],
        author: "org",
      },
    },
  };

  it("reads and parses marketplace.json", async () => {
    mockRootManifest(JSON.stringify(sampleManifest));

    const manifest = await readMarketplaceManifest(
      "test-marketplace",
      "global"
    );
    expect(manifest.name).toBe("test-marketplace");
    expect(manifest.plugins["plugin-a"]).toBeDefined();
  });

  it("throws descriptive error when manifest file is missing", async () => {
    // .babysitter-manifest-path not found
    mockedReadFile.mockRejectedValueOnce(enoent());
    // root marketplace.json not found
    mockedAccess.mockRejectedValueOnce(enoent());
    // .claude-plugin/marketplace.json not found
    mockedAccess.mockRejectedValueOnce(enoent());

    await expect(
      readMarketplaceManifest("missing-marketplace", "global")
    ).rejects.toThrow("Marketplace manifest not found");
  });

  it("rethrows non-ENOENT errors", async () => {
    const err = new Error("permission denied") as NodeJS.ErrnoException;
    err.code = "EACCES";
    // .babysitter-manifest-path → permission error
    mockedReadFile.mockRejectedValueOnce(err);
    // Should fall through to root check
    mockedAccess.mockRejectedValueOnce(enoent());
    // .claude-plugin check
    mockedAccess.mockRejectedValueOnce(enoent());

    await expect(
      readMarketplaceManifest("broken-marketplace", "global")
    ).rejects.toThrow("Marketplace manifest not found");
  });

  it("finds manifest at .claude-plugin/marketplace.json when root is missing", async () => {
    // .babysitter-manifest-path not found
    mockedReadFile.mockRejectedValueOnce(enoent());
    // root marketplace.json not found
    mockedAccess.mockRejectedValueOnce(enoent());
    // .claude-plugin/marketplace.json found
    mockedAccess.mockResolvedValueOnce(undefined);
    // read the manifest content
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(sampleManifest));

    const manifest = await readMarketplaceManifest("test-marketplace", "global");
    expect(manifest.name).toBe("test-marketplace");
  });

  it("uses custom manifest path from .babysitter-manifest-path", async () => {
    // .babysitter-manifest-path found with custom path
    mockedReadFile.mockResolvedValueOnce("plugins/a5c/marketplace/marketplace.json");
    // access check for the custom path succeeds
    mockedAccess.mockResolvedValueOnce(undefined);
    // read the manifest at the custom path
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(sampleManifest));

    const manifest = await readMarketplaceManifest("test-marketplace", "global");
    expect(manifest.name).toBe("test-marketplace");
  });

  it("normalizes legacy array format manifest", async () => {
    const legacyManifest = {
      name: "legacy-mp",
      owner: { name: "org", email: "org@test.com" },
      plugins: [
        {
          name: "my-plugin",
          source: "./plugins/my-plugin",
          description: "A plugin",
          version: "2.0.0",
          author: { name: "org" },
        },
      ],
    };
    mockRootManifest(JSON.stringify(legacyManifest));

    const manifest = await readMarketplaceManifest("legacy-mp", "global");
    expect(manifest.name).toBe("legacy-mp");
    expect(manifest.owner).toBe("org");
    expect(manifest.plugins["my-plugin"]).toBeDefined();
    expect(manifest.plugins["my-plugin"].packagePath).toBe("plugins/my-plugin");
    expect(manifest.plugins["my-plugin"].latestVersion).toBe("2.0.0");
    expect(manifest.plugins["my-plugin"].author).toBe("org");
  });
});

describe("listMarketplacePlugins", () => {
  it("returns sorted plugin entries from manifest", async () => {
    const manifest: MarketplaceManifest = {
      name: "mp",
      description: "",
      url: "",
      owner: "",
      plugins: {
        "zebra-plugin": {
          name: "zebra-plugin",
          description: "",
          latestVersion: "1.0.0",
          versions: ["1.0.0"],
          packagePath: "plugins/zebra",
          tags: [],
          author: "",
        },
        "alpha-plugin": {
          name: "alpha-plugin",
          description: "",
          latestVersion: "2.0.0",
          versions: ["2.0.0", "1.0.0"],
          packagePath: "plugins/alpha",
          tags: [],
          author: "",
        },
      },
    };
    mockRootManifest(JSON.stringify(manifest));

    const plugins = await listMarketplacePlugins("mp", "global");
    expect(plugins).toHaveLength(2);
    expect(plugins[0].name).toBe("alpha-plugin");
    expect(plugins[1].name).toBe("zebra-plugin");
  });
});

describe("resolvePluginPackagePath", () => {
  it("returns full path to plugin package directory", async () => {
    const manifest: MarketplaceManifest = {
      name: "mp",
      description: "",
      url: "",
      owner: "",
      plugins: {
        "my-plugin": {
          name: "my-plugin",
          description: "",
          latestVersion: "1.0.0",
          versions: ["1.0.0"],
          packagePath: "plugins/my-plugin",
          tags: [],
          author: "",
        },
      },
    };
    mockRootManifest(JSON.stringify(manifest));

    const result = await resolvePluginPackagePath(
      "mp",
      "my-plugin",
      "global"
    );
    expect(result).toBe(
      path.join(
        "/mock/home",
        ".a5c",
        "marketplaces",
        "mp",
        "plugins",
        "my-plugin"
      )
    );
  });

  it("resolves packagePath relative to manifest directory for custom path", async () => {
    const manifest: MarketplaceManifest = {
      name: "mp",
      description: "",
      url: "",
      owner: "",
      plugins: {
        "my-plugin": {
          name: "my-plugin",
          description: "",
          latestVersion: "1.0.0",
          versions: ["1.0.0"],
          packagePath: "plugins/my-plugin",
          tags: [],
          author: "",
        },
      },
    };
    // .babysitter-manifest-path returns custom path
    mockedReadFile.mockResolvedValueOnce("sub/dir/marketplace.json");
    // access check for custom path succeeds
    mockedAccess.mockResolvedValueOnce(undefined);
    // read manifest content
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(manifest));

    const result = await resolvePluginPackagePath(
      "mp",
      "my-plugin",
      "global"
    );
    // packagePath resolved relative to sub/dir/ (manifest's parent)
    expect(result).toBe(
      path.join(
        "/mock/home",
        ".a5c",
        "marketplaces",
        "mp",
        "sub",
        "dir",
        "plugins",
        "my-plugin"
      )
    );
  });

  it("throws when plugin is not found in marketplace", async () => {
    const manifest: MarketplaceManifest = {
      name: "mp",
      description: "",
      url: "",
      owner: "",
      plugins: {},
    };
    mockRootManifest(JSON.stringify(manifest));

    await expect(
      resolvePluginPackagePath("mp", "nonexistent", "global")
    ).rejects.toThrow('Plugin "nonexistent" not found in marketplace "mp"');
  });
});

describe("listMarketplaces", () => {
  it("returns sorted list of marketplace directory names", async () => {
    mockedReaddir.mockResolvedValueOnce([
      { name: "beta-mp", isDirectory: () => true, isFile: () => false },
      { name: "alpha-mp", isDirectory: () => true, isFile: () => false },
      { name: "readme.txt", isDirectory: () => false, isFile: () => true },
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await listMarketplaces("global");
    expect(result).toEqual(["alpha-mp", "beta-mp"]);
  });

  it("returns empty array when marketplaces dir does not exist", async () => {
    mockedReaddir.mockRejectedValueOnce(enoent());

    const result = await listMarketplaces("global");
    expect(result).toEqual([]);
  });

  it("rethrows non-ENOENT errors from readdir", async () => {
    const err = new Error("EPERM") as NodeJS.ErrnoException;
    err.code = "EPERM";
    mockedReaddir.mockRejectedValueOnce(err);

    await expect(listMarketplaces("global")).rejects.toThrow("EPERM");
  });
});
