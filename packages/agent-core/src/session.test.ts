import { afterEach, describe, expect, it, vi } from "vitest";

type MockRunResult = {
  text?: string;
  error?: { message?: string };
  exitReason?: string;
  exitCode?: number;
  sessionId?: string;
};

function createHandle(result: MockRunResult, events: unknown[] = []) {
  const handle = Object.assign(Promise.resolve(result), {
    send: vi.fn(async () => undefined),
    queue: vi.fn(async () => undefined),
    abort: vi.fn(async () => undefined),
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        yield event;
      }
    },
  });

  return handle;
}

async function loadSessionModule(args: {
  handleResult?: MockRunResult;
  events?: unknown[];
}) {
  vi.resetModules();

  const run = vi.fn((_options: Record<string, unknown>) => createHandle(
    args.handleResult ?? { text: "ok", exitReason: "completed", exitCode: 0, sessionId: "session-1" },
    args.events,
  ));
  const createClient = vi.fn(() => ({ run }));
  const registerBuiltInAdapters = vi.fn();

  vi.doMock("@a5c-ai/agent-mux", () => ({
    createClient,
    registerBuiltInAdapters,
  }));

  const sessionModule = await import("./session");
  return { ...sessionModule, createClient, registerBuiltInAdapters, run };
}

describe("AgentCoreSessionHandle", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("forwards the supported run options and translates thinkingLevel", async () => {
    const sessionModule = await loadSessionModule({
      events: [{ type: "session_start", sessionId: "started-session" }],
    });

    const session = sessionModule.createAgentCoreSession({
      workspace: "/tmp/workspace",
      model: "gpt-5.4",
      timeout: 12_345,
      thinkingLevel: "xhigh",
      uiContext: { interactive: true },
      systemPrompt: "Base prompt",
      appendSystemPrompt: ["More context"],
      backend: "codex",
      toolsMode: "coding",
      customTools: [{ name: "ignored-tool" }],
      isolated: true,
      ephemeral: true,
      bashSandbox: "secure",
      enableCompaction: true,
      agentDir: "/tmp/agents",
    });

    await session.prompt("Implement the change");

    expect(sessionModule.createClient).toHaveBeenCalledWith({
      approvalMode: "prompt",
      stream: true,
    });
    expect(sessionModule.registerBuiltInAdapters).toHaveBeenCalledTimes(1);
    expect(sessionModule.run).toHaveBeenCalledWith({
      agent: "codex",
      prompt: "Implement the change",
      cwd: "/tmp/workspace",
      model: "gpt-5.4",
      timeout: 12_345,
      sessionId: undefined,
      systemPrompt: "Base prompt\n\nMore context",
      systemPromptMode: "replace",
      approvalMode: "prompt",
      thinkingEffort: "max",
      collectEvents: true,
    });
    const firstCall = sessionModule.run.mock.calls[0];
    expect(firstCall).toBeDefined();
    const forwarded = firstCall?.[0] as Record<string, unknown>;
    expect(forwarded).not.toHaveProperty("toolsMode");
    expect(forwarded).not.toHaveProperty("customTools");
    expect(forwarded).not.toHaveProperty("isolated");
    expect(forwarded).not.toHaveProperty("ephemeral");
    expect(forwarded).not.toHaveProperty("bashSandbox");
    expect(forwarded).not.toHaveProperty("enableCompaction");
    expect(forwarded).not.toHaveProperty("agentDir");
  });

  it("uses append mode and yolo approval when no interactive UI context is provided", async () => {
    const sessionModule = await loadSessionModule({});
    const session = sessionModule.createAgentCoreSession({
      appendSystemPrompt: ["Line one", "Line two"],
    });

    await session.prompt("Review this");

    expect(sessionModule.run).toHaveBeenCalledWith({
      agent: "codex-sdk",
      prompt: "Review this",
      cwd: undefined,
      model: undefined,
      timeout: 900_000,
      sessionId: undefined,
      systemPrompt: "Line one\n\nLine two",
      systemPromptMode: "append",
      approvalMode: "yolo",
      collectEvents: true,
    });
  });

  it("reuses the session id learned from the prior run", async () => {
    const sessionModule = await loadSessionModule({
      handleResult: { text: "ok", exitReason: "completed", exitCode: 0, sessionId: "persisted-session" },
    });
    const session = sessionModule.createAgentCoreSession();

    await session.prompt("First prompt");
    await session.prompt("Second prompt");

    const firstCall = sessionModule.run.mock.calls[0];
    const secondCall = sessionModule.run.mock.calls[1];
    expect(firstCall).toBeDefined();
    expect(secondCall).toBeDefined();

    expect(firstCall?.[0]).toMatchObject({
      sessionId: undefined,
    });
    expect(secondCall?.[0]).toMatchObject({
      sessionId: "persisted-session",
    });
  });
});
