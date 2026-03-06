import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { promises as fs } from "node:fs";
import {
  parseMigrationFilename,
  listMigrations,
  buildMigrationGraph,
  findMigrationPath,
  resolveMigrationChain,
} from "../migrations";
import type { MigrationDescriptor } from "../types";

const mockedReadFile = vi.mocked(fs.readFile);
const mockedReaddir = vi.mocked(fs.readdir);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseMigrationFilename", () => {
  it("parses a valid .md migration filename", () => {
    const result = parseMigrationFilename("1.0.0_to_1.1.0.md");
    expect(result).toEqual({
      from: "1.0.0",
      to: "1.1.0",
      file: "1.0.0_to_1.1.0.md",
      type: "md",
    });
  });

  it("parses a valid .js migration filename", () => {
    const result = parseMigrationFilename("2.0.0-beta_to_2.0.0.js");
    expect(result).toEqual({
      from: "2.0.0-beta",
      to: "2.0.0",
      file: "2.0.0-beta_to_2.0.0.js",
      type: "js",
    });
  });

  it("parses filenames with complex pre-release identifiers", () => {
    const result = parseMigrationFilename(
      "1.0.0-alpha.1_to_1.0.0-beta.2.md"
    );
    expect(result).toEqual({
      from: "1.0.0-alpha.1",
      to: "1.0.0-beta.2",
      file: "1.0.0-alpha.1_to_1.0.0-beta.2.md",
      type: "md",
    });
  });

  it("returns undefined for invalid filenames", () => {
    expect(parseMigrationFilename("not-a-migration.txt")).toBeUndefined();
    expect(parseMigrationFilename("1.0.0_1.1.0.md")).toBeUndefined();
    expect(parseMigrationFilename("")).toBeUndefined();
    expect(
      parseMigrationFilename("1.0.0_to_1.1.0.py")
    ).toBeUndefined();
  });
});

