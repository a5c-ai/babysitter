import { promises as fs } from "node:fs";
import path from "node:path";

import { test, expect } from "../fixtures";

const backlogFilePath = path.resolve(__dirname, "../fixtures/kanban-backlog.task-tags.json");
const runsDirPath = path.resolve(__dirname, "../fixtures/runs");
let originalBacklogFileContents: string | null = null;

function createAutomationBacklog() {
  return {
    projects: [
      {
        id: "kanban-app",
        key: "KANBAN",
        name: "Kanban App",
        description: "Automation e2e project",
        issueIds: [],
        labels: [],
        assignees: [],
        statuses: [],
        repositories: [],
        linkedRunProjectName: "kanban",
      },
    ],
    issues: [],
    taskTags: [
      {
        id: "task-tag-bug-report",
        key: "bug_report",
        label: "Bug Report",
        content: "Describe the bug in detail.",
        description: "Capture reproduction details and observed behavior.",
        order: 0,
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:00:00.000Z",
      },
    ],
    automationRules: [
      {
        id: "automation-e2e-webhook",
        name: "GitHub issue triage",
        state: "active",
        trigger: {
          type: "webhook",
          port: 4800,
          path: "/api/automations/webhooks/automation-e2e-webhook",
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
          status: "ready",
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
      },
    ],
    automationExecutions: [],
  };
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  originalBacklogFileContents = await fs.readFile(backlogFilePath, "utf8");
});

test.beforeEach(async () => {
  await fs.mkdir(runsDirPath, { recursive: true });
  await fs.writeFile(backlogFilePath, `${JSON.stringify(createAutomationBacklog(), null, 2)}\n`, "utf8");
});

test.afterEach(async () => {
  if (originalBacklogFileContents !== null) {
    await fs.writeFile(backlogFilePath, originalBacklogFileContents, "utf8");
  }
});

test.describe("Automations trigger-to-board flow", () => {
  test("creates board-visible canonical work from a webhook delivery", async ({ request }) => {
    const delivery = await request.post("/api/automations/webhooks/automation-e2e-webhook", {
      headers: {
        authorization: "Bearer top-secret-token",
        "x-github-event": "issues",
        "x-github-delivery": "delivery-e2e-001",
        "user-agent": "GitHub-Hookshot/e2e",
      },
      data: {
        action: "opened",
        issue: { number: 101, title: "Webhook triggered issue" },
      },
    });

    expect(delivery.status()).toBe(201);
    const payload = await delivery.json();
    expect(payload.outcome).toBe("created");
    expect(payload.issue.key).toMatch(/^KANBAN-AUTO-/);

    const backlog = await request.get("/api/backlog");
    expect(backlog.status()).toBe(200);
    const overview = await backlog.json();
    const projectBoard = overview.board.projects.find(
      (project: { projectId: string }) => project.projectId === "kanban-app",
    );
    expect(projectBoard).toBeTruthy();
    expect(projectBoard.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issueKey: payload.issue.key,
          title: "Triage incoming webhook issue",
        }),
      ]),
    );
  });

  test("coalesces duplicate deliveries without creating duplicate board cards", async ({ request }) => {
    const first = await request.post("/api/automations/webhooks/automation-e2e-webhook", {
      headers: {
        authorization: "Bearer top-secret-token",
        "x-github-event": "issues",
        "x-github-delivery": "delivery-e2e-002",
      },
      data: {
        action: "opened",
      },
    });
    expect(first.status()).toBe(201);
    const created = await first.json();

    const duplicate = await request.post("/api/automations/webhooks/automation-e2e-webhook", {
      headers: {
        authorization: "Bearer top-secret-token",
        "x-github-event": "issues",
        "x-github-delivery": "delivery-e2e-002",
      },
      data: {
        action: "opened",
      },
    });

    expect(duplicate.status()).toBe(200);
    const duplicatePayload = await duplicate.json();
    expect(duplicatePayload.outcome).toBe("coalesced");
    expect(duplicatePayload.code).toBe("AUTOMATION_WEBHOOK_DUPLICATE_DELIVERY");

    const backlog = await request.get("/api/backlog");
    expect(backlog.status()).toBe(200);
    const overview = await backlog.json();
    const projectBoard = overview.board.projects.find(
      (project: { projectId: string }) => project.projectId === "kanban-app",
    );
    expect(projectBoard).toBeTruthy();

    const matchingCards = projectBoard.cards.filter(
      (card: { issueKey: string }) => card.issueKey === created.issue.key,
    );
    expect(matchingCards).toHaveLength(1);
  });
});
