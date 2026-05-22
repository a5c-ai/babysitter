import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";

import { createRun } from "../createRun";
import { orchestrateIteration } from "../orchestrateIteration";
import { loadJournal } from "../../storage/journal";
import {
  readPolicyDecisionLog,
  resolvePolicyDecisionLogDir,
  type RuntimeGovernanceConfig,
} from "../policy";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-governance-orch-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function writeProcessFile(dir: string, filename: string) {
  const filePath = path.join(dir, filename);
  const contents = `
  const echoTask = {
    id: "echo-task",
    async build() {
      return { kind: "node", title: "echo", metadata: { env: "test" } };
    }
  };

  export async function process(inputs, ctx) {
    return await ctx.task(echoTask, { value: inputs.value });
  }
  `;
  await fs.writeFile(filePath, contents, "utf8");
  return filePath;
}

describe("orchestrateIteration governance integration", () => {
  test("deny policy fails the run before task artifacts or EFFECT_REQUESTED are written", async () => {
    const processDir = path.join(tmpRoot, "processes");
    const auditRoot = path.join(tmpRoot, "logs");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = await writeProcessFile(processDir, "deny.mjs");
    const governance: RuntimeGovernanceConfig = {
      auditLogDir: auditRoot,
      policyRules: [
        {
          id: "deny-node-effects",
          kind: "permission",
          condition: { field: "effectKind", op: "eq", value: "node" },
          action: "deny",
          priority: 100,
          metadata: { reason: "node effects are not allowed" },
        },
      ],
    };

    const created = await createRun({
      runsDir: tmpRoot,
      runId: "run-governance-deny",
      request: "governance-deny",
      process: {
        processId: "governance/deny",
        importPath: processPath,
      },
      inputs: { value: 5 },
      governance,
    });

    const result = await orchestrateIteration({ runDir: created.runDir });
    expect(result.status).toBe("failed");
    if (result.status !== "failed") {
      throw new Error("Expected failed status");
    }

    expect(String(result.error.message)).toContain("deny-node-effects");

    const journal = await loadJournal(created.runDir);
    expect(journal.some((event) => event.type === "EFFECT_REQUESTED")).toBe(false);

    const taskEntries = await fs.readdir(path.join(created.runDir, "tasks"));
    expect(taskEntries).toHaveLength(0);

    const entries = await readPolicyDecisionLog(resolvePolicyDecisionLogDir(created.runId, governance));
    expect(entries).toHaveLength(1);
    expect(entries[0].decision.allowed).toBe(false);
    expect(entries[0].ruleId).toBe("deny-node-effects");
    expect(entries[0].context).toMatchObject({
      runId: created.runId,
      processId: "governance/deny",
      taskId: "echo-task",
      effectKind: "node",
    });
  });

  test("warn policy keeps runtime waiting and writes an audit entry", async () => {
    const processDir = path.join(tmpRoot, "processes");
    const auditRoot = path.join(tmpRoot, "logs");
    await fs.mkdir(processDir, { recursive: true });
    const processPath = await writeProcessFile(processDir, "warn.mjs");
    const governance: RuntimeGovernanceConfig = {
      auditLogDir: auditRoot,
      policyRules: [
        {
          id: "warn-node-effects",
          kind: "resource-limit",
          condition: { field: "effectKind", op: "eq", value: "node" },
          action: "warn",
          priority: 10,
          metadata: { reason: "node effects should be minimized" },
        },
      ],
    };

    const created = await createRun({
      runsDir: tmpRoot,
      runId: "run-governance-warn",
      request: "governance-warn",
      process: {
        processId: "governance/warn",
        importPath: processPath,
      },
      inputs: { value: 5 },
      governance,
    });

    const result = await orchestrateIteration({ runDir: created.runDir });
    expect(result.status).toBe("waiting");
    if (result.status !== "waiting") {
      throw new Error("Expected waiting status");
    }

    expect(result.nextActions).toHaveLength(1);
    expect(result.nextActions[0].kind).toBe("node");

    const entries = await readPolicyDecisionLog(resolvePolicyDecisionLogDir(created.runId, governance));
    expect(entries).toHaveLength(1);
    expect(entries[0].decision.allowed).toBe(true);
    expect(entries[0].decision.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("warn-node-effects")])
    );
  });
});
