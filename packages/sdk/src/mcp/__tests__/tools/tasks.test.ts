import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTaskTools } from "../../tools/tasks";

vi.mock("../../../runtime/commitEffectResult", () => ({
  commitEffectResult: vi.fn(),
}));

vi.mock("../../../storage", () => ({
  loadJournal: vi.fn(),
}));

vi.mock("../../../storage/tasks", () => ({
  readTaskDefinition: vi.fn(),
  readTaskResult: vi.fn(),
}));

import { commitEffectResult } from "../../../runtime/commitEffectResult";
import { loadJournal } from "../../../storage";
import { readTaskDefinition, readTaskResult } from "../../../storage/tasks";

const mockedCommitEffectResult = vi.mocked(commitEffectResult);
const mockedLoadJournal = vi.mocked(loadJournal);
const mockedReadTaskDefinition = vi.mocked(readTaskDefinition);
const mockedReadTaskResult = vi.mocked(readTaskResult);

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

function getToolHandler(server: McpServer, name: string): ToolHandler {
  const tools = (server as unknown as { _registeredTools: Record<string, { handler: ToolHandler }> })._registeredTools;
  const tool = tools[name];
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler;
}

function parseResult(result: { content: Array<{ type: string; text: string }> }): unknown {
  return JSON.parse(result.content[0].text);
}

let server: McpServer;

beforeEach(() => {
  vi.clearAllMocks();
  server = new McpServer({ name: "test", version: "0.0.0" });
  registerTaskTools(server);
});

describe("task_list", () => {
  it("lists tasks from journal events", async () => {
    mockedLoadJournal.mockResolvedValue([
      {
        seq: 1, type: "RUN_CREATED",
        recordedAt: "2026-01-01T00:00:00Z", data: {}, checksum: "a",
      },
      {
        seq: 2, type: "EFFECT_REQUESTED",
        recordedAt: "2026-01-01T00:00:01Z",
        data: { effectId: "eff-1", kind: "node", label: "Build" },
        checksum: "b",
      },
      {
        seq: 3, type: "EFFECT_REQUESTED",
        recordedAt: "2026-01-01T00:00:02Z",
        data: { effectId: "eff-2", kind: "node", label: "Test" },
        checksum: "c",
      },
      {
        seq: 4, type: "EFFECT_RESOLVED",
        recordedAt: "2026-01-01T00:00:03Z",
        data: { effectId: "eff-1" },
        checksum: "d",
      },
    ] as Awaited<ReturnType<typeof loadJournal>>);

    const handler = getToolHandler(server, "task_list");
    const result = await handler({ runId: "01TASKS", runsDir: "/tmp/runs" });

    const data = parseResult(result) as {
      total: number;
      showing: number;
      pendingCount: number;
      tasks: Array<{ effectId: string; status: string }>;
    };
    expect(data.total).toBe(2);
    expect(data.showing).toBe(2);
    expect(data.pendingCount).toBe(1);
    expect(data.tasks.find(t => t.effectId === "eff-1")?.status).toBe("resolved");
    expect(data.tasks.find(t => t.effectId === "eff-2")?.status).toBe("pending");
  });

  it("filters to pending only", async () => {
    mockedLoadJournal.mockResolvedValue([
      {
        seq: 1, type: "EFFECT_REQUESTED",
        recordedAt: "t1",
        data: { effectId: "eff-1", kind: "node" },
        checksum: "a",
      },
      {
        seq: 2, type: "EFFECT_REQUESTED",
        recordedAt: "t2",
        data: { effectId: "eff-2", kind: "node" },
        checksum: "b",
      },
      {
        seq: 3, type: "EFFECT_RESOLVED",
        recordedAt: "t3",
        data: { effectId: "eff-1" },
        checksum: "c",
      },
    ] as Awaited<ReturnType<typeof loadJournal>>);

    const handler = getToolHandler(server, "task_list");
    const result = await handler({
      runId: "01TASKS",
      runsDir: "/tmp/runs",
      pendingOnly: true,
    });

    const data = parseResult(result) as { showing: number; tasks: Array<{ effectId: string }> };
    expect(data.showing).toBe(1);
    expect(data.tasks[0].effectId).toBe("eff-2");
  });

  it("returns empty list when no effects exist", async () => {
    mockedLoadJournal.mockResolvedValue([
      { seq: 1, type: "RUN_CREATED", recordedAt: "t1", data: {}, checksum: "a" },
    ] as Awaited<ReturnType<typeof loadJournal>>);

    const handler = getToolHandler(server, "task_list");
    const result = await handler({ runId: "01EMPTY", runsDir: "/tmp/runs" });

    const data = parseResult(result) as { total: number; tasks: unknown[] };
    expect(data.total).toBe(0);
    expect(data.tasks).toEqual([]);
  });
});

