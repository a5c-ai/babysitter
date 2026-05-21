import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";
import { ServerBreakpointBackend, ServerBackendError } from "../backends/server.js";
import type { ServerBreakpointBackendConfig } from "../backends/server.js";
import { createBackend, listRegisteredBackends } from "../backends/index.js";
import type { SubmitBreakpointParams, SubmitAnswerParams } from "../backend.js";

// ── Fixtures ──────────────────────────────────────────────────────────────

const SERVER_URL = "http://localhost:3847";

const defaultConfig: ServerBreakpointBackendConfig = {
  serverUrl: SERVER_URL,
  authToken: "test-token-123",
  projectId: "proj-1",
  repoId: "repo-1",
};

function makeServerQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: "q-001",
    slug: "how-to-test-q-001",
    text: "How do I test this?",
    context: {
      description: "Testing context",
      codeSnippets: ["const x = 1;"],
      fileReferences: ["src/test.ts"],
      tags: ["testing"],
    },
    status: "routed",
    routing: {
      strategy: "single",
      targetExperts: ["expert-1"],
      timeoutMs: 60000,
      presentToUser: true,
    },
    answers: [],
    projectId: "proj-1",
    repoId: "repo-1",
    createdBy: {
      sub: "user-1",
      login: "testuser",
      name: "Test User",
    },
    createdAt: "2026-04-21T10:00:00.000Z",
    updatedAt: "2026-04-21T10:00:00.000Z",
    expiresAt: "2026-04-21T10:30:00.000Z",
    ...overrides,
  };
}

function makeServerAnswer(overrides: Record<string, unknown> = {}) {
  return {
    id: "ans-001",
    questionId: "q-001",
    expertId: "expert-1",
    expertName: "Dr. Test",
    text: "Here is the answer.",
    confidence: 90,
    references: ["https://example.com"],
    followUpQuestions: ["Any more questions?"],
    answeredAt: "2026-04-21T10:05:00.000Z",
    ...overrides,
  };
}

function makeServerExpert(overrides: Record<string, unknown> = {}) {
  return {
    id: "expert-1",
    name: "Dr. Test",
    title: "Testing Expert",
    expertiseAreas: [
      {
        domain: "testing",
        topics: ["unit-testing", "integration"],
        keywords: ["vitest", "jest"],
        proficiency: 5,
      },
    ],
    availability: true,
    responseTimeSla: 300000,
    ...overrides,
  };
}

function makeSubmitParams(overrides: Partial<SubmitBreakpointParams> = {}): SubmitBreakpointParams {
  return {
    text: "How do I test this?",
    context: {
      description: "Testing context",
      codeSnippets: ["const x = 1;"],
      fileReferences: ["src/test.ts"],
      tags: ["testing"],
    },
    routing: {
      strategy: "single",
      targetResponders: ["expert-1"],
      timeoutMs: 60000,
      presentToUser: true,
    },
    ...overrides,
  };
}

function makeAnswerParams(overrides: Partial<SubmitAnswerParams> = {}): SubmitAnswerParams {
  return {
    responderId: "expert-1",
    responderName: "Dr. Test",
    text: "Here is the answer.",
    confidence: 90,
    references: ["https://example.com"],
    followUpQuestions: ["Any more questions?"],
    ...overrides,
  };
}

// ── Mock fetch ────────────────────────────────────────────────────────────

function mockFetchOk(body: unknown): Mock {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number, body: { error: string }): Mock {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: `HTTP ${status}`,
    json: () => Promise.resolve(body),
  });
}

