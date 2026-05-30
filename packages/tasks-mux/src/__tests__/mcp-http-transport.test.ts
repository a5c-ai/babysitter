import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Server } from "node:http";
import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointContext,
  BreakpointRouting,
  BreakpointWaitResult,
} from "../types.js";
import type {
  BreakpointBackend,
  SubmitBreakpointParams,
  SubmitAnswerParams,
  WaitForAnswerOptions,
} from "../backend.js";

// ────────────────────────────────────────────────────────────────────────────
// Dynamic imports
// ────────────────────────────────────────────────────────────────────────────

async function importHttpTransport() {
  return import("../mcp/http-transport.js");
}

async function importMcpServer() {
  return import("../mcp/server.js");
}

// ────────────────────────────────────────────────────────────────────────────
// Test Factories
// ────────────────────────────────────────────────────────────────────────────

const NOW = "2026-04-21T10:00:00.000Z";
const LATER = "2026-04-21T10:30:00.000Z";
const TEST_TOKEN = "test-bearer-token-abc123";

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
// Helper: simple JSON-RPC request builder
// ────────────────────────────────────────────────────────────────────────────

function jsonRpcRequest(method: string, params?: Record<string, unknown>, id?: number) {
  return {
    jsonrpc: "2.0" as const,
    method,
    params: params ?? {},
    id: id ?? 1,
  };
}

