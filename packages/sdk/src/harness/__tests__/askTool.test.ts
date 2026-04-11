/**
 * TDD RED-phase tests for the ask tool enhancements (GAP-TOOLS-038).
 *
 * Tests the new `mode` parameter being added to the ask agentic tool:
 *   - mode: 'simple' | 'structured' (default: 'structured')
 *   - question: single string for simple mode
 *
 * When mode='simple': accepts a single `question` string, returns plain text.
 * When mode='structured': current behavior preserved (questions[] array).
 *
 * These tests are expected to FAIL against the current implementation
 * since the simple mode feature does not exist yet.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAgenticToolDefinitions,
  type CustomToolDefinition,
} from "../agenticTools";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_WORKSPACE = "/tmp/test-workspace";

function getAskTool(
  interactive = true,
  mockHandler?: ReturnType<typeof vi.fn>,
): { tool: CustomToolDefinition; handler: ReturnType<typeof vi.fn> } {
  const handler = mockHandler ?? vi.fn();
  const tools = createAgenticToolDefinitions({
    workspace: TEST_WORKSPACE,
    interactive,
    askUserQuestionHandler: interactive ? handler : undefined,
  });
  const tool = tools.find((t) => t.name === "ask");
  if (!tool) throw new Error("ask tool not found in agentic tool definitions");
  return { tool, handler };
}

function getResultText(result: {
  content: Array<{ type: string; text: string }>;
}): string {
  return result.content[0]?.text ?? "";
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mockHandler: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockHandler = vi.fn();
});

// ---------------------------------------------------------------------------
// 1. mode parameter
// ---------------------------------------------------------------------------

describe("ask tool -- mode parameter", () => {
  it("should default to structured mode with questions[] (backward compat)", async () => {
    mockHandler.mockResolvedValue({
      answers: [{ id: "q1", answer: "TypeScript" }],
    });
    const { tool, handler } = getAskTool(true, mockHandler);

    await tool.execute("call-1", {
      questions: [
        { id: "q1", question: "What language?", options: [{ label: "TS" }] },
      ],
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const mapped = handler.mock.calls[0][0];
    expect(mapped.questions).toBeDefined();
    expect(mapped.questions).toHaveLength(1);
    expect(mapped.questions[0].id).toBe("q1");
    expect(mapped.questions[0].text).toBe("What language?");
  });

  it("should work with explicit mode='structured' and questions[]", async () => {
    mockHandler.mockResolvedValue({
      answers: [{ id: "q1", answer: "yes" }],
    });
    const { tool, handler } = getAskTool(true, mockHandler);

    await tool.execute("call-2", {
      mode: "structured",
      questions: [{ id: "q1", question: "Proceed?" }],
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const mapped = handler.mock.calls[0][0];
    expect(mapped.questions).toHaveLength(1);
    expect(mapped.questions[0].text).toBe("Proceed?");
  });

  it("should accept mode='simple' with a single 'question' string", async () => {
    mockHandler.mockResolvedValue({
      answers: [{ id: "_simple", answer: "blue" }],
    });
    const { tool, handler } = getAskTool(true, mockHandler);

    const result = await tool.execute("call-3", {
      mode: "simple",
      question: "What is your favorite color?",
    });

    expect(handler).toHaveBeenCalledTimes(1);
    // The result should be a plain text answer, not JSON
    const text = getResultText(result);
    expect(text).toBe("blue");
  });

  it("should return plain text answer in simple mode", async () => {
    mockHandler.mockResolvedValue({
      answers: [{ id: "_simple", answer: "42" }],
    });
    const { tool } = getAskTool(true, mockHandler);

    const result = await tool.execute("call-4", {
      mode: "simple",
      question: "What is the answer to life?",
    });

    const text = getResultText(result);
    // Simple mode should return the plain answer string, not a JSON object
    expect(text).toBe("42");
    // Verify it's not a JSON object (structured mode would return {"answers":[...]})
    expect(text).not.toMatch(/^\{/);
  });
});

// ---------------------------------------------------------------------------
// 2. Simple mode behavior
// ---------------------------------------------------------------------------

describe("ask tool -- simple mode behavior", () => {
  it("should map single question to questions[] internally when calling handler", async () => {
    mockHandler.mockResolvedValue({
      answers: [{ id: "_simple", answer: "yes" }],
    });
    const { tool, handler } = getAskTool(true, mockHandler);

    await tool.execute("call-5", {
      mode: "simple",
      question: "Should we continue?",
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const mapped = handler.mock.calls[0][0];
    // Should have been converted to a single-element questions array
    expect(mapped.questions).toHaveLength(1);
    expect(mapped.questions[0].text).toBe("Should we continue?");
    expect(mapped.questions[0].id).toBe("_simple");
  });

  it("should extract first answer as plain string in the result", async () => {
    mockHandler.mockResolvedValue({
      answers: [{ id: "_simple", answer: "React" }],
    });
    const { tool } = getAskTool(true, mockHandler);

    const result = await tool.execute("call-6", {
      mode: "simple",
      question: "Which framework?",
    });

    const text = getResultText(result);
    expect(text).toBe("React");
  });

  it("should error if 'question' param is missing in simple mode", async () => {
    const { tool } = getAskTool(true, mockHandler);

    const result = await tool.execute("call-7", {
      mode: "simple",
      // no 'question' field
    });

    const text = getResultText(result);
    expect(text).toMatch(/error/i);
  });

  it("should work when handler returns a rich structured response", async () => {
    mockHandler.mockResolvedValue({
      answers: [{ id: "_simple", answer: "Node 20", extra: "LTS" }],
      metadata: { respondedAt: "2026-04-07T00:00:00Z" },
    });
    const { tool } = getAskTool(true, mockHandler);

    const result = await tool.execute("call-8", {
      mode: "simple",
      question: "Which Node version?",
    });

    // Even with rich response, simple mode extracts just the answer string
    const text = getResultText(result);
    expect(text).toBe("Node 20");
  });
});

// ---------------------------------------------------------------------------
// 3. Structured mode behavior
// ---------------------------------------------------------------------------

describe("ask tool -- structured mode behavior", () => {
  it("should error when questions[] is missing in structured mode", async () => {
    const { tool } = getAskTool(true, mockHandler);

    const result = await tool.execute("call-9", {
      mode: "structured",
      // no 'questions' field
    });

    const text = getResultText(result);
    expect(text).toMatch(/error/i);
  });

  it("should preserve full response object from handler", async () => {
    const handlerResponse = {
      answers: [
        { id: "q1", answer: "TypeScript" },
        { id: "q2", answer: "Vitest" },
      ],
      metadata: { respondedAt: "2026-04-07T00:00:00Z" },
    };
    mockHandler.mockResolvedValue(handlerResponse);
    const { tool } = getAskTool(true, mockHandler);

    const result = await tool.execute("call-10", {
      questions: [
        { id: "q1", question: "Language?" },
        { id: "q2", question: "Test framework?" },
      ],
    });

    // Structured mode returns the full response as JSON
    const parsed = JSON.parse(getResultText(result));
    expect(parsed.answers).toHaveLength(2);
    expect(parsed.answers[0].answer).toBe("TypeScript");
    expect(parsed.answers[1].answer).toBe("Vitest");
  });

  it("should map options, multi, and recommended fields correctly", async () => {
    mockHandler.mockResolvedValue({
      answers: [{ id: "q1", answer: "Option B" }],
    });
    const { tool, handler } = getAskTool(true, mockHandler);

    await tool.execute("call-11", {
      questions: [
        {
          id: "q1",
          question: "Pick one",
          options: [{ label: "Option A" }, { label: "Option B" }],
          multi: true,
          recommended: 1,
        },
      ],
    });

    const mapped = handler.mock.calls[0][0];
    const q = mapped.questions[0];
    expect(q.options).toEqual([
      { value: "Option A", label: "Option A" },
      { value: "Option B", label: "Option B" },
    ]);
    expect(q.allowMultiple).toBe(true);
    expect(q.recommendedIndex).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Backward compatibility
// ---------------------------------------------------------------------------

describe("ask tool -- backward compatibility", () => {
  it("should work unchanged with questions[] and no mode param", async () => {
    const handlerResponse = {
      answers: [{ id: "q1", answer: "confirmed" }],
    };
    mockHandler.mockResolvedValue(handlerResponse);
    const { tool, handler } = getAskTool(true, mockHandler);

    const result = await tool.execute("call-12", {
      questions: [{ id: "q1", question: "Confirm deployment?" }],
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const mapped = handler.mock.calls[0][0];
    expect(mapped.questions[0].text).toBe("Confirm deployment?");

    const parsed = JSON.parse(getResultText(result));
    expect(parsed.answers[0].answer).toBe("confirmed");
  });

  it("should return error when not in interactive mode", async () => {
    const { tool } = getAskTool(false);

    const result = await tool.execute("call-13", {
      questions: [{ id: "q1", question: "Hello?" }],
    });

    const text = getResultText(result);
    expect(text).toMatch(/not in interactive mode/i);
  });

  it("should handle multiple questions correctly", async () => {
    mockHandler.mockResolvedValue({
      answers: [
        { id: "q1", answer: "yes" },
        { id: "q2", answer: "no" },
        { id: "q3", answer: "maybe" },
      ],
    });
    const { tool, handler } = getAskTool(true, mockHandler);

    await tool.execute("call-14", {
      questions: [
        { id: "q1", question: "First?" },
        { id: "q2", question: "Second?" },
        { id: "q3", question: "Third?" },
      ],
    });

    const mapped = handler.mock.calls[0][0];
    expect(mapped.questions).toHaveLength(3);
    expect(mapped.questions[0].text).toBe("First?");
    expect(mapped.questions[1].text).toBe("Second?");
    expect(mapped.questions[2].text).toBe("Third?");
  });

  it("should map options/multi/recommended correctly to handler format", async () => {
    mockHandler.mockResolvedValue({
      answers: [{ id: "q1", answer: "debug" }],
    });
    const { tool, handler } = getAskTool(true, mockHandler);

    await tool.execute("call-15", {
      questions: [
        {
          id: "q1",
          question: "Build mode?",
          options: [{ label: "release" }, { label: "debug" }],
          multi: false,
          recommended: 0,
        },
      ],
    });

    const mapped = handler.mock.calls[0][0];
    const q = mapped.questions[0];
    expect(q.id).toBe("q1");
    expect(q.text).toBe("Build mode?");
    expect(q.options).toEqual([
      { value: "release", label: "release" },
      { value: "debug", label: "debug" },
    ]);
    expect(q.allowMultiple).toBe(false);
    expect(q.recommendedIndex).toBe(0);
  });
});
