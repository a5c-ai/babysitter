import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const OLD_PACKAGE = "@a5c-ai/agent-catalog";
const OLD_WORKSPACE_PATH = "packages/agent-catalog";

const METADATA_FILES = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "docs/workspace-validation.md",
  "docs/package-and-plugin-map.md",
  "docs/release-pipeline.md",
  "scripts/agent-mux-build.cjs",
  "scripts/bump-version.mjs",
  "scripts/check-architecture-boundaries.cjs",
  "scripts/fix-broken-latest-tags.mjs",
  "scripts/generate-plugins.mjs",
  "scripts/hooks-mux-build.cjs",
  "scripts/sync-external-plugin-repos.mjs",
  "packages/atlas/graph/catalog-meta/package-surfaces/agent-catalog.yaml",
  "packages/atlas/graph/catalog-meta/ci-surfaces/agent-catalog.yaml",
];

function listWorkflowFiles(): string[] {
  const workflowsDir = path.join(REPO_ROOT, ".github", "workflows");
  return fs
    .readdirSync(workflowsDir)
    .filter((entry) => entry.endsWith(".yml") || entry.endsWith(".yaml"))
    .map((entry) => path.join(".github", "workflows", entry));
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("atlas catalog workspace metadata", () => {
  it("keeps build scripts on atlas and the SDK without the retired agent-catalog workspace", () => {
    const rootManifest = JSON.parse(readRepoFile("package.json")) as { scripts?: Record<string, string> };

    expect(rootManifest.scripts?.["test:atlas-catalog-contracts"]).toBeDefined();
    expect(rootManifest.scripts?.["test:atlas-catalog-contracts"] ?? "").toContain("packages/atlas/src/catalog");
    expect(rootManifest.scripts?.["test:agent-catalog-contracts"]).toBeUndefined();
    const buildSdk = rootManifest.scripts?.["build:sdk"] ?? "";
    const buildSteps = buildSdk.split("&&").map((step) => step.trim());

    expect(buildSdk).not.toContain(OLD_PACKAGE);
    expect(buildSteps[0]).toBe("npm run build --workspace=@a5c-ai/atlas");
    expect(buildSteps.at(-1)).toBe("npm run build --workspace=@a5c-ai/babysitter-sdk");
  });

  it("does not expose standalone agent-catalog workspace metadata in build, CI, docs, or lockfile surfaces", () => {
    const staleReferences = [...METADATA_FILES, ...listWorkflowFiles()]
      .filter((relativePath) => fs.existsSync(path.join(REPO_ROOT, relativePath)))
      .flatMap((relativePath) => {
        const contents = readRepoFile(relativePath);
        return [OLD_PACKAGE, OLD_WORKSPACE_PATH]
          .filter((needle) => contents.includes(needle))
          .map((needle) => `${relativePath}: ${needle}`);
      })
      .sort();

    expect(staleReferences).toEqual([]);
  });
});
