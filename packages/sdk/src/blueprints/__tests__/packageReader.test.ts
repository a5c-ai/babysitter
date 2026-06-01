import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "node:path";

vi.mock("node:fs", () => {
  const actual = vi.importActual("node:fs");
  return {
    ...actual,
    promises: {
      readFile: vi.fn(),
      readdir: vi.fn(),
    },
  };
});

vi.mock("../migrations", () => ({
  parseMigrationFilename: vi.fn(),
  listMigrations: vi.fn(),
}));

import { promises as fs } from "node:fs";
import {
  readInstallInstructions,
  readUninstallInstructions,
  readConfigureInstructions,
  listMigrations,
  readMigration,
  readPluginPackage,
} from "../packageReader";
import { listMigrations as listMigrationsFromDir } from "../migrations";
import type { MigrationDescriptor } from "../types";

const mockedReadFile = vi.mocked(fs.readFile);
const mockedReaddir = vi.mocked(fs.readdir);
const mockedListMigrations = vi.mocked(listMigrationsFromDir);

const PKG_DIR = "/fake/plugin-package";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("readInstallInstructions", () => {
  it("reads install.md content from package directory", async () => {
    mockedReadFile.mockResolvedValueOnce("# Install\nRun npm install");

    const result = await readInstallInstructions(PKG_DIR);
    expect(result).toBe("# Install\nRun npm install");
    expect(mockedReadFile).toHaveBeenCalledWith(
      path.join(PKG_DIR, "install.md"),
      "utf8"
    );
  });

  it("returns undefined when install.md is missing", async () => {
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReadFile.mockRejectedValueOnce(err);

    const result = await readInstallInstructions(PKG_DIR);
    expect(result).toBeUndefined();
  });
});

describe("readUninstallInstructions", () => {
  it("reads uninstall.md content from package directory", async () => {
    mockedReadFile.mockResolvedValueOnce("# Uninstall\nRemove config");

    const result = await readUninstallInstructions(PKG_DIR);
    expect(result).toBe("# Uninstall\nRemove config");
    expect(mockedReadFile).toHaveBeenCalledWith(
      path.join(PKG_DIR, "uninstall.md"),
      "utf8"
    );
  });

  it("returns undefined when uninstall.md is missing", async () => {
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReadFile.mockRejectedValueOnce(err);

    const result = await readUninstallInstructions(PKG_DIR);
    expect(result).toBeUndefined();
  });
});

describe("readConfigureInstructions", () => {
  it("reads configure.md content from package directory", async () => {
    mockedReadFile.mockResolvedValueOnce("# Configure\nSet env vars");

    const result = await readConfigureInstructions(PKG_DIR);
    expect(result).toBe("# Configure\nSet env vars");
    expect(mockedReadFile).toHaveBeenCalledWith(
      path.join(PKG_DIR, "configure.md"),
      "utf8"
    );
  });

  it("returns undefined when configure.md is missing", async () => {
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReadFile.mockRejectedValueOnce(err);

    const result = await readConfigureInstructions(PKG_DIR);
    expect(result).toBeUndefined();
  });
});

describe("listMigrations", () => {
  it("delegates to migrations module with correct migrations dir", async () => {
    const descriptors: MigrationDescriptor[] = [
      { from: "1.0.0", to: "1.1.0", file: "1.0.0_to_1.1.0.md", type: "md" },
    ];
    mockedListMigrations.mockResolvedValueOnce(descriptors);

    const result = await listMigrations(PKG_DIR);
    expect(result).toEqual(descriptors);
    expect(mockedListMigrations).toHaveBeenCalledWith(
      path.join(PKG_DIR, "migrations")
    );
  });

  it("returns empty array when no migrations exist", async () => {
    mockedListMigrations.mockResolvedValueOnce([]);

    const result = await listMigrations(PKG_DIR);
    expect(result).toEqual([]);
  });
});

describe("readMigration", () => {
  it("reads the content of a specific migration file", async () => {
    const descriptors: MigrationDescriptor[] = [
      { from: "1.0.0", to: "1.1.0", file: "1.0.0_to_1.1.0.md", type: "md" },
    ];
    mockedListMigrations.mockResolvedValueOnce(descriptors);
    mockedReadFile.mockResolvedValueOnce("# Migration 1.0.0 to 1.1.0\nDo stuff");

    const content = await readMigration(PKG_DIR, "1.0.0", "1.1.0");
    expect(content).toBe("# Migration 1.0.0 to 1.1.0\nDo stuff");
  });

  it("throws when migration file is not found", async () => {
    mockedListMigrations.mockResolvedValueOnce([]);

    await expect(readMigration(PKG_DIR, "1.0.0", "3.0.0")).rejects.toThrow(
      'Migration from "1.0.0" to "3.0.0" not found'
    );
  });
});

describe("readPluginPackage", () => {
  it("aggregates all package info with package.json name", async () => {
    // package.json read
    mockedReadFile.mockResolvedValueOnce(
      JSON.stringify({ name: "my-cool-plugin" })
    );
    // install.md
    mockedReadFile.mockResolvedValueOnce("Install instructions");
    // uninstall.md
    mockedReadFile.mockResolvedValueOnce("Uninstall instructions");
    // configure.md
    mockedReadFile.mockResolvedValueOnce("Configure instructions");
    // listMigrations
    mockedListMigrations.mockResolvedValueOnce([]);
    // collectFiles for process dir — ENOENT
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReaddir.mockRejectedValueOnce(err);

    const info = await readPluginPackage(PKG_DIR);
    expect(info.name).toBe("my-cool-plugin");
    expect(info.installInstructions).toBe("Install instructions");
    expect(info.uninstallInstructions).toBe("Uninstall instructions");
    expect(info.configureInstructions).toBe("Configure instructions");
    expect(info.migrations).toEqual([]);
    expect(info.processFiles).toEqual([]);
  });

  it("falls back to directory name when no package.json", async () => {
    // package.json read fails
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReadFile.mockRejectedValueOnce(err);
    // install.md — ENOENT
    mockedReadFile.mockRejectedValueOnce(err);
    // uninstall.md — ENOENT
    mockedReadFile.mockRejectedValueOnce(err);
    // configure.md — ENOENT
    mockedReadFile.mockRejectedValueOnce(err);
    // listMigrations
    mockedListMigrations.mockResolvedValueOnce([]);
    // collectFiles for process dir — ENOENT
    mockedReaddir.mockRejectedValueOnce(err);

    const info = await readPluginPackage(PKG_DIR);
    expect(info.name).toBe("plugin-package");
    expect(info.installInstructions).toBeUndefined();
    expect(info.uninstallInstructions).toBeUndefined();
    expect(info.configureInstructions).toBeUndefined();
  });
});