function mockFetchNetworkError(message: string): Mock {
  return vi.fn().mockRejectedValue(new TypeError(message));
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("ServerBreakpointBackend", () => {
  let backend: ServerBreakpointBackend;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    backend = new ServerBreakpointBackend(defaultConfig);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ── Constructor ────────────────────────────────────────────────────

  describe("constructor", () => {
    it("should set the backend name to 'server'", () => {
      expect(backend.name).toBe("server");
    });

    it("should strip trailing slashes from serverUrl", () => {
      const b = new ServerBreakpointBackend({ serverUrl: "http://localhost:3847///" });
      globalThis.fetch = mockFetchOk(makeServerQuestion());

      // Exercise the backend to see the URL
      b.getBreakpoint("q-001").catch(() => {});
      const calledUrl = (globalThis.fetch as Mock).mock.calls[0]?.[0] as string;
      expect(calledUrl).toMatch(/^http:\/\/localhost:3847\/api/);
    });
  });

  // ── submitBreakpoint ───────────────────────────────────────────────

  describe("submitBreakpoint", () => {
    it("should POST to /api/v1/questions with mapped body", async () => {
      const serverQuestion = makeServerQuestion();
      globalThis.fetch = mockFetchOk(serverQuestion);

      const result = await backend.submitBreakpoint(makeSubmitParams());

      expect(globalThis.fetch).toHaveBeenCalledOnce();
      const [url, opts] = (globalThis.fetch as Mock).mock.calls[0];
      expect(url).toBe(`${SERVER_URL}/api/v1/questions`);
      expect(opts.method).toBe("POST");
      expect(opts.headers["Authorization"]).toBe("Bearer test-token-123");

      const body = JSON.parse(opts.body as string);
      expect(body.routing.targetExperts).toEqual(["expert-1"]);
      expect(body.projectId).toBe("proj-1");
      expect(body.repoId).toBe("repo-1");
    });

    it("should map server Question response to Breakpoint", async () => {
      const serverQuestion = makeServerQuestion();
      globalThis.fetch = mockFetchOk(serverQuestion);

      const breakpoint = await backend.submitBreakpoint(makeSubmitParams());

      expect(breakpoint.id).toBe("q-001");
      expect(breakpoint.routing.targetResponders).toEqual(["expert-1"]);
      expect(breakpoint.status).toBe("routed");
      expect(breakpoint.answers).toEqual([]);
    });

    it("should use params.projectId over config.projectId", async () => {
      globalThis.fetch = mockFetchOk(makeServerQuestion());

      await backend.submitBreakpoint(makeSubmitParams({ projectId: "override-proj" }));

      const body = JSON.parse(((globalThis.fetch as Mock).mock.calls[0][1] as { body: string }).body);
      expect(body.projectId).toBe("override-proj");
    });

    it("should throw if no projectId is available", async () => {
      const noProjectBackend = new ServerBreakpointBackend({
        serverUrl: SERVER_URL,
      });

      await expect(noProjectBackend.submitBreakpoint(makeSubmitParams()))
        .rejects
        .toThrow("projectId is required");
    });

    it("should throw if no repoId is available", async () => {
      const noRepoBackend = new ServerBreakpointBackend({
        serverUrl: SERVER_URL,
        projectId: "proj-1",
      });

      await expect(noRepoBackend.submitBreakpoint(makeSubmitParams()))
        .rejects
        .toThrow("repoId is required");
    });

    it("should reject proven requests until signed answers are supported", async () => {
      await expect(
        backend.submitBreakpoint(makeSubmitParams({ proven: true })),
      ).rejects.toThrow(/does not support ask_breakpoint\.proven/i);
    });
  });

  // ── getBreakpoint ──────────────────────────────────────────────────

  describe("getBreakpoint", () => {
    it("should GET /api/v1/questions/:id", async () => {
      globalThis.fetch = mockFetchOk(makeServerQuestion());

      const breakpoint = await backend.getBreakpoint("q-001");

      expect(globalThis.fetch).toHaveBeenCalledOnce();
      const [url] = (globalThis.fetch as Mock).mock.calls[0];
      expect(url).toBe(`${SERVER_URL}/api/v1/questions/q-001`);
      expect(breakpoint.id).toBe("q-001");
    });

    it("should map claimedByExpert to claimedByResponder fields", async () => {
      const claimed = makeServerQuestion({
        status: "claimed",
        claimedByExpertId: "expert-1",
        claimedByExpertName: "Dr. Test",
      });
      globalThis.fetch = mockFetchOk(claimed);

      const breakpoint = await backend.getBreakpoint("q-001");

      expect(breakpoint.claimedByResponderId).toBe("expert-1");
      expect(breakpoint.claimedByResponderName).toBe("Dr. Test");
    });

    it("should map answers with question/expert to breakpoint/responder naming", async () => {
      const withAnswer = makeServerQuestion({
        status: "answered",
        answers: [makeServerAnswer()],
        selectedAnswer: "ans-001",
      });
      globalThis.fetch = mockFetchOk(withAnswer);

      const breakpoint = await backend.getBreakpoint("q-001");

      expect(breakpoint.answers).toHaveLength(1);
      expect(breakpoint.answers[0].breakpointId).toBe("q-001");
      expect(breakpoint.answers[0].responderId).toBe("expert-1");
      expect(breakpoint.answers[0].responderName).toBe("Dr. Test");
    });

    it("should throw ServerBackendError on 404", async () => {
      globalThis.fetch = mockFetchError(404, { error: "Question not found" });

      await expect(backend.getBreakpoint("nonexistent"))
        .rejects
        .toThrow(ServerBackendError);

      try {
        await backend.getBreakpoint("nonexistent");
      } catch (err) {
        expect(err).toBeInstanceOf(ServerBackendError);
        expect((err as ServerBackendError).statusCode).toBe(404);
      }
    });
  });

  // ── waitForAnswer ──────────────────────────────────────────────────

  describe("waitForAnswer", () => {
    it("should return immediately if the breakpoint already has an answer", async () => {
      const answered = makeServerQuestion({
        status: "answered",
        answers: [makeServerAnswer()],
        selectedAnswer: "ans-001",
      });
      globalThis.fetch = mockFetchOk(answered);

      const result = await backend.waitForAnswer("q-001", { timeoutMs: 5000 });

      expect(result.answered).toBe(true);
      expect(result.answer?.id).toBe("ans-001");
      expect(result.resolution).toBe("answered");
    });

    it("should return not-answered if breakpoint is cancelled", async () => {
      const cancelled = makeServerQuestion({ status: "cancelled" });
      globalThis.fetch = mockFetchOk(cancelled);

      const result = await backend.waitForAnswer("q-001", { timeoutMs: 5000 });

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("cancelled");
    });

    it("should return not-answered if breakpoint is expired", async () => {
      const expired = makeServerQuestion({ status: "expired" });
      globalThis.fetch = mockFetchOk(expired);

      const result = await backend.waitForAnswer("q-001", { timeoutMs: 5000 });

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("expired");
    });

    it("should poll and resolve when answer arrives", async () => {
      const pending = makeServerQuestion({ status: "routed" });
      const answered = makeServerQuestion({
        status: "answered",
        answers: [makeServerAnswer()],
        selectedAnswer: "ans-001",
      });

      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        const body = callCount <= 2 ? pending : answered;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(body),
        });
      });

      const result = await backend.waitForAnswer("q-001", {
        timeoutMs: 10000,
        pollIntervalMs: 50,
      });

      expect(result.answered).toBe(true);
      expect(result.answer?.id).toBe("ans-001");
      expect(callCount).toBeGreaterThanOrEqual(3);
    });

    it("should respect abort signal", async () => {
      const pending = makeServerQuestion({ status: "routed" });
      globalThis.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(pending),
        });
      });

      const controller = new AbortController();
      const waitPromise = backend.waitForAnswer("q-001", {
        timeoutMs: 30000,
        pollIntervalMs: 50,
        signal: controller.signal,
      });

      // Abort after a short delay
      setTimeout(() => controller.abort(), 120);

      const result = await waitPromise;
      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("aborted");
    });

    it("should return timeout resolution when time expires", async () => {
      const pending = makeServerQuestion({ status: "routed" });
      globalThis.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(pending),
        });
      });

      const result = await backend.waitForAnswer("q-001", {
        timeoutMs: 150,
        pollIntervalMs: 50,
      });

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("timeout");
    });

    it("should select the selectedAnswer if present", async () => {
      const answered = makeServerQuestion({
        status: "answered",
        answers: [
          makeServerAnswer({ id: "ans-001", text: "First answer" }),
          makeServerAnswer({ id: "ans-002", text: "Second answer" }),
        ],
        selectedAnswer: "ans-002",
      });
      globalThis.fetch = mockFetchOk(answered);

      const result = await backend.waitForAnswer("q-001");

      expect(result.answer?.id).toBe("ans-002");
      expect(result.allAnswers).toHaveLength(2);
    });
  });

  // ── listPendingBreakpoints ─────────────────────────────────────────

  describe("listPendingBreakpoints", () => {
    it("should GET /api/v1/questions with status=pending when no responderId", async () => {
      const questions = [makeServerQuestion()];
      globalThis.fetch = mockFetchOk(questions);

      const result = await backend.listPendingBreakpoints();

      const [url] = (globalThis.fetch as Mock).mock.calls[0];
      expect(url).toContain("/api/v1/questions");
      expect(url).toContain("status=pending");
      expect(url).toContain("projectId=proj-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("q-001");
    });

    it("should use the expert-specific endpoint when responderId is given", async () => {
      const questions = [makeServerQuestion()];
      globalThis.fetch = mockFetchOk(questions);

      await backend.listPendingBreakpoints("expert-1");

      const [url] = (globalThis.fetch as Mock).mock.calls[0];
      expect(url).toContain("/api/v1/experts/expert-1/questions");
      expect(url).toContain("status=routed");
    });

    it("should throw if no projectId configured", async () => {
      const noProjectBackend = new ServerBreakpointBackend({ serverUrl: SERVER_URL });

      await expect(noProjectBackend.listPendingBreakpoints())
        .rejects
        .toThrow("projectId is required");
    });
  });

  // ── answerBreakpoint ───────────────────────────────────────────────

  describe("answerBreakpoint", () => {
    it("should POST to /api/v1/questions/:id/answers with mapped body", async () => {
      globalThis.fetch = mockFetchOk(makeServerAnswer());

      const result = await backend.answerBreakpoint("q-001", makeAnswerParams());

      expect(globalThis.fetch).toHaveBeenCalledOnce();
      const [url, opts] = (globalThis.fetch as Mock).mock.calls[0];
      expect(url).toBe(`${SERVER_URL}/api/v1/questions/q-001/answers`);
      expect(opts.method).toBe("POST");

      const body = JSON.parse(opts.body as string);
      expect(body.expertId).toBe("expert-1");
      expect(body.expertName).toBe("Dr. Test");
    });

    it("should map server answer response to BreakpointAnswer", async () => {
      globalThis.fetch = mockFetchOk(makeServerAnswer());

      const answer = await backend.answerBreakpoint("q-001", makeAnswerParams());

      expect(answer.breakpointId).toBe("q-001");
      expect(answer.responderId).toBe("expert-1");
      expect(answer.responderName).toBe("Dr. Test");
      expect(answer.confidence).toBe(90);
    });

    it("should include decision memory when provided", async () => {
      globalThis.fetch = mockFetchOk(makeServerAnswer());

      await backend.answerBreakpoint("q-001", makeAnswerParams({
        decisionMemory: {
          applicabilityContext: "When testing backends",
          reasoning: "Use mock fetch for isolation",
        },
      }));

      const body = JSON.parse(((globalThis.fetch as Mock).mock.calls[0][1] as { body: string }).body);
      expect(body.decisionMemory.applicabilityContext).toBe("When testing backends");
    });

    it("should default confidence to 80 when not provided", async () => {
      globalThis.fetch = mockFetchOk(makeServerAnswer());

      await backend.answerBreakpoint("q-001", makeAnswerParams({ confidence: undefined }));

      const body = JSON.parse(((globalThis.fetch as Mock).mock.calls[0][1] as { body: string }).body);
      expect(body.confidence).toBe(80);
    });

    it("should reject answer signing requests until signed answers are supported", async () => {
      await expect(
        backend.answerBreakpoint("q-001", makeAnswerParams({ sign: true })),
      ).rejects.toThrow(/does not support answer signing/i);
    });
  });

  // ── cancelBreakpoint ───────────────────────────────────────────────

  describe("cancelBreakpoint", () => {
    it("should DELETE /api/v1/questions/:id", async () => {
      globalThis.fetch = mockFetchOk(makeServerQuestion({ status: "cancelled" }));

      await backend.cancelBreakpoint("q-001");

      const [url, opts] = (globalThis.fetch as Mock).mock.calls[0];
      expect(url).toBe(`${SERVER_URL}/api/v1/questions/q-001`);
      expect(opts.method).toBe("DELETE");
    });

    it("should throw ServerBackendError on 409 (already cancelled)", async () => {
      globalThis.fetch = mockFetchError(409, { error: "Question is already cancelled" });

      await expect(backend.cancelBreakpoint("q-001"))
        .rejects
        .toThrow(ServerBackendError);
    });
  });

  // ── listResponders (optional) ──────────────────────────────────────

  describe("listResponders", () => {
    it("should GET /api/v1/experts and map to ResponderProfile", async () => {
      const experts = [makeServerExpert()];
      globalThis.fetch = mockFetchOk(experts);

      const result = await backend.listResponders!();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("expert-1");
      expect(result[0].name).toBe("Dr. Test");
      expect(result[0].domains).toEqual(["testing"]);
      expect(result[0].tags).toEqual(["unit-testing", "integration", "vitest", "jest"]);
      expect(result[0].availability).toBe(true);
      expect(result[0].responseTimeSla).toBe(300000);
    });

    it("should use params.projectId over config", async () => {
      globalThis.fetch = mockFetchOk([]);

      await backend.listResponders!({ projectId: "custom-proj", repoId: "custom-repo" });

      const [url] = (globalThis.fetch as Mock).mock.calls[0];
      expect(url).toContain("projectId=custom-proj");
      expect(url).toContain("repoId=custom-repo");
    });
  });

  // ── claimBreakpoint (optional) ─────────────────────────────────────

  describe("claimBreakpoint", () => {
    it("should POST to /api/v1/questions/:id/claim with expertId", async () => {
      const claimed = makeServerQuestion({
        status: "claimed",
        claimedByExpertId: "expert-1",
        claimedByExpertName: "Dr. Test",
      });
      globalThis.fetch = mockFetchOk(claimed);

      const result = await backend.claimBreakpoint!("q-001", "expert-1");

      const [url, opts] = (globalThis.fetch as Mock).mock.calls[0];
      expect(url).toBe(`${SERVER_URL}/api/v1/questions/q-001/claim`);
      expect(opts.method).toBe("POST");

      const body = JSON.parse(opts.body as string);
      expect(body.expertId).toBe("expert-1");

      expect(result.status).toBe("claimed");
      expect(result.claimedByResponderId).toBe("expert-1");
    });
  });

  // ── Error handling ─────────────────────────────────────────────────

  describe("error handling", () => {
    it("should throw ServerBackendError with status code on HTTP errors", async () => {
      globalThis.fetch = mockFetchError(403, { error: "Access denied" });

      try {
        await backend.getBreakpoint("q-001");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ServerBackendError);
        const sbe = err as ServerBackendError;
        expect(sbe.statusCode).toBe(403);
        expect(sbe.message).toContain("Access denied");
        expect(sbe.responseBody).toEqual({ error: "Access denied" });
      }
    });

    it("should throw ServerBackendError on 401 unauthorized", async () => {
      globalThis.fetch = mockFetchError(401, { error: "Authentication required" });

      await expect(backend.getBreakpoint("q-001"))
        .rejects
        .toMatchObject({
          statusCode: 401,
          message: expect.stringContaining("Authentication required"),
        });
    });

    it("should propagate network errors as-is", async () => {
      globalThis.fetch = mockFetchNetworkError("Failed to fetch");

      await expect(backend.getBreakpoint("q-001"))
        .rejects
        .toThrow("Failed to fetch");
    });

    it("should not send Authorization header when no authToken", async () => {
      const noAuthBackend = new ServerBreakpointBackend({
        serverUrl: SERVER_URL,
        projectId: "proj-1",
        repoId: "repo-1",
      });
      globalThis.fetch = mockFetchOk(makeServerQuestion());

      await noAuthBackend.getBreakpoint("q-001");

      const [, opts] = (globalThis.fetch as Mock).mock.calls[0];
      expect(opts.headers["Authorization"]).toBeUndefined();
    });

    it("should handle non-JSON error responses gracefully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: () => Promise.reject(new Error("Not JSON")),
        text: () => Promise.resolve("Bad Gateway"),
      });

      await expect(backend.getBreakpoint("q-001"))
        .rejects
        .toThrow(ServerBackendError);
    });
  });

  // ── Type mapping coverage ──────────────────────────────────────────

  describe("type mapping", () => {
    it("should map routing.targetExperts to routing.targetResponders", async () => {
      const question = makeServerQuestion({
        routing: {
          strategy: "collect-all",
          targetExperts: ["e1", "e2", "e3"],
          timeoutMs: 120000,
          presentToUser: false,
        },
      });
      globalThis.fetch = mockFetchOk(question);

      const breakpoint = await backend.getBreakpoint("q-001");

      expect(breakpoint.routing.targetResponders).toEqual(["e1", "e2", "e3"]);
      expect(breakpoint.routing.strategy).toBe("collect-all");
    });

    it("should map answer questionId/expertId to breakpointId/responderId", async () => {
      const withAnswers = makeServerQuestion({
        answers: [
          makeServerAnswer({ id: "a1", questionId: "q-001", expertId: "e1", expertName: "Expert 1" }),
          makeServerAnswer({ id: "a2", questionId: "q-001", expertId: "e2", expertName: "Expert 2" }),
        ],
      });
      globalThis.fetch = mockFetchOk(withAnswers);

      const breakpoint = await backend.getBreakpoint("q-001");

      expect(breakpoint.answers[0].breakpointId).toBe("q-001");
      expect(breakpoint.answers[0].responderId).toBe("e1");
      expect(breakpoint.answers[1].responderId).toBe("e2");
    });

    it("should map submit routing targetResponders to targetExperts in request", async () => {
      globalThis.fetch = mockFetchOk(makeServerQuestion());

      await backend.submitBreakpoint(makeSubmitParams({
        routing: {
          strategy: "quorum",
          targetResponders: ["r1", "r2", "r3"],
          timeoutMs: 90000,
          presentToUser: true,
        },
      }));

      const body = JSON.parse(((globalThis.fetch as Mock).mock.calls[0][1] as { body: string }).body);
      expect(body.routing.targetExperts).toEqual(["r1", "r2", "r3"]);
      expect(body.routing.strategy).toBe("quorum");
    });

    it("should map answer responderId/responderName to expertId/expertName in request", async () => {
      globalThis.fetch = mockFetchOk(makeServerAnswer());

      await backend.answerBreakpoint("q-001", makeAnswerParams({
        responderId: "resp-42",
        responderName: "Responder Forty-Two",
      }));

      const body = JSON.parse(((globalThis.fetch as Mock).mock.calls[0][1] as { body: string }).body);
      expect(body.expertId).toBe("resp-42");
      expect(body.expertName).toBe("Responder Forty-Two");
    });

    it("should map expert.expertiseAreas to responder domains and tags", async () => {
      const expert = makeServerExpert({
        expertiseAreas: [
          { domain: "frontend", topics: ["react"], keywords: ["hooks"], proficiency: 4 },
          { domain: "backend", topics: ["node"], keywords: ["express"], proficiency: 5 },
        ],
      });
      globalThis.fetch = mockFetchOk([expert]);

      const responders = await backend.listResponders!();

      expect(responders[0].domains).toEqual(["frontend", "backend"]);
      expect(responders[0].tags).toEqual(["react", "hooks", "node", "express"]);
    });

    it("should preserve context fields through mapping", async () => {
      const question = makeServerQuestion({
        context: {
          description: "Complex context",
          codeSnippets: ["code"],
          fileReferences: ["file.ts"],
          tags: ["tag1"],
          title: "A Title",
          summary: "A Summary",
          domain: "architecture",
          urgency: "high",
          metadata: { key: "value" },
        },
      });
      globalThis.fetch = mockFetchOk(question);

      const breakpoint = await backend.getBreakpoint("q-001");

      expect(breakpoint.context.description).toBe("Complex context");
      expect(breakpoint.context.title).toBe("A Title");
      expect(breakpoint.context.summary).toBe("A Summary");
      expect(breakpoint.context.domain).toBe("architecture");
      expect(breakpoint.context.urgency).toBe("high");
      expect(breakpoint.context.metadata).toEqual({ key: "value" });
    });
  });
});

