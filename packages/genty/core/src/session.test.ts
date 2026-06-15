import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

import * as childProcess from "node:child_process";
import { createAgentCoreSession } from "./session";

const mockFetch = vi.fn();

describe("AgentCoreSessionHandle", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    // Clear provider env vars so tests use the stubbed OPENAI_API_KEY
    vi.stubEnv("AGENT_MUX_PROVIDER", "");
    vi.stubEnv("AGENT_MUX_API_BASE", "");
    vi.stubEnv("AGENT_MUX_API_KEY", "");
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

  function deferredTextStream() {
    let controllerRef!: ReadableStreamDefaultController<Uint8Array>;
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controllerRef = controller;
      },
    });
    return {
      body,
      enqueue(text: string) {
        controllerRef.enqueue(encoder.encode(text));
      },
      close() {
        controllerRef.close();
      },
      error(error: unknown) {
        controllerRef.error(error);
      },
    };
  }

  function mockAnthropicResponse(text: string) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: textStream([
        `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 12 } } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 6 } })}\n\n`,
        `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`,
      ]),
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

  it("returns normalized OpenAI token usage on prompt results", async () => {
    mockApiResponse("hello world");
    const session = createAgentCoreSession({ model: "gpt-5.5" });

    const result = await session.prompt("Say hello");

    expect(result.usage).toEqual({
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
      provider: "openai",
      model: "gpt-5.5",
    });
  });

  it("returns normalized Anthropic token usage on prompt results", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-key");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: textStream([
        `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 12 } } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: "anthropic response" } })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 8 } })}\n\n`,
        `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`,
      ]),
    });
    const session = createAgentCoreSession({ model: "claude-sonnet-4-6" });

    const result = await session.prompt("Say hello");

    expect(result.success).toBe(true);
    expect(result.usage).toEqual({
      inputTokens: 12,
      outputTokens: 8,
      totalTokens: 20,
      provider: "anthropic",
      model: "claude-sonnet-4-6",
    });
  });

  it("omits usage when the provider response does not include usage", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: textStream([
        openAiDelta("done"),
        `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`,
      ]),
    });
    const session = createAgentCoreSession({});

    const result = await session.prompt("No usage");

    expect(result.success).toBe(true);
    expect(result.usage).toBeUndefined();
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

  it("maps OpenAI json_object structured output and returns parsed JSON", async () => {
    mockApiResponse('{"status":"ok"}');
    const session = createAgentCoreSession({ model: "gpt-5.5", outputFormat: "json_object" });

    const result = await session.prompt<{ status: string }>("Return JSON");

    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({ status: "ok" });
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages).toEqual([{ role: "user", content: "Return JSON" }]);
  });

  it("maps OpenAI json_schema structured output from prompt options", async () => {
    mockApiResponse('{"answer":42}');
    const session = createAgentCoreSession({ model: "gpt-5.5" });

    const result = await session.prompt<{ answer: number }>("Return schema JSON", {
      outputFormat: "json_schema",
      outputSchemaName: "answer_payload",
      outputSchemaStrict: true,
      outputSchema: {
        type: "object",
        required: ["answer"],
        properties: { answer: { type: "number" } },
      },
    });

    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({ answer: 42 });
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: {
        name: "answer_payload",
        strict: true,
        schema: {
          type: "object",
          required: ["answer"],
          properties: { answer: { type: "number" } },
        },
      },
    });
  });

  it("maps Azure json_schema structured output with OpenAI-compatible response_format", async () => {
    vi.stubEnv("AGENT_MUX_PROVIDER", "foundry");
    vi.stubEnv("AGENT_MUX_API_BASE", "https://myresource.services.ai.azure.com");
    vi.stubEnv("AZURE_API_KEY", "az-key-123");

    mockApiResponse('{"ok":true}');
    const session = createAgentCoreSession({
      model: "gpt-5.5",
      outputFormat: "json_schema",
      outputSchema: {
        type: "object",
        required: ["ok"],
        properties: { ok: { type: "boolean" } },
      },
    });

    const result = await session.prompt("Return JSON");

    expect(result.success).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.name).toBe("agent_core_response");
    expect(body.response_format.json_schema.schema.properties.ok.type).toBe("boolean");
  });

  it("uses an Anthropic system instruction as the structured output fallback", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-key");

    mockAnthropicResponse('{"status":"ok"}');
    const session = createAgentCoreSession({ outputFormat: "json_object" });

    const result = await session.prompt("Return JSON");

    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({ status: "ok" });
    const [url, options] = mockFetch.mock.calls[0]!;
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const body = JSON.parse(options.body);
    expect(body.system).toContain("Return only a valid JSON object");
    expect(body.messages).toEqual([{ role: "user", content: "Return JSON" }]);
    expect(body.response_format).toBeUndefined();
  });

  it("maps image URL and base64 parts for OpenAI-compatible providers", async () => {
    mockApiResponse("described");
    const session = createAgentCoreSession({ model: "gpt-5.5" });

    await session.prompt([
      { type: "text", text: "Describe these images" },
      { type: "image_url", imageUrl: "https://example.com/image.png" },
      { type: "image_base64", mediaType: "image/png", data: "aGVsbG8=" },
    ]);

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.messages[0].content).toEqual([
      { type: "text", text: "Describe these images" },
      { type: "image_url", image_url: { url: "https://example.com/image.png" } },
      { type: "image_url", image_url: { url: "data:image/png;base64,aGVsbG8=" } },
    ]);
  });

  it("maps image URL and base64 parts for Anthropic", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-key");

    mockAnthropicResponse("described");
    const session = createAgentCoreSession({ model: "claude-sonnet-4-6" });

    await session.prompt([
      { type: "text", text: "Describe these images" },
      { type: "image_url", imageUrl: "https://example.com/image.png" },
      { type: "image_base64", mediaType: "image/png", data: "aGVsbG8=" },
    ]);

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.messages[0].content).toEqual([
      { type: "text", text: "Describe these images" },
      { type: "image", source: { type: "url", url: "https://example.com/image.png" } },
      { type: "image", source: { type: "base64", media_type: "image/png", data: "aGVsbG8=" } },
    ]);
  });

  it("fails before dispatch for invalid structured output and image inputs", async () => {
    const schemaSession = createAgentCoreSession({ outputFormat: "json_schema" });
    const schemaResult = await schemaSession.prompt("Return JSON");
    expect(schemaResult.success).toBe(false);
    expect(schemaResult.output).toContain("requires outputSchema");

    const imageSession = createAgentCoreSession({});
    const imageResult = await imageSession.prompt([
      { type: "text", text: "Describe this" },
      { type: "image_url", imageUrl: "file:///tmp/image.png" },
    ]);
    expect(imageResult.success).toBe(false);
    expect(imageResult.output).toContain("http(s)");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns validationError when structured JSON does not match the schema", async () => {
    mockApiResponse('{"answer":"forty-two"}');
    const session = createAgentCoreSession({
      outputFormat: "json_schema",
      outputSchema: {
        type: "object",
        required: ["answer"],
        properties: { answer: { type: "number" } },
      },
    });

    const result = await session.prompt("Return JSON");

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.parsed).toEqual({ answer: "forty-two" });
    expect(result.validationError).toBe("$.answer must be number");
  });

  it("routes to Azure foundry when AGENT_MUX_PROVIDER=foundry", async () => {
    vi.stubEnv("AGENT_MUX_PROVIDER", "foundry");
    vi.stubEnv("AGENT_MUX_API_BASE", "https://myresource.services.ai.azure.com");
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

  it("trims prior history using the resolved provider and model estimate", async () => {
    mockApiResponse("bbbb");
    mockApiResponse("final");
    const session = createAgentCoreSession({ model: "gpt-4o", maxHistoryTokens: 2 });

    await session.prompt("aaaa");
    await session.prompt("next");

    const secondBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
    expect(secondBody.messages).toEqual([
      { role: "user", content: "aaaa" },
      { role: "assistant", content: "bbbb" },
      { role: "user", content: "next" },
    ]);
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

  it("treats abort after prompt completion as harmless", async () => {
    mockApiResponse("complete");
    const session = createAgentCoreSession({});

    const result = await session.prompt("finish");
    await session.abort();

    expect(result.success).toBe(true);
    expect(session.isStreaming).toBe(false);
    expect(session.getHistory()).toEqual([
      { role: "user", content: "finish" },
      { role: "assistant", content: "complete" },
    ]);
  });

  it("does not append partial streamed output when aborted after response starts", async () => {
    const stream = deferredTextStream();
    mockFetch.mockResolvedValueOnce({ ok: true, body: stream.body });
    const session = createAgentCoreSession({});
    const events: Array<Record<string, unknown>> = [];
    session.subscribe((event) => events.push(event as Record<string, unknown>));

    const prompt = session.prompt("abort stream");
    await new Promise((resolve) => setTimeout(resolve, 0));
    stream.enqueue(openAiDelta("partial"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    stream.error(new Error("stream aborted"));
    const result = await prompt;

    expect(result.success).toBe(false);
    expect(events.filter((event) => event.type === "text_delta").map((event) => event.delta)).toEqual(["partial"]);
    expect(session.isStreaming).toBe(false);
    expect(session.getHistory()).toEqual([]);
  });

  it("dispose aborts the active provider request and clears local session state", async () => {
    let signal: AbortSignal | undefined;
    mockFetch.mockImplementationOnce((_url, options) => {
      signal = options.signal;
      return new Promise((_resolve, reject) => {
        signal!.addEventListener("abort", () => reject(signal!.reason), { once: true });
      });
    });
    const session = createAgentCoreSession({});
    await session.steer("pending follow-up");
    const listener = vi.fn();
    session.subscribe(listener);

    const prompt = session.prompt("dispose me");
    await new Promise((resolve) => setTimeout(resolve, 0));
    session.dispose();
    const result = await prompt;

    expect(signal?.aborted).toBe(true);
    expect(result.success).toBe(false);
    expect(session.getHistory()).toEqual([]);
    expect(listener).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));

    mockApiResponse("fresh");
    await session.prompt("after dispose");
    const secondBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
    expect(secondBody.messages).toEqual([{ role: "user", content: "after dispose" }]);
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

    resolveResponse({
      ok: true,
      body: textStream([
        openAiDelta("done"),
        `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`,
      ]),
    });
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

  it("executes session commands through the shared shell argv contract", async () => {
    vi.mocked(childProcess.spawn).mockImplementation(() => {
      const listeners = new Map<string, (...args: unknown[]) => void>();
      return {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
          listeners.set(event, listener);
          if (event === "close") {
            queueMicrotask(() => listener(0, null));
          }
          return undefined;
        }),
      } as unknown as childProcess.ChildProcessWithoutNullStreams;
    });

    const session = createAgentCoreSession({ workspace: "/tmp/workspace" });
    const result = await session.executeCommand("echo from-session");

    expect(result.exitCode).toBe(0);
    const [command, args, options] = vi.mocked(childProcess.spawn).mock.calls[0]!;
    expect({ command, args }).toEqual({
      command: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      args: process.platform === "win32" ? ["/c", "echo from-session"] : ["-c", "echo from-session"],
    });
    expect(options).toMatchObject({
      cwd: "/tmp/workspace",
      stdio: ["ignore", "pipe", "pipe"],
    });
  });
});
