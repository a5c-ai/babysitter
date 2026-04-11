/**
 * GAP-REMOTE-001: Webhook Listener — HTTP trigger endpoint.
 */

import * as http from "node:http";
import type { WebhookListenerOptions, WebhookListenerHandle } from "./types";

const MAX_BODY_BYTES = 1024 * 1024; // 1 MiB

export async function createWebhookListener(
  options: WebhookListenerOptions,
): Promise<WebhookListenerHandle> {
  const { port, onTrigger, authToken } = options;

  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/trigger") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    // Auth check
    if (authToken) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${authToken}`) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
    }

    let body = "";
    let bodySize = 0;
    req.on("data", (chunk: Buffer) => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_BYTES) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Payload too large" }));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body) as {
          processId?: string;
          entrypoint?: string;
          inputs?: Record<string, unknown>;
        };

        if (!payload.processId || !payload.entrypoint) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing processId or entrypoint" }));
          return;
        }

        void onTrigger({
          processId: payload.processId,
          entrypoint: payload.entrypoint,
          inputs: payload.inputs,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, () => {
      const addr = server.address();
      const actualPort = typeof addr === "object" && addr ? addr.port : port;
      resolve({
        port: actualPort,
        async close() {
          return new Promise<void>((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          });
        },
      });
    });
  });
}
