/**
 * Tests for the wiring between invokeHarness and the adapters bridge.
 *
 * External harnesses are routed through adapters exclusively.
 * Pi remains direct; agent-core/internal route through create-run orchestration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AgentMuxClient, AgentMuxRunHandle, AmuxAgentEvent, AmuxInteractionChannel } from "../agentMuxTypes";

// ---------------------------------------------------------------------------
// Mock modules before importing the code under test
// ---------------------------------------------------------------------------

// Mock the agentMuxClientFactory
vi.mock("../agentMuxClientFactory", () => ({
  getAgentMuxClient: vi.fn().mockResolvedValue(null),
}));

// Mock the agentMuxBridge
vi.mock("../agentMuxBridge", () => ({
  invokeViaAgentMux: vi.fn(),
}));

// Mock create-run orchestration so agent-core invoke does not start a real run.
vi.mock("../../internal/createRun", () => ({
  handleHarnessCreateRun: vi.fn().mockImplementation(async () => {
    process.stdout.write("orchestrated-output");
    return 0;
  }),
}));

// Mock the babysitter-sdk checkCliAvailable so the direct path doesn't
// actually probe the filesystem
vi.mock("@a5c-ai/babysitter-sdk", () => {
  class BabysitterRuntimeError extends Error {
    constructor(name: string, message: string, public details?: unknown) {
      super(message);
      this.name = name;
    }
  }
  return {
    BabysitterRuntimeError,
    ErrorCategory: {
      Configuration: "configuration",
      External: "external",
      Runtime: "runtime",
      Validation: "validation",
    },
    checkCliAvailable: vi.fn().mockResolvedValue({ available: true, path: "/usr/bin/pi" }),
  };
});

// Mock child_process so the direct path doesn't actually spawn
vi.mock("node:child_process", () => ({
  execFile: vi.fn((_cmd: string, _args: string[], _opts: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
    cb(null, "direct-output", "");
    return { pid: 12345, stdin: null };
  }),
  spawn: vi.fn(),
}));

// Mock agent-core
vi.mock("@a5c-ai/genty-core", () => ({
  createAgentCoreSession: vi.fn().mockReturnValue({
    prompt: vi.fn().mockResolvedValue({
      output: "pi-output",
      duration: 100,
      success: true,
      exitCode: 0,
    }),
    dispose: vi.fn(),
  }),
}));

// Mock processControl
vi.mock("../../invoker/processControl", () => ({
  trackChild: vi.fn(),
  untrackChild: vi.fn(),
  cancelRunningProcess: vi.fn(),
}));

// Mock launch
vi.mock("../../invoker/launch", () => ({
  buildLaunchSpec: vi.fn().mockReturnValue({
    command: "pi",
    args: ["--prompt", "test"],
    shell: false,
  }),
}));

import { invokeHarness } from "../../invoker";
import { getAgentMuxClient } from "../agentMuxClientFactory";
import { invokeViaAgentMux } from "../agentMuxBridge";
import { handleHarnessCreateRun } from "../../internal/createRun";
import { createAgentCoreSession } from "@a5c-ai/genty-core";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockAgentMuxClient(output = "adapters-output"): AgentMuxClient {
  async function* emptyStream(): AsyncGenerator<AmuxAgentEvent> {
    yield {
      type: "text_delta",
      runId: "run-1",
      agent: "claude",
      timestamp: new Date().toISOString(),
      text: output,
    };
  }
  const interactions: AmuxInteractionChannel = {
    respond: vi.fn().mockResolvedValue(undefined),
  };
  const handle: AgentMuxRunHandle = {
    events: emptyStream(),
    interactions,
    sessionId: "s-1",
    exitCode: 0,
    abort: vi.fn(),
  };
  return {
    run: vi.fn().mockReturnValue(handle),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("invokeHarness adapters wiring", () => {
  it("routes external harnesses through adapters exclusively", async () => {
    const mockClient = createMockAgentMuxClient();
    vi.mocked(getAgentMuxClient).mockResolvedValue(mockClient);
    vi.mocked(invokeViaAgentMux).mockResolvedValue({
      success: true,
      output: "adapters-result",
      exitCode: 0,
      duration: 42,
      harness: "claude-code",
      sessionId: "s-1",
      totalCost: 0,
      events: [],
      lastMessage: "adapters-result",
    });

    const result = await invokeHarness("claude-code", {
      prompt: "test prompt",
    });

    expect(getAgentMuxClient).toHaveBeenCalledOnce();
    expect(invokeViaAgentMux).toHaveBeenCalledOnce();
    expect(invokeViaAgentMux).toHaveBeenCalledWith(
      mockClient,
      "claude-code",
      expect.objectContaining({ prompt: "test prompt" }),
    );
    expect(result.output).toBe("adapters-result");
  });

  it("throws for unknown harness without adapters adapter", async () => {
    await expect(
      invokeHarness("unknown-harness", { prompt: "test" }),
    ).rejects.toThrow(/No adapters adapter/);

    expect(getAgentMuxClient).not.toHaveBeenCalled();
    expect(invokeViaAgentMux).not.toHaveBeenCalled();
  });

  it("uses direct invocation for pi harness even when adapters is available", async () => {
    const mockClient = createMockAgentMuxClient();
    vi.mocked(getAgentMuxClient).mockResolvedValue(mockClient);

    const result = await invokeHarness("pi", {
      prompt: "test prompt",
    });

    // Should not even check adapters for pi -- goes through direct CLI path
    expect(getAgentMuxClient).not.toHaveBeenCalled();
    expect(invokeViaAgentMux).not.toHaveBeenCalled();
    expect(result.harness).toBe("pi");
  });

  it("routes agent-core harness through create-run orchestration even when adapters is available", async () => {
    const mockClient = createMockAgentMuxClient();
    vi.mocked(getAgentMuxClient).mockResolvedValue(mockClient);

    const result = await invokeHarness("agent-core", {
      prompt: "test prompt",
      workspace: "/tmp/workspace",
      model: "gpt-test",
    });

    expect(getAgentMuxClient).not.toHaveBeenCalled();
    expect(invokeViaAgentMux).not.toHaveBeenCalled();
    expect(createAgentCoreSession).not.toHaveBeenCalled();
    expect(handleHarnessCreateRun).toHaveBeenCalledWith(expect.objectContaining({
      invocationCommand: "invoke",
      prompt: "test prompt",
      harness: "agent-core",
      workspace: "/tmp/workspace",
      model: "gpt-test",
      json: false,
      verbose: false,
      interactive: false,
    }));
    expect(result.harness).toBe("agent-core");
    expect(result.output).toBe("orchestrated-output");
  });

  it("routes internal harness alias through create-run orchestration even when adapters is available", async () => {
    const mockClient = createMockAgentMuxClient();
    vi.mocked(getAgentMuxClient).mockResolvedValue(mockClient);

    const result = await invokeHarness("internal", {
      prompt: "test prompt",
    });

    expect(getAgentMuxClient).not.toHaveBeenCalled();
    expect(invokeViaAgentMux).not.toHaveBeenCalled();
    expect(createAgentCoreSession).not.toHaveBeenCalled();
    expect(handleHarnessCreateRun).toHaveBeenCalledWith(expect.objectContaining({
      invocationCommand: "invoke",
      prompt: "test prompt",
      harness: "agent-core",
    }));
    expect(result.harness).toBe("agent-core");
    expect(result.output).toBe("orchestrated-output");
  });

  it("routes codex through adapters", async () => {
    const mockClient = createMockAgentMuxClient();
    vi.mocked(getAgentMuxClient).mockResolvedValue(mockClient);
    vi.mocked(invokeViaAgentMux).mockResolvedValue({
      success: true,
      output: "adapters-codex",
      exitCode: 0,
      duration: 10,
      harness: "codex",
      sessionId: "s-2",
      totalCost: 0,
      events: [],
      lastMessage: "adapters-codex",
    });

    const result = await invokeHarness("codex", {
      prompt: "fix lint",
    });

    expect(invokeViaAgentMux).toHaveBeenCalledOnce();
    expect(result.output).toBe("adapters-codex");
  });
});
