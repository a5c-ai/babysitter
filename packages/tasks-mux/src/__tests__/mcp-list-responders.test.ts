import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ResponderProfile } from "../types.js";
import type { BreakpointBackend, SubmitBreakpointParams, SubmitAnswerParams, WaitForAnswerOptions } from "../backend.js";
import type { Breakpoint, BreakpointAnswer, BreakpointWaitResult } from "../types.js";

// ────────────────────────────────────────────────────────────────────────────
// Dynamic import for the tool under test
// ────────────────────────────────────────────────────────────────────────────

async function importListResponders() {
  return import("../mcp/tools/list-responders.js");
}

// ────────────────────────────────────────────────────────────────────────────
// Test Factories
// ────────────────────────────────────────────────────────────────────────────

const NOW = "2026-04-21T10:00:00.000Z";
const LATER = "2026-04-21T10:30:00.000Z";

function makeResponder(overrides: Partial<ResponderProfile> = {}): ResponderProfile {
  return {
    id: "resp-001",
    name: "Tal M",
    title: "Senior Engineer",
    domains: ["typescript", "backend"],
    tags: ["security", "auth"],
    availability: true,
    responseTimeSla: 300_000,
    ...overrides,
  };
}

function makeBreakpoint(overrides: Partial<Breakpoint> = {}): Breakpoint {
  return {
    id: "bp-001",
    text: "Should we use connection pooling?",
    context: { description: "", codeSnippets: [], fileReferences: [], tags: [] },
    status: "pending",
    routing: { strategy: "first-response-wins", targetResponders: [], timeoutMs: 1_800_000, presentToUser: false },
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
    listResponders: vi.fn<() => Promise<ResponderProfile[]>>()
      .mockResolvedValue([
        makeResponder({ id: "resp-001", name: "Tal M", domains: ["typescript", "backend"], tags: ["security", "auth"] }),
        makeResponder({ id: "resp-002", name: "Bob K", domains: ["frontend", "react"], tags: ["ui", "css"] }),
        makeResponder({ id: "resp-003", name: "Eve L", domains: ["security", "devops"], tags: ["infra", "auth"] }),
      ]),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("MCP Tool: list-responders", () => {
  let mockBackend: BreakpointBackend;

  beforeEach(() => {
    mockBackend = createMockBackend();
  });

  describe("handleListResponders", () => {
    it("returns all responders when no filters are provided", async () => {
      const { handleListResponders } = await importListResponders();

      const result = await handleListResponders({}, mockBackend);

      expect(result).toHaveLength(3);
      expect(mockBackend.listResponders).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when backend does not support listResponders", async () => {
      const { handleListResponders } = await importListResponders();
      const backendNoResponders = createMockBackend();
      delete (backendNoResponders as Record<string, unknown>).listResponders;

      const result = await handleListResponders({}, backendNoResponders);

      expect(result).toEqual([]);
    });

    it("filters responders by domain (case-insensitive)", async () => {
      const { handleListResponders } = await importListResponders();

      const result = await handleListResponders({ domain: "TypeScript" }, mockBackend);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("resp-001");
    });

    it("filters responders by domain with partial match", async () => {
      const { handleListResponders } = await importListResponders();

      const result = await handleListResponders({ domain: "front" }, mockBackend);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("resp-002");
    });

    it("filters responders by tags", async () => {
      const { handleListResponders } = await importListResponders();

      const result = await handleListResponders({ tags: ["auth"] }, mockBackend);

      expect(result).toHaveLength(2);
      const ids = result.map((r) => r.id);
      expect(ids).toContain("resp-001");
      expect(ids).toContain("resp-003");
    });

    it("filters responders by tags matching against domains", async () => {
      const { handleListResponders } = await importListResponders();

      const result = await handleListResponders({ tags: ["react"] }, mockBackend);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("resp-002");
    });

    it("returns empty array when no responders match domain filter", async () => {
      const { handleListResponders } = await importListResponders();

      const result = await handleListResponders({ domain: "rust" }, mockBackend);

      expect(result).toEqual([]);
    });

    it("returns empty array when no responders match tags filter", async () => {
      const { handleListResponders } = await importListResponders();

      const result = await handleListResponders({ tags: ["nonexistent-tag"] }, mockBackend);

      expect(result).toEqual([]);
    });

    it("applies both domain and tags filters when provided together", async () => {
      const { handleListResponders } = await importListResponders();

      // domain=security matches resp-003, tags=auth matches resp-001 and resp-003
      // domain filter runs first, then tags filter on the already-filtered set
      const result = await handleListResponders(
        { domain: "security", tags: ["auth"] },
        mockBackend,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("resp-003");
    });

    it("handles case-insensitive tags matching", async () => {
      const { handleListResponders } = await importListResponders();

      const result = await handleListResponders({ tags: ["AUTH"] }, mockBackend);

      expect(result).toHaveLength(2);
    });

    it("returns empty array when backend returns no responders", async () => {
      const { handleListResponders } = await importListResponders();
      (mockBackend.listResponders as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await handleListResponders({}, mockBackend);

      expect(result).toEqual([]);
    });

    it("propagates backend errors", async () => {
      const { handleListResponders } = await importListResponders();
      (mockBackend.listResponders as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Backend unavailable"),
      );

      await expect(
        handleListResponders({}, mockBackend),
      ).rejects.toThrow("Backend unavailable");
    });

    it("handles empty tags array as no filter", async () => {
      const { handleListResponders } = await importListResponders();

      const result = await handleListResponders({ tags: [] }, mockBackend);

      expect(result).toHaveLength(3);
    });
  });

  describe("exports", () => {
    it("exports listRespondersDescription as a non-empty string", async () => {
      const { listRespondersDescription } = await importListResponders();
      expect(typeof listRespondersDescription).toBe("string");
      expect(listRespondersDescription.length).toBeGreaterThan(0);
    });

    it("exports listRespondersParams schema object", async () => {
      const { listRespondersParams } = await importListResponders();
      expect(listRespondersParams).toBeDefined();
      expect(listRespondersParams).toHaveProperty("domain");
      expect(listRespondersParams).toHaveProperty("tags");
      expect(listRespondersParams).toHaveProperty("backend");
      expect(listRespondersParams).toHaveProperty("breakpointsDir");
    });
  });
});
