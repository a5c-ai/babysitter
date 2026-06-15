import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ATLAS_PACKAGE_ROOT = path.resolve(__dirname, "..", "..");

describe("@a5c-ai/atlas/catalog export contract", () => {
  it("declares a catalog subpath export with runtime and type outputs", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(ATLAS_PACKAGE_ROOT, "package.json"), "utf8")) as {
      exports?: Record<string, unknown>;
    };

    expect(packageJson.exports?.["./catalog"]).toEqual({
      types: "./dist/catalog/index.d.ts",
      default: "./dist/catalog/index.js",
    });
  });

  it("exposes the moved catalog runtime API from the atlas catalog entrypoint", async () => {
    const catalog = await import("./index");

    expect(catalog.getCatalogGraphDocument().graphId).toBe("graph:agent-catalog");
    expect(catalog.getCatalogDiscoverySnapshot().counts.agents).toBeGreaterThan(0);
    expect(catalog.getFallbackHarnessMetadata("claude-code")?.adapterName).toBe("claude");
    expect(catalog.getPluginTargetDescriptor("codex")?.adapterName).toBe("codex");
  }, 15_000);
});
