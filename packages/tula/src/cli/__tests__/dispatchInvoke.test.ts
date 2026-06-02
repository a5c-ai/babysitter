import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@a5c-ai/tula-platform/harness", () => ({
  invokeHarness: vi.fn().mockResolvedValue({
    success: true,
    output: "external-output",
    exitCode: 0,
    duration: 1,
    harness: "codex",
  }),
  detectCallerHarness: vi.fn(),
  discoverHarnesses: vi.fn(),
  normalizeBuiltInHarnessName: vi.fn((name: string) => name === "internal" ? "agent-core" : name),
}));

vi.mock("../../prompts/commandTemplates", () => ({
  renderCommandTemplate: vi.fn(),
}));

vi.mock("../ui", () => ({
  handleUnknownCommand: vi.fn().mockReturnValue(1),
  launchObserver: vi.fn().mockResolvedValue(0),
  readCliVersion: vi.fn().mockResolvedValue("test-version"),
}));

vi.mock("../commands/harness/createRun", () => ({
  handleHarnessCreateRun: vi.fn().mockResolvedValue(0),
}));

vi.mock("../commands/harness/resumeRun", () => ({
  handleHarnessResumeRun: vi.fn().mockResolvedValue(0),
}));

vi.mock("../commands/jsonlInteractive", () => ({
  handleJsonlInteractive: vi.fn().mockResolvedValue(0),
}));

vi.mock("../commands/tui", () => ({
  handleTui: vi.fn().mockResolvedValue(0),
}));

vi.mock("../commands/daemon", () => ({
  handleDaemonRun: vi.fn().mockResolvedValue(0),
  handleDaemonStart: vi.fn().mockResolvedValue(0),
  handleDaemonStatus: vi.fn().mockResolvedValue(0),
  handleDaemonStop: vi.fn().mockResolvedValue(0),
}));

vi.mock("../commands/mcpServe", () => ({
  handleMcpServe: vi.fn().mockResolvedValue(0),
}));

vi.mock("../commands/session/history", () => ({
  handleSessionHistory: vi.fn().mockResolvedValue(0),
}));

import { executeAgentCliCommand } from "../dispatch";
import { invokeHarness } from "@a5c-ai/tula-platform/harness";
import { handleHarnessCreateRun } from "../commands/harness/createRun";

const baseParsed = {
  command: "invoke",
  helpRequested: false,
  helpSurface: "human",
  json: false,
  verbose: false,
  positional: [],
};

describe("tula invoke dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes internal invoke through handleHarnessCreateRun", async () => {
    const code = await executeAgentCliCommand({
      ...baseParsed,
      positional: ["internal"],
      prompt: "list tools",
      workspace: "/tmp/workspace",
      model: "gpt-test",
      outputFormat: "amux-events",
    } as never);

    expect(code).toBe(0);
    expect(invokeHarness).not.toHaveBeenCalled();
    expect(handleHarnessCreateRun).toHaveBeenCalledWith(expect.objectContaining({
      invocationCommand: "invoke",
      prompt: "list tools",
      harness: "agent-core",
      workspace: "/tmp/workspace",
      model: "gpt-test",
      json: false,
      verbose: false,
      interactive: false,
      outputMode: "amux-events",
    }));
  });

  it("keeps external invoke on invokeHarness", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const code = await executeAgentCliCommand({
      ...baseParsed,
      positional: ["codex"],
      prompt: "hello",
      json: true,
    } as never);

    expect(code).toBe(0);
    expect(handleHarnessCreateRun).not.toHaveBeenCalled();
    expect(invokeHarness).toHaveBeenCalledWith("codex", expect.objectContaining({
      prompt: "hello",
    }));
    expect(log).toHaveBeenCalled();
  });
});
