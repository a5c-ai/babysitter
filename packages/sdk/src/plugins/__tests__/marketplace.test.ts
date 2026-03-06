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
const mockedReaddir = vi.mocked(fs.readdir);

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
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(sampleManifest));

    const manifest = await readMarketplaceManifest(
      "test-marketplace",
      "global"
    );
    expect(manifest.name).toBe("test-marketplace");
    expect(manifest.plugins["plugin-a"]).toBeDefined();
  });

  it("throws descriptive error when manifest file is missing", async () => {
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReadFile.mockRejectedValueOnce(err);

    await expect(
      readMarketplaceManifest("missing-marketplace", "global")
    ).rejects.toThrow("Marketplace manifest not found");
  });

  it("rethrows non-ENOENT errors", async () => {
    const err = new Error("permission denied") as NodeJS.ErrnoException;
    err.code = "EACCES";
    mockedReadFile.mockRejectedValueOnce(err);

    await expect(
      readMarketplaceManifest("broken-marketplace", "global")
    ).rejects.toThrow("permission denied");
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
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(manifest));

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
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(manifest));

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

  it("throws when plugin is not found in marketplace", async () => {
    const manifest: MarketplaceManifest = {
      name: "mp",
      description: "",
      url: "",
      owner: "",
      plugins: {},
    };
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(manifest));

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
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReaddir.mockRejectedValueOnce(err);

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
