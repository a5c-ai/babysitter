/**
 * Microagent discovery tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MicroagentRegistry, builtInManifests } from "@a5c-ai/genty-core";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmpdir } from "node:os";
import {
  discoverMicroagents,
  registerBuiltInMicroagents,
  registerDiscoveredMicroagents,
} from "../discovery";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempDir: string;

function writeManifest(agentName: string, manifest: object): void {
  const dir = path.join(tempDir, agentName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "microagent.json"),
    JSON.stringify(manifest, null, 2),
  );
}

function sampleManifest(name: string) {
  return {
    name,
    version: "1.0.0",
    description: `Test microagent: ${name}`,
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    isolation: "subprocess",
    runtime: { entrypoint: `dist/${name}.js` },
    tags: ["test"],
    builtIn: false,
  };
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(tmpdir(), "microagent-discovery-"));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("discoverMicroagents", () => {
  it("finds manifests in directories", () => {
    writeManifest("agent-a", sampleManifest("agent-a"));
    writeManifest("agent-b", sampleManifest("agent-b"));

    const manifests = discoverMicroagents([tempDir]);

    expect(manifests).toHaveLength(2);
    const names = manifests.map((m) => m.name).sort();
    expect(names).toEqual(["agent-a", "agent-b"]);
  });

  it("skips non-existent directories", () => {
    const manifests = discoverMicroagents([
      path.join(tempDir, "does-not-exist"),
      path.join(tempDir, "also-missing"),
    ]);

    expect(manifests).toHaveLength(0);
  });

  it("skips subdirectories without microagent.json", () => {
    fs.mkdirSync(path.join(tempDir, "no-manifest"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, "no-manifest", "README.md"), "nope");
    writeManifest("real-agent", sampleManifest("real-agent"));

    const manifests = discoverMicroagents([tempDir]);

    expect(manifests).toHaveLength(1);
    expect(manifests[0]!.name).toBe("real-agent");
  });

  it("scans multiple directories", () => {
    const dir2 = fs.mkdtempSync(path.join(tmpdir(), "microagent-disc2-"));
    try {
      writeManifest("from-dir1", sampleManifest("from-dir1"));
      const dir2Agent = path.join(dir2, "from-dir2");
      fs.mkdirSync(dir2Agent, { recursive: true });
      fs.writeFileSync(
        path.join(dir2Agent, "microagent.json"),
        JSON.stringify(sampleManifest("from-dir2")),
      );

      const manifests = discoverMicroagents([tempDir, dir2]);

      expect(manifests).toHaveLength(2);
    } finally {
      fs.rmSync(dir2, { recursive: true, force: true });
    }
  });
});

describe("registerBuiltInMicroagents", () => {
  it("registers all 5 built-in manifests", () => {
    const registry = new MicroagentRegistry();

    registerBuiltInMicroagents(registry);

    const all = registry.list();
    expect(all).toHaveLength(builtInManifests.length);
    expect(all).toHaveLength(5);

    // Every built-in should be present
    for (const builtin of builtInManifests) {
      expect(registry.has(builtin.name)).toBe(true);
    }
  });
});

describe("registerDiscoveredMicroagents", () => {
  it("registers discovered manifests and returns count", () => {
    writeManifest("disc-a", sampleManifest("disc-a"));
    writeManifest("disc-b", sampleManifest("disc-b"));

    const registry = new MicroagentRegistry();
    const count = registerDiscoveredMicroagents(registry, [tempDir]);

    expect(count).toBe(2);
    expect(registry.has("disc-a")).toBe(true);
    expect(registry.has("disc-b")).toBe(true);
  });

  it("returns 0 for non-existent directories", () => {
    const registry = new MicroagentRegistry();
    const count = registerDiscoveredMicroagents(registry, [
      path.join(tempDir, "nope"),
    ]);
    expect(count).toBe(0);
    expect(registry.list()).toHaveLength(0);
  });
});
