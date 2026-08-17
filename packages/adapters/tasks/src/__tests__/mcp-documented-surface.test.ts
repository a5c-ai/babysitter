import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// FIX-012: the documented surface of this package drifted from the code.
// README.md and docs/setup-guide.md each carried a hand-maintained MCP tool
// list (16 and "eight tools" respectively) while src/mcp/server.ts registered
// 20, and both documents named `adapters-tasks` as the only published bin while
// package.json declares two. Nothing checked either claim. These tests derive
// the truth from the sources and fail when a document falls behind.

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(packageRoot, relativePath), "utf8");
}

/** Every tool name passed to `server.tool(...)`, in registration order. */
function registeredToolNames(): string[] {
  const source = read("src/mcp/server.ts");
  return [...source.matchAll(/server\.tool\(\s*"([^"]+)"/g)].map((match) => match[1]);
}

/** Tool names a document mentions, in the order they first appear. */
function documentedToolNames(document: string, registered: string[]): string[] {
  const seen: string[] = [];
  for (const match of document.matchAll(/`([a-z][a-z0-9_]*)`/g)) {
    const name = match[1];
    if (registered.includes(name) && !seen.includes(name)) seen.push(name);
  }
  return seen;
}

const DOCUMENTS = ["README.md", "docs/setup-guide.md"] as const;

describe("FIX-012: the documented MCP tool surface matches src/mcp/server.ts", () => {
  it("registers tools unconditionally, so the registration list is the whole surface", () => {
    const source = read("src/mcp/server.ts");
    const registered = registeredToolNames();
    expect(registered.length).toBeGreaterThan(0);
    expect(new Set(registered).size).toBe(registered.length);
    // A guarded registration would make a static document list unprovable.
    expect(source).not.toMatch(/if\s*\([^)]*\)\s*\{?\s*server\.tool\(/);
  });

  for (const document of DOCUMENTS) {
    it(`${document} lists every registered tool, in registration order, and no others`, () => {
      const registered = registeredToolNames();
      const documented = documentedToolNames(read(document), registered);
      expect(documented).toEqual(registered);
    });

    it(`${document} states no stale tool count`, () => {
      const registered = registeredToolNames();
      const wordForCount: Record<number, string> = {
        8: "eight",
        16: "sixteen",
        20: "twenty",
      };
      const text = read(document);
      for (const [count, word] of Object.entries(wordForCount)) {
        if (Number(count) === registered.length) continue;
        expect(text.toLowerCase()).not.toContain(`${word} tools`);
        expect(text).not.toMatch(new RegExp(`\\b${count} tools\\b`));
      }
    });
  }
});

describe("FIX-012: both published bins are documented", () => {
  it("package.json declares the supported bin and the deprecation shim", () => {
    const manifest = JSON.parse(read("package.json")) as { bin: Record<string, string> };
    expect(manifest.bin).toEqual({
      "adapters-tasks": "./dist/cli/index.js",
      "tasks-adapter": "./dist/cli/tasks-adapter.js",
    });
  });

  it("the shim forwards to the supported entrypoint after warning", () => {
    const shim = read("src/cli/tasks-adapter.ts");
    expect(shim).toMatch(/is deprecated, use "adapters-tasks" instead/);
    expect(shim).toMatch(/import\(["']\.\/index\.js["']\)/);
  });

  for (const document of DOCUMENTS) {
    it(`${document} documents every declared bin`, () => {
      const manifest = JSON.parse(read("package.json")) as { bin: Record<string, string> };
      const text = read(document);
      for (const binName of Object.keys(manifest.bin)) {
        expect(text).toContain(`\`${binName}\``);
      }
      // And says which one is deprecated, so readers pick the supported bin.
      expect(text.toLowerCase()).toMatch(/deprecat/);
    });
  }
});
