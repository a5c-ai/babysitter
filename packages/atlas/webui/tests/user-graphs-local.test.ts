import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetLocalDevelopmentSqliteForTests } from "../lib/server/local-dev-sqlite";

describe("user graph local sqlite fallback", () => {
  let storageDir: string;

  beforeEach(async () => {
    vi.resetModules();
    storageDir = await mkdtemp(path.join(os.tmpdir(), "atlas-webui-user-graphs-"));
    process.env.ATLAS_LOCAL_STORAGE_DIR = storageDir;
    delete process.env.DATABASE_URL;
  });

  afterEach(async () => {
    resetLocalDevelopmentSqliteForTests();
    delete process.env.ATLAS_LOCAL_STORAGE_DIR;
    delete process.env.DATABASE_URL;
    await rm(storageDir, { recursive: true, force: true });
  });

  it("persists, rebuilds, and deletes local uploads without postgres", async () => {
    const mod = await import("../lib/server/user-graphs");
    const rawYaml = [
      "nodeKind: Tool",
      "id: tool:local-cli",
      "attributes:",
      "  displayName: Local CLI",
      "  description: Local dev CLI",
      "---",
      "nodeKind: Skill",
      "id: skill:local-playbook",
      "attributes:",
      "  displayName: Local Playbook",
      "  description: Development workflow",
      "edges:",
      "  uses_tool:",
      "    - tool:local-cli",
    ].join("\n");

    const created = await mod.createUserGraphUpload({
      userId: "user-1",
      title: "Local Overlay",
      description: "Private local graph",
      sourceFilename: "local-overlay.yaml",
      rawYaml,
    });

    expect(created.title).toBe("Local Overlay");
    expect(created.recordCount).toBe(2);
    expect(created.edgeCount).toBe(1);
    expect(created.status).toBe("ready");

    const uploads = await mod.listUserGraphUploads("user-1");
    expect(uploads).toHaveLength(1);
    expect(uploads[0]?.sourceFilename).toBe("local-overlay.yaml");

    const overlay = await mod.getUserOverlayIndex("user-1");
    expect(overlay?.records["tool:local-cli"]).toMatchObject({
      id: "tool:local-cli",
      displayName: "Local CLI",
    });
    expect(overlay?.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "skill:local-playbook",
          kind: "uses_tool",
          to: "tool:local-cli",
        }),
      ]),
    );

    const rebuilt = await mod.rebuildUserGraphUpload("user-1", created.id);
    expect(rebuilt.recordCount).toBe(2);
    expect(rebuilt.edgeCount).toBe(1);
    expect(rebuilt.status).toBe("ready");

    await mod.deleteUserGraphUpload("user-1", created.id);
    expect(await mod.listUserGraphUploads("user-1")).toHaveLength(0);
    expect(await mod.getUserOverlayIndex("user-1")).toBeNull();
  });
});
