import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ServerClient, ServerError, DEFAULT_BMUX_SERVER_URL } from "../client/server-client.js";

// ────────────────────────────────────────────────────────────────────────────
// Mock fetch
// ────────────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn<typeof globalThis.fetch>();

vi.stubGlobal("fetch", mockFetch);

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200, statusText = "OK"): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    clone: () => jsonResponse(data, status, statusText),
    formData: async () => new FormData(),
    redirected: false,
    type: "basic",
    url: "",
    bytes: async () => new Uint8Array(),
  } as Response;
}

function noContentResponse(): Response {
  return jsonResponse(null, 204, "No Content");
}

function errorResponse(status: number, statusText: string, body?: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({}),
    text: async () => body ?? "",
    headers: new Headers(),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    clone: () => errorResponse(status, statusText, body),
    formData: async () => new FormData(),
    redirected: false,
    type: "basic",
    url: "",
    bytes: async () => new Uint8Array(),
  } as Response;
}

function makeBreakpoint(overrides: Record<string, unknown> = {}) {
  return {
    id: "bp-001",
    text: "Should we use connection pooling?",
    status: "pending",
    context: { description: "", codeSnippets: [], fileReferences: [], tags: [] },
    routing: { strategy: "single", targetResponders: [], timeoutMs: 1_800_000, presentToUser: false },
    answers: [],
    createdAt: "2026-04-21T10:00:00.000Z",
    updatedAt: "2026-04-21T10:00:00.000Z",
    expiresAt: "2026-04-21T10:30:00.000Z",
    ...overrides,
  };
}

