/**
 * Tests for runStatus module (GAP-OBS-001, GAP-UX-005, GAP-UX-006).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRunHealthSnapshot,
  getOrchestrationStatus,
  getPendingWorkItems,
} from "../runStatus";
import type { OrchestrationStatus, PendingWorkItem } from "../runStatus";

// Mock storage modules
vi.mock("@a5c-ai/babysitter-sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@a5c-ai/babysitter-sdk")>();
  return {
    ...actual,
    loadJournal: vi.fn(),
    readRunMetadata: vi.fn(),
  };
});

vi.mock("node:fs", () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

import { loadJournal, readRunMetadata } from "@a5c-ai/babysitter-sdk";
import { promises as fsMock } from "node:fs";

const mockLoadJournal = vi.mocked(loadJournal);
const mockReadRunMetadata = vi.mocked(readRunMetadata);
const mockReadFile = vi.mocked(fsMock.readFile);

function makeEvent(
  seq: number,
  type: string,
  recordedAt: string,
  data: Record<string, unknown> = {},
) {
  return {
    seq,
    ulid: `ULID${seq}`,
    filename: `${seq}.json`,
    path: `/fake/${seq}.json`,
    type,
    recordedAt,
    data,
  };
}

const T0 = "2026-01-01T00:00:00.000Z";
const T1 = "2026-01-01T00:01:00.000Z";
const T2 = "2026-01-01T00:02:00.000Z";
const T3 = "2026-01-01T00:03:00.000Z";

describe("getRunHealthSnapshot (GAP-OBS-001)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads journal and returns health snapshot", async () => {
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
      makeEvent(2, "EFFECT_REQUESTED", T1, { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", T2, { effectId: "e1", status: "ok" }),
      makeEvent(4, "RUN_COMPLETED", T3),
    ]);

    const snapshot = await getRunHealthSnapshot("/fake/run");

    expect(snapshot.status).toBe("healthy");
    expect(snapshot.metrics.totalEffects).toBe(1);
    expect(snapshot.metrics.resolvedEffects).toBe(1);
    expect(mockLoadJournal).toHaveBeenCalledWith("/fake/run");
  });

  it("returns healthy for empty journal", async () => {
    mockLoadJournal.mockResolvedValue([]);

    const snapshot = await getRunHealthSnapshot("/fake/run");

    expect(snapshot.status).toBe("healthy");
    expect(snapshot.metrics.totalEffects).toBe(0);
  });
});

describe("getOrchestrationStatus (GAP-UX-005)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns structured status for a completed run", async () => {
    mockReadRunMetadata.mockResolvedValue({
      runId: "run-1",
      processId: "test-process",
      request: "test-request",
      createdAt: T0,
      layoutVersion: "1",
      entrypoint: { importPath: "test.js#process" },
    });
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
      makeEvent(2, "EFFECT_REQUESTED", T1, { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", T2, { effectId: "e1", status: "ok" }),
      makeEvent(4, "RUN_COMPLETED", T3),
    ]);

    const status: OrchestrationStatus =
      await getOrchestrationStatus("/fake/run");

    expect(status.runId).toBe("run-1");
    expect(status.processId).toBe("test-process");
    expect(status.phase).toBe("completed");
    expect(status.totalEffects).toBe(1);
    expect(status.pendingEffects).toBe(0);
    expect(status.resolvedEffects).toBe(1);
  });

  it("returns waiting phase when effects are pending", async () => {
    mockReadRunMetadata.mockResolvedValue({
      runId: "run-2",
      processId: "test-process",
      request: "test-request",
      createdAt: T0,
      layoutVersion: "1",
      entrypoint: { importPath: "test.js#process" },
    });
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
      makeEvent(2, "EFFECT_REQUESTED", T1, { effectId: "e1" }),
    ]);

    const status = await getOrchestrationStatus("/fake/run");

    expect(status.phase).toBe("waiting");
    expect(status.pendingEffects).toBe(1);
  });

  it("returns failed phase when run failed", async () => {
    mockReadRunMetadata.mockResolvedValue({
      runId: "run-3",
      processId: "test-process",
      request: "test-request",
      createdAt: T0,
      layoutVersion: "1",
      entrypoint: { importPath: "test.js#process" },
    });
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
      makeEvent(2, "RUN_FAILED", T1, { error: "crash" }),
    ]);

    const status = await getOrchestrationStatus("/fake/run");

    expect(status.phase).toBe("failed");
  });

  it("returns created phase for fresh run", async () => {
    mockReadRunMetadata.mockResolvedValue({
      runId: "run-4",
      processId: "test-process",
      request: "test-request",
      createdAt: T0,
      layoutVersion: "1",
      entrypoint: { importPath: "test.js#process" },
    });
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
    ]);

    const status = await getOrchestrationStatus("/fake/run");

    expect(status.phase).toBe("created");
  });
});

describe("getPendingWorkItems (GAP-UX-006)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns pending effects with age", async () => {
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
      makeEvent(2, "EFFECT_REQUESTED", T1, { effectId: "e1" }),
      makeEvent(3, "EFFECT_REQUESTED", T2, { effectId: "e2" }),
    ]);

    const items: PendingWorkItem[] =
      await getPendingWorkItems("/fake/run");

    expect(items).toHaveLength(2);
    expect(items[0].effectId).toBeDefined();
    expect(items[0].ageMs).toBeGreaterThan(0);
  });

  it("excludes resolved effects", async () => {
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
      makeEvent(2, "EFFECT_REQUESTED", T1, { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", T2, { effectId: "e1", status: "ok" }),
      makeEvent(4, "EFFECT_REQUESTED", T2, { effectId: "e2" }),
    ]);

    const items = await getPendingWorkItems("/fake/run");

    expect(items).toHaveLength(1);
    expect(items[0].effectId).toBe("e2");
  });

  it("returns empty for no pending effects", async () => {
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
      makeEvent(2, "EFFECT_REQUESTED", T1, { effectId: "e1" }),
      makeEvent(3, "EFFECT_RESOLVED", T2, { effectId: "e1", status: "ok" }),
    ]);

    const items = await getPendingWorkItems("/fake/run");

    expect(items).toHaveLength(0);
  });

  it("enriches pending items from task.json when available", async () => {
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
      makeEvent(2, "EFFECT_REQUESTED", T1, { effectId: "e1" }),
    ]);

    mockReadFile.mockImplementation(async (p) => {
      const pathStr = String(p);
      if (pathStr.includes("e1") && pathStr.endsWith("task.json")) {
        return JSON.stringify({
          taskId: "my-task",
          kind: "agent",
          title: "Do something",
          labels: ["review", "urgent"],
        });
      }
      throw new Error("ENOENT");
    });

    const items = await getPendingWorkItems("/fake/run");

    expect(items).toHaveLength(1);
    expect(items[0].taskId).toBe("my-task");
    expect(items[0].kind).toBe("agent");
    expect(items[0].title).toBe("Do something");
    expect(items[0].labels).toEqual(["review", "urgent"]);
  });

  it("sorts by age descending (oldest first)", async () => {
    mockLoadJournal.mockResolvedValue([
      makeEvent(1, "RUN_CREATED", T0),
      makeEvent(2, "EFFECT_REQUESTED", T2, { effectId: "newer" }),
      makeEvent(3, "EFFECT_REQUESTED", T1, { effectId: "older" }),
    ]);

    const items = await getPendingWorkItems("/fake/run");

    expect(items).toHaveLength(2);
    expect(items[0].effectId).toBe("older");
    expect(items[1].effectId).toBe("newer");
  });
});
