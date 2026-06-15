import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Breakpoint, BreakpointContext, BreakpointRouting, BreakpointWaitResult } from "../types.js";
import type { BreakpointBackend, SubmitBreakpointParams, SubmitAnswerParams, WaitForAnswerOptions } from "../backend.js";
import { BreakpointRouter } from "../client/breakpoint-router.js";

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

function makeContext(overrides: Partial<BreakpointContext> = {}): BreakpointContext {
  return {
    description: "A test question",
    codeSnippets: [],
    fileReferences: [],
    tags: [],
    ...overrides,
  };
}

function makeRouting(overrides: Partial<BreakpointRouting> = {}): BreakpointRouting {
  return {
    strategy: "first-response-wins",
    targetResponders: [],
    timeoutMs: 1_800_000,
    presentToUser: false,
    ...overrides,
  };
}

function createMockBackend(overrides: Partial<BreakpointBackend> = {}): BreakpointBackend {
  return {
    name: "mock-backend",
    submitBreakpoint: vi.fn<(params: SubmitBreakpointParams) => Promise<Breakpoint>>().mockResolvedValue(makeBreakpoint()),
    getBreakpoint: vi.fn<(id: string) => Promise<Breakpoint>>().mockResolvedValue(makeBreakpoint()),
    waitForAnswer: vi.fn<(id: string, options?: WaitForAnswerOptions) => Promise<BreakpointWaitResult>>().mockResolvedValue({} as BreakpointWaitResult),
    listPendingBreakpoints: vi.fn<(responderId?: string) => Promise<Breakpoint[]>>().mockResolvedValue([]),
    answerBreakpoint: vi.fn<(id: string, answer: SubmitAnswerParams) => Promise<any>>().mockResolvedValue({}),
    cancelBreakpoint: vi.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("BreakpointRouter", () => {
  let mockBackend: BreakpointBackend;
  let router: BreakpointRouter;

  beforeEach(() => {
    mockBackend = createMockBackend();
    router = new BreakpointRouter(mockBackend);
  });

  // ── submitBreakpoint ────────────────────────────────────────────────────

  describe("submitBreakpoint()", () => {
    it("should delegate to backend.submitBreakpoint with correct params", async () => {
      const context = makeContext();
      const routing = makeRouting();

      await router.submitBreakpoint("Test question", context, routing);

      expect(mockBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.text).toBe("Test question");
      expect(callArgs.context).toBe(context);
      expect(callArgs.routing).toBe(routing);
    });

    it("should pass projectId when provided", async () => {
      await router.submitBreakpoint("Test", makeContext(), makeRouting(), "proj-1");

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.projectId).toBe("proj-1");
    });

    it("should pass repoId when provided", async () => {
      await router.submitBreakpoint("Test", makeContext(), makeRouting(), undefined, "repo-1");

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.repoId).toBe("repo-1");
    });

    it("should return the breakpoint from the backend", async () => {
      const bp = makeBreakpoint({ id: "bp-new", text: "New question" });
      (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await router.submitBreakpoint("New question", makeContext(), makeRouting());

      expect(result.id).toBe("bp-new");
      expect(result.text).toBe("New question");
    });

    it("should propagate backend errors", async () => {
      (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Submit failed"),
      );

      await expect(
        router.submitBreakpoint("Test", makeContext(), makeRouting()),
      ).rejects.toThrow("Submit failed");
    });
  });

  // ── routeToResponders ───────────────────────────────────────────────────

  describe("routeToResponders()", () => {
    it("should submit breakpoint with responder IDs in routing", async () => {
      const context = makeContext();

      await router.routeToResponders(
        "Need security review",
        context,
        ["alice", "bob"],
        { strategy: "first-response-wins", timeoutMs: 60_000 },
      );

      expect(mockBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.routing.targetResponders).toEqual(["alice", "bob"]);
      expect(callArgs.routing.strategy).toBe("first-response-wins");
      expect(callArgs.routing.timeoutMs).toBe(60_000);
    });

    it("should set presentToUser from options", async () => {
      await router.routeToResponders(
        "Approval needed",
        makeContext(),
        ["tal"],
        { strategy: "single", timeoutMs: 30_000, presentToUser: true },
      );

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.routing.presentToUser).toBe(true);
    });

    it("should default presentToUser to false", async () => {
      await router.routeToResponders(
        "Question",
        makeContext(),
        ["tal"],
        { strategy: "single", timeoutMs: 30_000 },
      );

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.routing.presentToUser).toBe(false);
    });

    it("should pass projectId and repoId when provided", async () => {
      await router.routeToResponders(
        "Question",
        makeContext(),
        ["tal"],
        { strategy: "single", timeoutMs: 30_000 },
        "proj-1",
        "repo-1",
      );

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.projectId).toBe("proj-1");
      expect(callArgs.repoId).toBe("repo-1");
    });

    it("should return the created breakpoint", async () => {
      const bp = makeBreakpoint({ id: "bp-routed" });
      (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await router.routeToResponders(
        "Question",
        makeContext(),
        ["tal"],
        { strategy: "single", timeoutMs: 30_000 },
      );

      expect(result.id).toBe("bp-routed");
    });

    it("should support collect-all strategy", async () => {
      await router.routeToResponders(
        "Team question",
        makeContext(),
        ["alice", "bob", "charlie"],
        { strategy: "collect-all", timeoutMs: 120_000 },
      );

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.routing.strategy).toBe("collect-all");
      expect(callArgs.routing.targetResponders).toHaveLength(3);
    });
  });

  // ── generateBreakpointId ────────────────────────────────────────────────

  describe("generateBreakpointId()", () => {
    it("should return a non-empty string", () => {
      const id = router.generateBreakpointId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("should return unique IDs on each call", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 20; i++) {
        ids.add(router.generateBreakpointId());
      }
      expect(ids.size).toBe(20);
    });

    it("should return a hex string", () => {
      const id = router.generateBreakpointId();
      expect(id).toMatch(/^[0-9a-f]+$/);
    });
  });
});
