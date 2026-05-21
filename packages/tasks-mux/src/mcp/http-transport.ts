import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_MCP_HTTP_PORT = 3848;
const MCP_PATH = "/mcp";
const HEALTH_PATH = "/healthz";

// ── Types ──────────────────────────────────────────────────────────────────

export interface HttpMcpServerOptions {
  /** Port to listen on. Defaults to BPX_MCP_PORT env var or 3848. */
  port?: number;
  /** Bearer token for authentication. Defaults to BPX_MCP_TOKEN env var. */
  bearerToken?: string;
  /** Enable stateful sessions (generates session IDs). Defaults to true. */
  stateful?: boolean;
  /** Enable JSON responses instead of SSE streams. Defaults to false. */
  enableJsonResponse?: boolean;
}

export interface HttpMcpServerResult {
  /** The underlying Node.js HTTP server. */
  httpServer: Server;
  /** The StreamableHTTPServerTransport instance. */
  transport: StreamableHTTPServerTransport;
  /** The resolved port the server is listening on. */
  port: number;
  /** Close the server and transport gracefully. */
  close: () => Promise<void>;
}

// ── Bearer Token Auth ──────────────────────────────────────────────────────

function validateBearerToken(
  req: IncomingMessage,
  expectedToken: string,
): { valid: boolean; error?: string } {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { valid: false, error: "Missing Authorization header" };
  }

  if (!authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Authorization header must use Bearer scheme" };
  }

  const token = authHeader.slice(7);
  if (token !== expectedToken) {
    return { valid: false, error: "Invalid bearer token" };
  }

  return { valid: true };
}

function sendJsonError(res: ServerResponse, statusCode: number, message: string): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}

// ── HTTP Server Factory ────────────────────────────────────────────────────

/**
 * Create an HTTP server that serves the MCP protocol via Streamable HTTP transport.
 *
 * The server provides:
 * - POST/GET/DELETE /mcp -- MCP Streamable HTTP transport endpoint
 * - GET /healthz -- health check endpoint
 * - Bearer token authentication on /mcp routes (when token is configured)
 */
export function createHttpMcpServer(
  mcpServer: McpServer,
  options: HttpMcpServerOptions = {},
): HttpMcpServerResult {
  const port = options.port ?? (process.env.BPX_MCP_PORT ? parseInt(process.env.BPX_MCP_PORT, 10) : DEFAULT_MCP_HTTP_PORT);
  const bearerToken = options.bearerToken ?? process.env.BPX_MCP_TOKEN;
  const stateful = options.stateful ?? true;

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: stateful ? () => randomUUID() : undefined,
    enableJsonResponse: options.enableJsonResponse ?? false,
  });

  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const pathname = url.pathname;

    // ── Health check (no auth required) ────────────────────────────────
    if (pathname === HEALTH_PATH && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", transport: "streamable-http" }));
      return;
    }

    // ── MCP endpoint ───────────────────────────────────────────────────
    if (pathname === MCP_PATH) {
      // Bearer token auth (if configured)
      if (bearerToken) {
        const authResult = validateBearerToken(req, bearerToken);
        if (!authResult.valid) {
          const statusCode = req.headers.authorization ? 403 : 401;
          sendJsonError(res, statusCode, authResult.error!);
          return;
        }
      }

      // Delegate to the StreamableHTTPServerTransport
      transport.handleRequest(req, res).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Internal server error";
        if (!res.headersSent) {
          sendJsonError(res, 500, message);
        }
      });
      return;
    }

    // ── 404 for everything else ────────────────────────────────────────
    sendJsonError(res, 404, "Not found");
  });

  // Connect MCP server to transport (deferred to allow caller to set up listeners first)
  const connectPromise = mcpServer.connect(transport);

  const close = async (): Promise<void> => {
    await connectPromise;
    await transport.close();
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    });
  };

  return {
    httpServer,
    transport,
    port,
    close,
  };
}

/**
 * Create and start an HTTP MCP server, returning when it is listening.
 */
export async function startHttpMcpServer(
  mcpServer: McpServer,
  options: HttpMcpServerOptions = {},
): Promise<HttpMcpServerResult> {
  const result = createHttpMcpServer(mcpServer, options);

  await new Promise<void>((resolve) => {
    result.httpServer.listen(result.port, () => {
      resolve();
    });
  });

  return result;
}
