import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fsp from "node:fs/promises";
import { listTasks, readTask, readTaskStdout, readTaskStderr, countTasks } from "../crud";
import type { TaskSummary, TaskDetail } from "../crud";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
}));

const mockReaddir = vi.mocked(fsp.readdir);
const mockStat = vi.mocked(fsp.stat);
const mockReadFile = vi.mocked(fsp.readFile);

describe("listTasks (GAP-TOOLS-014)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists all tasks from a run directory", async () => {
    mockReaddir.mockResolvedValue(["eff-1", "eff-2"] as unknown as Awaited<ReturnType<typeof fsp.readdir>>);
    mockStat.mockResolvedValue({ isDirectory: () => true } as unknown as Awaited<ReturnType<typeof fsp.stat>>);
    mockReadFile.mockImplementation(async (filePath) => {
      const pathStr = String(filePath);
      if (pathStr.includes("eff-1") && pathStr.endsWith("task.json")) {
        return JSON.stringify({ taskId: "t1", kind: "agent", title: "Task 1", labels: ["test"] });
      }
      if (pathStr.includes("eff-2") && pathStr.endsWith("task.json")) {
        return JSON.stringify({ taskId: "t2", kind: "shell", title: "Task 2" });
      }
      if (pathStr.includes("eff-1") && pathStr.endsWith("result.json")) {
        return JSON.stringify({ status: "ok", resolvedAt: "2026-01-01T00:02:00Z" });
      }
      throw new Error("ENOENT");
    });

    const tasks: TaskSummary[] = await listTasks("/fake/run");

    expect(tasks).toHaveLength(2);
    expect(tasks.find((task) => task.taskId === "t1")?.status).toBe("resolved");
    expect(tasks.find((task) => task.taskId === "t2")?.status).toBe("requested");
  });

  it("filters by status", async () => {
    mockReaddir.mockResolvedValue(["eff-1", "eff-2"] as unknown as Awaited<ReturnType<typeof fsp.readdir>>);
    mockStat.mockResolvedValue({ isDirectory: () => true } as unknown as Awaited<ReturnType<typeof fsp.stat>>);
    mockReadFile.mockImplementation(async (filePath) => {
      const pathStr = String(filePath);
      if (pathStr.endsWith("task.json")) {
        return JSON.stringify({ taskId: "t", kind: "agent" });
      }
      if (pathStr.includes("eff-1") && pathStr.endsWith("result.json")) {
        return JSON.stringify({ status: "ok" });
      }
      throw new Error("ENOENT");
    });

    expect(await listTasks("/fake/run", { status: "requested" })).toHaveLength(1);
    expect(await listTasks("/fake/run", { status: "resolved" })).toHaveLength(1);
  });

  it("returns empty for nonexistent tasks dir", async () => {
    mockReaddir.mockRejectedValue(new Error("ENOENT"));
    expect(await listTasks("/fake/run")).toHaveLength(0);
  });
});

describe("readTask (GAP-TOOLS-014)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads task definition and result", async () => {
    mockReadFile.mockImplementation(async (filePath) => {
      const pathStr = String(filePath);
      if (pathStr.endsWith("task.json")) {
        return JSON.stringify({ taskId: "t1", kind: "agent", title: "My Task", labels: ["review"] });
      }
      if (pathStr.endsWith("result.json")) {
        return JSON.stringify({ status: "ok", value: { score: 95 } });
      }
      throw new Error("ENOENT");
    });

    const task: TaskDetail | null = await readTask("/fake/run", "eff-1");

    expect(task).not.toBeNull();
    expect(task?.taskId).toBe("t1");
    expect(task?.kind).toBe("agent");
    expect(task?.status).toBe("resolved");
    expect(task?.definition).toBeDefined();
    expect(task?.result).toBeDefined();
  });

  it("returns null for nonexistent task", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    expect(await readTask("/fake/run", "nonexistent")).toBeNull();
  });

  it("returns requested when there is no result file", async () => {
    mockReadFile.mockImplementation(async (filePath) => {
      const pathStr = String(filePath);
      if (pathStr.endsWith("task.json")) {
        return JSON.stringify({ taskId: "t1", kind: "shell" });
      }
      throw new Error("ENOENT");
    });

    const task = await readTask("/fake/run", "eff-1");
    expect(task?.status).toBe("requested");
    expect(task?.result).toBeUndefined();
  });
});

describe("readTaskStdout / readTaskStderr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads stdout content", async () => {
    mockReadFile.mockResolvedValue("output line 1\noutput line 2");
    expect(await readTaskStdout("/fake/run", "eff-1")).toBe("output line 1\noutput line 2");
  });

  it("returns null when stdout missing", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    expect(await readTaskStdout("/fake/run", "eff-1")).toBeNull();
  });

  it("reads stderr content", async () => {
    mockReadFile.mockResolvedValue("error output");
    expect(await readTaskStderr("/fake/run", "eff-1")).toBe("error output");
  });
});

describe("countTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts tasks by status", async () => {
    mockReaddir.mockResolvedValue(["eff-1", "eff-2", "eff-3"] as unknown as Awaited<ReturnType<typeof fsp.readdir>>);
    mockStat.mockResolvedValue({ isDirectory: () => true } as unknown as Awaited<ReturnType<typeof fsp.stat>>);
    mockReadFile.mockImplementation(async (filePath) => {
      const pathStr = String(filePath);
      if (pathStr.endsWith("task.json")) {
        return JSON.stringify({ taskId: "t", kind: "agent" });
      }
      if ((pathStr.includes("eff-1") || pathStr.includes("eff-2")) && pathStr.endsWith("result.json")) {
        return JSON.stringify({ status: "ok" });
      }
      throw new Error("ENOENT");
    });

    const counts = await countTasks("/fake/run");
    expect(counts.total).toBe(3);
    expect(counts.resolved).toBe(2);
    expect(counts.requested).toBe(1);
  });
});
