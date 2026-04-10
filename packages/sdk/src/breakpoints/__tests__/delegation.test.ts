import { describe, it, expect, afterEach } from "vitest";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import * as http from "node:http";
import {
  evaluateDelegation,
  sendDelegationWebhook,
  addDelegationRule,
  removeDelegationRule,
  listDelegationRules,
  delegateBreakpoint,
} from "../delegation";
import type { DelegationRule, DelegationPayload } from "../delegationTypes";
import { DEFAULT_DELEGATION_TIMEOUT_MS } from "../delegationTypes";

function makeRule(id: string, pattern: string, url: string, overrides?: Partial<DelegationRule>): DelegationRule {
  return {
    id,
    pattern,
    webhookUrl: url,
    createdAt: new Date().toISOString(),
    createdBy: "test",
    ...overrides,
  };
}

function makePayload(breakpointId: string, overrides?: Partial<DelegationPayload>): DelegationPayload {
  return {
    breakpointId,
    title: `Approve: ${breakpointId}`,
    ...overrides,
  };
}

describe("evaluateDelegation", () => {
  it("AC-BRK-003: returns matching delegation rules by pattern", () => {
    const rules = [
      makeRule("r1", "confirm.*", "http://localhost/hook1"),
      makeRule("r2", "gate.*", "http://localhost/hook2"),
      makeRule("r3", "confirm.deploy", "http://localhost/hook3"),
    ];
    const matched = evaluateDelegation("confirm.deploy", undefined, rules);
    expect(matched).toHaveLength(2);
    expect(matched.map((r) => r.id)).toContain("r1");
    expect(matched.map((r) => r.id)).toContain("r3");
  });

  it("AC-BRK-009: uses same pattern matching as auto-approval rules", () => {
    const rules = [makeRule("r1", "*", "http://localhost/hook")];
    const matched = evaluateDelegation("any.breakpoint", undefined, rules);
    expect(matched).toHaveLength(1);
  });

  it("AC-BRK-010: multiple rules can match — all matched endpoints", () => {
    const rules = [
      makeRule("r1", "deploy.*", "http://a/hook"),
      makeRule("r2", "deploy.*", "http://b/hook"),
      makeRule("r3", "deploy.prod", "http://c/hook"),
    ];
    const matched = evaluateDelegation("deploy.prod", undefined, rules);
    expect(matched).toHaveLength(3);
  });

  it("returns empty array when no rules match", () => {
    const rules = [makeRule("r1", "gate.*", "http://localhost/hook")];
    const matched = evaluateDelegation("confirm.deploy", undefined, rules);
    expect(matched).toHaveLength(0);
  });
});

describe("sendDelegationWebhook", () => {
  let server: http.Server | undefined;
  let serverPort: number;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = undefined;
    }
  });

  function startTestServer(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): Promise<void> {
    return new Promise((resolve) => {
      server = http.createServer(handler);
      server.listen(0, "127.0.0.1", () => {
        const addr = server!.address();
        serverPort = typeof addr === "object" && addr ? addr.port : 0;
        resolve();
      });
    });
  }

  it("AC-BRK-004: posts breakpoint data and returns DelegationResponse", async () => {
    await startTestServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ approved: true, respondedBy: "alice" }));
    });

    const rule = makeRule("r1", "*", `http://127.0.0.1:${serverPort}/hook`);
    const payload = makePayload("confirm.deploy");
    const response = await sendDelegationWebhook(rule, payload);

    expect(response.approved).toBe(true);
    expect(response.respondedBy).toBe("alice");
  });

  it("AC-BRK-005: response includes approved, respondedBy, responseData", async () => {
    await startTestServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ approved: false, respondedBy: "bob", reason: "not ready" }));
    });

    const rule = makeRule("r1", "*", `http://127.0.0.1:${serverPort}/hook`);
    const response = await sendDelegationWebhook(rule, makePayload("gate.review"));

    expect(response.approved).toBe(false);
    expect(response.respondedBy).toBe("bob");
    expect(response.responseData).toHaveProperty("reason", "not ready");
  });

  it("AC-BRK-006: default timeout is 300s", () => {
    expect(DEFAULT_DELEGATION_TIMEOUT_MS).toBe(300_000);
  });

  it("AC-BRK-006: configurable timeout per rule", async () => {
    await startTestServer((_req, res) => {
      // Never respond — simulate slow endpoint
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ approved: true }));
      }, 5000);
    });

    const rule = makeRule("r1", "*", `http://127.0.0.1:${serverPort}/hook`, {
      timeoutMs: 100,
    });
    const response = await sendDelegationWebhook(rule, makePayload("gate.slow"));

    expect(response.timedOut).toBe(true);
    expect(response.approved).toBe(false);
  });

  it("AC-BRK-007: webhook payload includes expected fields", async () => {
    let receivedBody: DelegationPayload | null = null;
    await startTestServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        receivedBody = JSON.parse(body) as DelegationPayload;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ approved: true }));
      });
    });

    const rule = makeRule("r1", "*", `http://127.0.0.1:${serverPort}/hook`);
    const payload: DelegationPayload = {
      breakpointId: "confirm.deploy",
      title: "Deploy to prod",
      description: "Deploying v2.0",
      tags: ["deploy", "prod"],
      expert: "ops-team",
      options: ["approve", "reject"],
      callbackUrl: "http://localhost/callback",
      runId: "run-123",
      effectId: "eff-456",
    };

    await sendDelegationWebhook(rule, payload);

    expect(receivedBody).not.toBeNull();
    expect(receivedBody!.breakpointId).toBe("confirm.deploy");
    expect(receivedBody!.title).toBe("Deploy to prod");
    expect(receivedBody!.tags).toEqual(["deploy", "prod"]);
    expect(receivedBody!.callbackUrl).toBe("http://localhost/callback");
    expect(receivedBody!.runId).toBe("run-123");
  });

  it("AC-BRK-012: network errors fall through with error response", async () => {
    const rule = makeRule("r1", "*", "http://127.0.0.1:1/nonexistent");
    const response = await sendDelegationWebhook(rule, makePayload("gate.broken"));

    expect(response.approved).toBe(false);
    expect(response.error).toBeTruthy();
  });

  it("AC-BRK-012: HTTP error responses return error", async () => {
    await startTestServer((_req, res) => {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    });

    const rule = makeRule("r1", "*", `http://127.0.0.1:${serverPort}/hook`);
    const response = await sendDelegationWebhook(rule, makePayload("gate.fail"));

    expect(response.approved).toBe(false);
    expect(response.error).toContain("500");
  });

  it("sends custom headers from rule", async () => {
    let receivedHeaders: Record<string, string | string[] | undefined> = {};
    await startTestServer((req, res) => {
      receivedHeaders = req.headers;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ approved: true }));
    });

    const rule = makeRule("r1", "*", `http://127.0.0.1:${serverPort}/hook`, {
      headers: { "X-Custom": "value123", Authorization: "Bearer secret" },
    });
    await sendDelegationWebhook(rule, makePayload("test"));

    expect(receivedHeaders["x-custom"]).toBe("value123");
    expect(receivedHeaders["authorization"]).toBe("Bearer secret");
  });
});

