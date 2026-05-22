import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Breakpoint, BreakpointWaitResult } from "../types.js";
import type { BreakpointBackend, SubmitBreakpointParams, SubmitAnswerParams, WaitForAnswerOptions } from "../backend.js";
import { AnswerPoller } from "../client/answer-poller.js";
import { ServerClient } from "../client/server-client.js";

// ────────────────────────────────────────────────────────────────────────────
// Factories
// ────────────────────────────────────────────────────────────────────────────

const NOW = "2026-04-21T10:00:00.000Z";
const LATER = "2026-04-21T10:30:00.000Z";

function makeBreakpoint(overrides: Partial<Breakpoint> = {}): Breakpoint {
  return {
    id: "bp-001",
    text: "Test breakpoint",
    context: { description: "", codeSnippets: [], fileReferences: [], tags: [] },
    status: "pending",
    routing: { strategy: "single", targetResponders: [], timeoutMs: 1_800_000, presentToUser: false },
    answers: [],
    createdAt: NOW,
    updatedAt: NOW,
    expiresAt: LATER,
    ...overrides,
  };
}

function makeWaitResult(overrides: Partial<BreakpointWaitResult> = {}): BreakpointWaitResult {
  return {
    answered: true,
    breakpoint: makeBreakpoint({ status: "answered" }),
    answer: {
      id: "answer-001",
      breakpointId: "bp-001",
      responderId: "tal",
      responderName: "Tal M",
      text: "Yes.",
      confidence: 90,
      references: [],
      followUpQuestions: [],
      answeredAt: NOW,
    },
    allAnswers: [],
    elapsedMs: 1000,
    ...overrides,
  };
}

