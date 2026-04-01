import { describe, expect, it, vi } from "vitest";
import {
  askUserQuestionViaTool,
  buildPiWorkerSessionOptions,
  DEFAULT_INTERACTIVE_ASK_TIMEOUT_MS,
  PI_WORKER_TIMEOUT_MS,
} from "../harnessUtils";

describe("harnessUtils", () => {
  it("falls back to default answers when the interactive UI tool fails", async () => {
    const response = await askUserQuestionViaTool(
      {
        questions: [
          {
            header: "Decision",
            question: "Continue?",
            options: [
              { label: "Approve" },
              { label: "Reject" },
            ],
            allowOther: false,
            required: true,
          },
        ],
      },
      true,
      null,
      {
        hasUI: true,
        ui: {
          select: vi.fn(async () => {
            throw new Error("UI transport died");
          }),
          input: vi.fn(async () => undefined),
          confirm: vi.fn(async () => false),
        },
      },
    );

    expect(response.answers).toEqual({
      Decision: "Approve",
    });
  });

  it("applies a generous default timeout to interactive AskUserQuestion requests", async () => {
    vi.useFakeTimers();

    try {
      const responsePromise = askUserQuestionViaTool(
        {
          questions: [
            {
              header: "Scope",
              question: "Choose a scope",
              options: [
                { label: "Recommended path" },
                { label: "Alternative" },
              ],
              required: true,
            },
          ],
        },
        true,
        null,
        {
          hasUI: true,
          ui: {
            select: vi.fn(async () => new Promise<string>(() => {})),
            input: vi.fn(async () => undefined),
            confirm: vi.fn(async () => false),
          },
        },
      );

      await vi.advanceTimersByTimeAsync(DEFAULT_INTERACTIVE_ASK_TIMEOUT_MS);
      const response = await responsePromise;

      expect(response.answers).toEqual({
        Scope: "Recommended path",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses the longer PI worker timeout by default for delegated work", () => {
    const options = buildPiWorkerSessionOptions({
      action: {
        effectId: "eff-1",
        invocationKey: "inv-1",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "Do the work",
        },
      },
    });

    expect(options.timeout).toBe(PI_WORKER_TIMEOUT_MS);
    expect(options.toolsMode).toBe("coding");
    expect(options.ephemeral).toBe(true);
  });
});
