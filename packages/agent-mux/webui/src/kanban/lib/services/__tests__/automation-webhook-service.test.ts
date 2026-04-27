import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AutomationWebhookService } from "../automation-webhook-service";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

function createHeaders(
  entries: Record<string, string>,
): Headers {
  return new Headers(entries);
}

function createWebhookRule(overrides: Record<string, unknown> = {}) {
  return {
    id: "automation-01hwebhook",
    name: "GitHub issue triage",
    state: "active",
    trigger: {
      type: "webhook",
      port: 4800,
      path: "/api/automations/webhooks/automation-01hwebhook",
      method: "POST",
      auth: {
        type: "bearer",
        token: "top-secret-token",
      },
      sourceEvent: "issues",
    },
    target: {
      projectId: "kanban-app",
      boardProjectId: "kanban-app",
    },
    routing: {
      issue: {
        action: "canonical-issue-create",
        projectId: "kanban-app",
      },
      board: {
        action: "shared-board-derive",
        boardProjectId: "kanban-app",
      },
      mutateBoardDirectly: false,
    },
    template: {
      title: "Triage incoming webhook issue",
      summary: "Generated from webhook delivery",
      description: "Investigate the incoming event and create follow-up work.",
      priority: "high",
      status: "backlog",
      acceptanceCriteria: ["A follow-up task exists"],
      issueSource: {
        kind: "run-derived",
      },
    },
    source: {
      kind: "external-system",
      provider: "github",
      externalId: "repo-123",
    },
    audit: {
      createdAt: "2026-04-24T00:00:00.000Z",
      createdBy: "ops",
    },
    ...overrides,
  };
}

async function createStorageFile(ruleOverrides: Record<string, unknown> = {}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-automation-webhook-"));
  tempDirs.push(tempDir);
  const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

  await fs.writeFile(
    backlogFilePath,
    JSON.stringify(
      {
        projects: [
          {
            id: "kanban-app",
            key: "KANBAN",
            name: "Kanban App",
            description: "Test project",
            issueIds: [],
            labels: [],
            assignees: [],
            statuses: [],
            repositories: [],
            linkedRunProjectName: "kanban",
          },
        ],
        issues: [],
        automationRules: [createWebhookRule(ruleOverrides)],
        automationExecutions: [],
      },
      null,
      2,
    ),
    "utf8",
  );

  return backlogFilePath;
}

function createService(backlogFilePath: string) {
  return new AutomationWebhookService({
    backlogFilePath,
    now: () => "2026-04-24T12:00:00.000Z",
  });
}