describe("delegation CRUD", () => {
  let tmpDir: string;
  let rulesPath: string;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  async function setup() {
    tmpDir = path.join(os.tmpdir(), `brk-deleg-test-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    rulesPath = path.join(tmpDir, "rules.json");
  }

  it("AC-BRK-002: addDelegationRule stores rules", async () => {
    await setup();
    const rule = makeRule("r1", "confirm.*", "http://localhost/hook");
    const result = await addDelegationRule(rule, rulesPath);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
  });

  it("AC-BRK-002: removeDelegationRule removes by ID", async () => {
    await setup();
    await addDelegationRule(makeRule("r1", "*", "http://a"), rulesPath);
    await addDelegationRule(makeRule("r2", "*", "http://b"), rulesPath);
    const result = await removeDelegationRule("r1", rulesPath);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r2");
  });

  it("AC-BRK-002: listDelegationRules returns all rules", async () => {
    await setup();
    await addDelegationRule(makeRule("r1", "*", "http://a"), rulesPath);
    await addDelegationRule(makeRule("r2", "*", "http://b"), rulesPath);
    const list = await listDelegationRules(rulesPath);
    expect(list).toHaveLength(2);
  });

  it("returns empty array for nonexistent file", async () => {
    const list = await listDelegationRules("/nonexistent/path/rules.json");
    expect(list).toHaveLength(0);
  });

  it("deduplicates by rule ID on add", async () => {
    await setup();
    await addDelegationRule(makeRule("r1", "a.*", "http://old"), rulesPath);
    await addDelegationRule(makeRule("r1", "b.*", "http://new"), rulesPath);
    const list = await listDelegationRules(rulesPath);
    expect(list).toHaveLength(1);
    expect(list[0].webhookUrl).toBe("http://new");
  });
});

describe("delegateBreakpoint", () => {
  let server: http.Server | undefined;
  let serverPort: number;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = undefined;
    }
  });

  function startTestServer(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): Promise<void> {
    return new Promise((resolve) => {
      server = http.createServer(handler);
      server.listen(0, "127.0.0.1", () => {
        const addr = server!.address();
        serverPort = typeof addr === "object" && addr ? addr.port : 0;
        resolve();
      });
    });
  }

  it("AC-BRK-011: first-response-wins strategy", async () => {
    await startTestServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ approved: true, respondedBy: "fast-responder" }));
    });

    const rules = [
      makeRule("r1", "*", `http://127.0.0.1:${serverPort}/hook1`),
      makeRule("r2", "*", `http://127.0.0.1:${serverPort}/hook2`),
    ];
    const payload = makePayload("confirm.deploy");
    const result = await delegateBreakpoint("confirm.deploy", payload, rules);

    expect(result.approved).toBe(true);
  });

  it("returns error when no rules match", async () => {
    const rules = [makeRule("r1", "gate.*", "http://localhost/hook")];
    const result = await delegateBreakpoint("confirm.deploy", makePayload("confirm.deploy"), rules);
    expect(result.approved).toBe(false);
    expect(result.error).toContain("No matching");
  });

  it("AC-BRK-001: DelegationRule supports required fields", () => {
    const rule: DelegationRule = {
      id: "test",
      pattern: "confirm.*",
      webhookUrl: "http://localhost/hook",
      method: "POST",
      headers: { Authorization: "Bearer token" },
      timeoutMs: 10000,
      retries: 3,
      createdAt: new Date().toISOString(),
      createdBy: "user",
      note: "Test rule",
    };
    expect(rule.id).toBe("test");
    expect(rule.webhookUrl).toBe("http://localhost/hook");
    expect(rule.method).toBe("POST");
    expect(rule.headers).toHaveProperty("Authorization");
    expect(rule.timeoutMs).toBe(10000);
    expect(rule.retries).toBe(3);
  });
});
