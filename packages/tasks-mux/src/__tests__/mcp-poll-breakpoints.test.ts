import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { BreakpointBackend, SubmitBreakpointParams, SubmitAnswerParams, WaitForAnswerOptions } from "../backend.js";
import type { Breakpoint, BreakpointAnswer, BreakpointWaitResult } from "../types.js";

// ────────────────────────────────────────────────────────────────────────────
// Dynamic import for the tool under test
// ────────────────────────────────────────────────────────────────────────────

async function importPollBreakpoints() {
  return import("../mcp/tools/poll-breakpoints.js");
}

// ────────────────────────────────────────────────────────────────────────────
// Test Factories
// ────────────────────────────────────────────────────────────────────────────

const NOW = "2026-04-21T10:00:00.000Z";
const LATER = "2026-04-21T10:30:00.000Z";

function makeBreakpoint(overrides: Partial<Breakpoint> = {}): Breakpoint {
  return {
    id: "bp-001",
    text: "Should we use connection pooling?",
    context: { description: "", codeSnippets: [], fileReferences: [], tags: [] },
    status: "pending",
    routing: { strategy: "first-response-wins", targetResponders: ["tal"], timeoutMs: 1_800_000, presentToUser: false },
    answers: [],
    createdAt: NOW,
    updatedAt: NOW,
    expiresAt: LATER,
    ...overrides,
  };
}

function makeAnswer(overrides: Partial<BreakpointAnswer> = {}): BreakpointAnswer {
  return {
    id: "answer-001",
    breakpointId: "bp-001",
    responderId: "tal",
    responderName: "Tal M",
    text: "Yes.",
    approved: true,
    confidence: 90,
    references: [],
    followUpQuestions: [],
    answeredAt: NOW,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Mock Backend Factory
// ────────────────────────────────────────────────────────────────────────────

function createMockBackend(overrides: Partial<BreakpointBackend> = {}): BreakpointBackend {
  return {
    name: "mock-backend",
    submitBreakpoint: vi.fn<(params: SubmitBreakpointParams) => Promise<Breakpoint>>()
      .mockResolvedValue(makeBreakpoint()),
    getBreakpoint: vi.fn<(id: string) => Promise<Breakpoint>>()
      .mockResolvedValue(makeBreakpoint()),
    waitForAnswer: vi.fn<(id: string, options?: WaitForAnswerOptions) => Promise<BreakpointWaitResult>>()
      .mockResolvedValue({
        answered: true,
        breakpoint: makeBreakpoint({ status: "answered", answers: [makeAnswer()] }),
        answer: makeAnswer(),
        allAnswers: [makeAnswer()],
        elapsedMs: 5000,
      }),
    listPendingBreakpoints: vi.fn<(responderId?: string) => Promise<Breakpoint[]>>()
      .mockResolvedValue([]),
    answerBreakpoint: vi.fn<(id: string, answer: SubmitAnswerParams) => Promise<BreakpointAnswer>>()
      .mockResolvedValue(makeAnswer()),
    cancelBreakpoint: vi.fn<(id: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("MCP Tool: poll-breakpoints", () => {
  let mockBackend: BreakpointBackend;

  beforeEach(() => {
    vi.useFakeTimers();
    mockBackend = createMockBackend();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("handlePollBreakpoints", () => {
    it("calls backend.listPendingBreakpoints with responderId", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();

      await handlePollBreakpoints({ responderId: "tal" }, mockBackend);

      expect(mockBackend.listPendingBreakpoints).toHaveBeenCalledTimes(1);
      expect(mockBackend.listPendingBreakpoints).toHaveBeenCalledWith("tal");
    });

    it("returns empty array when no breakpoints are pending", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();

      const result = await handlePollBreakpoints({ responderId: "tal" }, mockBackend);

      expect(result).toEqual([]);
    });

    it("returns breakpoints immediately when available (waitSeconds=0)", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();
      const bps = [makeBreakpoint({ id: "bp-001" }), makeBreakpoint({ id: "bp-002" })];
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockResolvedValue(bps);

      const result = await handlePollBreakpoints({ responderId: "tal", waitSeconds: 0 }, mockBackend);

      expect(result).toHaveLength(2);
      expect(mockBackend.listPendingBreakpoints).toHaveBeenCalledTimes(1);
    });

    it("returns breakpoints immediately when available even if waitSeconds > 0", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();
      const bps = [makeBreakpoint()];
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockResolvedValue(bps);

      const result = await handlePollBreakpoints({ responderId: "tal", waitSeconds: 30 }, mockBackend);

      expect(result).toHaveLength(1);
      // Should not have needed to poll since breakpoints were found immediately
      expect(mockBackend.listPendingBreakpoints).toHaveBeenCalledTimes(1);
    });

    it("throws when responderId is empty", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();

      await expect(
        handlePollBreakpoints({ responderId: "" }, mockBackend),
      ).rejects.toThrow("responderId is required and must be non-empty");
    });

    it("defaults waitSeconds to 0 (immediate return)", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();

      const result = await handlePollBreakpoints({ responderId: "tal" }, mockBackend);

      // Should return immediately without polling
      expect(mockBackend.listPendingBreakpoints).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it("polls with waitSeconds and finds breakpoints on retry", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();
      let callCount = 0;
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callCount++;
        if (callCount >= 2) {
          return [makeBreakpoint()];
        }
        return [];
      });

      const pollPromise = handlePollBreakpoints({ responderId: "tal", waitSeconds: 10 }, mockBackend);

      // Advance past the 2-second polling interval
      await vi.advanceTimersByTimeAsync(2000);

      const result = await pollPromise;
      expect(result).toHaveLength(1);
      expect(callCount).toBe(2);
    });

    it("returns empty array when waitSeconds expires with no breakpoints", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const pollPromise = handlePollBreakpoints({ responderId: "tal", waitSeconds: 4 }, mockBackend);

      // Advance enough time to cover the wait period
      await vi.advanceTimersByTimeAsync(6000);

      const result = await pollPromise;
      expect(result).toEqual([]);
    });

    it("propagates backend errors", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      await expect(
        handlePollBreakpoints({ responderId: "tal" }, mockBackend),
      ).rejects.toThrow("Network error");
    });

    it("returns breakpoints filtered by responderId", async () => {
      const { handlePollBreakpoints } = await importPollBreakpoints();
      const bps = [
        makeBreakpoint({ id: "bp-for-tal", routing: { strategy: "first-response-wins", targetResponders: ["tal"], timeoutMs: 1_800_000, presentToUser: false } }),
      ];
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockResolvedValue(bps);

      const result = await handlePollBreakpoints({ responderId: "tal" }, mockBackend);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("bp-for-tal");
    });
  });

  describe("exports", () => {
    it("exports pollBreakpointsDescription as a non-empty string", async () => {
      const { pollBreakpointsDescription } = await importPollBreakpoints();
      expect(typeof pollBreakpointsDescription).toBe("string");
      expect(pollBreakpointsDescription.length).toBeGreaterThan(0);
    });

    it("exports pollBreakpointsParams schema object", async () => {
      const { pollBreakpointsParams } = await importPollBreakpoints();
      expect(pollBreakpointsParams).toBeDefined();
      expect(pollBreakpointsParams).toHaveProperty("responderId");
      expect(pollBreakpointsParams).toHaveProperty("waitSeconds");
      expect(pollBreakpointsParams).toHaveProperty("backend");
      expect(pollBreakpointsParams).toHaveProperty("breakpointsDir");
    });
  });
});