describe("task_show", () => {
  it("shows task details with definition and result", async () => {
    mockedLoadJournal.mockResolvedValue([
      {
        seq: 1, type: "EFFECT_REQUESTED",
        recordedAt: "t1",
        data: { effectId: "eff-1", kind: "node", label: "Build" },
        checksum: "a",
      },
      {
        seq: 2, type: "EFFECT_RESOLVED",
        recordedAt: "t2",
        data: { effectId: "eff-1" },
        checksum: "b",
      },
    ] as Awaited<ReturnType<typeof loadJournal>>);

    mockedReadTaskDefinition.mockResolvedValue({ kind: "node", title: "Build step" });
    mockedReadTaskResult.mockResolvedValue({ status: "ok", value: { success: true } });

    const handler = getToolHandler(server, "task_show");
    const result = await handler({
      runId: "01SHOW",
      effectId: "eff-1",
      runsDir: "/tmp/runs",
    });

    const data = parseResult(result) as {
      effect: { effectId: string; status: string };
      task: unknown;
      result: unknown;
    };
    expect(data.effect.effectId).toBe("eff-1");
    expect(data.effect.status).toBe("resolved");
    expect(data.task).toEqual({ kind: "node", title: "Build step" });
    expect(data.result).toEqual({ status: "ok", value: { success: true } });
  });

  it("returns error for unknown effect", async () => {
    mockedLoadJournal.mockResolvedValue([
      { seq: 1, type: "RUN_CREATED", recordedAt: "t1", data: {}, checksum: "a" },
    ] as Awaited<ReturnType<typeof loadJournal>>);

    const handler = getToolHandler(server, "task_show");
    const result = await handler({
      runId: "01SHOW",
      effectId: "nonexistent",
      runsDir: "/tmp/runs",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("nonexistent");
    expect(data.error).toContain("not found");
  });

  it("returns null for task def and result when files do not exist", async () => {
    mockedLoadJournal.mockResolvedValue([
      {
        seq: 1, type: "EFFECT_REQUESTED",
        recordedAt: "t1",
        data: { effectId: "eff-1", kind: "node" },
        checksum: "a",
      },
    ] as Awaited<ReturnType<typeof loadJournal>>);

    mockedReadTaskDefinition.mockRejectedValue(new Error("ENOENT"));

    const handler = getToolHandler(server, "task_show");
    const result = await handler({
      runId: "01SHOW",
      effectId: "eff-1",
      runsDir: "/tmp/runs",
    });

    const data = parseResult(result) as { task: unknown; result: unknown };
    expect(data.task).toBeNull();
    expect(data.result).toBeNull();
  });
});

describe("task_post", () => {
  it("posts a successful result", async () => {
    mockedCommitEffectResult.mockResolvedValue({
      resultRef: "tasks/eff-1/result.json",
    } as Awaited<ReturnType<typeof commitEffectResult>>);

    const handler = getToolHandler(server, "task_post");
    const result = await handler({
      runId: "01POST",
      effectId: "eff-1",
      status: "ok",
      value: '{"success": true}',
      runsDir: "/tmp/runs",
    });

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { status: string; effectId: string; resultRef: string };
    expect(data.status).toBe("ok");
    expect(data.effectId).toBe("eff-1");
    expect(data.resultRef).toBe("tasks/eff-1/result.json");

    expect(mockedCommitEffectResult).toHaveBeenCalledWith(
      expect.objectContaining({
        effectId: "eff-1",
        result: expect.objectContaining({
          status: "ok",
          value: { success: true },
        }),
      })
    );
  });

  it("posts an error result", async () => {
    mockedCommitEffectResult.mockResolvedValue({
      resultRef: "tasks/eff-1/result.json",
    } as Awaited<ReturnType<typeof commitEffectResult>>);

    const handler = getToolHandler(server, "task_post");
    const result = await handler({
      runId: "01POST",
      effectId: "eff-1",
      status: "error",
      error: '{"name": "Error", "message": "oops"}',
      runsDir: "/tmp/runs",
    });

    const data = parseResult(result) as { status: string };
    expect(data.status).toBe("error");

    expect(mockedCommitEffectResult).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          status: "error",
          error: { name: "Error", message: "oops" },
        }),
      })
    );
  });

  it("uses default error payload when error string is omitted", async () => {
    mockedCommitEffectResult.mockResolvedValue({
      resultRef: "tasks/eff-1/result.json",
    } as Awaited<ReturnType<typeof commitEffectResult>>);

    const handler = getToolHandler(server, "task_post");
    await handler({
      runId: "01POST",
      effectId: "eff-1",
      status: "error",
      runsDir: "/tmp/runs",
    });

    expect(mockedCommitEffectResult).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          status: "error",
          error: { name: "Error", message: "Task reported failure" },
        }),
      })
    );
  });

  it("returns error for invalid JSON in value", async () => {
    const handler = getToolHandler(server, "task_post");
    const result = await handler({
      runId: "01POST",
      effectId: "eff-1",
      status: "ok",
      value: "not-json",
      runsDir: "/tmp/runs",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("Invalid JSON in value");
  });

  it("returns error for invalid JSON in error parameter", async () => {
    const handler = getToolHandler(server, "task_post");
    const result = await handler({
      runId: "01POST",
      effectId: "eff-1",
      status: "error",
      error: "{bad-json",
      runsDir: "/tmp/runs",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("Invalid JSON in error");
  });
});