function createMockBackend(overrides: Partial<BreakpointBackend> = {}): BreakpointBackend {
  return {
    name: "mock-backend",
    submitBreakpoint: vi.fn<(params: SubmitBreakpointParams) => Promise<Breakpoint>>().mockResolvedValue(makeBreakpoint()),
    getBreakpoint: vi.fn<(id: string) => Promise<Breakpoint>>().mockResolvedValue(makeBreakpoint()),
    waitForAnswer: vi.fn<(id: string, options?: WaitForAnswerOptions) => Promise<BreakpointWaitResult>>().mockResolvedValue(makeWaitResult()),
    listPendingBreakpoints: vi.fn<(responderId?: string) => Promise<Breakpoint[]>>().mockResolvedValue([]),
    answerBreakpoint: vi.fn<(id: string, answer: SubmitAnswerParams) => Promise<any>>().mockResolvedValue({}),
    cancelBreakpoint: vi.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("AnswerPoller", () => {
  // ── Backend mode ────────────────────────────────────────────────────────

  describe("with BreakpointBackend", () => {
    it("should delegate waitForAnswer to backend", async () => {
      const backend = createMockBackend();
      const poller = new AnswerPoller(backend);

      await poller.waitForAnswer("bp-001");

      expect(backend.waitForAnswer).toHaveBeenCalledTimes(1);
      expect(backend.waitForAnswer).toHaveBeenCalledWith("bp-001", expect.any(Object));
    });

    it("should pass timeout options to backend", async () => {
      const backend = createMockBackend();
      const poller = new AnswerPoller(backend);

      await poller.waitForAnswer("bp-001", { timeoutMs: 60_000, pollIntervalMs: 500 });

      const callArgs = (backend.waitForAnswer as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callArgs.timeoutMs).toBe(60_000);
      expect(callArgs.pollIntervalMs).toBe(500);
    });

    it("should pass useSSE option as preferStreaming to backend", async () => {
      const backend = createMockBackend();
      const poller = new AnswerPoller(backend);

      await poller.waitForAnswer("bp-001", { useSSE: true });

      const callArgs = (backend.waitForAnswer as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callArgs.preferStreaming).toBe(true);
    });

    it("should pass signal option to backend", async () => {
      const backend = createMockBackend();
      const poller = new AnswerPoller(backend);
      const controller = new AbortController();

      await poller.waitForAnswer("bp-001", { signal: controller.signal });

      const callArgs = (backend.waitForAnswer as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callArgs.signal).toBe(controller.signal);
    });

    it("should return the backend's wait result", async () => {
      const waitResult = makeWaitResult({ elapsedMs: 12345 });
      const backend = createMockBackend({
        waitForAnswer: vi.fn().mockResolvedValue(waitResult),
      });
      const poller = new AnswerPoller(backend);

      const result = await poller.waitForAnswer("bp-001");

      expect(result.elapsedMs).toBe(12345);
      expect(result.answered).toBe(true);
    });

    it("should propagate backend errors", async () => {
      const backend = createMockBackend({
        waitForAnswer: vi.fn().mockRejectedValue(new Error("Backend failed")),
      });
      const poller = new AnswerPoller(backend);

      await expect(poller.waitForAnswer("bp-001")).rejects.toThrow("Backend failed");
    });
  });

  // ── ServerClient mode (polling) ─────────────────────────────────────────

  describe("with ServerClient (polling)", () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFetch = vi.fn<typeof globalThis.fetch>();
      vi.stubGlobal("fetch", mockFetch);
    });

    function jsonResp(data: unknown, status = 200): Response {
      return {
        ok: status >= 200 && status < 300,
        status,
        statusText: "OK",
        json: async () => data,
        text: async () => JSON.stringify(data),
        headers: new Headers(),
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        clone: () => jsonResp(data, status),
        formData: async () => new FormData(),
        redirected: false,
        type: "basic",
        url: "",
        bytes: async () => new Uint8Array(),
      } as Response;
    }

    it("should resolve when breakpoint reaches answered status via polling", async () => {
      const answeredBp = makeBreakpoint({
        status: "answered",
        answers: [{
          id: "answer-001",
          breakpointId: "bp-001",
          responderId: "tal",
          responderName: "Tal M",
          text: "Yes.",
          confidence: 80,
          references: [],
          followUpQuestions: [],
          answeredAt: NOW,
        }],
      });
      mockFetch.mockResolvedValue(jsonResp(answeredBp));

      const client = new ServerClient("https://api.example.com/api/v1");
      const poller = new AnswerPoller(client);

      const result = await poller.waitForAnswer("bp-001", {
        useSSE: false,
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });

      expect(result.answered).toBe(true);
      expect(result.answer?.text).toBe("Yes.");
    });

    it("should resolve with cancelled status when breakpoint is cancelled", async () => {
      const cancelledBp = makeBreakpoint({ status: "cancelled" });
      mockFetch.mockResolvedValue(jsonResp(cancelledBp));

      const client = new ServerClient("https://api.example.com/api/v1");
      const poller = new AnswerPoller(client);

      const result = await poller.waitForAnswer("bp-001", {
        useSSE: false,
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("cancelled");
    });

    it("should resolve with expired status", async () => {
      const expiredBp = makeBreakpoint({ status: "expired" });
      mockFetch.mockResolvedValue(jsonResp(expiredBp));

      const client = new ServerClient("https://api.example.com/api/v1");
      const poller = new AnswerPoller(client);

      const result = await poller.waitForAnswer("bp-001", {
        useSSE: false,
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("expired");
    });

    it("should abort when signal is already aborted", async () => {
      const pendingBp = makeBreakpoint({ status: "pending" });
      mockFetch.mockResolvedValue(jsonResp(pendingBp));

      const client = new ServerClient("https://api.example.com/api/v1");
      const poller = new AnswerPoller(client);
      const controller = new AbortController();
      controller.abort();

      const result = await poller.waitForAnswer("bp-001", {
        useSSE: false,
        pollIntervalMs: 50,
        timeoutMs: 5_000,
        signal: controller.signal,
      });

      expect(result.answered).toBe(false);
    });

    it("should propagate network errors from polling", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const client = new ServerClient("https://api.example.com/api/v1");
      const poller = new AnswerPoller(client);

      // When getBreakpoint fails in the polling loop, the error propagates
      await expect(
        poller.waitForAnswer("bp-001", {
          useSSE: false,
          pollIntervalMs: 50,
          timeoutMs: 200,
        }),
      ).rejects.toThrow("Network error");
    });

    it("should include elapsedMs in the result", async () => {
      const answeredBp = makeBreakpoint({
        status: "answered",
        answers: [{
          id: "a1",
          breakpointId: "bp-001",
          responderId: "tal",
          responderName: "Tal M",
          text: "Yes.",
          confidence: 80,
          references: [],
          followUpQuestions: [],
          answeredAt: NOW,
        }],
      });
      mockFetch.mockResolvedValue(jsonResp(answeredBp));

      const client = new ServerClient("https://api.example.com/api/v1");
      const poller = new AnswerPoller(client);

      const result = await poller.waitForAnswer("bp-001", {
        useSSE: false,
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });

      expect(result.elapsedMs).toBeDefined();
      expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it("should include allAnswers in the result", async () => {
      const answeredBp = makeBreakpoint({
        status: "answered",
        answers: [
          {
            id: "a1", breakpointId: "bp-001", responderId: "tal", responderName: "Tal M",
            text: "Answer 1", confidence: 80, references: [], followUpQuestions: [], answeredAt: NOW,
          },
          {
            id: "a2", breakpointId: "bp-001", responderId: "alice", responderName: "Alice",
            text: "Answer 2", confidence: 90, references: [], followUpQuestions: [], answeredAt: NOW,
          },
        ],
      });
      mockFetch.mockResolvedValue(jsonResp(answeredBp));

      const client = new ServerClient("https://api.example.com/api/v1");
      const poller = new AnswerPoller(client);

      const result = await poller.waitForAnswer("bp-001", {
        useSSE: false,
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });

      expect(result.allAnswers).toHaveLength(2);
    });
  });
});
