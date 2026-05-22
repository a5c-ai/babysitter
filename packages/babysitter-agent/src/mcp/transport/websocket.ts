/**
 * Status: NOT INTEGRATED YET
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-REMOTE-003: WebSocket server transport for MCP.
 *
 * Creates a WebSocket server where each connection gets its own MCP Transport,
 * enabling per-connection McpServer instances for session multiplexing.
 */

import { WebSocketServer, WebSocket } from "ws";
import * as http from "node:http";
import * as crypto from "node:crypto";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import type { TransportSendOptions } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { WebSocketTransportOptions } from "./types";
import { WebSocketSessionManager } from "./session";

const DEFAULT_PING_INTERVAL_MS = 30_000;
const DEFAULT_MAX_MESSAGES_PER_SECOND = 100;
const SESSION_GRACE_PERIOD_MS = 60_000;

export function authenticateUpgrade(
  request: http.IncomingMessage,
  expectedToken: string | undefined,
): boolean {
  if (!expectedToken) return true;
  const authHeader = request.headers.authorization;
  if (!authHeader) return false;
  const expected = `Bearer ${expectedToken}`;
  if (authHeader.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(authHeader),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

/**
 * A Transport implementation backed by a single WebSocket connection.
 * Bridges WS messages to/from the MCP server.
 */
export class WebSocketConnectionTransport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: unknown) => void;
  sessionId?: string;

  private _ws: WebSocket;
  private _rateLimiter: { count: number; resetAt: number };
  private _maxMps: number;

  constructor(ws: WebSocket, sessionId: string, maxMessagesPerSecond: number) {
    this._ws = ws;
    this.sessionId = sessionId;
    this._maxMps = maxMessagesPerSecond;
    this._rateLimiter = { count: 0, resetAt: Date.now() + 1000 };
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- Transport interface requires Promise
  async start(): Promise<void> {
    this._ws.on("message", (data: Buffer) => {
      // Rate limit check
      const now = Date.now();
      if (now >= this._rateLimiter.resetAt) {
        this._rateLimiter.count = 0;
        this._rateLimiter.resetAt = now + 1000;
      }
      this._rateLimiter.count++;
      if (this._rateLimiter.count > this._maxMps) {
        const errorResponse = JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Rate limit exceeded" },
          id: null,
        });
        this._ws.send(errorResponse);
        return;
      }

      try {
        const message = JSON.parse(data.toString()) as unknown;
        if (this.onmessage) {
          this.onmessage(message);
        }
      } catch (err) {
        if (this.onerror) {
          this.onerror(err instanceof Error ? err : new Error(String(err)));
        }
      }
    });

    this._ws.on("close", () => {
      if (this.onclose) this.onclose();
    });

    this._ws.on("error", (err) => {
      if (this.onerror) this.onerror(err);
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- Transport interface requires Promise
  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    if (this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(message));
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- Transport interface requires Promise
  async close(): Promise<void> {
    this._ws.close(1001, "Server shutting down");
  }

  setProtocolVersion?: (version: string) => void;
}

export interface WebSocketServerTransport {
  port: number;
  sessionManager: WebSocketSessionManager;
  close(): Promise<void>;
  onconnection?: (transport: WebSocketConnectionTransport) => void;
}

export async function createWebSocketTransport(
  options: WebSocketTransportOptions,
): Promise<WebSocketServerTransport> {
  const {
    port,
    host = "127.0.0.1",
    authToken,
    pingIntervalMs = DEFAULT_PING_INTERVAL_MS,
    maxMessagesPerSecond = DEFAULT_MAX_MESSAGES_PER_SECOND,
    sessionGracePeriodMs = SESSION_GRACE_PERIOD_MS,
  } = options;

  const sessionManager = new WebSocketSessionManager();
  const server = http.createServer();
  const wss = new WebSocketServer({ noServer: true });

  const connections = new Set<WebSocket>();
  const pingTimers = new Map<WebSocket, ReturnType<typeof setInterval>>();
  const sessionGraceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  let onconnection: ((transport: WebSocketConnectionTransport) => void) | undefined;

  server.on("upgrade", (request, socket, head) => {
    if (!authenticateUpgrade(request, authToken)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      // Check for session restore
      const restoreId = request.headers["x-session-id"] as string | undefined;
      let session;
      if (restoreId) {
        session = sessionManager.restoreSession(restoreId);
        if (session) {
          // Cancel any pending grace period cleanup
          const graceTimer = sessionGraceTimers.get(restoreId);
          if (graceTimer) {
            clearTimeout(graceTimer);
            sessionGraceTimers.delete(restoreId);
          }
        }
      }
      if (!session) {
        session = sessionManager.createSession();
      }

      connections.add(ws);

      // Set up ping/pong keepalive
      let alive = true;
      const pingTimer = setInterval(() => {
        if (!alive) {
          ws.terminate();
          return;
        }
        alive = false;
        ws.ping();
      }, pingIntervalMs);

      ws.on("pong", () => {
        alive = true;
      });

      // Create per-connection MCP transport
      const transport = new WebSocketConnectionTransport(ws, session.sessionId, maxMessagesPerSecond);

      ws.on("close", () => {
        connections.delete(ws);
        clearInterval(pingTimer);
        pingTimers.delete(ws);

        // Grace period: don't delete session immediately — allow reconnection
        const sid = transport.sessionId;
        if (sid) {
          const graceTimer = setTimeout(() => {
            sessionManager.removeSession(sid);
            sessionGraceTimers.delete(sid);
          }, sessionGracePeriodMs);
          sessionGraceTimers.set(sid, graceTimer);
        }
      });

      pingTimers.set(ws, pingTimer);

      // Notify consumer so they can connect a McpServer to this transport
      if (onconnection) {
        onconnection(transport);
      }

      // Send session info
      ws.send(JSON.stringify({
        jsonrpc: "2.0",
        method: "session/initialized",
        params: { sessionId: session.sessionId },
      }));
    });
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === "object" && addr ? addr.port : port;

      const result: WebSocketServerTransport = {
        port: actualPort,
        sessionManager,
        get onconnection() {
          return onconnection;
        },
        set onconnection(handler) {
          onconnection = handler;
        },
        async close() {
          // Clear all grace timers
          for (const timer of sessionGraceTimers.values()) {
            clearTimeout(timer);
          }
          sessionGraceTimers.clear();

          // Send close frame to all connections
          for (const ws of connections) {
            ws.close(1001, "Server shutting down");
          }

          // Clear all ping timers
          for (const timer of pingTimers.values()) {
            clearInterval(timer);
          }
          pingTimers.clear();

          // Wait for connections to close (max 5s)
          await Promise.race([
            new Promise<void>((res) => {
              if (connections.size === 0) { res(); return; }
              const check: ReturnType<typeof setInterval> = setInterval(() => {
                if (connections.size === 0) {
                  clearInterval(check);
                  res();
                }
              }, 100);
            }),
            new Promise<void>((res) => setTimeout(res, 5000)),
          ]);

          wss.close();
          await new Promise<void>((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          });
        },
      };

      resolve(result);
    });
  });
}
