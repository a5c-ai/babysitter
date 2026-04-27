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

  it("publishes graph and evidence assets through explicit subpath exports", () => {
    const output = runNodeScript(consumerRoot, [
      'const catalog = require("@a5c-ai/agent-catalog");',
      'const graphExport = require.resolve("@a5c-ai/agent-catalog/graph/agent-catalog.graph.yaml");',
      'const evidenceExport = require.resolve("@a5c-ai/agent-catalog/evidence/ontology-evidence/manifest.json");',
      "process.stdout.write(JSON.stringify({",
      "  graphExport,",
      "  evidenceExport,",
      '  helperGraph: catalog.resolveCatalogGraphAssetPath("agent-catalog.graph.yaml"),',
      '  helperEvidence: catalog.resolveCatalogEvidenceAssetPath("ontology-evidence/manifest.json"),',
      "  graphId: catalog.getCatalogGraphDocument().graphId,",
      "  shardCount: catalog.getOntologyEvidenceManifest().shards.length,",
      "}));",
    ]);

    const result = JSON.parse(output) as {
      graphExport: string;
      evidenceExport: string;
      helperGraph: string;
      helperEvidence: string;
      graphId: string;
      shardCount: number;
    };

    expect(result.graphExport).toBe(result.helperGraph);
    expect(result.evidenceExport).toBe(result.helperEvidence);
    expect(result.graphExport).toContain(path.join("@a5c-ai", "agent-catalog", "graph", "agent-catalog.graph.yaml"));
    expect(result.evidenceExport).toContain(path.join("@a5c-ai", "agent-catalog", "evidence", "ontology-evidence", "manifest.json"));
    expect(result.graphId).toBe("graph:agent-catalog");
    expect(result.shardCount).toBeGreaterThan(0);
  });

  it("keeps import-only package loading working when graph assets are missing and fails at the graph callsite", () => {
    const graphMissingConsumer = installPackedConsumer(tempRoot, packedTgzPath, "consumer-missing-graph");
    const installedRoot = path.join(graphMissingConsumer, "node_modules", "@a5c-ai", "agent-catalog");
    fs.rmSync(path.join(installedRoot, "graph", "agent-catalog.graph.yaml"), { force: true });

    const output = runNodeScript(graphMissingConsumer, [
      'const catalog = require("@a5c-ai/agent-catalog");',
      "let error = null;",
      "try {",
      "  catalog.getCatalogGraphDocument();",
      "} catch (nextError) {",
      "  error = nextError instanceof Error ? nextError.message : String(nextError);",
      "}",
      "process.stdout.write(JSON.stringify({",
      "  exportCount: Object.keys(catalog).length,",
      '  hasGraphCallsite: typeof catalog.getCatalogGraphDocument === "function",',
      "  error,",
      "}));",
    ]);

    const result = JSON.parse(output) as { exportCount: number; hasGraphCallsite: boolean; error: string | null };

    expect(result.exportCount).toBeGreaterThan(0);
    expect(result.hasGraphCallsite).toBe(true);
    expect(result.error).toMatch(/Failed to load graph assets for @a5c-ai\/agent-catalog/);
    expect(result.error).toMatch(/graph\/agent-catalog\.graph\.yaml/);
    expect(result.error).toMatch(/valid YAML/);
  });

  it("keeps import-only package loading working when evidence assets are malformed and fails at the evidence callsite", () => {
    const malformedEvidenceConsumer = installPackedConsumer(tempRoot, packedTgzPath, "consumer-malformed-evidence");
    const installedRoot = path.join(malformedEvidenceConsumer, "node_modules", "@a5c-ai", "agent-catalog");
    fs.writeFileSync(path.join(installedRoot, "evidence", "ontology-evidence", "manifest.json"), "{not-json", "utf8");

    const output = runNodeScript(malformedEvidenceConsumer, [
      'const catalog = require("@a5c-ai/agent-catalog");',
      "let error = null;",
      "try {",
      "  catalog.getOntologyEvidenceManifest();",
      "} catch (nextError) {",
      "  error = nextError instanceof Error ? nextError.message : String(nextError);",
      "}",
      "process.stdout.write(JSON.stringify({",
      "  exportCount: Object.keys(catalog).length,",
      '  hasEvidenceCallsite: typeof catalog.getOntologyEvidenceManifest === "function",',
      "  error,",
      "}));",
    ]);

    const result = JSON.parse(output) as { exportCount: number; hasEvidenceCallsite: boolean; error: string | null };

    expect(result.exportCount).toBeGreaterThan(0);
    expect(result.hasEvidenceCallsite).toBe(true);
    expect(result.error).toMatch(/Failed to load ontology evidence assets for @a5c-ai\/agent-catalog/);
    expect(result.error).toMatch(/evidence\/ontology-evidence\/manifest\.json/);
    expect(result.error).toMatch(/valid JSON/);
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
