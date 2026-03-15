import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  createRunDir,
  appendEvent,
  loadJournal,
  writeTaskDefinition,
} from "../../storage";
import { registerRunTools } from "../tools/runs";
import { registerTaskTools } from "../tools/tasks";
import { registerDiscoveryTools } from "../tools/discovery";

// -- helpers ------------------------------------------------------------------

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

function getToolHandler(server: McpServer, name: string): ToolHandler {
  const tools = (
    server as unknown as {
      _registeredTools: Record<string, { handler: ToolHandler }>;
    }
  )._registeredTools;
  const tool = tools[name];
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler;
}

function parseResult(result: {
  content: Array<{ type: string; text: string }>;
}): Record<string, unknown> {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

/**
 * Helper to create a run directory, write RUN_CREATED, and optionally add
 * EFFECT_REQUESTED events with all required fields for the effect index.
 */
async function setupRun(
  runsDir: string,
  runId: string,
  processId: string,
  effects?: Array<{
    effectId: string;
    taskId: string;
    stepId: string;
    invocationKey: string;
    kind: string;
    label: string;
  }>
): Promise<string> {
  const result = await createRunDir({
    runsRoot: runsDir,
    runId,
    request: "integration-test",
    processId,
    entrypoint: { importPath: "./fake-process.js", exportName: "process" },
  });
  const runDir = result.runDir;

  await appendEvent({
    runDir,
    eventType: "RUN_CREATED",
    event: { runId, processId },
  });

  if (effects) {
    for (const eff of effects) {
      // Write a task definition file first so the taskDefRef is valid
      const taskDefRef = await writeTaskDefinition(runDir, eff.effectId, {
        kind: eff.kind,
        title: eff.label,
        taskId: eff.taskId,
      });

      await appendEvent({
        runDir,
        eventType: "EFFECT_REQUESTED",
        event: {
          effectId: eff.effectId,
          invocationKey: eff.invocationKey,
          stepId: eff.stepId,
          taskId: eff.taskId,
          kind: eff.kind,
          label: eff.label,
          taskDefRef,
        },
      });
    }
  }

  return runDir;
}

// -- test suite ---------------------------------------------------------------

describe("MCP Server Integration Tests", () => {
  let tmpDir: string;
  let runsDir: string;
  let server: McpServer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-integration-"));
    runsDir = path.join(tmpDir, "runs");
    await fs.mkdir(runsDir, { recursive: true });

    server = new McpServer({ name: "test-integration", version: "0.0.0" });
    registerRunTools(server);
    registerTaskTools(server);
    registerDiscoveryTools(server);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("run lifecycle with real SDK storage", () => {
    const RUN_ID = "01INTEG-RUN";

    beforeEach(async () => {
      await setupRun(runsDir, RUN_ID, "test/integration-process");
    });

    it("run_status returns created state for a fresh run", async () => {
      const handler = getToolHandler(server, "run_status");
      const result = await handler({ runId: RUN_ID, runsDir });

      expect(result.isError).toBeUndefined();
      const data = parseResult(result);
      expect(data.runId).toBe(RUN_ID);
      expect(data.processId).toBe("test/integration-process");
      expect(data.state).toBe("created");
      expect(data.pendingEffects).toEqual([]);
    });

    it("run_events returns the RUN_CREATED event", async () => {
      const handler = getToolHandler(server, "run_events");
      const result = await handler({ runId: RUN_ID, runsDir });

      expect(result.isError).toBeUndefined();
      const data = parseResult(result);
      expect(data.total).toBe(1);
      const events = data.events as Array<{ type: string }>;
      expect(events[0].type).toBe("RUN_CREATED");
    });

    it("task_list returns empty for a fresh run", async () => {
      const handler = getToolHandler(server, "task_list");
      const result = await handler({ runId: RUN_ID, runsDir });

      expect(result.isError).toBeUndefined();
      const data = parseResult(result);
      expect(data.total).toBe(0);
      expect(data.pendingCount).toBe(0);
      expect(data.tasks).toEqual([]);
    });
  });

  describe("effect request and resolution flow", () => {
    const RUN_ID = "01INTEG-EFFECTS";
    const EFFECT_ID = "eff-integ-001";
    const TASK_ID = "my-task";
    const INVOCATION_KEY = "test:S000001:my-task";
    let runDir: string;

    beforeEach(async () => {
      runDir = await setupRun(runsDir, RUN_ID, "test/effect-process", [
        {
          effectId: EFFECT_ID,
          taskId: TASK_ID,
          stepId: "S000001",
          invocationKey: INVOCATION_KEY,
          kind: "node",
          label: "Run integration task",
        },
      ]);
    });

    it("task_list shows the pending effect", async () => {
      const handler = getToolHandler(server, "task_list");
      const result = await handler({ runId: RUN_ID, runsDir });

      const data = parseResult(result);
      expect(data.total).toBe(1);
      expect(data.pendingCount).toBe(1);
      const tasks = data.tasks as Array<{
        effectId: string;
        kind: string;
        status: string;
        label: string;
      }>;
      expect(tasks[0].effectId).toBe(EFFECT_ID);
      expect(tasks[0].kind).toBe("node");
      expect(tasks[0].status).toBe("pending");
      expect(tasks[0].label).toBe("Run integration task");
    });

    it("task_list pendingOnly=true filters correctly", async () => {
      const handler = getToolHandler(server, "task_list");
      const result = await handler({
        runId: RUN_ID,
        runsDir,
        pendingOnly: true,
      });

      const data = parseResult(result);
      expect(data.showing).toBe(1);
      const tasks = data.tasks as Array<{ effectId: string }>;
      expect(tasks[0].effectId).toBe(EFFECT_ID);
    });

    it("run_status shows waiting state with pending effects", async () => {
      const handler = getToolHandler(server, "run_status");
      const result = await handler({ runId: RUN_ID, runsDir });

      const data = parseResult(result);
      expect(data.state).toBe("waiting");
      const pending = data.pendingEffects as Array<{
        effectId: string;
        kind: string;
      }>;
      expect(pending).toHaveLength(1);
      expect(pending[0].effectId).toBe(EFFECT_ID);
      expect(pending[0].kind).toBe("node");
      const byKind = data.pendingByKind as Record<string, number>;
      expect(byKind.node).toBe(1);
    });

    it("task_show returns task details for a pending effect", async () => {
      const handler = getToolHandler(server, "task_show");
      const result = await handler({
        runId: RUN_ID,
        effectId: EFFECT_ID,
        runsDir,
      });

      expect(result.isError).toBeUndefined();
      const data = parseResult(result);
      const effect = data.effect as {
        effectId: string;
        status: string;
        kind: string;
      };
      expect(effect.effectId).toBe(EFFECT_ID);
      expect(effect.status).toBe("pending");
      expect(effect.kind).toBe("node");
      // Task definition was written by setupRun, so it should be present
      const task = data.task as Record<string, unknown>;
      expect(task).toBeTruthy();
      expect(task.kind).toBe("node");
      // Not resolved, so result should be null/undefined
      expect(data.result).toBeFalsy();
    });

    it("task_show returns error for non-existent effect", async () => {
      const handler = getToolHandler(server, "task_show");
      const result = await handler({
        runId: RUN_ID,
        effectId: "nonexistent-effect",
        runsDir,
      });

      expect(result.isError).toBe(true);
      const data = parseResult(result);
      expect(data.error).toContain("nonexistent-effect");
    });

    it("task_post resolves the effect via real SDK commitEffectResult", async () => {
      const postHandler = getToolHandler(server, "task_post");
      const postResult = await postHandler({
        runId: RUN_ID,
        effectId: EFFECT_ID,
        status: "ok",
        value: JSON.stringify({ output: "integration success" }),
        runsDir,
      });

      expect(postResult.isError).toBeUndefined();
      const postData = parseResult(postResult);
      expect(postData.status).toBe("ok");
      expect(postData.effectId).toBe(EFFECT_ID);
      expect(postData.resultRef).toBeTruthy();

      // Verify journal now has EFFECT_RESOLVED
      const journal = await loadJournal(runDir);
      const resolvedEvents = journal.filter(
        (e) => e.type === "EFFECT_RESOLVED"
      );
      expect(resolvedEvents).toHaveLength(1);
      expect(resolvedEvents[0].data.effectId).toBe(EFFECT_ID);
      expect(resolvedEvents[0].data.status).toBe("ok");
    });

    it("full flow: request -> post -> verify resolved via MCP tools", async () => {
      // Step 1: Verify task is pending
      const listHandler = getToolHandler(server, "task_list");
      const listBefore = await listHandler({ runId: RUN_ID, runsDir });
      const dataBefore = parseResult(listBefore);
      expect(dataBefore.pendingCount).toBe(1);

      // Step 2: Post the result
      const postHandler = getToolHandler(server, "task_post");
      const postResult = await postHandler({
        runId: RUN_ID,
        effectId: EFFECT_ID,
        status: "ok",
        value: JSON.stringify({ answer: 42 }),
        runsDir,
      });
      expect(postResult.isError).toBeUndefined();

      // Step 3: Verify task is now resolved
      const listAfter = await listHandler({ runId: RUN_ID, runsDir });
      const dataAfter = parseResult(listAfter);
      expect(dataAfter.pendingCount).toBe(0);
      expect(dataAfter.total).toBe(1);
      const tasks = dataAfter.tasks as Array<{
        effectId: string;
        status: string;
      }>;
      expect(tasks[0].effectId).toBe(EFFECT_ID);
      expect(tasks[0].status).toBe("resolved");

      // Step 4: Verify run_status reflects no pending effects
      const statusHandler = getToolHandler(server, "run_status");
      const statusResult = await statusHandler({ runId: RUN_ID, runsDir });
      const statusData = parseResult(statusResult);
      // State is "created" because the last lifecycle event is still RUN_CREATED
      // (no RUN_COMPLETED was emitted, but there are no more pending effects)
      expect(statusData.state).toBe("created");
      expect(statusData.pendingEffects).toEqual([]);

      // Step 5: Verify task_show returns the result
      const showHandler = getToolHandler(server, "task_show");
      const showResult = await showHandler({
        runId: RUN_ID,
        effectId: EFFECT_ID,
        runsDir,
      });
      const showData = parseResult(showResult);
      const effect = showData.effect as { status: string };
      expect(effect.status).toBe("resolved");
      // result should be populated (the serializer wrote a result file)
      expect(showData.result).toBeTruthy();
    });

    it("task_post with error status resolves with error payload", async () => {
      const postHandler = getToolHandler(server, "task_post");
      const postResult = await postHandler({
        runId: RUN_ID,
        effectId: EFFECT_ID,
        status: "error",
        error: JSON.stringify({
          name: "IntegrationError",
          message: "Something went wrong",
        }),
        runsDir,
      });

      expect(postResult.isError).toBeUndefined();
      const postData = parseResult(postResult);
      expect(postData.status).toBe("error");

      // Verify the journal recorded an error resolution
      const journal = await loadJournal(runDir);
      const resolved = journal.find((e) => e.type === "EFFECT_RESOLVED");
      expect(resolved).toBeTruthy();
      expect(resolved!.data.status).toBe("error");
    });
  });

  describe("multiple effects", () => {
    const RUN_ID = "01INTEG-MULTI";
    let runDir: string;

    beforeEach(async () => {
      runDir = await setupRun(runsDir, RUN_ID, "test/multi", [
        {
          effectId: "eff-A",
          taskId: "taskA",
          stepId: "S000001",
          invocationKey: "test:S000001:taskA",
          kind: "node",
          label: "Task A",
        },
        {
          effectId: "eff-B",
          taskId: "taskB",
          stepId: "S000002",
          invocationKey: "test:S000002:taskB",
          kind: "breakpoint",
          label: "Task B",
        },
      ]);
    });

    it("lists multiple pending effects by kind", async () => {
      const statusHandler = getToolHandler(server, "run_status");
      const result = await statusHandler({ runId: RUN_ID, runsDir });
      const data = parseResult(result);

      expect(data.state).toBe("waiting");
      const pending = data.pendingEffects as Array<{
        effectId: string;
        kind: string;
      }>;
      expect(pending).toHaveLength(2);
      const byKind = data.pendingByKind as Record<string, number>;
      expect(byKind.node).toBe(1);
      expect(byKind.breakpoint).toBe(1);
    });

    it("resolving one effect leaves the other pending", async () => {
      // Resolve eff-A
      const postHandler = getToolHandler(server, "task_post");
      const postResult = await postHandler({
        runId: RUN_ID,
        effectId: "eff-A",
        status: "ok",
        value: JSON.stringify({ done: true }),
        runsDir,
      });
      expect(postResult.isError).toBeUndefined();

      const listHandler = getToolHandler(server, "task_list");
      const result = await listHandler({
        runId: RUN_ID,
        runsDir,
        pendingOnly: true,
      });
      const data = parseResult(result);
      expect(data.showing).toBe(1);
      const tasks = data.tasks as Array<{ effectId: string }>;
      expect(tasks[0].effectId).toBe("eff-B");
    });

    it("run_events filter by type works with real journal", async () => {
      const handler = getToolHandler(server, "run_events");

      // Filter to only EFFECT_REQUESTED
      const result = await handler({
        runId: RUN_ID,
        runsDir,
        filterType: "EFFECT_REQUESTED",
      });
      const data = parseResult(result);
      expect(data.total).toBe(3); // RUN_CREATED + 2 EFFECT_REQUESTED
      expect(data.matching).toBe(2);
      expect(data.showing).toBe(2);
    });

    it("run_events with limit and reverse works", async () => {
      const handler = getToolHandler(server, "run_events");
      const result = await handler({
        runId: RUN_ID,
        runsDir,
        reverse: true,
        limit: 1,
      });
      const data = parseResult(result);
      expect(data.showing).toBe(1);
      const events = data.events as Array<{ type: string }>;
      expect(events[0].type).toBe("EFFECT_REQUESTED"); // last event reversed
    });
  });

  describe("run_rebuild_state with real storage", () => {
    const RUN_ID = "01INTEG-REBUILD";

    beforeEach(async () => {
      await setupRun(runsDir, RUN_ID, "test/rebuild", [
        {
          effectId: "eff-rebuild-1",
          taskId: "rebuild-task",
          stepId: "S000001",
          invocationKey: "test:S000001:rebuild-task",
          kind: "node",
          label: "Rebuild test task",
        },
      ]);
    });

    it("rebuilds state cache from journal", async () => {
      const handler = getToolHandler(server, "run_rebuild_state");
      const result = await handler({ runId: RUN_ID, runsDir });

      expect(result.isError).toBeUndefined();
      const data = parseResult(result);
      expect(data.success).toBe(true);
      expect(data.stateVersion).toBeGreaterThanOrEqual(1);
      expect(data.journalHead).toBeTruthy();
    });
  });

  describe("error handling with real storage", () => {
    it("run_status returns error for non-existent run", async () => {
      const handler = getToolHandler(server, "run_status");
      const result = await handler({
        runId: "nonexistent-run-id",
        runsDir,
      });

      expect(result.isError).toBe(true);
      const data = parseResult(result);
      expect(data.error).toBeTruthy();
    });

    it("task_post returns error for non-existent run", async () => {
      const handler = getToolHandler(server, "task_post");
      const result = await handler({
        runId: "nonexistent-run-id",
        effectId: "eff-1",
        status: "ok",
        value: "{}",
        runsDir,
      });

      expect(result.isError).toBe(true);
    });

    it("task_post returns error for invalid JSON in value", async () => {
      const handler = getToolHandler(server, "task_post");
      const result = await handler({
        runId: "any-run",
        effectId: "eff-1",
        status: "ok",
        value: "not-json{",
        runsDir,
      });

      expect(result.isError).toBe(true);
      const data = parseResult(result);
      expect(data.error).toContain("Invalid JSON");
    });
  });

  describe("configure_show tool", () => {
    it("returns configuration values", async () => {
      const handler = getToolHandler(server, "configure_show");
      const result = await handler({});

      expect(result.isError).toBeUndefined();
      const data = parseResult(result);
      expect(data.values).toBeTruthy();
      expect(data.timestamp).toBeTruthy();
    });
  });

  describe("health tool", () => {
    it("returns health check results", async () => {
      const handler = getToolHandler(server, "health");
      const result = await handler({});

      expect(result.isError).toBeUndefined();
      const data = parseResult(result);
      expect(data.status).toBeTruthy();
      expect(data.checks).toBeTruthy();
    });
  });

  describe("task_show with task definition file", () => {
    const RUN_ID = "01INTEG-TASKDEF";
    const EFFECT_ID = "eff-with-def";

    beforeEach(async () => {
      // setupRun already writes task definitions for each effect
      await setupRun(runsDir, RUN_ID, "test/taskdef", [
        {
          effectId: EFFECT_ID,
          taskId: "def-task",
          stepId: "S000001",
          invocationKey: "test:S000001:def-task",
          kind: "node",
          label: "Task with definition",
        },
      ]);
    });

    it("task_show returns the task definition", async () => {
      const handler = getToolHandler(server, "task_show");
      const result = await handler({
        runId: RUN_ID,
        effectId: EFFECT_ID,
        runsDir,
      });

      expect(result.isError).toBeUndefined();
      const data = parseResult(result);
      const task = data.task as Record<string, unknown>;
      expect(task).toBeTruthy();
      expect(task.kind).toBe("node");
      expect(task.title).toBe("Task with definition");
    });
  });
});
