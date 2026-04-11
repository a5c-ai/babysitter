import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRunTools } from "../../tools/runs";

// Mock the SDK functions
vi.mock("../../../runtime", () => ({
  createRun: vi.fn(),
  orchestrateIteration: vi.fn(),
}));

vi.mock("../../../storage", () => ({
  loadJournal: vi.fn(),
  readRunMetadata: vi.fn(),
}));

vi.mock("../../../runtime/replay/stateCache", () => ({
  rebuildStateCache: vi.fn(),
}));

vi.mock("../../../api/runs", () => ({
  apiRunStatus: vi.fn(),
  apiRunEvents: vi.fn(),
}));

import {
  createRun,
  orchestrateIteration,
} from "../../../runtime";
import {
  readRunMetadata,
} from "../../../storage";
import { rebuildStateCache } from "../../../runtime/replay/stateCache";
import { apiRunStatus, apiRunEvents } from "../../../api/runs";

const mockedCreateRun = vi.mocked(createRun);
const mockedReadRunMetadata = vi.mocked(readRunMetadata);
const mockedOrchestrateIteration = vi.mocked(orchestrateIteration);
const mockedRebuildStateCache = vi.mocked(rebuildStateCache);
const mockedApiRunStatus = vi.mocked(apiRunStatus);
const mockedApiRunEvents = vi.mocked(apiRunEvents);

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
  registerRunTools(server);
});

