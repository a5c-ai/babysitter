import { describe, expect, test } from "vitest";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  BABYSITTER_AGENT_SEAM_VALIDATION_COMMANDS,
  babysitterAgentSeamContracts,
  listBabysitterAgentPublicExports,
  listBabysitterAgentSeamDirectories,
} from "./contract";

const packageRoot = path.resolve(__dirname, "..", "..");
const srcRoot = path.join(packageRoot, "src");
const currentStateDocPath = path.resolve(
  packageRoot,
  "..",
  "..",
  "docs",
  "v6-spec-and-roadmap",
  "current-state.md",
);
const seamAdrPath = path.resolve(
  packageRoot,
  "..",
  "..",
  "docs",
  "v6-spec-and-roadmap",
  "decisions",
  "ADR-001-babysitter-agent-seam-contract.md",
);

describe("babysitter-agent seam contract", () => {
  test("assigns every top-level src directory to exactly one seam", async () => {
    const topLevelEntries = await fs.readdir(srcRoot, { withFileTypes: true });
    const topLevelDirectories = topLevelEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(listBabysitterAgentSeamDirectories().sort()).toEqual(topLevelDirectories);
  });

  test("documents public subpath exports for every public seam", async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(packageRoot, "package.json"), "utf8"),
    ) as { exports?: Record<string, unknown> };

    const exportedSubpaths = Object.keys(packageJson.exports ?? {}).sort();
    expect(exportedSubpaths).toEqual([
      ".",
      "./anycli",
      "./api",
      "./cli",
      "./cost",
      "./daemon",
      "./governance",
      "./harness",
      "./interaction",
      "./observability",
      "./package.json",
      "./runtime",
      "./seams",
      "./session",
      "./storage",
      "./tasks",
    ]);

    expect(listBabysitterAgentPublicExports().sort()).toEqual([
      "./anycli",
      "./api",
      "./cli",
      "./cost",
      "./daemon",
      "./governance",
      "./harness",
      "./interaction",
      "./observability",
      "./runtime",
      "./seams",
      "./session",
      "./storage",
      "./tasks",
    ]);
  });

  test("publishes both runtime CLI entrypoint aliases", async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(packageRoot, "package.json"), "utf8"),
    ) as { bin?: Record<string, string> };

    expect(packageJson.bin).toEqual({
      "babysitter-agent": "dist/cli/main.js",
      "babysitter-harness": "dist/cli/main.js",
    });
  });

  test("keeps the validation gate stable for every seam", () => {
    expect(BABYSITTER_AGENT_SEAM_VALIDATION_COMMANDS).toEqual([
      "npm run build --workspace=@a5c-ai/babysitter-agent",
      "npm run test --workspace=@a5c-ai/babysitter-agent",
    ]);

    for (const contract of babysitterAgentSeamContracts) {
      expect(contract.validationCommands).toEqual([
        "npm run build --workspace=@a5c-ai/babysitter-agent",
        "npm run test --workspace=@a5c-ai/babysitter-agent",
      ]);
    }
  });

  test("anchors the seam contract in the V6 current-state doc", async () => {
    const currentStateDoc = await fs.readFile(currentStateDocPath, "utf8");

    expect(currentStateDoc).toContain("`packages/babysitter-agent/src/seams/contract.ts`");
    expect(currentStateDoc).toContain("`runtime-foundation`");
    expect(currentStateDoc).toContain("`governance-control`");
    expect(currentStateDoc).toContain("`integration-bridges`");
    expect(currentStateDoc).toContain("`operator-surfaces`");
    expect(currentStateDoc).toContain("`npm run verify:v6:seams`");
  });

  test("keeps the accepted ADR aligned with the seam validation command", async () => {
    const seamAdr = await fs.readFile(seamAdrPath, "utf8");

    expect(seamAdr).toContain("# ADR-001: Babysitter-Agent Seam Contract As The First Executable V6 Slice");
    expect(seamAdr).toContain("`packages/babysitter-agent/src/seams/contract.ts`");
    expect(seamAdr).toContain("npm run verify:v6:seams");
    expect(seamAdr).toContain("`@a5c-ai/babysitter-agent`");
  });
});
