/**
 * GAP-REMOTE-001: Webhook Listener — HTTP trigger endpoint.
 */

import * as http from "node:http";
import type { WebhookListenerOptions, WebhookListenerHandle } from "./types";

const MAX_BODY_BYTES = 1024 * 1024; // 1 MiB

export async function createWebhookListener(
  options: WebhookListenerOptions,
): Promise<WebhookListenerHandle> {
  const { rule, onTrigger } = options;
  const port = rule.trigger.port;
  const path = rule.trigger.path ?? "/trigger";
  const method = rule.trigger.method ?? "POST";
  const authToken = rule.trigger.auth?.type === "bearer" ? rule.trigger.auth.token : undefined;

  const server = http.createServer((req, res) => {
    if (req.method !== method || req.url !== path) {
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
        const payload = JSON.parse(body) as Record<string, unknown>;
        const inputs = typeof payload.inputs === "object" && payload.inputs !== null && !Array.isArray(payload.inputs)
          ? payload.inputs as Record<string, unknown>
          : undefined;

        void onTrigger({
          type: "automation",
          rule,
          inputs,
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
