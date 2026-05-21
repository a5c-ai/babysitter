import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Breakpoint, BreakpointAnswer } from "../types.js";
import { ResponderClient } from "../client/responder-client.js";
import { ServerClient } from "../client/server-client.js";

// ────────────────────────────────────────────────────────────────────────────
// Mock fetch
// ────────────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn<typeof globalThis.fetch>();
vi.stubGlobal("fetch", mockFetch);

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const NOW = "2026-04-21T10:00:00.000Z";
const LATER = "2026-04-21T10:30:00.000Z";

function jsonResponse(data: unknown, status = 200): Response {
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
    clone: () => jsonResponse(data, status),
    formData: async () => new FormData(),
    redirected: false,
    type: "basic",
    url: "",
    bytes: async () => new Uint8Array(),
  } as Response;
}

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

function makeAnswer(overrides: Partial<BreakpointAnswer> = {}): BreakpointAnswer {
  return {
    id: "answer-001",
    breakpointId: "bp-001",
    responderId: "tal",
    responderName: "Tal M",
    text: "Yes.",
    confidence: 80,
    references: [],
    followUpQuestions: [],
    answeredAt: NOW,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("ResponderClient", () => {
  let serverClient: ServerClient;
  let responderClient: ResponderClient;

  beforeEach(() => {
    mockFetch.mockReset();
    serverClient = new ServerClient("https://api.example.com/api/v1");
    responderClient = new ResponderClient(serverClient, "tal");
  });

  afterEach(() => {
    responderClient.stopPollingLoop();
  });

  // ── responderId ─────────────────────────────────────────────────────────

  describe("responderId", () => {
    it("should expose the responderId", () => {
      expect(responderClient.responderId).toBe("tal");
    });
  });

  // ── fetchPendingBreakpoints ─────────────────────────────────────────────

  describe("fetchPendingBreakpoints()", () => {
    it("should call ServerClient.listPendingBreakpoints with the responderId", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([makeBreakpoint()]));

      const result = await responderClient.fetchPendingBreakpoints();

      expect(result).toHaveLength(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/responders/tal/breakpoints");
    });

    it("should return empty array when no breakpoints", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const result = await responderClient.fetchPendingBreakpoints();
      expect(result).toEqual([]);
    });
  });

  // ── claimBreakpoint ─────────────────────────────────────────────────────

  describe("claimBreakpoint()", () => {
    it("should call ServerClient.claimBreakpoint with breakpointId and responderId", async () => {
      const claimed = makeBreakpoint({ status: "claimed" });
      mockFetch.mockResolvedValueOnce(jsonResponse(claimed));

      const result = await responderClient.claimBreakpoint("bp-001");

      expect(result.status).toBe("claimed");
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("/breakpoints/bp-001/claim");
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.responderId).toBe("tal");
    });
  });

  // ── submitAnswer ────────────────────────────────────────────────────────

  describe("submitAnswer()", () => {
    it("should submit answer with responderId from constructor", async () => {
      const answer = makeAnswer();
      mockFetch.mockResolvedValueOnce(jsonResponse(answer));

      const result = await responderClient.submitAnswer("bp-001", "Yes, do it.");

      expect(result.text).toBe("Yes.");
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("/breakpoints/bp-001/answers");
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.responderId).toBe("tal");
      expect(body.text).toBe("Yes, do it.");
    });

    it("should use default confidence of 80", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(makeAnswer()));

      await responderClient.submitAnswer("bp-001", "Answer text");

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.confidence).toBe(80);
    });

    it("should accept custom confidence", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(makeAnswer()));

      await responderClient.submitAnswer("bp-001", "Answer text", 95);

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.confidence).toBe(95);
    });

    it("should accept custom references", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(makeAnswer()));

      await responderClient.submitAnswer("bp-001", "Answer text", 80, ["https://example.com"]);

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.references).toEqual(["https://example.com"]);
    });

    it("should default references to empty array", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(makeAnswer()));

      await responderClient.submitAnswer("bp-001", "Answer text");

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.references).toEqual([]);
    });
  });

  // ── startPollingLoop / stopPollingLoop ──────────────────────────────────

  describe("polling loop", () => {
    it("should start polling and invoke callback when breakpoints are found", async () => {
      const bp = makeBreakpoint();
      mockFetch.mockResolvedValue(jsonResponse([bp]));

      const callback = vi.fn();
      const stop = responderClient.startPollingLoop(callback, 50);

      // Wait for the first poll
      await new Promise((r) => setTimeout(r, 100));
      stop();

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0]).toHaveLength(1);
    });

    it("should not invoke callback when no breakpoints are found", async () => {
      mockFetch.mockResolvedValue(jsonResponse([]));

      const callback = vi.fn();
      const stop = responderClient.startPollingLoop(callback, 50);

      await new Promise((r) => setTimeout(r, 100));
      stop();

      expect(callback).not.toHaveBeenCalled();
    });

    it("should stop polling when stop function is called", async () => {
      mockFetch.mockResolvedValue(jsonResponse([]));

      const callback = vi.fn();
      const stop = responderClient.startPollingLoop(callback, 50);
      stop();

      const callCountBefore = mockFetch.mock.calls.length;
      await new Promise((r) => setTimeout(r, 200));
      const callCountAfter = mockFetch.mock.calls.length;

      // Should not have made more calls after stopping (allow +1 for in-flight)
      expect(callCountAfter - callCountBefore).toBeLessThanOrEqual(1);
    });

    it("should replace existing polling loop when started again", async () => {
      mockFetch.mockResolvedValue(jsonResponse([]));

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      responderClient.startPollingLoop(callback1, 1000);
      const stop = responderClient.startPollingLoop(callback2, 50);

      await new Promise((r) => setTimeout(r, 100));
      stop();
    });

    it("stopPollingLoop should be safe to call when no loop is running", () => {
      expect(() => responderClient.stopPollingLoop()).not.toThrow();
    });

    it("should continue polling after errors", async () => {
      let callCount = 0;
      mockFetch.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Network error");
        }
        return jsonResponse([makeBreakpoint()]);
      });

      const callback = vi.fn();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const stop = responderClient.startPollingLoop(callback, 50);

      await new Promise((r) => setTimeout(r, 200));
      stop();
      consoleSpy.mockRestore();

      // Should have recovered after the error and called the callback
      expect(callback).toHaveBeenCalled();
    });
  });
});
