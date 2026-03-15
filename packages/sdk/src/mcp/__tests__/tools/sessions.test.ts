import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSessionTools } from "../../tools/sessions";

vi.mock("../../../session", () => ({
  readSessionFile: vi.fn(),
  sessionFileExists: vi.fn(),
  getSessionFilePath: vi.fn(),
  writeSessionFile: vi.fn(),
  getCurrentTimestamp: vi.fn(),
}));

vi.mock("../../../storage", () => ({
  loadJournal: vi.fn(),
}));

import {
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
  getCurrentTimestamp,
} from "../../../session";
import { loadJournal } from "../../../storage";

const mockedReadSessionFile = vi.mocked(readSessionFile);
const mockedSessionFileExists = vi.mocked(sessionFileExists);
const mockedGetSessionFilePath = vi.mocked(getSessionFilePath);
const mockedWriteSessionFile = vi.mocked(writeSessionFile);
const mockedGetCurrentTimestamp = vi.mocked(getCurrentTimestamp);
const mockedLoadJournal = vi.mocked(loadJournal);

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
  registerSessionTools(server);
  mockedGetCurrentTimestamp.mockReturnValue("2026-03-15T12:00:00Z");
});

describe("session_init", () => {
  it("creates a new session state file", async () => {
    const filePath = "/tmp/sessions/sess-1.md";
    mockedGetSessionFilePath.mockReturnValue(filePath);
    mockedSessionFileExists.mockResolvedValue(false);
    mockedWriteSessionFile.mockResolvedValue(undefined);

    const handler = getToolHandler(server, "session_init");
    const result = await handler({
      sessionId: "sess-1",
      stateDir: "/tmp/sessions",
    });

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { stateFile: string; iteration: number; maxIterations: number };
    expect(data.stateFile).toBe(filePath);
    expect(data.iteration).toBe(1);
    expect(data.maxIterations).toBe(256);

    expect(mockedWriteSessionFile).toHaveBeenCalledWith(
      filePath,
      expect.objectContaining({
        active: true,
        iteration: 1,
        maxIterations: 256,
        runId: "",
      }),
      ""
    );
  });

  it("accepts custom maxIterations and runId", async () => {
    mockedGetSessionFilePath.mockReturnValue("/tmp/s/sess-2.md");
    mockedSessionFileExists.mockResolvedValue(false);
    mockedWriteSessionFile.mockResolvedValue(undefined);

    const handler = getToolHandler(server, "session_init");
    const result = await handler({
      sessionId: "sess-2",
      stateDir: "/tmp/s",
      maxIterations: 50,
      runId: "run-abc",
    });

    const data = parseResult(result) as { maxIterations: number; runId: string };
    expect(data.maxIterations).toBe(50);
    expect(data.runId).toBe("run-abc");
  });

  it("rejects when session already exists with a run", async () => {
    mockedGetSessionFilePath.mockReturnValue("/tmp/s/sess-3.md");
    mockedSessionFileExists.mockResolvedValue(true);
    mockedReadSessionFile.mockResolvedValue({
      state: { active: true, iteration: 5, maxIterations: 256, runId: "existing-run", startedAt: "", lastIterationAt: "", iterationTimes: [] },
      prompt: "",
    });

    const handler = getToolHandler(server, "session_init");
    const result = await handler({
      sessionId: "sess-3",
      stateDir: "/tmp/s",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("already associated with run");
  });

  it("rejects when session file exists but has no run", async () => {
    mockedGetSessionFilePath.mockReturnValue("/tmp/s/sess-4.md");
    mockedSessionFileExists.mockResolvedValue(true);
    mockedReadSessionFile.mockResolvedValue({
      state: { active: true, iteration: 1, maxIterations: 256, runId: "", startedAt: "", lastIterationAt: "", iterationTimes: [] },
      prompt: "",
    });

    const handler = getToolHandler(server, "session_init");
    const result = await handler({
      sessionId: "sess-4",
      stateDir: "/tmp/s",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("already active");
  });
});

describe("session_associate", () => {
  it("associates a session with a run", async () => {
    const filePath = "/tmp/s/sess-5.md";
    mockedGetSessionFilePath.mockReturnValue(filePath);
    mockedReadSessionFile.mockResolvedValue({
      state: { active: true, iteration: 1, maxIterations: 256, runId: "", startedAt: "", lastIterationAt: "", iterationTimes: [] },
      prompt: "test prompt",
    });
    mockedWriteSessionFile.mockResolvedValue(undefined);

    const handler = getToolHandler(server, "session_associate");
    const result = await handler({
      sessionId: "sess-5",
      stateDir: "/tmp/s",
      runId: "run-xyz",
    });

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { runId: string };
    expect(data.runId).toBe("run-xyz");

    expect(mockedWriteSessionFile).toHaveBeenCalledWith(
      filePath,
      expect.objectContaining({ runId: "run-xyz" }),
      "test prompt"
    );
  });

  it("rejects when session already has a run", async () => {
    mockedGetSessionFilePath.mockReturnValue("/tmp/s/sess-6.md");
    mockedReadSessionFile.mockResolvedValue({
      state: { active: true, iteration: 1, maxIterations: 256, runId: "old-run", startedAt: "", lastIterationAt: "", iterationTimes: [] },
      prompt: "",
    });

    const handler = getToolHandler(server, "session_associate");
    const result = await handler({
      sessionId: "sess-6",
      stateDir: "/tmp/s",
      runId: "new-run",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("already associated");
  });

  it("returns error when no session file exists", async () => {
    mockedGetSessionFilePath.mockReturnValue("/tmp/s/sess-7.md");
    mockedReadSessionFile.mockRejectedValue(new Error("ENOENT"));

    const handler = getToolHandler(server, "session_associate");
    const result = await handler({
      sessionId: "sess-7",
      stateDir: "/tmp/s",
      runId: "run-abc",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("No active session");
  });
});

describe("session_state", () => {
  it("returns session state when file exists", async () => {
    const filePath = "/tmp/s/sess-8.md";
    mockedGetSessionFilePath.mockReturnValue(filePath);
    mockedSessionFileExists.mockResolvedValue(true);
    mockedReadSessionFile.mockResolvedValue({
      state: { active: true, iteration: 3, maxIterations: 100, runId: "run-1", startedAt: "t1", lastIterationAt: "t2", iterationTimes: [500, 600] },
      prompt: "do stuff",
    });

    const handler = getToolHandler(server, "session_state");
    const result = await handler({
      sessionId: "sess-8",
      stateDir: "/tmp/s",
    });

    const data = parseResult(result) as { found: boolean; state: { iteration: number }; prompt: string };
    expect(data.found).toBe(true);
    expect(data.state.iteration).toBe(3);
    expect(data.prompt).toBe("do stuff");
  });

  it("returns found: false when no session exists", async () => {
    mockedGetSessionFilePath.mockReturnValue("/tmp/s/sess-9.md");
    mockedSessionFileExists.mockResolvedValue(false);

    const handler = getToolHandler(server, "session_state");
    const result = await handler({
      sessionId: "sess-9",
      stateDir: "/tmp/s",
    });

    const data = parseResult(result) as { found: boolean };
    expect(data.found).toBe(false);
  });
});

describe("session_resume", () => {
  it("resumes a waiting run in a new session", async () => {
    const filePath = "/tmp/s/sess-10.md";
    mockedGetSessionFilePath.mockReturnValue(filePath);
    mockedWriteSessionFile.mockResolvedValue(undefined);
    mockedLoadJournal.mockResolvedValue([
      { seq: 1, type: "RUN_CREATED", recordedAt: "t1", data: {}, checksum: "a" },
      { seq: 2, type: "EFFECT_REQUESTED", recordedAt: "t2", data: { effectId: "e1" }, checksum: "b" },
    ] as Awaited<ReturnType<typeof loadJournal>>);

    const handler = getToolHandler(server, "session_resume");
    const result = await handler({
      sessionId: "sess-10",
      stateDir: "/tmp/s",
      runId: "run-resume",
      runsDir: "/tmp/runs",
    });

    const data = parseResult(result) as { runId: string; runState: string };
    expect(data.runId).toBe("run-resume");
    expect(data.runState).toBe("waiting");
  });

  it("rejects resuming a completed run", async () => {
    mockedGetSessionFilePath.mockReturnValue("/tmp/s/sess-11.md");
    mockedLoadJournal.mockResolvedValue([
      { seq: 1, type: "RUN_CREATED", recordedAt: "t1", data: {}, checksum: "a" },
      { seq: 2, type: "RUN_COMPLETED", recordedAt: "t2", data: {}, checksum: "b" },
    ] as Awaited<ReturnType<typeof loadJournal>>);

    const handler = getToolHandler(server, "session_resume");
    const result = await handler({
      sessionId: "sess-11",
      stateDir: "/tmp/s",
      runId: "run-done",
      runsDir: "/tmp/runs",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("already completed");
  });

  it("returns error when run not found", async () => {
    mockedGetSessionFilePath.mockReturnValue("/tmp/s/sess-12.md");
    mockedLoadJournal.mockRejectedValue(new Error("ENOENT"));

    const handler = getToolHandler(server, "session_resume");
    const result = await handler({
      sessionId: "sess-12",
      stateDir: "/tmp/s",
      runId: "missing-run",
      runsDir: "/tmp/runs",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toContain("Run not found");
  });
});