function makeAnswer(overrides: Record<string, unknown> = {}) {
  return {
    id: "answer-001",
    breakpointId: "bp-001",
    responderId: "tal",
    responderName: "Tal M",
    text: "Yes, use connection pooling.",
    approved: true,
    confidence: 90,
    references: [],
    followUpQuestions: [],
    answeredAt: "2026-04-21T10:05:00.000Z",
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("ServerClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ── Constructor ──────────────────────────────────────────────────────────

  describe("constructor", () => {
    it("should use the default server URL when no options are provided", () => {
      const client = new ServerClient();
      expect(client.baseUrl).toBe(DEFAULT_BMUX_SERVER_URL);
    });

    it("should accept a string URL", () => {
      const client = new ServerClient("https://custom.example.com/api/v1");
      expect(client.baseUrl).toBe("https://custom.example.com/api/v1");
    });

    it("should strip trailing slashes from the URL", () => {
      const client = new ServerClient("https://example.com/api/v1///");
      expect(client.baseUrl).toBe("https://example.com/api/v1");
    });

    it("should accept an options object with baseUrl", () => {
      const client = new ServerClient({ baseUrl: "https://custom.example.com/api/v1" });
      expect(client.baseUrl).toBe("https://custom.example.com/api/v1");
    });

    it("should use the default URL when options object has no baseUrl", () => {
      const client = new ServerClient({});
      expect(client.baseUrl).toBe(DEFAULT_BMUX_SERVER_URL);
    });
  });

  // ── submitBreakpoint ────────────────────────────────────────────────────

  describe("submitBreakpoint()", () => {
    it("should POST to /breakpoints and return the created breakpoint", async () => {
      const bp = makeBreakpoint();
      mockFetch.mockResolvedValueOnce(jsonResponse(bp));

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.submitBreakpoint({
        text: "Should we use connection pooling?",
        context: { description: "", codeSnippets: [], fileReferences: [], tags: [] },
        routing: { strategy: "single", targetResponders: [], timeoutMs: 1_800_000, presentToUser: false },
        projectId: "proj-1",
        repoId: "repo-1",
      });

      expect(result.id).toBe("bp-001");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/breakpoints");
      expect((init as RequestInit).method).toBe("POST");
    });

    it("should throw ServerError on non-OK response", async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(400, "Bad Request", "Missing text"));

      const client = new ServerClient("https://api.example.com/api/v1");
      await expect(
        client.submitBreakpoint({
          text: "",
          context: { description: "", codeSnippets: [], fileReferences: [], tags: [] },
          routing: { strategy: "single", targetResponders: [], timeoutMs: 1_800_000, presentToUser: false },
          projectId: "proj-1",
          repoId: "repo-1",
        }),
      ).rejects.toThrow(ServerError);
    });
  });

  // ── getBreakpoint ───────────────────────────────────────────────────────

  describe("getBreakpoint()", () => {
    it("should GET /breakpoints/:id and return the breakpoint", async () => {
      const bp = makeBreakpoint({ id: "bp-xyz" });
      mockFetch.mockResolvedValueOnce(jsonResponse(bp));

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.getBreakpoint("bp-xyz");

      expect(result.id).toBe("bp-xyz");
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/breakpoints/bp-xyz");
    });

    it("should throw ServerError for 404 response", async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(404, "Not Found"));

      const client = new ServerClient("https://api.example.com/api/v1");
      await expect(client.getBreakpoint("nonexistent")).rejects.toThrow(ServerError);
    });
  });

  // ── createBrowserSession ────────────────────────────────────────────────

  describe("createBrowserSession()", () => {
    it("should POST to /breakpoints/:id/browser-session", async () => {
      const session = { breakpointId: "bp-001", slug: "abc", url: "https://example.com/s/abc", authToken: "tok", expiresAt: "2026-04-21T11:00:00.000Z", mode: "same-user" };
      mockFetch.mockResolvedValueOnce(jsonResponse(session));

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.createBrowserSession("bp-001");

      expect(result.slug).toBe("abc");
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/breakpoints/bp-001/browser-session");
      expect((init as RequestInit).method).toBe("POST");
    });

    it("should pass mode and responder options", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.createBrowserSession("bp-001", {
        mode: "responder",
        responderId: "tal",
        responderName: "Tal M",
      });

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.mode).toBe("responder");
      expect(body.responderId).toBe("tal");
    });
  });

  // ── getBreakpointSession ────────────────────────────────────────────────

  describe("getBreakpointSession()", () => {
    it("should GET /breakpoints/session/:authToken", async () => {
      const sessionView = { breakpoint: makeBreakpoint(), expiresAt: "2026-04-21T11:00:00.000Z", canAnswer: true, mode: "same-user" };
      mockFetch.mockResolvedValueOnce(jsonResponse(sessionView));

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.getBreakpointSession("auth-token-123");

      expect(result.canAnswer).toBe(true);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/breakpoints/session/auth-token-123");
    });
  });

  // ── submitSessionAnswer ─────────────────────────────────────────────────

  describe("submitSessionAnswer()", () => {
    it("should POST to /breakpoints/session/:authToken/answer", async () => {
      const answer = makeAnswer();
      mockFetch.mockResolvedValueOnce(jsonResponse(answer));

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.submitSessionAnswer("auth-token-123", {
        text: "Yes, do it.",
        confidence: 85,
      });

      expect(result.text).toBe("Yes, use connection pooling.");
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/breakpoints/session/auth-token-123/answer");
      expect((init as RequestInit).method).toBe("POST");
    });
  });

  // ── listResponders ──────────────────────────────────────────────────────

  describe("listResponders()", () => {
    it("should GET /responders without filters", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.listResponders();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/responders");
    });

    it("should append query params when filters are provided", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.listResponders({ projectId: "proj-1", repoId: "repo-1" });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("projectId=proj-1");
      expect(url).toContain("repoId=repo-1");
    });
  });

  // ── listPendingBreakpoints ──────────────────────────────────────────────

  describe("listPendingBreakpoints()", () => {
    it("should GET /responders/:id/breakpoints", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([makeBreakpoint()]));

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.listPendingBreakpoints("tal");

      expect(result).toHaveLength(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/responders/tal/breakpoints");
    });

    it("should append filters as query params", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.listPendingBreakpoints("tal", { projectId: "proj-1", status: "pending" });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("projectId=proj-1");
      expect(url).toContain("status=pending");
    });
  });

  // ── claimBreakpoint ─────────────────────────────────────────────────────

  describe("claimBreakpoint()", () => {
    it("should POST to /breakpoints/:id/claim", async () => {
      const bp = makeBreakpoint({ status: "claimed" });
      mockFetch.mockResolvedValueOnce(jsonResponse(bp));

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.claimBreakpoint("bp-001", "tal");

      expect(result.status).toBe("claimed");
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/breakpoints/bp-001/claim");
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.responderId).toBe("tal");
    });
  });

  // ── submitAnswer ────────────────────────────────────────────────────────

  describe("submitAnswer()", () => {
    it("should POST to /breakpoints/:id/answers", async () => {
      const answer = makeAnswer();
      mockFetch.mockResolvedValueOnce(jsonResponse(answer));

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.submitAnswer("bp-001", {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, use connection pooling.",
      });

      expect(result.responderId).toBe("tal");
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/breakpoints/bp-001/answers");
    });

    it("should include optional fields in the body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(makeAnswer()));

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.submitAnswer("bp-001", {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
        confidence: 95,
        references: ["https://redis.io"],
        followUpQuestions: ["What about latency?"],
        decisionMemory: { applicabilityContext: "Redis", reasoning: "Pooling helps" },
      });

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.confidence).toBe(95);
      expect(body.references).toEqual(["https://redis.io"]);
      expect(body.decisionMemory.reasoning).toBe("Pooling helps");
    });
  });

  // ── cancelBreakpoint ────────────────────────────────────────────────────

  describe("cancelBreakpoint()", () => {
    it("should DELETE /breakpoints/:id", async () => {
      mockFetch.mockResolvedValueOnce(noContentResponse());

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.cancelBreakpoint("bp-001");

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/breakpoints/bp-001");
      expect((init as RequestInit).method).toBe("DELETE");
    });
  });

  // ── healthCheck ─────────────────────────────────────────────────────────

  describe("healthCheck()", () => {
    it("should GET /health and return status", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ status: "ok" }));

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.healthCheck();

      expect(result.status).toBe("ok");
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/health");
    });
  });

  // ── ServerError ─────────────────────────────────────────────────────────

  describe("ServerError", () => {
    it("should contain status, statusText, and optional body", () => {
      const err = new ServerError(404, "Not Found", "No breakpoint");
      expect(err.status).toBe(404);
      expect(err.statusText).toBe("Not Found");
      expect(err.body).toBe("No breakpoint");
      expect(err.message).toBe("Server responded with 404 Not Found");
      expect(err.name).toBe("ServerError");
    });

    it("should work without body", () => {
      const err = new ServerError(500, "Internal Server Error");
      expect(err.body).toBeUndefined();
    });
  });

  // ── Default headers ─────────────────────────────────────────────────────

  describe("default headers", () => {
    it("should merge default headers into every request", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ status: "ok" }));

      const client = new ServerClient({
        baseUrl: "https://api.example.com/api/v1",
        defaultHeaders: { "X-Custom-Header": "custom-value" },
      });
      await client.healthCheck();

      const [, init] = mockFetch.mock.calls[0];
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers["X-Custom-Header"]).toBe("custom-value");
    });
  });

  // ── URL resolution ──────────────────────────────────────────────────────

  describe("URL resolution", () => {
    it("should resolve paths correctly when baseUrl includes /api/v1", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.listResponders();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/responders");
    });
  });

  // ── HTTP method helpers ─────────────────────────────────────────────────

  describe("HTTP helpers", () => {
    it("get() sends GET request", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.get("/test-path");

      const [, init] = mockFetch.mock.calls[0];
      expect((init as RequestInit).method).toBe("GET");
    });

    it("post() sends POST request with JSON body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.post("/test-path", { key: "value" });

      const [, init] = mockFetch.mock.calls[0];
      expect((init as RequestInit).method).toBe("POST");
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.key).toBe("value");
    });

    it("put() sends PUT request with JSON body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.put("/test-path", { key: "value" });

      const [, init] = mockFetch.mock.calls[0];
      expect((init as RequestInit).method).toBe("PUT");
    });

    it("delete() sends DELETE request", async () => {
      mockFetch.mockResolvedValueOnce(noContentResponse());

      const client = new ServerClient("https://api.example.com/api/v1");
      await client.delete("/test-path");

      const [, init] = mockFetch.mock.calls[0];
      expect((init as RequestInit).method).toBe("DELETE");
    });

    it("should handle 204 No Content responses", async () => {
      mockFetch.mockResolvedValueOnce(noContentResponse());

      const client = new ServerClient("https://api.example.com/api/v1");
      const result = await client.delete("/test-path");

      expect(result).toBeUndefined();
    });
  });
});
