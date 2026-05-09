import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getAtlasViewForUserMock = vi.fn();

vi.mock("@/lib/server/atlas-view", () => ({
  getAtlasViewForUser: getAtlasViewForUserMock,
}));

describe("company builder local fallback", () => {
  let storageDir: string;

  beforeEach(async () => {
    vi.resetModules();
    getAtlasViewForUserMock.mockReset();
    getAtlasViewForUserMock.mockResolvedValue({
      index: {
        records: {
          "agent:codex": {
            id: "agent:codex",
            _kind: "AgentProduct",
            displayName: "Codex",
            description: "Coding agent",
          },
          "tool:github": {
            id: "tool:github",
            _kind: "Tool",
            displayName: "GitHub",
            description: "Repository host",
          },
        },
      },
    });
    storageDir = await mkdtemp(path.join(os.tmpdir(), "atlas-webui-company-builder-"));
    process.env.ATLAS_LOCAL_STORAGE_DIR = storageDir;
    delete process.env.DATABASE_URL;
  });

  afterEach(async () => {
    delete process.env.ATLAS_LOCAL_STORAGE_DIR;
    delete process.env.DATABASE_URL;
    await rm(storageDir, { recursive: true, force: true });
  });

  it("persists and exports company blueprints without postgres", async () => {
    const mod = await import("../lib/server/company-builder");

    const blueprint = await mod.createCompanyBlueprint("user-1", {
      name: "Acme Agentic Stack",
      description: "Private local blueprint",
    });

    await mod.saveCompanyBlueprintMetadata("user-1", blueprint.id, {
      displayName: "Acme Agentic Atlas",
      description: "Updated local blueprint",
      status: "active",
    });
    await mod.addCompanySystem("user-1", blueprint.id, {
      displayName: "Customer Ops",
      description: "Handles customer requests",
      systemKind: "customer-ops",
    });
    await mod.addCompanyAsset("user-1", blueprint.id, {
      displayName: "GitHub org",
      assetKind: "vcs-host",
      environment: "production",
      provider: "GitHub",
      notes: "Main repository host",
    });

    const loaded = await mod.getCompanyBlueprint("user-1", blueprint.id);
    expect(loaded?.name).toBe("Acme Agentic Atlas");
    expect(loaded?.draft.systems).toHaveLength(1);
    expect(loaded?.draft.assets).toHaveLength(1);

    const yaml = await mod.exportCompanyBlueprintYaml("user-1", blueprint.id);
    expect(yaml).toContain("nodeKind: CompanyBlueprint");
    expect(yaml).toContain("displayName: Acme Agentic Atlas");

    const reloaded = await mod.getCompanyBlueprint("user-1", blueprint.id);
    expect(reloaded?.lastExportYaml).toBe(yaml);

    const list = await mod.listCompanyBlueprints("user-1");
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("Acme Agentic Atlas");
  });

  it("still builds the layer palette from the atlas view in local mode", async () => {
    const mod = await import("../lib/server/company-builder");

    const palette = await mod.getCompanyLayerPalette("user-1");

    expect(palette.find((layer) => layer.key === "agents")?.options[0]?.label).toBe("Codex");
    expect(palette.find((layer) => layer.key === "tools")?.options[0]?.label).toBe("GitHub");
  });
});
