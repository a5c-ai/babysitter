import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RunHandle } from "@a5c-ai/genty-platform/orchestration";

// Mock the babysitter-sdk
vi.mock("@a5c-ai/babysitter-sdk", () => ({
  resolveRunsDir: vi.fn(() => "/mock/runs"),
  createRun: vi.fn(async () => ({
    runId: "01MOCK_RUN_ID",
    runDir: "/mock/runs/01MOCK_RUN_ID",
    metadata: {
      runId: "01MOCK_RUN_ID",
      processId: "test-process",
      request: "test-process",
      entrypoint: { importPath: "./process.ts" },
      layoutVersion: "2",
      createdAt: "2026-06-03T00:00:00Z",
    },
  })),
  loadJournal: vi.fn(async () => [
    {
      seq: 1,
      ulid: "01MOCK_ULID_1",
      filename: "000001.01MOCK_ULID_1.json",
      path: "/mock/runs/01MOCK_RUN_ID/journal/000001.01MOCK_ULID_1.json",
      type: "RUN_CREATED",
      recordedAt: "2026-06-03T00:00:00Z",
      data: { runId: "01MOCK_RUN_ID", processId: "test-process" },
    },
    {
      seq: 2,
      ulid: "01MOCK_ULID_2",
      filename: "000002.01MOCK_ULID_2.json",
      path: "/mock/runs/01MOCK_RUN_ID/journal/000002.01MOCK_ULID_2.json",
      type: "ITERATION_EXECUTED",
      recordedAt: "2026-06-03T00:00:01Z",
      data: { iteration: 1 },
    },
  ]),
  readRunMetadata: vi.fn(async () => ({
    runId: "01MOCK_RUN_ID",
    processId: "test-process",
    request: "test-process",
    entrypoint: { importPath: "./process.ts" },
    layoutVersion: "2",
    createdAt: "2026-06-03T00:00:00Z",
  })),
}));

// Mock child_process for CLI calls
vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(() =>
    JSON.stringify({
      iteration: 1,
      status: "waiting",
      action: "effect_requested",
      reason: "agent effect pending",
      pendingEffects: [
        {
          effectId: "eff-001",
          kind: "agent",
          label: "code-review",
          status: "requested",
          taskDef: { tool: "review" },
        },
      ],
    }),
  ),
}));

import { BabysitterOrchestrationProvider } from "../provider";
import { resolveRunsDir, createRun, loadJournal } from "@a5c-ai/babysitter-sdk";

describe("BabysitterOrchestrationProvider", () => {
  let provider: BabysitterOrchestrationProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new BabysitterOrchestrationProvider();
  });

  it("has the correct name", () => {
    expect(provider.name).toBe("babysitter");
  });

  describe("resolveRunsDir", () => {
    it("delegates to babysitter-sdk resolveRunsDir", () => {
      const result = provider.resolveRunsDir({ cwd: "/test/dir" });
      expect(resolveRunsDir).toHaveBeenCalledWith({ cwd: "/test/dir" });
      expect(result).toBe("/mock/runs");
    });

    it("works without options", () => {
      const result = provider.resolveRunsDir();
      expect(resolveRunsDir).toHaveBeenCalledWith({ cwd: undefined });
      expect(result).toBe("/mock/runs");
    });
  });

  describe("createRun", () => {
    it("returns a valid RunHandle", async () => {
      const handle = await provider.createRun({
        processId: "test-process",
        entrypoint: "./process.ts",
        prompt: "do the thing",
      });

      expect(createRun).toHaveBeenCalledWith(
        expect.objectContaining({
          process: {
            processId: "test-process",
            importPath: "./process.ts",
            exportName: undefined,
          },
          prompt: "do the thing",
        }),
      );

      expect(handle).toEqual({
        runId: "01MOCK_RUN_ID",
        runDir: "/mock/runs/01MOCK_RUN_ID",
        processId: "test-process",
        status: "pending",
      });
    });

    it("passes harness and inputs through", async () => {
      await provider.createRun({
        processId: "my-proc",
        entrypoint: "./my-proc.ts",
        prompt: "hello",
        harness: "claude-code",
        inputs: { key: "value" },
      });

      expect(createRun).toHaveBeenCalledWith(
        expect.objectContaining({
          harness: "claude-code",
          inputs: { key: "value" },
        }),
      );
    });
  });

  describe("iterateRun", () => {
    it("parses CLI output into IterationResult", async () => {
      const handle: RunHandle = {
        runId: "01MOCK_RUN_ID",
        runDir: "/mock/runs/01MOCK_RUN_ID",
        processId: "test-process",
        status: "running",
      };

      const result = await provider.iterateRun(handle, 1);

      expect(result).toEqual({
        iteration: 1,
        status: "waiting",
        action: "effect_requested",
        reason: "agent effect pending",
        pendingEffects: [
          {
            effectId: "eff-001",
            kind: "agent",
            label: "code-review",
            status: "requested",
            taskDef: { tool: "review" },
          },
        ],
        completionProof: undefined,
      });
    });
  });

  describe("getRunStatus", () => {
    it("derives status from journal events", async () => {
      const handle: RunHandle = {
        runId: "01MOCK_RUN_ID",
        runDir: "/mock/runs/01MOCK_RUN_ID",
        processId: "test-process",
        status: "pending",
      };

      const result = await provider.getRunStatus(handle);

      expect(result.status).toBe("running");
      expect(result.processId).toBe("test-process");
    });
  });

  describe("getRunEvents", () => {
    it("maps journal events to RunEvent[]", async () => {
      const handle: RunHandle = {
        runId: "01MOCK_RUN_ID",
        runDir: "/mock/runs/01MOCK_RUN_ID",
        processId: "test-process",
        status: "running",
      };

      const events = await provider.getRunEvents(handle);

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({
        type: "RUN_CREATED",
        timestamp: "2026-06-03T00:00:00Z",
        data: { runId: "01MOCK_RUN_ID", processId: "test-process" },
      });
    });

    it("respects limit option", async () => {
      const handle: RunHandle = {
        runId: "01MOCK_RUN_ID",
        runDir: "/mock/runs/01MOCK_RUN_ID",
        processId: "test-process",
        status: "running",
      };

      const events = await provider.getRunEvents(handle, { limit: 1 });
      expect(events).toHaveLength(1);
    });

    it("respects reverse option", async () => {
      const handle: RunHandle = {
        runId: "01MOCK_RUN_ID",
        runDir: "/mock/runs/01MOCK_RUN_ID",
        processId: "test-process",
        status: "running",
      };

      const events = await provider.getRunEvents(handle, { reverse: true });
      expect(events[0].type).toBe("ITERATION_EXECUTED");
      expect(events[1].type).toBe("RUN_CREATED");
    });
  });
});
