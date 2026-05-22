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

function writeConsumerPackageJson(consumerDir: string): void {
  fs.mkdirSync(consumerDir, { recursive: true });
  fs.writeFileSync(
    path.join(consumerDir, "package.json"),
    JSON.stringify({ name: "agent-catalog-packed-test", private: true }, null, 2),
    "utf8",
  );
}

function installPackedConsumer(tempDir: string, packedTarballPath: string, name: string): string {
  const consumerDir = path.join(tempDir, name);
  writeConsumerPackageJson(consumerDir);
  exec(NPM_COMMAND, ["install", "--no-package-lock", packedTarballPath], consumerDir);
  return consumerDir;
}

function runNodeScript(cwd: string, lines: string[]): string {
  return exec("node", ["-e", lines.join("\n")], cwd);
}

describe("agent-catalog packaged discovery", () => {
  let tempRoot = "";
  let consumerRoot = "";
  let packedTgzPath = "";
  let packedEntries: Array<{ path: string }> = [];

  beforeAll(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agent-catalog-packaged-"));

    exec(NPM_COMMAND, ["run", "build", "--workspace=@a5c-ai/agent-catalog"], REPO_ROOT);

    const packOutput = exec(NPM_COMMAND, ["pack", "--json"], PACKAGE_ROOT);
    const [packResult] = JSON.parse(packOutput) as Array<{ filename: string; files?: Array<{ path: string }> }>;
    packedTgzPath = path.join(PACKAGE_ROOT, packResult.filename);
    packedEntries = packResult.files ?? [];

    consumerRoot = installPackedConsumer(tempRoot, packedTgzPath, "consumer");
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
    expect(packedEntries.some((entry) => entry.path === "index.js")).toBe(true);
    expect(packedEntries.some((entry) => entry.path === "index.d.ts")).toBe(true);
    expect(packedEntries.some((entry) => /\.test\.(?:js|d\.ts|d\.ts\.map)$/.test(entry.path))).toBe(false);
  });

  it("imports the broad package surface without touching graph or evidence assets", () => {
    const output = runNodeScript(consumerRoot, [
      'const catalog = require("@a5c-ai/agent-catalog");',
      "process.stdout.write(JSON.stringify({",
      "  exportCount: Object.keys(catalog).length,",
      '  hasGraphCallsite: typeof catalog.getCatalogGraphDocument === "function",',
      '  hasEvidenceCallsite: typeof catalog.getOntologyEvidenceManifest === "function",',
      '  hasDiscoveryCallsite: typeof catalog.getCatalogDiscoverySnapshot === "function",',
      '  hasCatalogSurface: typeof catalog.AGENT_CATALOG === "object",',
      "}));",
    ]);

    const result = JSON.parse(output) as {
      exportCount: number;
      hasGraphCallsite: boolean;
      hasEvidenceCallsite: boolean;
      hasDiscoveryCallsite: boolean;
      hasCatalogSurface: boolean;
    };

    expect(result.exportCount).toBeGreaterThan(0);
    expect(result.hasGraphCallsite).toBe(true);
    expect(result.hasEvidenceCallsite).toBe(true);
    expect(result.hasDiscoveryCallsite).toBe(true);
    expect(result.hasCatalogSurface).toBe(true);
  });

  it("loads non-empty discovery inventories from an installed tarball", () => {
    const output = runNodeScript(consumerRoot, [
      'const catalog = require("@a5c-ai/agent-catalog");',
      "const snapshot = catalog.getCatalogDiscoverySnapshot();",
      "process.stdout.write(JSON.stringify({",
      "  counts: snapshot.counts,",
      "  agentCount: catalog.listCatalogAgents().length,",
      "  skillCount: catalog.listCatalogSkills().length,",
      "  processCount: catalog.listCatalogProcesses().length,",
      "}));",
    ]);

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


  it("still loads through the root entry shim when package.json is missing from the installed package root", () => {
    const rootEntryConsumer = installPackedConsumer(tempRoot, packedTgzPath, "consumer-missing-package-json");
    const installedRoot = path.join(rootEntryConsumer, "node_modules", "@a5c-ai", "agent-catalog");
    fs.rmSync(path.join(installedRoot, "package.json"), { force: true });

    const output = runNodeScript(rootEntryConsumer, [
      'const catalog = require("@a5c-ai/agent-catalog");',
      "process.stdout.write(JSON.stringify({",
      "  exportCount: Object.keys(catalog).length,",
      '  hasDiscoveryCallsite: typeof catalog.getCatalogDiscoverySnapshot === "function",',
      "}));",
    ]);

    const result = JSON.parse(output) as {
      exportCount: number;
      hasDiscoveryCallsite: boolean;
    };

    expect(result.exportCount).toBeGreaterThan(0);
    expect(result.hasDiscoveryCallsite).toBe(true);
  });


  it("fails explicitly when packaged discovery assets are unavailable", () => {
    const installedRoot = path.join(consumerRoot, "node_modules", "@a5c-ai", "agent-catalog");
    const snapshotPath = path.join(installedRoot, "dist", "discovery-snapshot.json");
    fs.rmSync(snapshotPath, { force: true });

    expect(() =>
      runNodeScript(consumerRoot, [
        'const catalog = require("@a5c-ai/agent-catalog");',
        "catalog.clearCatalogDiscoveryCache();",
        "catalog.getCatalogDiscoverySnapshot();",
      ]),
    ).toThrowError(/Discovery assets unavailable for @a5c-ai\/agent-catalog/);
  });
});
