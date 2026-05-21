import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointContext,
  BreakpointRouting,
  BreakpointWaitResult,
  ProvenBreakpointAnswer,
  ProvenVerificationResult,
} from "../types.js";
import type {
  BreakpointBackend,
  SubmitBreakpointParams,
  SubmitAnswerParams,
  WaitForAnswerOptions,
} from "../backend.js";

// ────────────────────────────────────────────────────────────────────────────
// Dynamic imports for MCP tool handlers.
// These are loaded lazily so that individual test failures are visible
// rather than a single top-level import failure blocking all tests.
// ────────────────────────────────────────────────────────────────────────────

async function importAskBreakpoint() {
  return import("../mcp/tools/ask-breakpoint.js");
}

async function importCheckStatus() {
  return import("../mcp/tools/check-status.js");
}

async function importListBreakpoints() {
  return import("../mcp/tools/list-breakpoints.js");
}

async function importAnswerBreakpoint() {
  return import("../mcp/tools/answer-breakpoint.js");
}

async function importVerifyAnswer() {
  return import("../mcp/tools/verify-answer.js");
}

async function importBackendResolver() {
  return import("../mcp/backend-resolver.js");
}

async function importMcpServer() {
  return import("../mcp/server.js");
}

// ────────────────────────────────────────────────────────────────────────────
// Test Factories
// ────────────────────────────────────────────────────────────────────────────

const NOW = "2026-04-21T10:00:00.000Z";
const LATER = "2026-04-21T10:30:00.000Z";