describe("listMigrations", () => {
  it("parses valid migration filenames from directory", async () => {
    mockedReaddir.mockResolvedValueOnce([
      "1.0.0_to_1.1.0.md",
      "1.1.0_to_2.0.0.js",
      "README.md",
      ".gitkeep",
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await listMigrations("/fake/migrations");
    expect(result).toHaveLength(2);
    expect(result[0].from).toBe("1.0.0");
    expect(result[1].from).toBe("1.1.0");
  });

  it("returns empty array when migrations dir does not exist", async () => {
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReaddir.mockRejectedValueOnce(err);

    const result = await listMigrations("/fake/migrations");
    expect(result).toEqual([]);
  });

  it("returns sorted results by from version", async () => {
    mockedReaddir.mockResolvedValueOnce([
      "2.0.0_to_3.0.0.md",
      "1.0.0_to_1.1.0.md",
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await listMigrations("/fake/migrations");
    expect(result[0].from).toBe("1.0.0");
    expect(result[1].from).toBe("2.0.0");
  });
});

describe("buildMigrationGraph", () => {
  it("builds correct adjacency list", () => {
    const migrations: MigrationDescriptor[] = [
      { from: "1.0.0", to: "1.1.0", file: "1.0.0_to_1.1.0.md", type: "md" },
      { from: "1.1.0", to: "2.0.0", file: "1.1.0_to_2.0.0.md", type: "md" },
      { from: "1.0.0", to: "2.0.0", file: "1.0.0_to_2.0.0.js", type: "js" },
    ];

    const graph = buildMigrationGraph(migrations);
    expect(graph.get("1.0.0")).toHaveLength(2);
    expect(graph.get("1.1.0")).toHaveLength(1);
    expect(graph.get("2.0.0")).toBeUndefined();
  });

  it("returns empty map for no migrations", () => {
    const graph = buildMigrationGraph([]);
    expect(graph.size).toBe(0);
  });
});

describe("findMigrationPath", () => {
  const migrations: MigrationDescriptor[] = [
    { from: "1.0.0", to: "1.1.0", file: "1.0.0_to_1.1.0.md", type: "md" },
    { from: "1.1.0", to: "2.0.0", file: "1.1.0_to_2.0.0.md", type: "md" },
    { from: "2.0.0", to: "3.0.0", file: "2.0.0_to_3.0.0.js", type: "js" },
  ];

  it("returns empty array when from equals to", () => {
    const result = findMigrationPath(migrations, "1.0.0", "1.0.0");
    expect(result).toEqual([]);
  });

  it("finds a direct single-hop path", () => {
    const result = findMigrationPath(migrations, "1.0.0", "1.1.0");
    expect(result).toHaveLength(1);
    expect(result![0].from).toBe("1.0.0");
    expect(result![0].to).toBe("1.1.0");
  });

  it("finds a multi-hop path", () => {
    const result = findMigrationPath(migrations, "1.0.0", "2.0.0");
    expect(result).toHaveLength(2);
    expect(result![0].from).toBe("1.0.0");
    expect(result![0].to).toBe("1.1.0");
    expect(result![1].from).toBe("1.1.0");
    expect(result![1].to).toBe("2.0.0");
  });

  it("finds a three-hop path", () => {
    const result = findMigrationPath(migrations, "1.0.0", "3.0.0");
    expect(result).toHaveLength(3);
    expect(result![0].to).toBe("1.1.0");
    expect(result![1].to).toBe("2.0.0");
    expect(result![2].to).toBe("3.0.0");
  });

  it("returns undefined when no path exists", () => {
    const result = findMigrationPath(migrations, "1.0.0", "9.9.9");
    expect(result).toBeUndefined();
  });

  it("returns undefined when from version has no migrations", () => {
    const result = findMigrationPath(migrations, "5.0.0", "6.0.0");
    expect(result).toBeUndefined();
  });

  it("prefers shortest path when direct route exists", () => {
    const withDirect: MigrationDescriptor[] = [
      ...migrations,
      { from: "1.0.0", to: "2.0.0", file: "1.0.0_to_2.0.0.md", type: "md" },
    ];
    const result = findMigrationPath(withDirect, "1.0.0", "2.0.0");
    // BFS should find the direct path (1 hop) before the 2-hop path
    expect(result).toHaveLength(1);
    expect(result![0].from).toBe("1.0.0");
    expect(result![0].to).toBe("2.0.0");
  });
});

describe("resolveMigrationChain", () => {
  it("returns descriptors with file contents for a valid chain", async () => {
    mockedReaddir.mockResolvedValueOnce([
      "1.0.0_to_1.1.0.md",
      "1.1.0_to_2.0.0.md",
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    mockedReadFile
      .mockResolvedValueOnce("# Step 1: Migrate 1.0.0 to 1.1.0")
      .mockResolvedValueOnce("# Step 2: Migrate 1.1.0 to 2.0.0");

    const result = await resolveMigrationChain("/fake/pkg", "1.0.0", "2.0.0");
    expect(result).toHaveLength(2);
    expect(result![0].descriptor.from).toBe("1.0.0");
    expect(result![0].content).toBe("# Step 1: Migrate 1.0.0 to 1.1.0");
    expect(result![1].descriptor.from).toBe("1.1.0");
    expect(result![1].content).toBe("# Step 2: Migrate 1.1.0 to 2.0.0");
  });

  it("returns undefined when no migration path exists", async () => {
    mockedReaddir.mockResolvedValueOnce([
      "1.0.0_to_1.1.0.md",
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await resolveMigrationChain("/fake/pkg", "1.0.0", "9.0.0");
    expect(result).toBeUndefined();
  });

  it("returns empty array when from equals to", async () => {
    mockedReaddir.mockResolvedValueOnce(
      [] as unknown as Awaited<ReturnType<typeof fs.readdir>>
    );

    const result = await resolveMigrationChain("/fake/pkg", "1.0.0", "1.0.0");
    expect(result).toEqual([]);
  });

  it("handles empty migrations directory", async () => {
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReaddir.mockRejectedValueOnce(err);

    const result = await resolveMigrationChain("/fake/pkg", "1.0.0", "2.0.0");
    expect(result).toBeUndefined();
  });
});
