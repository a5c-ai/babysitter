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

function createPendingHandle(events: unknown[] = []) {
  let resolveResult: ((result: MockRunResult) => void) | undefined;
  const promise = new Promise<MockRunResult>((resolve) => {
    resolveResult = resolve;
  });

  const handle = Object.assign(promise, {
    send: vi.fn(async () => undefined),
    queue: vi.fn(async () => undefined),
    abort: vi.fn(async () => undefined),
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        yield event;
      }
    },
  });

  return {
    handle,
    resolve(result: MockRunResult) {
      resolveResult?.(result);
    },
  };
}

async function loadSessionModule(args: {
  handleResult?: MockRunResult;
  events?: unknown[];
  runImplementation?: (options: Record<string, unknown>) => ReturnType<typeof createHandle>;
  modelImplementation?: (agent: string, modelId: string) => Record<string, unknown> | null;
  adapterImplementation?: (agent: string) => Record<string, unknown> | undefined;
}) {
  vi.resetModules();

  const run = vi.fn((options: Record<string, unknown>) => args.runImplementation?.(options) ?? createHandle(
    args.handleResult ?? { text: "ok", exitReason: "completed", exitCode: 0, sessionId: "session-1" },
    args.events,
  ));
  const models = {
    model: vi.fn((agent: string, modelId: string) => args.modelImplementation?.(agent, modelId) ?? null),
  };
  const adapters = {
    get: vi.fn((agent: string) => args.adapterImplementation?.(agent)),
  };
  const createClient = vi.fn(() => ({ run, models, adapters }));
  const registerBuiltInAdapters = vi.fn();

  vi.doMock("@a5c-ai/agent-mux", () => ({
    createClient,
    registerBuiltInAdapters,
  }));

  const sessionModule = await import("./session");
  return { ...sessionModule, createClient, registerBuiltInAdapters, run, models, adapters };
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

  it("falls back from the implicit sdk backend to the paired subprocess backend for unsupported models", async () => {
    const sessionModule = await loadSessionModule({
      modelImplementation: () => null,
      adapterImplementation: (agent) => (agent === "codex" ? { agent } : undefined),
    });
    const session = sessionModule.createAgentCoreSession({
      model: "gpt-5.4",
    });

    await session.prompt("Plan the run");

    expect(sessionModule.models.model).toHaveBeenCalledWith("codex-sdk", "gpt-5.4");
    expect(sessionModule.adapters.get).toHaveBeenCalledWith("codex");
    expect(sessionModule.run).toHaveBeenCalledWith({
      agent: "codex",
      prompt: "Plan the run",
      cwd: undefined,
      model: "gpt-5.4",
      timeout: 900_000,
      sessionId: undefined,
      systemPrompt: undefined,
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

  it("appends queued follow-up instructions to the next prompt only once", async () => {
    const sessionModule = await loadSessionModule({});
    const session = sessionModule.createAgentCoreSession();

    await session.steer("Use the session export path");
    await session.followUp("Add the registry regression");
    await session.prompt("Implement tests");
    await session.prompt("Verify again");

    expect(sessionModule.run.mock.calls[0]?.[0]).toMatchObject({
      prompt: [
        "Implement tests",
        "Follow-up instruction:\nUse the session export path",
        "Follow-up instruction:\nAdd the registry regression",
      ].join("\n\n"),
    });
    expect(sessionModule.run.mock.calls[1]?.[0]).toMatchObject({
      prompt: "Verify again",
    });
  });

  it("normalizes unknown event payloads for subscribers", async () => {
    const sessionModule = await loadSessionModule({
      events: [null, { foo: "bar" }, { type: "session_start", sessionId: "event-session" }],
      handleResult: { text: "ok", exitReason: "completed", exitCode: 0, sessionId: "event-session" },
    });
    const session = sessionModule.createAgentCoreSession();
    const received: Array<Record<string, unknown>> = [];

    session.subscribe((event) => {
      received.push(event as Record<string, unknown>);
    });

    await session.prompt("Inspect event flow");

    expect(received).toEqual([
      { type: "unknown", value: null },
      { type: "unknown", foo: "bar" },
      { type: "session_start", sessionId: "event-session" },
    ]);
    expect(session.sessionId).toBe("event-session");
    expect(session.isStreaming).toBe(false);
  });

  it("rejects concurrent prompt attempts while a prompt is active", async () => {
    const pending = createPendingHandle();
    const sessionModule = await loadSessionModule({
      runImplementation: () => pending.handle,
    });
    const session = sessionModule.createAgentCoreSession();

    const firstPrompt = session.prompt("First prompt");
    await new Promise((resolve) => setTimeout(resolve, 0));

    await expect(session.prompt("Second prompt")).rejects.toThrow(
      "Agent core session is already processing a prompt",
    );

    pending.resolve({ text: "done", exitReason: "completed", exitCode: 0, sessionId: "session-1" });
    await firstPrompt;
    expect(session.isStreaming).toBe(false);
  });
});
