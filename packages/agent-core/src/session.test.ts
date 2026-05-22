import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAgentCoreSession } from "./session";

const mockFetch = vi.fn();

describe("AgentCoreSessionHandle", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("OPENAI_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  function mockApiResponse(text: string) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: text } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }),
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
    expect(firstBody.messages[0].content).toContain("Implement tests");
    expect(firstBody.messages[0].content).toContain("Follow-up instruction:\nUse the session export path");
    expect(secondBody.messages[0].content).toBe("Verify again");
  });

  it("emits events to subscribers", async () => {
    mockApiResponse("streamed text");
    const session = createAgentCoreSession({});
    const events: Array<Record<string, unknown>> = [];
    session.subscribe((event) => events.push(event as Record<string, unknown>));

    await session.prompt("Test events");

    expect(events.some((e) => e.type === "session_start")).toBe(true);
    expect(events.some((e) => e.type === "text_delta" && e.delta === "streamed text")).toBe(true);
    expect(events.some((e) => e.type === "session_end")).toBe(true);
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
