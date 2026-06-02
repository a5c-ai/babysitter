import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import { createWebhookListener } from "../webhookListener";

function webhookRule(overrides: Partial<{
  id: string;
  port: number;
  path: string;
  authToken: string;
}> = {}) {
  const port = overrides.port ?? 0;
  const path = overrides.path ?? "/trigger";
  return {
    id: overrides.id ?? "rule-webhook",
    name: "Webhook rule",
    state: "active" as const,
    trigger: {
      type: "webhook" as const,
      port,
      path,
      method: "POST" as const,
      ...(overrides.authToken ? {
        auth: {
          type: "bearer" as const,
          token: overrides.authToken,
        },
      } : {}),
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
      provider: "github",
    },
    audit: {
      createdAt: "2026-04-24T00:00:00.000Z",
    },
  };
}

function post(port: number, path: string, body: string, headers?: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method: "POST", headers: { "Content-Type": "application/json", ...headers } },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on("error", reject);
    req.end(body);
  });
}

function get(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method: "GET" },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

describe("webhookListener", () => {
  const handles: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    for (const h of handles) {
      await h.close().catch(() => {});
    }
    handles.length = 0;
  });

  it("accepts a valid trigger POST and calls onTrigger", async () => {
    const onTrigger = vi.fn();
    const rule = webhookRule();
    const handle = await createWebhookListener({ rule, onTrigger });
    handles.push(handle);

    const resp = await post(handle.port, rule.trigger.path!, JSON.stringify({}));
    expect(resp.status).toBe(200);
    expect(JSON.parse(resp.body)).toMatchObject({ ok: true, status: "accepted" });
    expect(onTrigger).toHaveBeenCalledWith({
      type: "automation",
      rule,
      inputs: undefined,
    });
  });

  it("passes inputs to onTrigger", async () => {
    const onTrigger = vi.fn();
    const rule = webhookRule();
    const handle = await createWebhookListener({ rule, onTrigger });
    handles.push(handle);

    await post(handle.port, rule.trigger.path!, JSON.stringify({ inputs: { key: "val" } }));
    expect(onTrigger).toHaveBeenCalledWith(
      {
        type: "automation",
        rule,
        inputs: { key: "val" },
      },
    );
  });

  it("returns 400 for invalid JSON", async () => {
    const onTrigger = vi.fn();
    const rule = webhookRule();
    const handle = await createWebhookListener({ rule, onTrigger });
    handles.push(handle);

    const resp = await post(handle.port, rule.trigger.path!, "not json");
    expect(resp.status).toBe(400);
    expect(JSON.parse(resp.body)).toEqual({ error: "Invalid JSON body" });
  });

  it("returns 404 for non-POST or wrong path", async () => {
    const onTrigger = vi.fn();
    const rule = webhookRule();
    const handle = await createWebhookListener({ rule, onTrigger });
    handles.push(handle);

    const resp = await get(handle.port, "/trigger");
    expect(resp.status).toBe(404);
  });

  it("returns 401 when auth token is required but missing", async () => {
    const onTrigger = vi.fn();
    const rule = webhookRule({ authToken: "secret" });
    const handle = await createWebhookListener({ rule, onTrigger });
    handles.push(handle);

    const resp = await post(handle.port, rule.trigger.path!, JSON.stringify({}));
    expect(resp.status).toBe(401);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("returns 401 when auth token is wrong", async () => {
    const onTrigger = vi.fn();
    const rule = webhookRule({ authToken: "secret" });
    const handle = await createWebhookListener({ rule, onTrigger });
    handles.push(handle);

    const resp = await post(handle.port, rule.trigger.path!, JSON.stringify({}), {
      Authorization: "Bearer wrong",
    });
    expect(resp.status).toBe(401);
  });

  it("accepts request with correct auth token", async () => {
    const onTrigger = vi.fn();
    const rule = webhookRule({ authToken: "secret" });
    const handle = await createWebhookListener({ rule, onTrigger });
    handles.push(handle);

    const resp = await post(handle.port, rule.trigger.path!, JSON.stringify({}), {
      Authorization: "Bearer secret",
    });
    expect(resp.status).toBe(200);
    expect(onTrigger).toHaveBeenCalled();
  });

  it("returns 429 with retry-after when admission rate limits the trigger", async () => {
    const rule = webhookRule();
    const handle = await createWebhookListener({
      rule,
      onTrigger: () => ({ status: "rejected", reason: "rate-limit", retryAfterMs: 1_500 }),
    });
    handles.push(handle);

    const resp = await post(handle.port, rule.trigger.path!, JSON.stringify({}));
    expect(resp.status).toBe(429);
    expect(JSON.parse(resp.body)).toMatchObject({ ok: false, status: "rejected", reason: "rate-limit" });
  });

  it("closes cleanly", async () => {
    const onTrigger = vi.fn();
    const rule = webhookRule();
    const handle = await createWebhookListener({ rule, onTrigger });

    await handle.close();
    // Should not be able to connect after close
    await expect(post(handle.port, rule.trigger.path!, "{}")).rejects.toThrow();
  });
});
