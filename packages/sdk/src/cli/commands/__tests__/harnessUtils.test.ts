import { describe, expect, it, vi } from "vitest";
import {
  askUserQuestionViaTool,
  buildPiWorkerSessionOptions,
  promptPiWithRetry,
  DEFAULT_INTERACTIVE_ASK_TIMEOUT_MS,
  PI_WORKER_TIMEOUT_MS,
} from "../harnessUtils";
import { BabysitterRuntimeError, ErrorCategory } from "../../../runtime/exceptions";
import type { PiSessionHandle } from "../../../harness/piWrapper";

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

  it("does not override an explicit timeout of 0 (infinite) for interactive AskUserQuestion", async () => {
    // timeout=0 means "wait forever" — do NOT apply the default timeout.
    let selectCalled = false;
    const neverResolve = new Promise<string>(() => {
      selectCalled = true;
    });

    vi.useFakeTimers();
    try {
      const responsePromise = askUserQuestionViaTool(
        {
          questions: [
            {
              header: "Infinite",
              question: "Wait forever?",
              options: [
                { label: "Yes" },
                { label: "No" },
              ],
              required: true,
            },
          ],
          timeout: 0,
        },
        true,
        null,
        {
          hasUI: true,
          ui: {
            select: vi.fn(async () => neverResolve),
            input: vi.fn(async () => undefined),
            confirm: vi.fn(async () => false),
          },
        },
      );

      // Advance well past the default interactive timeout
      await vi.advanceTimersByTimeAsync(DEFAULT_INTERACTIVE_ASK_TIMEOUT_MS * 2);

      // The promise should still be pending (not timed out)
      const raceResult = await Promise.race([
        responsePromise.then(() => "resolved"),
        Promise.resolve("still-pending"),
      ]);
      expect(selectCalled).toBe(true);
      expect(raceResult).toBe("still-pending");
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

  describe("promptPiWithRetry", () => {
    function createMockSession(
      promptImpl: (text: string, timeout?: number) => Promise<{ success: boolean; output: string; exitCode: number; duration: number }>,
    ): PiSessionHandle {
      return {
        prompt: vi.fn(promptImpl),
        initialize: vi.fn(),
        dispose: vi.fn(),
        subscribe: vi.fn(() => () => {}),
        abort: vi.fn(),
        steer: vi.fn(),
        followUp: vi.fn(),
        executeBash: vi.fn(),
        getLastAssistantText: vi.fn(() => ""),
      } as unknown as PiSessionHandle;
    }

    it("retries on PiTimeoutError and eventually throws after max retries", async () => {
      const timeoutError = new BabysitterRuntimeError(
        "PiTimeoutError",
        "Pi prompt timed out after 900000ms",
        { category: ErrorCategory.External },
      );
      const session = createMockSession(async () => {
        throw timeoutError;
      });

      await expect(
        promptPiWithRetry({
          session,
          message: "test",
          timeout: 900_000,
          label: "test",
        }),
      ).rejects.toThrow("Pi prompt timed out after 900000ms");

      // Initial attempt + retries (TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS has 2 entries in VITEST)
      expect(session.prompt).toHaveBeenCalledTimes(3);
    });

    it("returns the result when the prompt succeeds", async () => {
      const session = createMockSession(async () => ({
        success: true,
        output: "done",
        exitCode: 0,
        duration: 100,
      }));

      const result = await promptPiWithRetry({
        session,
        message: "hello",
        timeout: 10_000,
        label: "test",
      });

      expect(result.success).toBe(true);
      expect(result.output).toBe("done");
      expect(session.prompt).toHaveBeenCalledTimes(1);
    });

    it("does not retry non-retryable errors", async () => {
      const session = createMockSession(async () => {
        throw new Error("something completely different");
      });

      await expect(
        promptPiWithRetry({
          session,
          message: "test",
          timeout: 10_000,
          label: "test",
        }),
      ).rejects.toThrow("something completely different");

      expect(session.prompt).toHaveBeenCalledTimes(1);
    });
  });
});
