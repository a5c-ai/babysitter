import { describe, it, expect, afterEach } from "vitest";
import * as http from "node:http";
import { createWebhookListener } from "../webhookListener";

function webhookRule() {
  return {
    id: "rule-webhook",
    name: "Webhook rule",
    state: "active" as const,
    trigger: {
      type: "webhook" as const,
      port: 0,
      path: "/trigger",
      method: "POST" as const,
    },
    target: {
      projectId: "kanban-app",
      boardProjectId: "kanban-app",
    },
    template: {
      title: "Generated from webhook",
    },
    routing: {
      issue: {
        action: "canonical-issue-create" as const,
        projectId: "kanban-app",
      },
      board: {
        action: "shared-board-derive" as const,
        boardProjectId: "kanban-app",
      },
      mutateBoardDirectly: false as const,
    },
    source: {
      kind: "external-system" as const,
    },
    audit: {
      createdAt: "2026-04-24T00:00:00.000Z",
    },
  };
}

function post(port: number, body: string): Promise<{ status: number; body: string; retryAfter?: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path: "/trigger", method: "POST", headers: { "Content-Type": "application/json" } },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => resolve({
          status: res.statusCode ?? 0,
          body: data,
          retryAfter: typeof res.headers["retry-after"] === "string" ? res.headers["retry-after"] : undefined,
        }));
      },
    );
    req.on("error", reject);
    req.end(body);
  });
}

describe("webhookListener admission responses", () => {
  const handles: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    for (const h of handles) {
      await h.close().catch(() => {});
    }
    handles.length = 0;
  });

  it("keeps accepted webhooks compatible while reporting admission status", async () => {
    const handle = await createWebhookListener({
      rule: webhookRule(),
      onTrigger: () => ({ status: "accepted", queueDepth: 0 }),
    });
    handles.push(handle);

    const response = await post(handle.port, JSON.stringify({}));

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true, status: "accepted", queueDepth: 0 });
  });

  it("returns retryable status for rate-limited webhooks", async () => {
    const handle = await createWebhookListener({
      rule: webhookRule(),
      onTrigger: () => ({ status: "rejected", reason: "rate-limit", retryAfterMs: 1500 }),
    });
    handles.push(handle);

    const response = await post(handle.port, JSON.stringify({}));

    expect(response.status).toBe(429);
    expect(response.retryAfter).toBe("2");
    expect(JSON.parse(response.body)).toMatchObject({ ok: false, status: "rejected", reason: "rate-limit" });
  });
});
