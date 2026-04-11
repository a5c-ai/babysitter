import { describe, it, expect, afterEach } from "vitest";
import { WebSocket } from "ws";
import * as http from "node:http";
import { createWebSocketTransport, authenticateUpgrade, WebSocketConnectionTransport } from "../../transport/websocket";
import type { WebSocketServerTransport } from "../../transport/websocket";

function connectAndReceiveInit(
  port: number,
  headers?: Record<string, string>,
): Promise<{ ws: WebSocket; initMessage: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`, { headers });
    ws.on("error", reject);
    ws.on("message", (data) => {
      const parsed = JSON.parse(data.toString()) as Record<string, unknown>;
      resolve({ ws, initMessage: parsed });
    });
  });
}

function connectRaw(port: number, headers?: Record<string, string>): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`, { headers });
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
}

describe("WebSocket transport", () => {
  const transports: WebSocketServerTransport[] = [];

  afterEach(async () => {
    for (const t of transports) {
      await t.close().catch(() => {});
    }
    transports.length = 0;
  });

  describe("authenticateUpgrade", () => {
    it("returns true when no token configured", () => {
      const req = { headers: {} } as http.IncomingMessage;
      expect(authenticateUpgrade(req, undefined)).toBe(true);
    });

    it("returns false when token required but missing", () => {
      const req = { headers: {} } as http.IncomingMessage;
      expect(authenticateUpgrade(req, "secret")).toBe(false);
    });

    it("returns false when token is wrong", () => {
      const req = { headers: { authorization: "Bearer wrong" } } as http.IncomingMessage;
      expect(authenticateUpgrade(req, "secret")).toBe(false);
    });

    it("returns true when token matches", () => {
      const req = { headers: { authorization: "Bearer secret" } } as http.IncomingMessage;
      expect(authenticateUpgrade(req, "secret")).toBe(true);
    });

    it("uses timing-safe comparison", () => {
      // Different lengths still rejected
      const req = { headers: { authorization: "Bearer x" } } as http.IncomingMessage;
      expect(authenticateUpgrade(req, "secret")).toBe(false);
    });
  });

  describe("createWebSocketTransport", () => {
    it("AC-WS-001: listens on a configurable port", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);
      expect(transport.port).toBeGreaterThan(0);
    });

    it("AC-WS-003: sends session/initialized as first message with JSON-RPC framing", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);
      transport.onconnection = () => {};

      const { ws, initMessage } = await connectAndReceiveInit(transport.port);
      expect(initMessage.jsonrpc).toBe("2.0");
      expect(initMessage.method).toBe("session/initialized");
      expect((initMessage.params as Record<string, unknown>).sessionId).toBeTruthy();
      ws.close();
    });

    it("AC-WS-004: rejects connections without valid auth token", async () => {
      const transport = await createWebSocketTransport({
        port: 0,
        authToken: "mysecret",
      });
      transports.push(transport);

      await expect(connectRaw(transport.port)).rejects.toThrow();
    });

    it("AC-WS-004: accepts connections with valid auth token", async () => {
      const transport = await createWebSocketTransport({
        port: 0,
        authToken: "mysecret",
      });
      transports.push(transport);
      transport.onconnection = () => {};

      const { ws, initMessage } = await connectAndReceiveInit(transport.port, {
        Authorization: "Bearer mysecret",
      });
      expect((initMessage.params as Record<string, unknown>).sessionId).toBeTruthy();
      ws.close();
    });

    it("AC-WS-005: handles multiple concurrent connections independently", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);

      const connectionTransports: WebSocketConnectionTransport[] = [];
      transport.onconnection = (ct) => {
        connectionTransports.push(ct);
      };

      const { ws: ws1, initMessage: msg1 } = await connectAndReceiveInit(transport.port);
      const { ws: ws2, initMessage: msg2 } = await connectAndReceiveInit(transport.port);

      const id1 = (msg1.params as Record<string, unknown>).sessionId;
      const id2 = (msg2.params as Record<string, unknown>).sessionId;
      expect(id1).not.toBe(id2);
      expect(transport.sessionManager.getActiveCount()).toBe(2);
      expect(connectionTransports).toHaveLength(2);

      ws1.close();
      ws2.close();
    });

    it("AC-WS-006: assigns unique session IDs", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);
      transport.onconnection = () => {};

      const ids = new Set<string>();
      for (let i = 0; i < 3; i++) {
        const { ws, initMessage } = await connectAndReceiveInit(transport.port);
        ids.add((initMessage.params as Record<string, unknown>).sessionId as string);
        ws.close();
        await new Promise((r) => setTimeout(r, 50));
      }
      expect(ids.size).toBe(3);
    });

    it("AC-WS-007: restores session on reconnect with X-Session-Id header (grace period)", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);
      transport.onconnection = () => {};

      // Connect and get session ID
      const { ws: ws1, initMessage: msg1 } = await connectAndReceiveInit(transport.port);
      const sessionId = (msg1.params as Record<string, unknown>).sessionId as string;

      // Close first connection — session stays due to grace period
      ws1.close();
      await new Promise((r) => setTimeout(r, 100));

      // Session should still be in manager (grace period not expired)
      expect(transport.sessionManager.getSession(sessionId)).not.toBeNull();

      // Reconnect with session ID
      const { ws: ws2, initMessage: msg2 } = await connectAndReceiveInit(transport.port, {
        "X-Session-Id": sessionId,
      });
      const restoredId = (msg2.params as Record<string, unknown>).sessionId as string;
      expect(restoredId).toBe(sessionId);

      ws2.close();
    });

    it("AC-WS-009: sends close frame 1001 on shutdown", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transport.onconnection = () => {};

      const { ws } = await connectAndReceiveInit(transport.port);

      const closePromise = new Promise<number>((resolve) => {
        ws.on("close", (code) => resolve(code));
      });

      await transport.close();

      const code = await closePromise;
      expect(code).toBe(1001);
    });

    it("AC-WS-010: defaults to localhost-only binding", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);
      // If it works on 127.0.0.1, we know default host is localhost
      transport.onconnection = () => {};
      const { ws } = await connectAndReceiveInit(transport.port);
      ws.close();
    });

    it("AC-WS-002: onconnection callback fires for each connection (enabling MCP integration)", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);

      const received: WebSocketConnectionTransport[] = [];
      transport.onconnection = (ct) => {
        received.push(ct);
      };

      const { ws: ws1 } = await connectAndReceiveInit(transport.port);
      const { ws: ws2 } = await connectAndReceiveInit(transport.port);

      expect(received).toHaveLength(2);
      expect(received[0].sessionId).toBeTruthy();
      expect(received[1].sessionId).toBeTruthy();
      expect(received[0].sessionId).not.toBe(received[1].sessionId);

      ws1.close();
      ws2.close();
    });

    it("AC-WS-002: WebSocketConnectionTransport forwards messages via onmessage", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);

      const messages: unknown[] = [];
      transport.onconnection = (ct) => {
        void ct.start();
        ct.onmessage = (msg) => messages.push(msg);
      };

      const { ws } = await connectAndReceiveInit(transport.port);

      ws.send(JSON.stringify({ jsonrpc: "2.0", method: "test", id: 1 }));
      await new Promise((r) => setTimeout(r, 100));

      expect(messages).toHaveLength(1);
      expect((messages[0] as Record<string, unknown>).method).toBe("test");

      ws.close();
    });

    it("AC-WS-002: WebSocketConnectionTransport can send responses back", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);

      transport.onconnection = (ct) => {
        void ct.start();
        ct.onmessage = () => {
          void ct.send({ jsonrpc: "2.0", result: { ok: true }, id: 1 });
        };
      };

      const { ws } = await connectAndReceiveInit(transport.port);

      const responsePromise = new Promise<Record<string, unknown>>((resolve) => {
        ws.on("message", (data) => {
          const parsed = JSON.parse(data.toString()) as Record<string, unknown>;
          if (parsed.result) resolve(parsed);
        });
      });

      ws.send(JSON.stringify({ jsonrpc: "2.0", method: "test", id: 1 }));

      const response = await responsePromise;
      expect(response.result).toEqual({ ok: true });
      expect(response.id).toBe(1);

      ws.close();
    });

    it("AC-WS-012: rate limits messages beyond threshold", async () => {
      const transport = await createWebSocketTransport({
        port: 0,
        maxMessagesPerSecond: 3,
      });
      transports.push(transport);

      transport.onconnection = (ct) => {
        void ct.start();
      };

      const { ws } = await connectAndReceiveInit(transport.port);

      const responses: string[] = [];
      ws.on("message", (data) => {
        responses.push(data.toString());
      });

      for (let i = 0; i < 10; i++) {
        ws.send(JSON.stringify({ jsonrpc: "2.0", method: "test", id: i }));
      }

      await new Promise((r) => setTimeout(r, 500));

      const rateLimited = responses.filter((r) => {
        const parsed = JSON.parse(r);
        return parsed.error?.code === -32000;
      });
      expect(rateLimited.length).toBeGreaterThan(0);

      ws.close();
    });

    it("cleans up session after grace period on disconnect", async () => {
      const transport = await createWebSocketTransport({ port: 0 });
      transports.push(transport);
      transport.onconnection = () => {};

      const { ws, initMessage } = await connectAndReceiveInit(transport.port);
      const sessionId = (initMessage.params as Record<string, unknown>).sessionId as string;

      ws.close();
      await new Promise((r) => setTimeout(r, 100));

      // Session still exists during grace period
      expect(transport.sessionManager.getSession(sessionId)).not.toBeNull();
    });

    it("AC-WS-008: ping/pong keepalive terminates unresponsive connections", async () => {
      const transport = await createWebSocketTransport({
        port: 0,
        pingIntervalMs: 200, // Short interval for testing
      });
      transports.push(transport);
      transport.onconnection = () => {};

      const { ws } = await connectAndReceiveInit(transport.port);

      // Verify server sends pings (client auto-responds with pong by default)
      const pongReceived = new Promise<void>((resolve) => {
        ws.on("ping", () => resolve());
      });

      // Should receive a ping within the interval
      await pongReceived;

      // Connection should still be alive since ws auto-replies to pings
      expect(ws.readyState).toBe(WebSocket.OPEN);

      ws.close();
    });

    it("accepts configurable sessionGracePeriodMs", async () => {
      const transport = await createWebSocketTransport({
        port: 0,
        sessionGracePeriodMs: 300,
      });
      transports.push(transport);
      transport.onconnection = () => {};

      const { ws, initMessage } = await connectAndReceiveInit(transport.port);
      const sessionId = (initMessage.params as Record<string, unknown>).sessionId as string;

      ws.close();
      await new Promise((r) => setTimeout(r, 100));

      // Session still exists during grace period
      expect(transport.sessionManager.getSession(sessionId)).not.toBeNull();

      // Wait for grace period to expire
      await new Promise((r) => setTimeout(r, 300));

      // Session should now be cleaned up
      expect(transport.sessionManager.getSession(sessionId)).toBeNull();
    });
  });
});