describe("run_create", () => {
  it("creates a run and returns runId and runDir", async () => {
    mockedCreateRun.mockResolvedValue({
      runId: "01TEST",
      runDir: "/tmp/runs/01TEST",
    } as ReturnType<typeof createRun> extends Promise<infer T> ? T : never);

    const handler = getToolHandler(server, "run_create");
    const result = await handler({
      processId: "test/process",
      entrypoint: "/tmp/process.js",
      runsDir: "/tmp/runs",
    });

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { runId: string; runDir: string };
    expect(data.runId).toBe("01TEST");
    expect(data.runDir).toBe("/tmp/runs/01TEST");
  });

  it("parses entrypoint with hash export name", async () => {
    mockedCreateRun.mockResolvedValue({
      runId: "01HASH",
      runDir: "/tmp/runs/01HASH",
    } as ReturnType<typeof createRun> extends Promise<infer T> ? T : never);

    const handler = getToolHandler(server, "run_create");
    await handler({
      processId: "test/process",
      entrypoint: "/tmp/process.js#myExport",
      runsDir: "/tmp/runs",
    });

    expect(mockedCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({
        process: expect.objectContaining({
          exportName: "myExport",
        }),
      })
    );
  });

  it("parses JSON inputs", async () => {
    mockedCreateRun.mockResolvedValue({
      runId: "01INPUT",
      runDir: "/tmp/runs/01INPUT",
    } as ReturnType<typeof createRun> extends Promise<infer T> ? T : never);

    const handler = getToolHandler(server, "run_create");
    await handler({
      processId: "test/process",
      entrypoint: "/tmp/process.js",
      inputs: '{"key": "value"}',
      runsDir: "/tmp/runs",
    });

    expect(mockedCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: { key: "value" },
      })
    );
  });

  it("returns error for invalid JSON inputs", async () => {
    const handler = getToolHandler(server, "run_create");
    const result = await handler({
      processId: "test/process",
      entrypoint: "/tmp/process.js",
      inputs: "not-json{",
      runsDir: "/tmp/runs",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("Invalid JSON");
  });

  it("returns error when createRun throws", async () => {
    mockedCreateRun.mockRejectedValue(new Error("Disk full"));

    const handler = getToolHandler(server, "run_create");
    const result = await handler({
      processId: "test/process",
      entrypoint: "/tmp/process.js",
      runsDir: "/tmp/runs",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toBe("Disk full");
  });
});

describe("run_status", () => {
  it("returns status for a created run with no effects", async () => {
    mockedApiRunStatus.mockResolvedValue({
      ok: true,
      data: {
        runId: "01STATUS",
        processId: "test/process",
        state: "created",
        pendingEffects: [],
      },
    });

    const handler = getToolHandler(server, "run_status");
    const result = await handler({ runId: "01STATUS", runsDir: "/tmp/runs" });

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { state: string; pendingEffects: unknown[] };
    expect(data.state).toBe("created");
    expect(data.pendingEffects).toEqual([]);
  });

  it("returns 'waiting' when there are pending effects", async () => {
    mockedApiRunStatus.mockResolvedValue({
      ok: true,
      data: {
        runId: "01WAIT",
        processId: "test/process",
        state: "waiting",
        pendingEffects: [{ effectId: "eff-1", kind: "node" }],
      },
    });

    const handler = getToolHandler(server, "run_status");
    const result = await handler({ runId: "01WAIT", runsDir: "/tmp/runs" });

    const data = parseResult(result) as {
      state: string;
      pendingEffects: Array<{ effectId: string }>;
    };
    expect(data.state).toBe("waiting");
    expect(data.pendingEffects).toHaveLength(1);
    expect(data.pendingEffects[0].effectId).toBe("eff-1");
  });

  it("returns 'completed' when run has completed", async () => {
    mockedApiRunStatus.mockResolvedValue({
      ok: true,
      data: {
        runId: "01DONE",
        processId: "test/process",
        state: "completed",
        pendingEffects: [],
      },
    });

    const handler = getToolHandler(server, "run_status");
    const result = await handler({ runId: "01DONE", runsDir: "/tmp/runs" });

    const data = parseResult(result) as { state: string };
    expect(data.state).toBe("completed");
  });

  it("returns 'failed' when run has failed", async () => {
    mockedApiRunStatus.mockResolvedValue({
      ok: true,
      data: {
        runId: "01FAIL",
        processId: "test/process",
        state: "failed",
        pendingEffects: [],
      },
    });

    const handler = getToolHandler(server, "run_status");
    const result = await handler({ runId: "01FAIL", runsDir: "/tmp/runs" });

    const data = parseResult(result) as { state: string };
    expect(data.state).toBe("failed");
  });

  it("returns error when run not found", async () => {
    mockedApiRunStatus.mockResolvedValue({
      ok: false,
      error: { code: "RUN_NOT_FOUND", message: "Run not found: nonexistent" },
    });

    const handler = getToolHandler(server, "run_status");
    const result = await handler({ runId: "nonexistent", runsDir: "/tmp/runs" });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toBe("Run not found: nonexistent");
  });
});

describe("run_events", () => {
  it("returns all journal events", async () => {
    mockedApiRunEvents.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { seq: 1, type: "RUN_CREATED", recordedAt: "2026-01-01T00:00:00Z", data: { runId: "01EVENTS" } },
          { seq: 2, type: "EFFECT_REQUESTED", recordedAt: "2026-01-01T00:00:01Z", data: { effectId: "eff-1" } },
        ],
      },
    });

    const handler = getToolHandler(server, "run_events");
    const result = await handler({ runId: "01EVENTS", runsDir: "/tmp/runs" });

    const data = parseResult(result) as { total: number; events: unknown[] };
    expect(data.total).toBe(2);
    expect(data.events).toHaveLength(2);
  });

  it("filters events by type (delegates to API)", async () => {
    mockedApiRunEvents.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { seq: 2, type: "EFFECT_REQUESTED", recordedAt: "2026-01-01T00:00:01Z", data: { effectId: "eff-1" } },
          { seq: 3, type: "EFFECT_REQUESTED", recordedAt: "2026-01-01T00:00:02Z", data: { effectId: "eff-2" } },
        ],
      },
    });

    const handler = getToolHandler(server, "run_events");
    const result = await handler({
      runId: "01EVENTS",
      runsDir: "/tmp/runs",
      filterType: "EFFECT_REQUESTED",
    });

    const data = parseResult(result) as { total: number; showing: number; events: unknown[] };
    expect(data.total).toBe(2);
    expect(data.showing).toBe(2);
    expect(data.events).toHaveLength(2);
  });

  it("applies reverse (limit is delegated to API)", async () => {
    mockedApiRunEvents.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { seq: 2, type: "EFFECT_REQUESTED", recordedAt: "t2", data: { effectId: "e1" } },
          { seq: 3, type: "EFFECT_RESOLVED", recordedAt: "t3", data: { effectId: "e1" } },
        ],
      },
    });

    const handler = getToolHandler(server, "run_events");
    const result = await handler({
      runId: "01EVENTS",
      runsDir: "/tmp/runs",
      reverse: true,
      limit: 2,
    });

    const data = parseResult(result) as { showing: number; events: Array<{ seq: number }> };
    expect(data.showing).toBe(2);
    expect(data.events[0].seq).toBe(3);
    expect(data.events[1].seq).toBe(2);
  });

  it("returns error when run not found", async () => {
    mockedApiRunEvents.mockResolvedValue({
      ok: false,
      error: { code: "RUN_NOT_FOUND", message: "Run not found: nonexistent" },
    });

    const handler = getToolHandler(server, "run_events");
    const result = await handler({ runId: "nonexistent", runsDir: "/tmp/runs" });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toBe("Run not found: nonexistent");
  });
});