function makeContext(overrides: Partial<BreakpointContext> = {}): BreakpointContext {
  return {
    description: "A test breakpoint",
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

function makeBreakpoint(overrides: Partial<Breakpoint> = {}): Breakpoint {
  return {
    id: "bp-001",
    text: "Should we use connection pooling?",
    context: makeContext(),
    status: "pending",
    routing: makeRouting(),
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
    text: "Yes, use connection pooling with ioredis.",
    approved: true,
    confidence: 90,
    references: ["https://github.com/redis/ioredis#cluster"],
    followUpQuestions: [],
    answeredAt: NOW,
    ...overrides,
  };
}

function makeWaitResult(overrides: Partial<BreakpointWaitResult> = {}): BreakpointWaitResult {
  const answer = makeAnswer();
  return {
    answered: true,
    breakpoint: makeBreakpoint({ status: "answered", answers: [answer] }),
    answer,
    allAnswers: [answer],
    elapsedMs: 5000,
    ...overrides,
  };
}

function makeProvenAnswer(overrides: Partial<ProvenBreakpointAnswer> = {}): ProvenBreakpointAnswer {
  return {
    ...makeAnswer(),
    signature: "base64signaturedata==",
    publicKeyFingerprint: "abc123fingerprint",
    signedAt: NOW,
    signedFields: ["id", "breakpointId", "responderId", "text", "approved", "confidence", "answeredAt"],
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
      .mockResolvedValue(makeWaitResult()),
    listPendingBreakpoints: vi.fn<(responderId?: string) => Promise<Breakpoint[]>>()
      .mockResolvedValue([makeBreakpoint()]),
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

describe("MCP Server Tools", () => {
  let mockBackend: BreakpointBackend;

  beforeEach(() => {
    mockBackend = createMockBackend();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 1: ask_breakpoint tool handler
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleAskBreakpoint", () => {
    it("calls backend.submitBreakpoint with constructed params", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      const result = await handleAskBreakpoint({
        question: "Should we use connection pooling?",
      }, mockBackend);

      expect(mockBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.text).toBe("Should we use connection pooling?");
    });

    it("calls backend.waitForAnswer after submit", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const bp = makeBreakpoint({ id: "bp-new" });
      (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      await handleAskBreakpoint({
        question: "Should we use connection pooling?",
      }, mockBackend);

      expect(mockBackend.waitForAnswer).toHaveBeenCalledTimes(1);
      expect((mockBackend.waitForAnswer as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("bp-new");
    });

    it("returns the BreakpointWaitResult from backend", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const waitResult = makeWaitResult({ elapsedMs: 12345 });
      (mockBackend.waitForAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(waitResult);

      const result = await handleAskBreakpoint({
        question: "Should we use connection pooling?",
      }, mockBackend);

      expect(result.answered).toBe(true);
      expect(result.elapsedMs).toBe(12345);
    });

    it("passes context description from the context param", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Should we use connection pooling?",
        context: "We are seeing high latency under load.",
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.context.description).toBe("We are seeing high latency under load.");
    });

    it("passes markdown as context.markdown", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Review this approach",
        markdown: "## Approach\n\nUse Redis.",
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.context.markdown).toBe("## Approach\n\nUse Redis.");
    });

    it("passes codeSnippets to context", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const snippets = [{ filename: "main.ts", code: "console.log('hi')", language: "typescript" }];

      await handleAskBreakpoint({
        question: "Is this correct?",
        codeSnippets: snippets,
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.context.codeSnippets).toEqual(snippets);
    });

    it("passes fileReferences to context", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Is this correct?",
        fileReferences: ["src/main.ts", "src/util.ts"],
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.context.fileReferences).toEqual(["src/main.ts", "src/util.ts"]);
    });

    it("passes tags to context", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Security question",
        tags: ["security", "auth"],
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.context.tags).toEqual(["security", "auth"]);
    });

    it("passes domain to context", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Backend question",
        domain: "backend",
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.context.domain).toBe("backend");
    });

    it("passes urgency to context", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Urgent question",
        urgency: "high",
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.context.urgency).toBe("high");
    });

    it("passes interactionKind to context", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Approval needed",
        interactionKind: "approval",
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.context.interactionKind).toBe("approval");
    });

    it("passes targetResponders to routing", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Question for Tal",
        targetResponders: ["tal", "bob"],
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.routing.targetResponders).toEqual(["tal", "bob"]);
    });

    it("passes routingStrategy to routing.strategy", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Question for team",
        routingStrategy: "collect-all",
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.routing.strategy).toBe("collect-all");
    });

    it("defaults routingStrategy to first-response-wins", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Question for team",
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.routing.strategy).toBe("first-response-wins");
    });

    it("passes timeout to waitForAnswer options", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Question",
        timeout: 60_000,
      }, mockBackend);

      const waitArgs = (mockBackend.waitForAnswer as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(waitArgs[1]).toMatchObject({ timeoutMs: 60_000 });
    });

    it("passes timeout to routing.timeoutMs", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Question",
        timeout: 60_000,
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.routing.timeoutMs).toBe(60_000);
    });

    it("passes breakpointId to routing.breakpointId", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Canonical question",
        breakpointId: "my-canonical-bp-id",
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.routing.breakpointId).toBe("my-canonical-bp-id");
    });

    it("passes proven=true through submitBreakpoint params", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const gitBackend = createMockBackend({ name: "git-native" });
      const provenAnswer = makeProvenAnswer();
      (gitBackend.waitForAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeWaitResult({
          answer: provenAnswer,
          allAnswers: [provenAnswer],
          breakpoint: makeBreakpoint({
            status: "answered",
            answers: [provenAnswer],
          }),
        }),
      );

      await handleAskBreakpoint({
        question: "Need a signed answer",
        proven: true,
      }, gitBackend);

      const callArgs = (gitBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.proven).toBe(true);
    });

    it("enforces that proven answers are actually signed", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const unsignedAnswer = makeAnswer();
      const waitResult = makeWaitResult({
        answered: true,
        answer: unsignedAnswer,
        allAnswers: [unsignedAnswer],
      });
      const gitBackend = createMockBackend({ name: "git-native" });
      (gitBackend.waitForAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(waitResult);

      await expect(
        handleAskBreakpoint({
          question: "Need a signed answer",
          proven: true,
        }, gitBackend),
      ).rejects.toThrow(/required a signed answer/i);
    });

    it("rejects ask_breakpoint.proven on unsupported backends", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const serverBackend = createMockBackend({ name: "server" });

      await expect(
        handleAskBreakpoint({
          question: "Need a signed answer",
          proven: true,
        }, serverBackend),
      ).rejects.toThrow(/Backend "server" does not support ask_breakpoint\.proven/);

      expect(serverBackend.submitBreakpoint).not.toHaveBeenCalled();
    });

    it("handles timeout resolution from waitForAnswer", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const timedOutResult = makeWaitResult({
        answered: false,
        answer: undefined,
        allAnswers: [],
        resolution: "timeout",
        elapsedMs: 1_800_000,
      });
      (mockBackend.waitForAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(timedOutResult);

      const result = await handleAskBreakpoint({
        question: "Slow question",
        timeout: 1_800_000,
      }, mockBackend);

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("timeout");
    });

    it("handles cancellation resolution from waitForAnswer", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const cancelledResult = makeWaitResult({
        answered: false,
        answer: undefined,
        allAnswers: [],
        resolution: "cancelled",
        elapsedMs: 500,
      });
      (mockBackend.waitForAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(cancelledResult);

      const result = await handleAskBreakpoint({
        question: "Cancelled question",
      }, mockBackend);

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("cancelled");
    });

    it("handles aborted resolution from waitForAnswer", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const abortedResult = makeWaitResult({
        answered: false,
        answer: undefined,
        allAnswers: [],
        resolution: "aborted",
        elapsedMs: 100,
      });
      (mockBackend.waitForAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(abortedResult);

      const result = await handleAskBreakpoint({
        question: "Aborted question",
      }, mockBackend);

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("aborted");
    });

    it("uses default empty arrays for optional array params", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Minimal question",
      }, mockBackend);

      const callArgs = (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0][0] as SubmitBreakpointParams;
      expect(callArgs.context.codeSnippets).toEqual([]);
      expect(callArgs.context.fileReferences).toEqual([]);
      expect(callArgs.context.tags).toEqual([]);
      expect(callArgs.routing.targetResponders).toEqual([]);
    });

    it("propagates backend errors from submitBreakpoint", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      (mockBackend.submitBreakpoint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Backend submit failed"),
      );

      await expect(
        handleAskBreakpoint({ question: "Failing question" }, mockBackend),
      ).rejects.toThrow("Backend submit failed");
    });

    it("propagates backend errors from waitForAnswer", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      (mockBackend.waitForAnswer as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Backend wait failed"),
      );

      await expect(
        handleAskBreakpoint({ question: "Failing question" }, mockBackend),
      ).rejects.toThrow("Backend wait failed");
    });

    it("returns answer text in the returned result", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const answer = makeAnswer({ text: "The answer is 42." });
      const waitResult = makeWaitResult({
        answered: true,
        answer,
        allAnswers: [answer],
      });
      (mockBackend.waitForAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(waitResult);

      const result = await handleAskBreakpoint({
        question: "What is the answer?",
      }, mockBackend);

      expect(result.answer?.text).toBe("The answer is 42.");
    });

    it("returns multiple answers in allAnswers for collect-all strategy", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();
      const answer1 = makeAnswer({ id: "a1", text: "Answer one" });
      const answer2 = makeAnswer({ id: "a2", text: "Answer two" });
      const waitResult = makeWaitResult({
        answered: true,
        answer: answer1,
        allAnswers: [answer1, answer2],
      });
      (mockBackend.waitForAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(waitResult);

      const result = await handleAskBreakpoint({
        question: "Collect all answers",
        routingStrategy: "collect-all",
      }, mockBackend);

      expect(result.allAnswers).toHaveLength(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 2: check_breakpoint_status tool handler
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleCheckBreakpointStatus", () => {
    it("calls backend.getBreakpoint with the given id", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();

      await handleCheckBreakpointStatus({
        breakpointId: "bp-001",
      }, mockBackend);

      expect(mockBackend.getBreakpoint).toHaveBeenCalledTimes(1);
      expect(mockBackend.getBreakpoint).toHaveBeenCalledWith("bp-001");
    });

    it("returns breakpoint details including status", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();
      const bp = makeBreakpoint({ id: "bp-002", status: "answered" });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await handleCheckBreakpointStatus({
        breakpointId: "bp-002",
      }, mockBackend);

      expect(result.id).toBe("bp-002");
      expect(result.status).toBe("answered");
    });

    it("returns breakpoint with answers when answered", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();
      const answer = makeAnswer();
      const bp = makeBreakpoint({
        id: "bp-003",
        status: "answered",
        answers: [answer],
      });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await handleCheckBreakpointStatus({
        breakpointId: "bp-003",
      }, mockBackend);

      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].text).toBe("Yes, use connection pooling with ioredis.");
    });

    it("returns breakpoint timing information", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();
      const bp = makeBreakpoint({
        createdAt: NOW,
        updatedAt: NOW,
        expiresAt: LATER,
      });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await handleCheckBreakpointStatus({
        breakpointId: "bp-001",
      }, mockBackend);

      expect(result.createdAt).toBe(NOW);
      expect(result.expiresAt).toBe(LATER);
    });

    it("handles not-found by propagating backend error", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Breakpoint not found: bp-nonexistent"),
      );

      await expect(
        handleCheckBreakpointStatus({ breakpointId: "bp-nonexistent" }, mockBackend),
      ).rejects.toThrow("Breakpoint not found");
    });

    it("returns pending status for unanswered breakpoints", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();
      const bp = makeBreakpoint({ status: "pending", answers: [] });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await handleCheckBreakpointStatus({
        breakpointId: "bp-001",
      }, mockBackend);

      expect(result.status).toBe("pending");
      expect(result.answers).toEqual([]);
    });

    it("returns cancelled status for cancelled breakpoints", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();
      const bp = makeBreakpoint({ status: "cancelled" });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await handleCheckBreakpointStatus({
        breakpointId: "bp-001",
      }, mockBackend);

      expect(result.status).toBe("cancelled");
    });

    it("returns expired status for expired breakpoints", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();
      const bp = makeBreakpoint({ status: "expired" });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await handleCheckBreakpointStatus({
        breakpointId: "bp-001",
      }, mockBackend);

      expect(result.status).toBe("expired");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 3: list_breakpoints tool handler
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleListBreakpoints", () => {
    it("calls backend.listPendingBreakpoints without responderId when not provided", async () => {
      const { handleListBreakpoints } = await importListBreakpoints();

      await handleListBreakpoints({}, mockBackend);

      expect(mockBackend.listPendingBreakpoints).toHaveBeenCalledTimes(1);
      expect(mockBackend.listPendingBreakpoints).toHaveBeenCalledWith(undefined);
    });

    it("calls backend.listPendingBreakpoints with responderId when provided", async () => {
      const { handleListBreakpoints } = await importListBreakpoints();

      await handleListBreakpoints({
        responderId: "tal",
      }, mockBackend);

      expect(mockBackend.listPendingBreakpoints).toHaveBeenCalledWith("tal");
    });

    it("returns array of pending breakpoints", async () => {
      const { handleListBreakpoints } = await importListBreakpoints();
      const bps = [
        makeBreakpoint({ id: "bp-001" }),
        makeBreakpoint({ id: "bp-002" }),
      ];
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockResolvedValue(bps);

      const result = await handleListBreakpoints({}, mockBackend);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("bp-001");
      expect(result[1].id).toBe("bp-002");
    });

    it("returns empty array when no pending breakpoints", async () => {
      const { handleListBreakpoints } = await importListBreakpoints();
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await handleListBreakpoints({}, mockBackend);

      expect(result).toEqual([]);
    });

    it("propagates backend errors", async () => {
      const { handleListBreakpoints } = await importListBreakpoints();
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Backend list failed"),
      );

      await expect(
        handleListBreakpoints({}, mockBackend),
      ).rejects.toThrow("Backend list failed");
    });

    it("returns breakpoints with their full context and routing", async () => {
      const { handleListBreakpoints } = await importListBreakpoints();
      const bp = makeBreakpoint({
        id: "bp-full",
        context: makeContext({ domain: "security", tags: ["auth"] }),
        routing: makeRouting({ targetResponders: ["tal"] }),
      });
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockResolvedValue([bp]);

      const result = await handleListBreakpoints({}, mockBackend);

      expect(result[0].context.domain).toBe("security");
      expect(result[0].routing.targetResponders).toEqual(["tal"]);
    });

    it("handles large result sets", async () => {
      const { handleListBreakpoints } = await importListBreakpoints();
      const manyBreakpoints = Array.from({ length: 50 }, (_, i) =>
        makeBreakpoint({ id: `bp-${String(i).padStart(3, "0")}` }),
      );
      (mockBackend.listPendingBreakpoints as ReturnType<typeof vi.fn>).mockResolvedValue(manyBreakpoints);

      const result = await handleListBreakpoints({}, mockBackend);

      expect(result).toHaveLength(50);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 5: answer_breakpoint tool handler
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleAnswerBreakpoint", () => {
    it("calls backend.answerBreakpoint with breakpointId and answer params", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "Use connection pooling.",
        responderId: "tal",
        responderName: "Tal M",
      }, mockBackend);

      expect(mockBackend.answerBreakpoint).toHaveBeenCalledTimes(1);
      const [id, params] = (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(id).toBe("bp-001");
      expect(params.text).toBe("Use connection pooling.");
      expect(params.responderId).toBe("tal");
      expect(params.responderName).toBe("Tal M");
    });

    it("returns the created BreakpointAnswer", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();
      const answer = makeAnswer({ id: "answer-new", text: "My answer" });
      (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(answer);

      const result = await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "My answer",
        responderId: "tal",
        responderName: "Tal M",
      }, mockBackend);

      expect(result.id).toBe("answer-new");
      expect(result.text).toBe("My answer");
    });

    it("passes approved=true for approval-type breakpoints", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "Approved.",
        responderId: "tal",
        responderName: "Tal M",
        approved: true,
      }, mockBackend);

      const [, params] = (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(params.approved).toBe(true);
    });

    it("passes approved=false for rejection", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "Rejected.",
        responderId: "tal",
        responderName: "Tal M",
        approved: false,
      }, mockBackend);

      const [, params] = (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(params.approved).toBe(false);
    });

    it("passes confidence score", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "Fairly confident answer.",
        responderId: "tal",
        responderName: "Tal M",
        confidence: 75,
      }, mockBackend);

      const [, params] = (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(params.confidence).toBe(75);
    });

    it("passes confidence=0 (minimum)", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "Very uncertain answer.",
        responderId: "tal",
        responderName: "Tal M",
        confidence: 0,
      }, mockBackend);

      const [, params] = (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(params.confidence).toBe(0);
    });

    it("passes confidence=100 (maximum)", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "Absolutely certain.",
        responderId: "tal",
        responderName: "Tal M",
        confidence: 100,
      }, mockBackend);

      const [, params] = (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(params.confidence).toBe(100);
    });

    it("passes references array", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "See references.",
        responderId: "tal",
        responderName: "Tal M",
        references: ["https://example.com/doc", "src/main.ts"],
      }, mockBackend);

      const [, params] = (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(params.references).toEqual(["https://example.com/doc", "src/main.ts"]);
    });

    it("passes sign and keyFingerprint through to the backend", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "Signed answer",
        responderId: "tal",
        responderName: "Tal M",
        sign: true,
        keyFingerprint: "fingerprint-123",
      }, mockBackend);

      const [, params] = (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(params.sign).toBe(true);
      expect(params.keyFingerprint).toBe("fingerprint-123");
    });

    it("propagates backend errors for nonexistent breakpoint", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();
      (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Breakpoint not found: bp-nonexistent"),
      );

      await expect(
        handleAnswerBreakpoint({
          breakpointId: "bp-nonexistent",
          text: "Answer to nothing",
          responderId: "tal",
          responderName: "Tal M",
        }, mockBackend),
      ).rejects.toThrow("Breakpoint not found");
    });

    it("propagates backend errors for already-answered breakpoints", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();
      (mockBackend.answerBreakpoint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Breakpoint already answered"),
      );

      await expect(
        handleAnswerBreakpoint({
          breakpointId: "bp-001",
          text: "Late answer",
          responderId: "tal",
          responderName: "Tal M",
        }, mockBackend),
      ).rejects.toThrow("Breakpoint already answered");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 6: verify_breakpoint_answer tool handler
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleVerifyBreakpointAnswer", () => {
    it("calls backend.getBreakpoint to load the breakpoint", async () => {
      const { handleVerifyBreakpointAnswer } = await importVerifyAnswer();
      const provenAnswer = makeProvenAnswer();
      const bp = makeBreakpoint({
        id: "bp-001",
        status: "answered",
        answers: [provenAnswer],
      });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      try {
        await handleVerifyBreakpointAnswer({
          breakpointId: "bp-001",
        }, mockBackend);
      } catch {
        // May fail due to missing trusted keys, but getBreakpoint should have been called
      }

      expect(mockBackend.getBreakpoint).toHaveBeenCalledWith("bp-001");
    });

    it("returns verification result with valid field", async () => {
      const { handleVerifyBreakpointAnswer } = await importVerifyAnswer();
      const provenAnswer = makeProvenAnswer();
      const bp = makeBreakpoint({
        id: "bp-001",
        status: "answered",
        answers: [provenAnswer],
      });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await handleVerifyBreakpointAnswer({
        breakpointId: "bp-001",
      }, mockBackend);

      expect(result).toHaveProperty("valid");
      expect(typeof result.valid).toBe("boolean");
      expect(result).toHaveProperty("verifiedAt");
    });

    it("returns valid=false when public key not found in trusted keys", async () => {
      const { handleVerifyBreakpointAnswer } = await importVerifyAnswer();
      const provenAnswer = makeProvenAnswer({
        publicKeyFingerprint: "unknown-fingerprint",
      });
      const bp = makeBreakpoint({
        id: "bp-001",
        status: "answered",
        answers: [provenAnswer],
      });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      const result = await handleVerifyBreakpointAnswer({
        breakpointId: "bp-001",
      }, mockBackend);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("not found");
    });

    it("handles breakpoint not found", async () => {
      const { handleVerifyBreakpointAnswer } = await importVerifyAnswer();
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Breakpoint not found: bp-gone"),
      );

      await expect(
        handleVerifyBreakpointAnswer({ breakpointId: "bp-gone" }, mockBackend),
      ).rejects.toThrow("Breakpoint not found");
    });

    it("throws when breakpoint has no answers", async () => {
      const { handleVerifyBreakpointAnswer } = await importVerifyAnswer();
      const bp = makeBreakpoint({
        id: "bp-unanswered",
        status: "pending",
        answers: [],
      });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      await expect(
        handleVerifyBreakpointAnswer({ breakpointId: "bp-unanswered" }, mockBackend),
      ).rejects.toThrow(/no.*answer/i);
    });

    it("throws when answer is not a proven answer (no signature)", async () => {
      const { handleVerifyBreakpointAnswer } = await importVerifyAnswer();
      const plainAnswer = makeAnswer();
      const bp = makeBreakpoint({
        id: "bp-plain",
        status: "answered",
        answers: [plainAnswer],
      });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      await expect(
        handleVerifyBreakpointAnswer({ breakpointId: "bp-plain" }, mockBackend),
      ).rejects.toThrow(/not.*signed|not.*proven/i);
    });

    it("verifies the selectedAnswer instead of the first answer", async () => {
      const { handleVerifyBreakpointAnswer } = await importVerifyAnswer();
      const firstAnswer = makeProvenAnswer({ id: "answer-1" });
      const selectedUnsignedAnswer = makeAnswer({ id: "answer-2", text: "Selected but unsigned" });
      const bp = makeBreakpoint({
        id: "bp-selected",
        status: "answered",
        selectedAnswer: "answer-2",
        answers: [firstAnswer, selectedUnsignedAnswer],
      });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      await expect(
        handleVerifyBreakpointAnswer({ breakpointId: "bp-selected" }, mockBackend),
      ).rejects.toThrow(/not.*signed|not.*proven/i);
    });

    it("passes breakpointsDir to verification for trusted key lookup", async () => {
      const { handleVerifyBreakpointAnswer } = await importVerifyAnswer();
      const provenAnswer = makeProvenAnswer();
      const bp = makeBreakpoint({
        id: "bp-001",
        status: "answered",
        answers: [provenAnswer],
      });
      (mockBackend.getBreakpoint as ReturnType<typeof vi.fn>).mockResolvedValue(bp);

      // This test verifies the breakpointsDir param is accepted and forwarded
      const result = await handleVerifyBreakpointAnswer({
        breakpointId: "bp-001",
        breakpointsDir: "/tmp/test-breakpoints",
      }, mockBackend);

      expect(result).toHaveProperty("valid");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 6: Tool Registration (createBreakpointMcpServer)
  // ──────────────────────────────────────────────────────────────────────────

  describe("Tool Registration (createBreakpointMcpServer)", () => {
    it("exports createBreakpointMcpServer function", async () => {
      const mod = await importMcpServer();
      expect(typeof mod.createBreakpointMcpServer).toBe("function");
    });

    it("creates an MCP server instance", async () => {
      const { createBreakpointMcpServer } = await importMcpServer();
      const server = createBreakpointMcpServer();
      expect(server).toBeDefined();
    });

    it("exports startBreakpointMcpServer function", async () => {
      const mod = await importMcpServer();
      expect(typeof mod.startBreakpointMcpServer).toBe("function");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 8: Tool Descriptions and Metadata
  // ──────────────────────────────────────────────────────────────────────────

  describe("Tool Descriptions and Metadata", () => {
    it("ask_breakpoint description mentions breakpoint and human responder", async () => {
      const { askBreakpointDescription } = await importAskBreakpoint();
      expect(askBreakpointDescription).toContain("breakpoint");
      expect(askBreakpointDescription.toLowerCase()).toContain("human");
    });

    it("ask_breakpoint exports param schema object", async () => {
      const { askBreakpointParams } = await importAskBreakpoint();
      expect(askBreakpointParams).toBeDefined();
      expect(askBreakpointParams).toHaveProperty("question");
    });

    it("check_breakpoint_status description mentions status", async () => {
      const { checkBreakpointStatusDescription } = await importCheckStatus();
      expect(checkBreakpointStatusDescription.toLowerCase()).toContain("status");
    });

    it("check_breakpoint_status exports param schema object", async () => {
      const { checkBreakpointStatusParams } = await importCheckStatus();
      expect(checkBreakpointStatusParams).toBeDefined();
      expect(checkBreakpointStatusParams).toHaveProperty("breakpointId");
    });

    it("list_breakpoints description mentions pending breakpoints", async () => {
      const { listBreakpointsDescription } = await importListBreakpoints();
      expect(listBreakpointsDescription.toLowerCase()).toContain("pending");
    });

    it("list_breakpoints exports param schema with optional responderId", async () => {
      const { listBreakpointsParams } = await importListBreakpoints();
      expect(listBreakpointsParams).toBeDefined();
      expect(listBreakpointsParams).toHaveProperty("responderId");
    });

    it("answer_breakpoint description mentions answer", async () => {
      const { answerBreakpointDescription } = await importAnswerBreakpoint();
      expect(answerBreakpointDescription.toLowerCase()).toContain("answer");
    });

    it("answer_breakpoint exports param schema with required fields", async () => {
      const { answerBreakpointParams } = await importAnswerBreakpoint();
      expect(answerBreakpointParams).toBeDefined();
      expect(answerBreakpointParams).toHaveProperty("breakpointId");
      expect(answerBreakpointParams).toHaveProperty("text");
      expect(answerBreakpointParams).toHaveProperty("responderId");
      expect(answerBreakpointParams).toHaveProperty("responderName");
    });

    it("verify_breakpoint_answer description mentions cryptographic or signature", async () => {
      const { verifyBreakpointAnswerDescription } = await importVerifyAnswer();
      const desc = verifyBreakpointAnswerDescription.toLowerCase();
      expect(desc.match(/cryptographic|signature/)).toBeTruthy();
    });

    it("verify_breakpoint_answer exports param schema", async () => {
      const { verifyBreakpointAnswerParams } = await importVerifyAnswer();
      expect(verifyBreakpointAnswerParams).toBeDefined();
      expect(verifyBreakpointAnswerParams).toHaveProperty("breakpointId");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 9: Backend Resolution from MCP tool params
  // ──────────────────────────────────────────────────────────────────────────

  describe("Backend Resolution from MCP tool params", () => {
    it("explicit backend override wins over env override", async () => {
      const { resolveBreakpointBackend } = await importBackendResolver();
      const configRoot = await fs.mkdtemp(path.join(os.tmpdir(), "bmux-routing-"));
      const originalEnv = process.env.BMUX_BACKEND;

      await fs.writeFile(
        path.join(configRoot, "routing.json"),
        JSON.stringify({
          defaultBackend: "git-native",
          routes: [
            {
              backend: "server-route",
              backendConfig: {
                type: "server",
                url: "http://localhost:3847",
              },
            },
          ],
        }),
        "utf-8",
      );

      process.env.BMUX_BACKEND = "git-native";
      try {
        const resolved = resolveBreakpointBackend({
          explicitBackend: "server",
          configRoot,
        });

        expect(resolved.backend.name).toBe("server");
        expect(resolved.source).toBe("explicit-override");
      } finally {
        if (originalEnv === undefined) {
          delete process.env.BMUX_BACKEND;
        } else {
          process.env.BMUX_BACKEND = originalEnv;
        }
        await fs.rm(configRoot, { recursive: true, force: true });
      }
    });

    it("handler accepts backend param without error", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Question with explicit backend",
        backend: "git-native",
      }, mockBackend);

      expect(mockBackend.submitBreakpoint).toHaveBeenCalled();
    });

    it("handler accepts breakpointsDir param without error", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await handleAskBreakpoint({
        question: "Question with custom dir",
        breakpointsDir: "/tmp/custom-breakpoints",
      }, mockBackend);

      expect(mockBackend.submitBreakpoint).toHaveBeenCalled();
    });

    it("check_breakpoint_status accepts backend param", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();

      await handleCheckBreakpointStatus({
        breakpointId: "bp-001",
        backend: "git-native",
      }, mockBackend);

      expect(mockBackend.getBreakpoint).toHaveBeenCalled();
    });

    it("list_breakpoints accepts backend param", async () => {
      const { handleListBreakpoints } = await importListBreakpoints();

      await handleListBreakpoints({
        backend: "git-native",
      }, mockBackend);

      expect(mockBackend.listPendingBreakpoints).toHaveBeenCalled();
    });

    it("answer_breakpoint accepts backend param", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await handleAnswerBreakpoint({
        breakpointId: "bp-001",
        text: "Answer with backend",
        responderId: "tal",
        responderName: "Tal M",
        backend: "git-native",
      }, mockBackend);

      expect(mockBackend.answerBreakpoint).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 10: Input Validation Edge Cases
  // ──────────────────────────────────────────────────────────────────────────

  describe("Input Validation Edge Cases", () => {
    it("ask_breakpoint rejects empty question string", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      await expect(
        handleAskBreakpoint({ question: "" }, mockBackend),
      ).rejects.toThrow();
    });

    it("check_breakpoint_status rejects missing breakpointId", async () => {
      const { handleCheckBreakpointStatus } = await importCheckStatus();

      await expect(
        handleCheckBreakpointStatus({} as { breakpointId: string }, mockBackend),
      ).rejects.toThrow();
    });

    it("answer_breakpoint rejects missing required fields", async () => {
      const { handleAnswerBreakpoint } = await importAnswerBreakpoint();

      await expect(
        handleAnswerBreakpoint(
          { breakpointId: "bp-001" } as {
            breakpointId: string;
            text: string;
            responderId: string;
            responderName: string;
          },
          mockBackend,
        ),
      ).rejects.toThrow();
    });

    it("verify_breakpoint_answer rejects missing breakpointId", async () => {
      const { handleVerifyBreakpointAnswer } = await importVerifyAnswer();

      await expect(
        handleVerifyBreakpointAnswer({} as { breakpointId: string }, mockBackend),
      ).rejects.toThrow();
    });

    it("ask_breakpoint accepts all optional fields together", async () => {
      const { handleAskBreakpoint } = await importAskBreakpoint();

      const result = await handleAskBreakpoint({
        question: "Full params question",
        context: "Context description",
        markdown: "## Details",
        codeSnippets: [{ filename: "a.ts", code: "1+1" }],
        fileReferences: ["src/main.ts"],
        tags: ["perf"],
        domain: "backend",
        urgency: "high",
        interactionKind: "clarification",
        targetResponders: ["tal"],
        routingStrategy: "single",
        timeout: 60_000,
        breakpointId: "canonical-id",
        backend: "git-native",
        breakpointsDir: "/tmp/bp",
        proven: false,
      }, mockBackend);

      expect(result.answered).toBe(true);
    });
  });
});