// ── Backend factory registration ────────────────────────────────────────

describe("server backend factory", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should be registered as 'server' in the backend registry", () => {
    expect(listRegisteredBackends()).toContain("server");
  });

  it("should create a backend via createBackend('server', ...)", () => {
    const backend = createBackend("server", {
      type: "server",
      url: "http://localhost:3847",
      authToken: "tok-123",
    });

    expect(backend.name).toBe("server");
  });

  it("should accept serverUrl as alternative to url", () => {
    const backend = createBackend("server", {
      type: "server",
      serverUrl: "http://localhost:3847",
    });

    expect(backend.name).toBe("server");
  });

  it("should throw if neither url nor serverUrl is provided", () => {
    expect(() => createBackend("server", { type: "server" }))
      .toThrow('Server backend requires a "url" or "serverUrl"');
  });

  it("should pass through projectId and repoId from config", async () => {
    const serverQuestion = {
      id: "q-test",
      text: "test",
      context: { description: "", codeSnippets: [], fileReferences: [], tags: [] },
      status: "routed",
      routing: { strategy: "single", targetExperts: [], timeoutMs: 60000, presentToUser: true },
      answers: [],
      projectId: "proj-reg",
      repoId: "repo-reg",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:00:00.000Z",
      expiresAt: "2026-04-21T10:30:00.000Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([serverQuestion]),
    });

    const backend = createBackend("server", {
      type: "server",
      url: "http://localhost:3847",
      projectId: "proj-reg",
      repoId: "repo-reg",
    });

    const pending = await backend.listPendingBreakpoints();
    expect(pending).toHaveLength(1);

    const [calledUrl] = (globalThis.fetch as Mock).mock.calls[0];
    expect(calledUrl).toContain("projectId=proj-reg");
  });
});
