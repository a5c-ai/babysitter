import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

import { defineTask, resetGlobalTaskRegistry } from "../../tasks";
import { createPolicyEngine } from "../../governance";
import { readPolicyDecisionLog } from "../../governance/logging";
import { RunFailedError, EffectRequestedError } from "../exceptions";
import { runTaskIntrinsic } from "../intrinsics/task";
import { buildTaskContext, createTestRun } from "./testHelpers";

/**
 * RED tests for GAP-SEC-001 integration:
 * Governance policy must be enforced at effect-dispatch time (before EFFECT_REQUESTED is written)
 * and every evaluation must be audit-logged.
 *
 * These tests are expected to FAIL until the policy engine is wired into the runtime.
 */

describe("GAP-SEC-001 governance enforcement (RED)", () => {
  let tmpRoot: string;
  let logRoot: string;
  const oldLogDir = process.env.BABYSITTER_LOG_DIR;

  beforeEach(async () => {
    resetGlobalTaskRegistry();
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-governance-red-"));
    logRoot = path.join(tmpRoot, "logs");
    process.env.BABYSITTER_LOG_DIR = logRoot;
  });

  afterEach(async () => {
    process.env.BABYSITTER_LOG_DIR = oldLogDir;
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  test("deny policy blocks effect dispatch before writing task artifacts/journal", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId, { processId: "demo-process" });

    // Attach a policy engine (runtime wiring not implemented yet).
    (context as unknown as { policyEngine: unknown }).policyEngine = createPolicyEngine([
      {
        id: "deny-node-effects",
        kind: "permission",
        condition: { field: "effectKind", op: "eq", value: "node" },
        action: "deny",
        priority: 100,
        metadata: { reason: "node effects are not allowed" },
      },
    ]);

    const task = defineTask("test:node", () => ({
      kind: "node",
      title: "node task",
      metadata: { env: "test" },
    }));

    await expect(
      runTaskIntrinsic({ task, args: {}, context })
    ).rejects.toSatisfy((err) => {
      // Expected behavior once governance is enforced:
      // - policy denies dispatch
      // - runtime fails the run with a meaningful error
      expect(err).toBeInstanceOf(RunFailedError);
      expect(String((err as Error).message)).toContain("deny-node-effects");
      return true;
    });

    // No task artifacts should be created for a denied effect.
    const tasksDir = path.join(runDir, "tasks");
    const taskEntries = await fs.readdir(tasksDir).catch(() => []);
    expect(taskEntries).toHaveLength(0);

    // A decision must be audit-logged (run-scoped under the log dir).
    const entries = await readPolicyDecisionLog(path.join(logRoot, runId));
    expect(entries).toHaveLength(1);
    expect(entries[0].decision.allowed).toBe(false);
    expect(entries[0].ruleId).toBe("deny-node-effects");
    expect(entries[0].context).toMatchObject({
      runId,
      processId: "demo-process",
      taskId: "test:node",
      effectKind: "node",
    });
  });

  test("warn policy does not block dispatch but is audit-logged", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId, { processId: "demo-process" });

    (context as unknown as { policyEngine: unknown }).policyEngine = createPolicyEngine([
      {
        id: "warn-node-effects",
        kind: "resource-limit",
        condition: { field: "effectKind", op: "eq", value: "node" },
        action: "warn",
        priority: 10,
        metadata: { reason: "node effects should be minimized" },
      },
    ]);

    const task = defineTask("test:node", () => ({
      kind: "node",
      title: "node task",
    }));

    await expect(runTaskIntrinsic({ task, args: {}, context })).rejects.toBeInstanceOf(EffectRequestedError);

    const entries = await readPolicyDecisionLog(path.join(logRoot, runId));
    expect(entries).toHaveLength(1);
    expect(entries[0].decision.allowed).toBe(true);
    expect(entries[0].decision.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("warn-node-effects")])
    );
  });

  test("allow policy is audit-logged with the matching rule id", async () => {
    const { runDir, runId } = await createTestRun(tmpRoot);
    const context = await buildTaskContext(runDir, runId);

    (context as unknown as { policyEngine: unknown }).policyEngine = createPolicyEngine([
      {
        id: "allow-node-effects",
        kind: "permission",
        condition: { field: "effectKind", op: "eq", value: "node" },
        action: "allow",
        priority: 10,
      },
    ]);

    const task = defineTask("test:node", () => ({
      kind: "node",
      title: "node task",
    }));

    await expect(runTaskIntrinsic({ task, args: {}, context })).rejects.toBeInstanceOf(EffectRequestedError);

    const entries = await readPolicyDecisionLog(path.join(logRoot, runId));
    expect(entries).toHaveLength(1);
    expect(entries[0].decision.allowed).toBe(true);
    expect(entries[0].ruleId).toBe("allow-node-effects");
  });
});
