import { Type } from "@sinclair/typebox";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

import { createAgentCoreSession } from "./session";
import type { CustomToolDefinition, ToolResult } from "./types";

const mockFetch = vi.fn();

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

// --- OpenAI SSE frame helpers ---------------------------------------------

function openAiTextDelta(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: null }] })}\n\n`;
}

function openAiToolCallFrames(
  toolCalls: Array<{ index: number; id: string; name: string; argChunks: string[] }>,
): string {
  const frames: string[] = [];
  // First frame announces id + name per call.
  frames.push(
    `data: ${JSON.stringify({
      choices: [
        {
          delta: {
            tool_calls: toolCalls.map((c) => ({ index: c.index, id: c.id, function: { name: c.name, arguments: "" } })),
          },
          finish_reason: null,
        },
      ],
    })}\n\n`,
  );
  // Subsequent frames stream argument chunks.
  const maxChunks = Math.max(...toolCalls.map((c) => c.argChunks.length));
  for (let i = 0; i < maxChunks; i += 1) {
    frames.push(
      `data: ${JSON.stringify({
        choices: [
          {
            delta: {
              tool_calls: toolCalls
                .filter((c) => c.argChunks[i] !== undefined)
                .map((c) => ({ index: c.index, function: { arguments: c.argChunks[i] } })),
            },
            finish_reason: null,
          },
        ],
      })}\n\n`,
    );
  }
  frames.push(
    `data: ${JSON.stringify({
      choices: [{ delta: {}, finish_reason: "tool_calls" }],
      usage: { prompt_tokens: 5, completion_tokens: 3 },
    })}\n\ndata: [DONE]\n\n`,
  );
  return frames.join("");
}

function openAiFinalText(text: string): ReadableStream<Uint8Array> {
  return textStream([
    openAiTextDelta(text),
    `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 7, completion_tokens: 4 } })}\n\ndata: [DONE]\n\n`,
  ]);
}

// --- Anthropic SSE frame helpers ------------------------------------------

function anthropicToolUseStream(toolCall: { id: string; name: string; partialJson: string[] }): ReadableStream<Uint8Array> {
  const frames: string[] = [
    `data: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 9 } } })}\n\n`,
    `data: ${JSON.stringify({ type: "content_block_start", index: 0, content_block: { type: "tool_use", id: toolCall.id, name: toolCall.name } })}\n\n`,
  ];
  for (const chunk of toolCall.partialJson) {
    frames.push(
      `data: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: chunk } })}\n\n`,
    );
  }
  frames.push(
    `data: ${JSON.stringify({ type: "content_block_stop", index: 0 })}\n\n`,
    `data: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "tool_use" }, usage: { output_tokens: 5 } })}\n\n`,
    `data: ${JSON.stringify({ type: "message_stop" })}\n\n`,
  );
  return textStream(frames);
}

function anthropicTextStream(text: string): ReadableStream<Uint8Array> {
  return textStream([
    `data: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 6 } } })}\n\n`,
    `data: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text } })}\n\n`,
    `data: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 2 } })}\n\n`,
    `data: ${JSON.stringify({ type: "message_stop" })}\n\n`,
  ]);
}

describe("AgentCoreSessionHandle tool-calling loop", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("OPENAI_API_KEY", "test-key");
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

  function makeTool(
    name: string,
    execute: CustomToolDefinition["execute"],
  ): CustomToolDefinition {
    return {
      name,
      label: name,
      description: `Tool ${name}`,
      parameters: Type.Object({ value: Type.Optional(Type.String()) }),
      execute,
    };
  }

  it("runs the OpenAI tool_calls loop: execute() with parsed args, tool result, then final text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: textStream([
        openAiToolCallFrames([
          { index: 0, id: "call_1", name: "get_weather", argChunks: ['{"value":', '"Paris"}'] },
        ]),
      ]),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, body: openAiFinalText("It is sunny in Paris.") });

    const execute = vi.fn(
      async (_toolCallId: string, _params: Record<string, unknown>): Promise<ToolResult> => ({
        content: [{ type: "text", text: "sunny" }],
      }),
    );
    const session = createAgentCoreSession({
      model: "gpt-5.5",
      customTools: [makeTool("get_weather", execute)],
    });

    const events: Array<Record<string, unknown>> = [];
    session.subscribe((e) => events.push(e as Record<string, unknown>));

    const result = await session.prompt("What is the weather in Paris?");

    expect(result.success).toBe(true);
    expect(result.output).toBe("It is sunny in Paris.");
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0]![0]).toBe("call_1");
    expect(execute.mock.calls[0]![1]).toEqual({ value: "Paris" });

    // First request sends the tools; second request includes the tool-call turn + tool result.
    const firstBody = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(firstBody.tools).toEqual([
      {
        type: "function",
        function: { name: "get_weather", description: "Tool get_weather", parameters: expect.any(Object) },
      },
    ]);
    expect(firstBody.tool_choice).toBe("auto");

    const secondBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
    const assistantTurn = secondBody.messages.find((m: { role: string }) => m.role === "assistant");
    expect(assistantTurn.tool_calls[0]).toMatchObject({ id: "call_1", function: { name: "get_weather" } });
    const toolTurn = secondBody.messages.find((m: { role: string }) => m.role === "tool");
    expect(toolTurn).toEqual({ role: "tool", tool_call_id: "call_1", content: "sunny" });

    // tool_use / tool_result events emitted.
    expect(events.filter((e) => e.type === "tool_use").map((e) => e.name)).toEqual(["get_weather"]);
    expect(events.filter((e) => e.type === "tool_result").map((e) => e.toolCallId)).toEqual(["call_1"]);

    // Usage aggregated across both model calls.
    expect(result.usage).toMatchObject({ inputTokens: 12, outputTokens: 7, totalTokens: 19 });
  });

  it("handles multiple tool calls in a single turn", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: textStream([
        openAiToolCallFrames([
          { index: 0, id: "call_a", name: "tool_a", argChunks: ['{"value":"A"}'] },
          { index: 1, id: "call_b", name: "tool_b", argChunks: ['{"value":"B"}'] },
        ]),
      ]),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, body: openAiFinalText("done") });

    const aExec = vi.fn(async (): Promise<ToolResult> => ({ content: [{ type: "text", text: "ra" }] }));
    const bExec = vi.fn(async (): Promise<ToolResult> => ({ content: [{ type: "text", text: "rb" }] }));
    const session = createAgentCoreSession({
      model: "gpt-5.5",
      customTools: [makeTool("tool_a", aExec), makeTool("tool_b", bExec)],
    });

    const result = await session.prompt("Use both");

    expect(result.output).toBe("done");
    expect(aExec).toHaveBeenCalledWith("call_a", { value: "A" }, undefined, expect.any(Object));
    expect(bExec).toHaveBeenCalledWith("call_b", { value: "B" }, undefined, expect.any(Object));

    const secondBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
    const toolTurns = secondBody.messages.filter((m: { role: string }) => m.role === "tool");
    expect(toolTurns).toEqual([
      { role: "tool", tool_call_id: "call_a", content: "ra" },
      { role: "tool", tool_call_id: "call_b", content: "rb" },
    ]);
  });

  it("runs the Anthropic tool_use loop and feeds tool_result back", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-key");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: anthropicToolUseStream({ id: "toolu_1", name: "lookup", partialJson: ['{"value":', '"x"}'] }),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, body: anthropicTextStream("final answer") });

    const execute = vi.fn(async (): Promise<ToolResult> => ({ content: [{ type: "text", text: "result-data" }] }));
    const session = createAgentCoreSession({
      model: "claude-sonnet-4-6",
      customTools: [makeTool("lookup", execute)],
    });

    const result = await session.prompt("Look it up");

    expect(result.success).toBe(true);
    expect(result.output).toBe("final answer");
    expect(execute).toHaveBeenCalledWith("toolu_1", { value: "x" }, undefined, expect.any(Object));

    const firstBody = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(firstBody.tools).toEqual([
      { name: "lookup", description: "Tool lookup", input_schema: expect.any(Object) },
    ]);

    const secondBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
    const assistantTurn = secondBody.messages.find((m: { role: string }) => m.role === "assistant");
    expect(assistantTurn.content).toContainEqual({ type: "tool_use", id: "toolu_1", name: "lookup", input: { value: "x" } });
    const userTurns = secondBody.messages.filter((m: { role: string }) => m.role === "user");
    const resultTurn = userTurns[userTurns.length - 1];
    expect(resultTurn.content).toEqual([{ type: "tool_result", tool_use_id: "toolu_1", content: "result-data" }]);
  });

  it("does not send tools and never loops on the plain-text path (no customTools)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, body: openAiFinalText("plain reply") });
    const session = createAgentCoreSession({ model: "gpt-5.5" });

    const result = await session.prompt("Hello");

    expect(result.success).toBe(true);
    expect(result.output).toBe("plain reply");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.tools).toBeUndefined();
    expect(body.tool_choice).toBeUndefined();
    expect(session.getHistory()).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "plain reply" },
    ]);
  });

  it("does not send tools when customTools is an empty array", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, body: openAiFinalText("ok") });
    const session = createAgentCoreSession({ model: "gpt-5.5", customTools: [] });

    await session.prompt("Hi");

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.tools).toBeUndefined();
  });

  // --- Convergence guard (#936) --------------------------------------------

  it("terminates fast when the model fixates on the same failing tool call (does not spin to the iteration cap)", async () => {
    // Every model turn emits the SAME tool call with identical arguments, and
    // the tool always returns an error. Without the convergence guard this
    // would run up to MAX_TOOL_LOOP_ITERATIONS (50) model calls; the guard must
    // break far sooner (MAX_CONSECUTIVE_TOOL_ERRORS = 6) and return usable text.
    mockFetch.mockImplementation(async () => ({
      ok: true,
      body: textStream([
        openAiTextDelta("thinking"),
        openAiToolCallFrames([
          { index: 0, id: "call_loop", name: "search", argChunks: ['{"value":"outside-workspace"}'] },
        ]),
      ]),
    }));

    const execute = vi.fn(
      async (): Promise<ToolResult> => ({
        // errorResult-shaped: text begins with "Error:" so the guard counts it.
        content: [{ type: "text", text: 'Error: Path "x" resolves outside the workspace boundary.' }],
      }),
    );
    const session = createAgentCoreSession({
      model: "gpt-5.5",
      customTools: [makeTool("search", execute)],
    });

    const result = await session.prompt("Search the library");

    // Loop converged (returned the last assistant text) instead of throwing the
    // "exceeded 50 iterations" error.
    expect(result.output).toBe("thinking");
    // Terminated at the consecutive-error threshold, NOT the 50-iteration cap.
    expect(execute.mock.calls.length).toBeLessThanOrEqual(6);
    expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(6);
  });

  it("steers the model after repeated identical tool calls before giving up", async () => {
    // The tool succeeds (non-error) so the consecutive-error guard never trips;
    // the repeated-signature guard must still inject a corrective steering turn
    // once the same call recurs past the threshold (MAX_REPEATED_TOOL_CALLS=3),
    // then the model emits final text.
    let turn = 0;
    mockFetch.mockImplementation(async () => {
      turn += 1;
      // Turns 1..3 repeat the identical tool call; turn 4 finishes with text.
      if (turn >= 4) {
        return { ok: true, body: openAiFinalText("done after steering") };
      }
      return {
        ok: true,
        body: textStream([
          openAiToolCallFrames([
            { index: 0, id: `call_${turn}`, name: "noop", argChunks: ['{"value":"same"}'] },
          ]),
        ]),
      };
    });

    const execute = vi.fn(async (): Promise<ToolResult> => ({ content: [{ type: "text", text: "ok" }] }));
    const session = createAgentCoreSession({
      model: "gpt-5.5",
      customTools: [makeTool("noop", execute)],
    });

    const result = await session.prompt("Repeat the same call");
    expect(result.output).toBe("done after steering");

    // The 4th request (final-text turn) must carry a corrective steering user
    // message injected after the 3rd identical call.
    const finalBody = JSON.parse(mockFetch.mock.calls[3]![1].body);
    const userTurns = finalBody.messages.filter((m: { role: string }) => m.role === "user");
    const steered = userTurns.some(
      (m: { content: unknown }) => typeof m.content === "string" && m.content.includes("identical arguments"),
    );
    expect(steered).toBe(true);
  });
});