describe("AutomationWebhookService", () => {
  it("creates automation work for authorized deliveries and persists execution records", async () => {
    const backlogFilePath = await createStorageFile();
    const service = createService(backlogFilePath);

    const response = await service.deliver({
      ruleId: "automation-01hwebhook",
      requestPath: "/api/automations/webhooks/automation-01hwebhook",
      requestMethod: "POST",
      headers: createHeaders({
        authorization: "Bearer top-secret-token",
        "x-github-event": "issues",
        "x-github-delivery": "delivery-001",
        "user-agent": "GitHub-Hookshot/test",
      }),
      rawBody: JSON.stringify({ action: "opened", issue: { number: 123 } }),
    });

    expect(response.outcome).toBe("created");
    expect(response.code).toBe("AUTOMATION_WEBHOOK_CREATED");
    expect(response.issue?.key).toContain("KANBAN-AUTO-");
    expect(response.execution.deliveryId).toBe("delivery-001");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{ key: string; source?: { externalId?: string } }>;
      projects: Array<{ issueIds: string[] }>;
      automationRules: Array<{ audit?: { lastTriggeredAt?: string; lastTriggeredBy?: string } }>;
      automationExecutions: Array<{ status: string; deliveryId?: string; issueKey?: string }>;
    };

    expect(persisted.issues).toHaveLength(1);
    expect(persisted.issues[0]?.source?.externalId).toBe("automation-01hwebhook:delivery-001");
    expect(persisted.projects[0]?.issueIds).toHaveLength(1);
    expect(persisted.automationRules[0]?.audit?.lastTriggeredAt).toBe("2026-04-24T12:00:00.000Z");
    expect(persisted.automationRules[0]?.audit?.lastTriggeredBy).toBe("webhook:GitHub-Hookshot/test");
    expect(persisted.automationExecutions).toEqual([
      expect.objectContaining({
        status: "created",
        deliveryId: "delivery-001",
        issueKey: persisted.issues[0]?.key,
      }),
    ]);
  });

  it("coalesces duplicate deliveries without creating duplicate work", async () => {
    const backlogFilePath = await createStorageFile();
    const service = createService(backlogFilePath);
    const input = {
      ruleId: "automation-01hwebhook",
      requestPath: "/api/automations/webhooks/automation-01hwebhook",
      requestMethod: "POST",
      headers: createHeaders({
        authorization: "Bearer top-secret-token",
        "x-github-event": "issues",
        "x-github-delivery": "delivery-002",
      }),
      rawBody: JSON.stringify({ action: "opened" }),
    } as const;

    await service.deliver(input);
    const duplicate = await service.deliver(input);

    expect(duplicate.outcome).toBe("coalesced");
    expect(duplicate.code).toBe("AUTOMATION_WEBHOOK_DUPLICATE_DELIVERY");
    expect(duplicate.reason).toContain("delivery-002");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{ id: string }>;
      automationExecutions: Array<{ status: string; deliveryId?: string }>;
    };

    expect(persisted.issues).toHaveLength(1);
    expect(persisted.automationExecutions).toHaveLength(1);
    expect(persisted.automationExecutions[0]?.status).toBe("created");
    expect(persisted.automationExecutions[0]?.deliveryId).toBe("delivery-002");
  });

  it("rejects unauthorized deliveries with an explicit reason", async () => {
    const backlogFilePath = await createStorageFile();
    const service = createService(backlogFilePath);

    const response = await service.deliver({
      ruleId: "automation-01hwebhook",
      requestPath: "/api/automations/webhooks/automation-01hwebhook",
      requestMethod: "POST",
      headers: createHeaders({
        authorization: "Bearer wrong-token",
        "x-github-event": "issues",
        "x-github-delivery": "delivery-003",
      }),
      rawBody: JSON.stringify({ action: "opened" }),
    });

    expect(response.outcome).toBe("rejected");
    expect(response.code).toBe("AUTOMATION_WEBHOOK_UNAUTHORIZED");
    expect(response.reason).toContain("bearer token");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{ id: string }>;
      automationExecutions: Array<{ status: string; reason?: string }>;
    };

    expect(persisted.issues).toHaveLength(0);
    expect(persisted.automationExecutions).toEqual([
      expect.objectContaining({
        status: "rejected",
        reason: "Webhook bearer token did not match the automation rule.",
      }),
    ]);
  });

  it("rejects deliveries for paused rules and records the rejection", async () => {
    const backlogFilePath = await createStorageFile({ state: "paused" });
    const service = createService(backlogFilePath);

    const response = await service.deliver({
      ruleId: "automation-01hwebhook",
      requestPath: "/api/automations/webhooks/automation-01hwebhook",
      requestMethod: "POST",
      headers: createHeaders({
        authorization: "Bearer top-secret-token",
        "x-github-event": "issues",
        "x-github-delivery": "delivery-004",
      }),
      rawBody: JSON.stringify({ action: "opened" }),
    });

    expect(response.outcome).toBe("rejected");
    expect(response.code).toBe("AUTOMATION_RULE_NOT_ACTIVE");
    expect(response.reason).toContain("paused");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{ id: string }>;
      automationExecutions: Array<{ status: string; reason?: string; stateAtExecution?: string }>;
    };

    expect(persisted.issues).toHaveLength(0);
    expect(persisted.automationExecutions).toEqual([
      expect.objectContaining({
        status: "rejected",
        stateAtExecution: "paused",
      }),
    ]);
  });

  it("rejects deliveries that omit an idempotency key", async () => {
    const backlogFilePath = await createStorageFile();
    const service = createService(backlogFilePath);

    const response = await service.deliver({
      ruleId: "automation-01hwebhook",
      requestPath: "/api/automations/webhooks/automation-01hwebhook",
      requestMethod: "POST",
      headers: createHeaders({
        authorization: "Bearer top-secret-token",
        "x-github-event": "issues",
      }),
      rawBody: JSON.stringify({ action: "opened" }),
    });

    expect(response.outcome).toBe("rejected");
    expect(response.code).toBe("AUTOMATION_WEBHOOK_MISSING_IDEMPOTENCY_KEY");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{ id: string }>;
      automationExecutions: Array<{ status: string; code?: string; deliveryId?: string }>;
    };

    expect(persisted.issues).toHaveLength(0);
    expect(persisted.automationExecutions).toHaveLength(1);
    expect(persisted.automationExecutions[0]?.status).toBe("rejected");
    expect(persisted.automationExecutions[0]?.deliveryId).toBeUndefined();
  });
});
