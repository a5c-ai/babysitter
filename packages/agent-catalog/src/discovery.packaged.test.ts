import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(PACKAGE_ROOT, "..", "..");
const NPM_COMMAND = "npm";

function exec(command: string, args: string[], cwd: string): string {
  if (process.platform === "win32" && /^npm(?:\.cmd)?$/i.test(command)) {
    const cmd = process.env.ComSpec ?? "cmd.exe";
    return execFileSync(cmd, ["/d", "/s", "/c", command, ...args], {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
    });
  }
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
  });
}

describe("agent-catalog packaged discovery", () => {
  let tempRoot = "";
  let consumerRoot = "";
  let packedTgzPath = "";
  let packedEntries: Array<{ path: string }> = [];

  beforeAll(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agent-catalog-packaged-"));
    consumerRoot = path.join(tempRoot, "consumer");
    fs.mkdirSync(consumerRoot, { recursive: true });
    fs.writeFileSync(
      path.join(consumerRoot, "package.json"),
      JSON.stringify({ name: "agent-catalog-packed-test", private: true }, null, 2),
      "utf8",
    );

    exec(NPM_COMMAND, ["run", "build", "--workspace=@a5c-ai/agent-catalog"], REPO_ROOT);

    const packOutput = exec(NPM_COMMAND, ["pack", "--json"], PACKAGE_ROOT);
    const [packResult] = JSON.parse(packOutput) as Array<{ filename: string; files?: Array<{ path: string }> }>;
    packedTgzPath = path.join(PACKAGE_ROOT, packResult.filename);
    packedEntries = packResult.files ?? [];

    exec(NPM_COMMAND, ["install", "--no-package-lock", packedTgzPath], consumerRoot);
  }, 180000);

  afterAll(() => {
    if (packedTgzPath && fs.existsSync(packedTgzPath)) {
      fs.rmSync(packedTgzPath, { force: true });
    }
    if (tempRoot && fs.existsSync(tempRoot)) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("ships a packaged discovery snapshot", () => {
    expect(packedEntries.some((entry) => entry.path === "dist/discovery-snapshot.json")).toBe(true);
    expect(packedEntries.some((entry) => /\.test\.(?:js|d\.ts|d\.ts\.map)$/.test(entry.path))).toBe(false);
  });

  it("loads non-empty discovery inventories from an installed tarball", () => {
    const output = exec(
      "node",
      [
        "-e",
        [
          'const catalog = require("@a5c-ai/agent-catalog");',
          "const snapshot = catalog.getCatalogDiscoverySnapshot();",
          "process.stdout.write(JSON.stringify({",
          "  counts: snapshot.counts,",
          "  agentCount: catalog.listCatalogAgents().length,",
          "  skillCount: catalog.listCatalogSkills().length,",
          "  processCount: catalog.listCatalogProcesses().length,",
          "}));",
        ].join("\n"),
      ],
      consumerRoot,
    );

    const result = JSON.parse(output) as {
      counts: { agents: number; skills: number; processes: number; domains: number; specializations: number };
      agentCount: number;
      skillCount: number;
      processCount: number;
    };

    expect(result.counts.domains).toBeGreaterThan(0);
    expect(result.counts.specializations).toBeGreaterThan(0);
    expect(result.counts.agents).toBeGreaterThan(0);
    expect(result.counts.skills).toBeGreaterThan(0);
    expect(result.counts.processes).toBeGreaterThan(0);
    expect(result.agentCount).toBe(result.counts.agents);
    expect(result.skillCount).toBe(result.counts.skills);
    expect(result.processCount).toBe(result.counts.processes);
  });

  it("fails explicitly when packaged discovery assets are unavailable", () => {
    const installedRoot = path.join(consumerRoot, "node_modules", "@a5c-ai", "agent-catalog");
    const snapshotPath = path.join(installedRoot, "dist", "discovery-snapshot.json");
    fs.rmSync(snapshotPath, { force: true });

    expect(() =>
      exec(
        "node",
        [
          "-e",
          [
            'const catalog = require("@a5c-ai/agent-catalog");',
            "catalog.clearCatalogDiscoveryCache();",
            "catalog.getCatalogDiscoverySnapshot();",
          ].join("\n"),
        ],
        consumerRoot,
      ),
    ).toThrowError(/Discovery assets unavailable for @a5c-ai\/agent-catalog/);
  });
});
