import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAgentCoreSession } from "./session";

const mockFetch = vi.fn();

describe("AgentCoreSessionHandle", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    // Clear provider env vars so tests use the stubbed OPENAI_API_KEY
    vi.stubEnv("AMUX_PROVIDER", "");
    vi.stubEnv("AMUX_API_BASE", "");
    vi.stubEnv("AMUX_API_KEY", "");
    vi.stubEnv("AZURE_API_KEY", "");
    vi.stubEnv("AZURE_OPENAI_API_KEY", "");
    vi.stubEnv("AZURE_OPENAI_PROJECT_NAME", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  function textStream(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
  }

  function openAiDelta(text: string): string {
    return `data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: null }] })}\n\n`;
  }

  function openAiDone(): string {
    return `data: ${JSON.stringify({
      choices: [{ delta: {}, finish_reason: "stop" }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    })}\n\ndata: [DONE]\n\n`;
  }

  function mockApiResponse(text: string) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: textStream([openAiDelta(text), openAiDone()]),
    });
  }

  it("makes a direct API call with the prompt", async () => {
    mockApiResponse("hello world");
    const session = createAgentCoreSession({ model: "gpt-5.5" });

    const result = await session.prompt("Say hello");

    expect(result.success).toBe(true);
    expect(result.output).toBe("hello world");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(options.body);
    expect(body.model).toBe("gpt-5.5");
    expect(body.stream).toBe(true);
    expect(body.messages).toEqual([{ role: "user", content: "Say hello" }]);
  });

  it("includes system prompt when provided", async () => {
    mockApiResponse("ok");
    const session = createAgentCoreSession({
      systemPrompt: "You are helpful",
      appendSystemPrompt: ["Be concise"],
    });

    await session.prompt("Do something");

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.messages[0]).toEqual({ role: "system", content: "You are helpful\n\nBe concise" });
    expect(body.messages[1]).toEqual({ role: "user", content: "Do something" });
  });

  it("routes to Azure foundry when AMUX_PROVIDER=foundry", async () => {
    vi.stubEnv("AMUX_PROVIDER", "foundry");
    vi.stubEnv("AMUX_API_BASE", "https://myresource.services.ai.azure.com");
    vi.stubEnv("AZURE_API_KEY", "az-key-123");

    mockApiResponse("azure response");
    const session = createAgentCoreSession({ model: "gpt-5.5" });

    await session.prompt("Hello");

    const [url, options] = mockFetch.mock.calls[0]!;
    expect(url).toBe("https://myresource.services.ai.azure.com/openai/deployments/gpt-5.5/chat/completions?api-version=2025-04-01-preview");
    expect(options.headers["api-key"]).toBe("az-key-123");
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  it("uses OPENAI_API_KEY with Bearer auth for OpenAI", async () => {
    mockApiResponse("openai response");
    const session = createAgentCoreSession({});

    await session.prompt("Test");

    const [, options] = mockFetch.mock.calls[0]!;
    expect(options.headers["Authorization"]).toBe("Bearer test-key");
    expect(options.headers["api-key"]).toBeUndefined();
  });

  it("appends queued follow-up instructions to the next prompt only once", async () => {
    mockApiResponse("first");
    mockApiResponse("second");
    const session = createAgentCoreSession({});

    await session.steer("Use the session export path");
    await session.followUp("Add the registry regression");
    await session.prompt("Implement tests");
    await session.prompt("Verify again");

    const firstBody = JSON.parse(mockFetch.mock.calls[0]![1].body);
    const secondBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
    expect(firstBody.messages.at(-1).content).toContain("Implement tests");
    expect(firstBody.messages.at(-1).content).toContain("Follow-up instruction:\nUse the session export path");
    expect(secondBody.messages).toContainEqual({ role: "user", content: firstBody.messages.at(-1).content });
    expect(secondBody.messages).toContainEqual({ role: "assistant", content: "first" });
    expect(secondBody.messages.at(-1)).toEqual({ role: "user", content: "Verify again" });

    expect(session.getHistory()).toEqual([
      { role: "user", content: firstBody.messages.at(-1).content },
      { role: "assistant", content: "first" },
      { role: "user", content: "Verify again" },
      { role: "assistant", content: "second" },
    ]);
  });

  it("emits incremental OpenAI text deltas in order while preserving final output", async () => {
    const firstFrame = openAiDelta("streamed ");
    const secondFrame = openAiDelta("text");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: textStream([
        firstFrame.slice(0, 18),
        firstFrame.slice(18),
        secondFrame,
        openAiDone(),
      ]),
    });
    const session = createAgentCoreSession({});
    const events: Array<Record<string, unknown>> = [];
    session.subscribe((event) => events.push(event as Record<string, unknown>));

    const result = await session.prompt("Test events");

    expect(result.output).toBe("streamed text");
    expect(events.map((event) => event.type)).toEqual([
      "session_start",
      "text_delta",
      "text_delta",
      "session_end",
    ]);
    expect(events.filter((e) => e.type === "text_delta").map((e) => e.delta)).toEqual(["streamed ", "text"]);
  });

  it("emits incremental Anthropic text deltas in order while preserving final output", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-key");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: textStream([
        `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 4 } } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: "anthropic " } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: "stream" } })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 3 } })}\n\n`,
        `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`,
      ]),
    });
    const session = createAgentCoreSession({ model: "claude-sonnet-4-6" });
    const events: Array<Record<string, unknown>> = [];
    session.subscribe((event) => events.push(event as Record<string, unknown>));

    const result = await session.prompt("Test anthropic");

    expect(result.output).toBe("anthropic stream");
    expect(events.map((event) => event.type)).toEqual([
      "session_start",
      "text_delta",
      "text_delta",
      "session_end",
    ]);
    expect(events.filter((e) => e.type === "text_delta").map((e) => e.delta)).toEqual(["anthropic ", "stream"]);

    const [url, options] = mockFetch.mock.calls[0]!;
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const body = JSON.parse(options.body);
    expect(body.stream).toBe(true);
    expect(body.messages).toEqual([{ role: "user", content: "Test anthropic" }]);
  });

  it("includes prior successful user and assistant turns in later prompts", async () => {
    mockApiResponse("first answer");
    mockApiResponse("second answer");
    const session = createAgentCoreSession({ systemPrompt: "System stays separate" });

    await session.prompt("First question");
    await session.prompt("Second question");

    const secondBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
    expect(secondBody.messages).toEqual([
      { role: "system", content: "System stays separate" },
      { role: "user", content: "First question" },
      { role: "assistant", content: "first answer" },
      { role: "user", content: "Second question" },
    ]);
    expect(session.getHistory()).toEqual([
      { role: "user", content: "First question" },
      { role: "assistant", content: "first answer" },
      { role: "user", content: "Second question" },
      { role: "assistant", content: "second answer" },
    ]);
  });

  it("returns defensive history copies and clearHistory removes prior turns", async () => {
    mockApiResponse("answer");
    mockApiResponse("after clear");
    const session = createAgentCoreSession({ systemPrompt: "System prompt" });

    await session.prompt("Question");

    const history = session.getHistory();
    history[0]!.content = "mutated";
    expect(session.getHistory()).toEqual([
      { role: "user", content: "Question" },
      { role: "assistant", content: "answer" },
    ]);

    session.clearHistory();
    expect(session.getHistory()).toEqual([]);
    await session.prompt("Fresh");

    const secondBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
    expect(secondBody.messages).toEqual([
      { role: "system", content: "System prompt" },
      { role: "user", content: "Fresh" },
    ]);
  });

  it("trims prior history deterministically by max turns", async () => {
    mockApiResponse("a1");
    mockApiResponse("a2");
    mockApiResponse("a3");
    const session = createAgentCoreSession({ maxHistoryTurns: 2 });

    await session.prompt("q1");
    await session.prompt("q2");
    await session.prompt("q3");

    const thirdBody = JSON.parse(mockFetch.mock.calls[2]![1].body);
    expect(thirdBody.messages).toEqual([
      { role: "user", content: "q2" },
      { role: "assistant", content: "a2" },
      { role: "user", content: "q3" },
    ]);
    expect(session.getHistory()).toEqual([
      { role: "user", content: "q3" },
      { role: "assistant", content: "a3" },
    ]);
  });

  it("trims prior history deterministically by token estimate", async () => {
    mockApiResponse("short");
    mockApiResponse("final");
    const session = createAgentCoreSession({ maxHistoryTokens: 2 });

    await session.prompt("this previous turn is too long");
    await session.prompt("next");

    const secondBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
    expect(secondBody.messages).toEqual([{ role: "user", content: "next" }]);
  });

  it("does not append failed prompts or partial streamed output to history", async () => {
    mockApiResponse("ok");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: textStream([`data: ${JSON.stringify({ choices: [{ delta: { content: "partial" } }] })}\n\n`, "data: {not-json}\n\n"]),
    });
    mockApiResponse("after failure");
    const session = createAgentCoreSession({});
    const events: Array<Record<string, unknown>> = [];
    session.subscribe((event) => events.push(event as Record<string, unknown>));

    await session.prompt("good");
    const failed = await session.prompt("bad");
    await session.prompt("after");

    expect(failed.success).toBe(false);
    expect(events.some((event) => event.type === "error")).toBe(true);
    expect(session.getHistory()).toEqual([
      { role: "user", content: "good" },
      { role: "assistant", content: "ok" },
      { role: "user", content: "after" },
      { role: "assistant", content: "after failure" },
    ]);

    const thirdBody = JSON.parse(mockFetch.mock.calls[2]![1].body);
    expect(thirdBody.messages).toEqual([
      { role: "user", content: "good" },
      { role: "assistant", content: "ok" },
      { role: "user", content: "after" },
    ]);
  });

  it("aborts the active provider request without appending history", async () => {
    let signal: AbortSignal | undefined;
    mockFetch.mockImplementationOnce((_url, options) => {
      signal = options.signal;
      return new Promise((_resolve, reject) => {
        signal!.addEventListener("abort", () => reject(signal!.reason));
      });
    });
    const session = createAgentCoreSession({});

    const prompt = session.prompt("abort me");
    await new Promise((resolve) => setTimeout(resolve, 0));
    await session.abort();
    const result = await prompt;

    expect(result.success).toBe(false);
    expect(result.output).toContain("aborted");
    expect(session.isStreaming).toBe(false);
    expect(session.getHistory()).toEqual([]);
  });

  it("rejects concurrent prompt attempts", async () => {
    let resolveResponse!: (value: unknown) => void;
    mockFetch.mockReturnValueOnce(new Promise((resolve) => { resolveResponse = resolve; }));

    const session = createAgentCoreSession({});
    const firstPrompt = session.prompt("First");
    await new Promise((resolve) => setTimeout(resolve, 0));

    await expect(session.prompt("Second")).rejects.toThrow(
      "Agent core session is already processing a prompt",
    );

    resolveResponse({ ok: true, json: async () => ({ choices: [{ message: { content: "done" } }] }) });
    await firstPrompt;
    expect(session.isStreaming).toBe(false);
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });
    const session = createAgentCoreSession({});

    const result = await session.prompt("Will fail");

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("401");
  });
});