/** Standard headers required by the MCP Streamable HTTP transport. */
const MCP_HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json, text/event-stream",
};

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("MCP HTTP Transport", () => {
  let serverInstance: { httpServer: Server; close: () => Promise<void>; port: number } | undefined;
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = {
      BPX_MCP_PORT: process.env.BPX_MCP_PORT,
      BPX_MCP_TOKEN: process.env.BPX_MCP_TOKEN,
      BMUX_BACKEND: process.env.BMUX_BACKEND,
    };
    // Clear env vars to avoid cross-test contamination
    delete process.env.BPX_MCP_PORT;
    delete process.env.BPX_MCP_TOKEN;
    delete process.env.BMUX_BACKEND;
  });

  afterEach(async () => {
    // Restore env
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    // Close server if open
    if (serverInstance) {
      await serverInstance.close().catch(() => {});
      serverInstance = undefined;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 1: HTTP server initialization
  // ──────────────────────────────────────────────────────────────────────────

  describe("server initialization", () => {
    it("creates an HTTP server on the specified port", async () => {
      const { createHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = createHttpMcpServer(mcpServer, { port: 0 });

      expect(result.httpServer).toBeDefined();
      expect(result.transport).toBeDefined();
      expect(result.close).toBeInstanceOf(Function);

      // Clean up without starting
      await result.transport.close();
    });

    it("starts and listens via startHttpMcpServer", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, { port: 0 });
      serverInstance = result;

      const actualPort = (result.httpServer.address() as { port: number }).port;
      expect(actualPort).toBeGreaterThan(0);
    });

    it("defaults to port 3848 when no port is specified", async () => {
      const { createHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = createHttpMcpServer(mcpServer);
      expect(result.port).toBe(3848);
      await result.transport.close();
    });

    it("reads port from BPX_MCP_PORT env var", async () => {
      process.env.BPX_MCP_PORT = "4242";
      const { createHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = createHttpMcpServer(mcpServer);
      expect(result.port).toBe(4242);
      await result.transport.close();
    });

    it("option port overrides BPX_MCP_PORT env var", async () => {
      process.env.BPX_MCP_PORT = "4242";
      const { createHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = createHttpMcpServer(mcpServer, { port: 5555 });
      expect(result.port).toBe(5555);
      await result.transport.close();
    });

    it("exports startHttpBreakpointMcpServer from server module", async () => {
      const { startHttpBreakpointMcpServer } = await importMcpServer();
      expect(startHttpBreakpointMcpServer).toBeInstanceOf(Function);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 2: Health check endpoint
  // ──────────────────────────────────────────────────────────────────────────

  describe("GET /healthz", () => {
    it("returns 200 with status ok", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, { port: 0 });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      const response = await fetch(`http://localhost:${port}/healthz`);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ status: "ok", transport: "streamable-http" });
    });

    it("does not require authentication for health check", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        bearerToken: TEST_TOKEN,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      // No Authorization header -- should still work for healthz
      const response = await fetch(`http://localhost:${port}/healthz`);
      expect(response.status).toBe(200);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 3: Bearer token authentication
  // ──────────────────────────────────────────────────────────────────────────

  describe("bearer token authentication", () => {
    it("rejects requests without Authorization header when token is configured", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        bearerToken: TEST_TOKEN,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      const response = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: { ...MCP_HEADERS },
        body: JSON.stringify(jsonRpcRequest("initialize")),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Missing Authorization header");
    });

    it("rejects requests with invalid bearer token", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        bearerToken: TEST_TOKEN,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      const response = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: {
          ...MCP_HEADERS,
          "Authorization": "Bearer wrong-token",
        },
        body: JSON.stringify(jsonRpcRequest("initialize")),
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Invalid bearer token");
    });

    it("rejects requests with non-Bearer auth scheme", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        bearerToken: TEST_TOKEN,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      const response = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: {
          ...MCP_HEADERS,
          "Authorization": `Basic ${TEST_TOKEN}`,
        },
        body: JSON.stringify(jsonRpcRequest("initialize")),
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Authorization header must use Bearer scheme");
    });

    it("accepts requests with valid bearer token", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        bearerToken: TEST_TOKEN,
        enableJsonResponse: true,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      const response = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: {
          ...MCP_HEADERS,
          "Authorization": `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify(jsonRpcRequest("initialize", {
          protocolVersion: "2025-03-26",
          clientInfo: { name: "test-client", version: "1.0.0" },
          capabilities: {},
        })),
      });

      // The MCP SDK should process the request (either 200 or SSE)
      // With enableJsonResponse, it should be a direct JSON response
      expect(response.status).toBe(200);
    });

    it("allows requests without token when no bearerToken is configured", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        enableJsonResponse: true,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      const response = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: { ...MCP_HEADERS },
        body: JSON.stringify(jsonRpcRequest("initialize", {
          protocolVersion: "2025-03-26",
          clientInfo: { name: "test-client", version: "1.0.0" },
          capabilities: {},
        })),
      });

      expect(response.status).toBe(200);
    });

    it("reads bearer token from BPX_MCP_TOKEN env var", async () => {
      process.env.BPX_MCP_TOKEN = "env-token-xyz";
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        enableJsonResponse: true,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;

      // Without token -- should be rejected
      const noAuthResp = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: { ...MCP_HEADERS },
        body: JSON.stringify(jsonRpcRequest("initialize")),
      });
      expect(noAuthResp.status).toBe(401);

      // With env-based token -- should be accepted
      const authResp = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: {
          ...MCP_HEADERS,
          "Authorization": "Bearer env-token-xyz",
        },
        body: JSON.stringify(jsonRpcRequest("initialize", {
          protocolVersion: "2025-03-26",
          clientInfo: { name: "test-client", version: "1.0.0" },
          capabilities: {},
        })),
      });
      // Should pass auth (200 means MCP accepted, not 401/403)
      expect(authResp.status).toBe(200);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 4: 404 for unknown routes
  // ──────────────────────────────────────────────────────────────────────────

  describe("unknown routes", () => {
    it("returns 404 for unknown paths", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, { port: 0 });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      const response = await fetch(`http://localhost:${port}/nonexistent`);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("Not found");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 5: MCP protocol initialization over HTTP
  // ──────────────────────────────────────────────────────────────────────────

  describe("MCP protocol over HTTP", () => {
    it("completes initialization handshake with JSON response mode", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        enableJsonResponse: true,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      const response = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: { ...MCP_HEADERS },
        body: JSON.stringify(jsonRpcRequest("initialize", {
          protocolVersion: "2025-03-26",
          clientInfo: { name: "test-client", version: "1.0.0" },
          capabilities: {},
        })),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.jsonrpc).toBe("2.0");
      expect(body.result).toBeDefined();
      expect(body.result.serverInfo.name).toBe("tasks-mux");
    });

    it("returns session ID header in stateful mode", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        stateful: true,
        enableJsonResponse: true,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;
      const response = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: { ...MCP_HEADERS },
        body: JSON.stringify(jsonRpcRequest("initialize", {
          protocolVersion: "2025-03-26",
          clientInfo: { name: "test-client", version: "1.0.0" },
          capabilities: {},
        })),
      });

      expect(response.status).toBe(200);
      const sessionId = response.headers.get("mcp-session-id");
      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe("string");
    });

    it("lists tools after initialization", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, {
        port: 0,
        stateful: true,
        enableJsonResponse: true,
      });
      serverInstance = result;

      const port = (result.httpServer.address() as { port: number }).port;

      // Step 1: Initialize
      const initResponse = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: { ...MCP_HEADERS },
        body: JSON.stringify(jsonRpcRequest("initialize", {
          protocolVersion: "2025-03-26",
          clientInfo: { name: "test-client", version: "1.0.0" },
          capabilities: {},
        })),
      });
      expect(initResponse.status).toBe(200);
      const sessionId = initResponse.headers.get("mcp-session-id");

      // Step 2: Send initialized notification
      await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: {
          ...MCP_HEADERS,
          ...(sessionId ? { "mcp-session-id": sessionId } : {}),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
        }),
      });

      // Step 3: List tools
      const toolsResponse = await fetch(`http://localhost:${port}/mcp`, {
        method: "POST",
        headers: {
          ...MCP_HEADERS,
          ...(sessionId ? { "mcp-session-id": sessionId } : {}),
        },
        body: JSON.stringify(jsonRpcRequest("tools/list", {}, 2)),
      });

      expect(toolsResponse.status).toBe(200);
      const toolsBody = await toolsResponse.json();
      expect(toolsBody.result).toBeDefined();
      expect(toolsBody.result.tools).toBeInstanceOf(Array);

      // Should expose breakpoint/responder tools plus native task tools.
      const toolNames = toolsBody.result.tools.map((t: { name: string }) => t.name);
      expect(toolNames).toContain("ask_breakpoint");
      expect(toolNames).toContain("check_breakpoint_status");
      expect(toolNames).toContain("list_breakpoints");
      expect(toolNames).toContain("create_todo");
      expect(toolNames).toContain("assign_task");
      expect(toolNames).toContain("search_tasks");
      expect(toolNames).toContain("escalate");
      expect(toolNames).toContain("answer_breakpoint");
      expect(toolNames).toContain("verify_breakpoint_answer");
      expect(toolNames).toContain("list_responders");
      expect(toolNames).toContain("claim_breakpoint");
      expect(toolNames).toContain("poll_breakpoints");
      expect(toolNames.length).toBe(12);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 6: Graceful shutdown
  // ──────────────────────────────────────────────────────────────────────────

  describe("graceful shutdown", () => {
    it("close() stops the HTTP server", async () => {
      const { startHttpMcpServer } = await importHttpTransport();
      const { createBreakpointMcpServer } = await importMcpServer();

      const mcpServer = createBreakpointMcpServer();
      const result = await startHttpMcpServer(mcpServer, { port: 0 });

      const port = (result.httpServer.address() as { port: number }).port;

      // Verify server is up
      const healthResp = await fetch(`http://localhost:${port}/healthz`);
      expect(healthResp.status).toBe(200);

      // Close it
      await result.close();

      // Verify server is down
      await expect(
        fetch(`http://localhost:${port}/healthz`),
      ).rejects.toThrow();

      // Don't set serverInstance since we already closed
    });
  });
});
