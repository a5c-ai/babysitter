import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BreakpointBackend, SubmitBreakpointParams, SubmitAnswerParams, WaitForAnswerOptions } from "../backend.js";
import type { Breakpoint, BreakpointAnswer, BreakpointWaitResult, ResponderProfile } from "../types.js";

// ────────────────────────────────────────────────────────────────────────────
// Dynamic import for the tool under test
// ────────────────────────────────────────────────────────────────────────────

async function importClaimBreakpoint() {
  return import("../mcp/tools/claim-breakpoint.js");
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
      .mockResolvedValue([makeBreakpoint()]),
    answerBreakpoint: vi.fn<(id: string, answer: SubmitAnswerParams) => Promise<BreakpointAnswer>>()
      .mockResolvedValue(makeAnswer()),
    cancelBreakpoint: vi.fn<(id: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    claimBreakpoint: vi.fn<(id: string, responderId: string) => Promise<Breakpoint>>()
      .mockResolvedValue(makeBreakpoint({ status: "claimed", claimedByResponderId: "tal" })),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("MCP Tool: claim-breakpoint", () => {
  let mockBackend: BreakpointBackend;

  beforeEach(() => {
    mockBackend = createMockBackend();
  });

  describe("handleClaimBreakpoint", () => {
    it("calls backend.claimBreakpoint with correct params", async () => {
      const { handleClaimBreakpoint } = await importClaimBreakpoint();

      await handleClaimBreakpoint(
        { breakpointId: "bp-001", responderId: "tal" },
        mockBackend,
      );

      expect(mockBackend.claimBreakpoint).toHaveBeenCalledTimes(1);
      expect(mockBackend.claimBreakpoint).toHaveBeenCalledWith("bp-001", "tal");
    });

    it("returns the claimed breakpoint", async () => {
      const { handleClaimBreakpoint } = await importClaimBreakpoint();

      const result = await handleClaimBreakpoint(
        { breakpointId: "bp-001", responderId: "tal" },
        mockBackend,
      );

      expect(result.status).toBe("claimed");
      expect(result.claimedByResponderId).toBe("tal");
    });

    it("throws when breakpointId is empty", async () => {
      const { handleClaimBreakpoint } = await importClaimBreakpoint();

      await expect(
        handleClaimBreakpoint(
          { breakpointId: "", responderId: "tal" },
          mockBackend,
        ),
      ).rejects.toThrow("breakpointId is required and must be non-empty");
    });

    it("throws when responderId is empty", async () => {
      const { handleClaimBreakpoint } = await importClaimBreakpoint();

      await expect(
        handleClaimBreakpoint(
          { breakpointId: "bp-001", responderId: "" },
          mockBackend,
        ),
      ).rejects.toThrow("responderId is required and must be non-empty");
    });

    it("throws when backend does not support claimBreakpoint", async () => {
      const { handleClaimBreakpoint } = await importClaimBreakpoint();
      const backendNoClaim = createMockBackend();
      delete (backendNoClaim as Record<string, unknown>).claimBreakpoint;

      await expect(
        handleClaimBreakpoint(
          { breakpointId: "bp-001", responderId: "tal" },
          backendNoClaim,
        ),
      ).rejects.toThrow(/does not support claiming/);
    });

    it("includes backend name in error when claimBreakpoint not supported", async () => {
      const { handleClaimBreakpoint } = await importClaimBreakpoint();
      const backendNoClaim = createMockBackend();
      backendNoClaim.name = "my-special-backend";
      delete (backendNoClaim as Record<string, unknown>).claimBreakpoint;

      await expect(
        handleClaimBreakpoint(
          { breakpointId: "bp-001", responderId: "tal" },
          backendNoClaim,
        ),
      ).rejects.toThrow("my-special-backend");
    });

    it("propagates backend errors from claimBreakpoint", async () => {
      const { handleClaimBreakpoint } = await importClaimBreakpoint();
      (mockBackend.claimBreakpoint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Breakpoint already claimed"),
      );

      await expect(
        handleClaimBreakpoint(
          { breakpointId: "bp-001", responderId: "tal" },
          mockBackend,
        ),
      ).rejects.toThrow("Breakpoint already claimed");
    });

    it("returns breakpoint with preserved routing info", async () => {
      const { handleClaimBreakpoint } = await importClaimBreakpoint();
      const claimed = makeBreakpoint({
        status: "claimed",
        claimedByResponderId: "bob",
        routing: {
          strategy: "collect-all",
          targetResponders: ["bob", "tal"],
          timeoutMs: 600_000,
          presentToUser: true,
        },
      });
      (mockBackend.claimBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(claimed);

      const result = await handleClaimBreakpoint(
        { breakpointId: "bp-001", responderId: "bob" },
        mockBackend,
      );

      expect(result.routing.strategy).toBe("collect-all");
      expect(result.routing.targetResponders).toEqual(["bob", "tal"]);
    });
  });

  describe("exports", () => {
    it("exports claimBreakpointDescription as a non-empty string", async () => {
      const { claimBreakpointDescription } = await importClaimBreakpoint();
      expect(typeof claimBreakpointDescription).toBe("string");
      expect(claimBreakpointDescription.length).toBeGreaterThan(0);
    });

    it("exports claimBreakpointParams schema object", async () => {
      const { claimBreakpointParams } = await importClaimBreakpoint();
      expect(claimBreakpointParams).toBeDefined();
      expect(claimBreakpointParams).toHaveProperty("breakpointId");
      expect(claimBreakpointParams).toHaveProperty("responderId");
      expect(claimBreakpointParams).toHaveProperty("backend");
      expect(claimBreakpointParams).toHaveProperty("breakpointsDir");
    });
  });
});
