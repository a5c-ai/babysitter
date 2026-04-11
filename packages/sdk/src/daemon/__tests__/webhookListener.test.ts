import { describe, it, expect, vi, afterEach } from "vitest";
import * as http from "node:http";
import { createWebhookListener } from "../webhookListener";

function post(port: number, body: string, headers?: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path: "/trigger", method: "POST", headers: { "Content-Type": "application/json", ...headers } },
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
    const handle = await createWebhookListener({ port: 0, onTrigger });
    handles.push(handle);

    const resp = await post(handle.port, JSON.stringify({ processId: "p1", entrypoint: "e1" }));
    expect(resp.status).toBe(200);
    expect(JSON.parse(resp.body)).toEqual({ ok: true });
    expect(onTrigger).toHaveBeenCalledWith({
      processId: "p1",
      entrypoint: "e1",
      inputs: undefined,
    });
  });

  it("passes inputs to onTrigger", async () => {
    const onTrigger = vi.fn();
    const handle = await createWebhookListener({ port: 0, onTrigger });
    handles.push(handle);

    await post(handle.port, JSON.stringify({ processId: "p1", entrypoint: "e1", inputs: { key: "val" } }));
    expect(onTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ inputs: { key: "val" } }),
    );
  });

  it("returns 400 when processId is missing", async () => {
    const onTrigger = vi.fn();
    const handle = await createWebhookListener({ port: 0, onTrigger });
    handles.push(handle);

    const resp = await post(handle.port, JSON.stringify({ entrypoint: "e1" }));
    expect(resp.status).toBe(400);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON", async () => {
    const onTrigger = vi.fn();
    const handle = await createWebhookListener({ port: 0, onTrigger });
    handles.push(handle);

    const resp = await post(handle.port, "not json");
    expect(resp.status).toBe(400);
    expect(JSON.parse(resp.body)).toEqual({ error: "Invalid JSON body" });
  });

  it("returns 404 for non-POST or wrong path", async () => {
    const onTrigger = vi.fn();
    const handle = await createWebhookListener({ port: 0, onTrigger });
    handles.push(handle);

    const resp = await get(handle.port, "/trigger");
    expect(resp.status).toBe(404);
  });

  it("returns 401 when auth token is required but missing", async () => {
    const onTrigger = vi.fn();
    const handle = await createWebhookListener({ port: 0, onTrigger, authToken: "secret" });
    handles.push(handle);

    const resp = await post(handle.port, JSON.stringify({ processId: "p1", entrypoint: "e1" }));
    expect(resp.status).toBe(401);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("returns 401 when auth token is wrong", async () => {
    const onTrigger = vi.fn();
    const handle = await createWebhookListener({ port: 0, onTrigger, authToken: "secret" });
    handles.push(handle);

    const resp = await post(handle.port, JSON.stringify({ processId: "p1", entrypoint: "e1" }), {
      Authorization: "Bearer wrong",
    });
    expect(resp.status).toBe(401);
  });

  it("accepts request with correct auth token", async () => {
    const onTrigger = vi.fn();
    const handle = await createWebhookListener({ port: 0, onTrigger, authToken: "secret" });
    handles.push(handle);

    const resp = await post(handle.port, JSON.stringify({ processId: "p1", entrypoint: "e1" }), {
      Authorization: "Bearer secret",
    });
    expect(resp.status).toBe(200);
    expect(onTrigger).toHaveBeenCalled();
  });

  it("closes cleanly", async () => {
    const onTrigger = vi.fn();
    const handle = await createWebhookListener({ port: 0, onTrigger });

    await handle.close();
    // Should not be able to connect after close
    await expect(post(handle.port, "{}")).rejects.toThrow();
  });
});
