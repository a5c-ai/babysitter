import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PACKAGES_ROOT = path.join(REPO_ROOT, "packages");
const OLD_CATALOG_PACKAGE = "@a5c-ai/agent-catalog";

const SKIPPED_DIRS = new Set(["node_modules", "dist", "coverage", ".turbo"]);
const SCANNED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"]);

function listFiles(dir: string): string[] {
  const results: string[] = [];
  const visit = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry.name)) {
          visit(path.join(current, entry.name));
        }
        continue;
      }

      const filePath = path.join(current, entry.name);
      if (SCANNED_EXTENSIONS.has(path.extname(filePath))) {
        results.push(filePath);
      }
    }
  };

  visit(dir);
  return results;
}

describe("atlas catalog consumer migration", () => {
  it("keeps active package consumers off the retired agent-catalog package", () => {
    const staleReferences = listFiles(PACKAGES_ROOT)
      .filter((filePath) => {
        const relativePath = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
        return !relativePath.startsWith("packages/agent-catalog/") && !relativePath.startsWith("packages/atlas/src/catalog/");
      })
      .filter((filePath) => fs.readFileSync(filePath, "utf8").includes(OLD_CATALOG_PACKAGE))
      .map((filePath) => path.relative(REPO_ROOT, filePath).replace(/\\/g, "/"))
      .sort();

    expect(staleReferences).toEqual([]);
  });
});
