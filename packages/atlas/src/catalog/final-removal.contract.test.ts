import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const OLD_PACKAGE = "@a5c-ai/agent-catalog";
const OLD_WORKSPACE_PATH = "packages/agent-catalog";

const ACTIVE_DOC_AND_METADATA_FILES = [
  "docs/agent-mux/reference/01-core-types-and-client.md",
  "docs/atlas-catalog-unification/README.md",
  "docs/development/01-overview-and-philosophy.md",
  "docs/development/02-atlas-graph-and-agent-catalog.md",
  "docs/evil-fallbacks.md",
  "docs/generated/package-plugin-docs-coverage.json",
  "docs/testing/current-test-command-inventory.md",
  "docs/v6-announcement.md",
  ".github/workflows/live-stack-published.yml",
  ".github/workflows/publish.yml",
  ".github/workflows/qa-daily.yml",
  "scripts/docs-freshness-report.cjs",
  "packages/atlas/graph/catalog-meta/evidence-sources/repo-evidence-bundle.yaml",
  "packages/atlas/graph/catalog-meta/path-descriptors/agent-catalog-graph.yaml",
];

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("atlas catalog final package removal", () => {
  it("removes the retired standalone agent-catalog package directory", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, OLD_WORKSPACE_PATH))).toBe(false);
  });

  it("keeps active docs and metadata pointed at the atlas catalog surface", () => {
    const staleReferences = ACTIVE_DOC_AND_METADATA_FILES.flatMap((relativePath) => {
      const contents = readRepoFile(relativePath);
      return [OLD_PACKAGE, OLD_WORKSPACE_PATH]
        .filter((needle) => contents.includes(needle))
        .map((needle) => `${relativePath}: ${needle}`);
    }).sort();

    expect(staleReferences).toEqual([]);
  });
});