describe("run_iterate", () => {
  it("returns completed status with output", async () => {
    mockedOrchestrateIteration.mockResolvedValue({
      status: "completed",
      output: { result: "done" },
      metadata: {},
    } as Awaited<ReturnType<typeof orchestrateIteration>>);

    mockedReadRunMetadata.mockResolvedValue({
      completionProof: "proof-123",
    } as Awaited<ReturnType<typeof readRunMetadata>>);

    const handler = getToolHandler(server, "run_iterate");
    const result = await handler({ runId: "01ITER", runsDir: "/tmp/runs" });

    const data = parseResult(result) as { status: string; completionProof: string };
    expect(data.status).toBe("completed");
    expect(data.completionProof).toBe("proof-123");
  });

  it("returns waiting status with next actions", async () => {
    mockedOrchestrateIteration.mockResolvedValue({
      status: "waiting",
      nextActions: [
        { effectId: "e1", kind: "node", label: "Build", labels: [], taskId: "t1", stepId: "S000001" },
      ],
      metadata: {},
    } as Awaited<ReturnType<typeof orchestrateIteration>>);

    const handler = getToolHandler(server, "run_iterate");
    const result = await handler({ runId: "01ITER", runsDir: "/tmp/runs" });

    const data = parseResult(result) as {
      status: string;
      nextActions: Array<{ effectId: string; kind: string }>;
    };
    expect(data.status).toBe("waiting");
    expect(data.nextActions).toHaveLength(1);
    expect(data.nextActions[0].effectId).toBe("e1");
  });

  it("returns failed status with error message", async () => {
    mockedOrchestrateIteration.mockResolvedValue({
      status: "failed",
      error: new Error("Process crashed"),
      metadata: {},
    } as Awaited<ReturnType<typeof orchestrateIteration>>);

    const handler = getToolHandler(server, "run_iterate");
    const result = await handler({ runId: "01ITER", runsDir: "/tmp/runs" });

    const data = parseResult(result) as { status: string; error: string };
    expect(data.status).toBe("failed");
    expect(data.error).toBe("Process crashed");
  });
});

describe("run_rebuild_state", () => {
  it("rebuilds state and returns snapshot info", async () => {
    mockedRebuildStateCache.mockResolvedValue({
      stateVersion: 5,
      journalHead: { seq: 5, ulid: "01ABC" },
    } as Awaited<ReturnType<typeof rebuildStateCache>>);

    const handler = getToolHandler(server, "run_rebuild_state");
    const result = await handler({ runId: "01REBUILD", runsDir: "/tmp/runs" });

    const data = parseResult(result) as { success: boolean; stateVersion: number };
    expect(data.success).toBe(true);
    expect(data.stateVersion).toBe(5);
  });

  it("returns error when rebuild fails", async () => {
    mockedRebuildStateCache.mockRejectedValue(new Error("Corrupt journal"));

    const handler = getToolHandler(server, "run_rebuild_state");
    const result = await handler({ runId: "01BAD", runsDir: "/tmp/runs" });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toBe("Corrupt journal");
  });
});
