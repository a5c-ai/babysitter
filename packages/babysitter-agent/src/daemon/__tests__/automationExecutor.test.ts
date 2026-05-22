import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { executeAutomationTrigger } from "../automationExecutor";
import type { AutomationTriggerEvent } from "../types";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

function createProject(overrides: Partial<{
  id: string;
  key: string;
  name: string;
}> = {}) {
  return {
    id: overrides.id ?? "kanban-app",
    key: overrides.key ?? "KANBAN",
    name: overrides.name ?? "Kanban App",
    description: "Automation target project",
    issueIds: [],
    labels: [
      {
        id: "external",
        name: "External",
      },
    ],
    assignees: [
      {
        id: "ops",
        displayName: "Ops",
      },
    ],
    statuses: [],
    repositories: [],
    linkedRunProjectName: "kanban",
  };
}

function createAutomationEvent(
  overrides: Partial<AutomationTriggerEvent["rule"]> = {},
  inputs?: Record<string, unknown>,
): AutomationTriggerEvent {
  return {
    type: "automation",
    rule: {
      id: "rule-webhook",
      name: "Webhook triage",
      state: "active",
      trigger: {
        type: "webhook",
        port: 4100,
        path: "/github/issues",
        method: "POST",
        sourceEvent: "issues.opened",
      },
      target: {
        projectId: "kanban-app",
        boardProjectId: "kanban-app",
      },
      template: {
        title: "Triage incoming GitHub issue",
        priority: "high",
        labelIds: ["external"],
        assigneeIds: ["ops"],
        acceptanceCriteria: ["Issue is reviewed"],
        issueSource: {
          kind: "run-derived",
          externalId: "github-issue-1",
        },
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
      source: {
        kind: "external-system",
        provider: "github",
        externalId: "issues.opened",
        metadata: {
          installationId: 1234,
        },
      },
      audit: {
        createdAt: "2026-04-24T00:00:00.000Z",
      },
      ...overrides,
    },
    inputs,
  };
}

describe("executeAutomationTrigger", () => {
  it("creates canonical work and records webhook execution metadata", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "daemon-automation-exec-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");
    await fs.writeFile(
      backlogFilePath,
      JSON.stringify({
        projects: [createProject()],
        issues: [],
        automationRules: [createAutomationEvent().rule],
      }),
      "utf8",
    );

    const execution = await executeAutomationTrigger(
      createAutomationEvent({}, { repository: "a5c-ai/babysitter" }),
      {
        backlogFilePath,
        now: () => "2026-04-24T12:00:00.000Z",
      },
    );

    expect(execution.status).toBe("created");
    expect(execution.ruleId).toBe("rule-webhook");
    expect(execution.triggerType).toBe("webhook");
    expect(execution.source.provider).toBe("github");
    expect(execution.inputs).toEqual({ repository: "a5c-ai/babysitter" });
    expect(execution.issueKey).toBe("KANBAN-AUTO-001");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{ id: string; key: string; title: string; source?: { externalId?: string } }>;
      automationExecutions: Array<{ ruleId: string; triggerType: string; source: { provider?: string } }>;
      automationRules: Array<{ audit?: { lastTriggeredAt?: string; lastTriggeredBy?: string } }>;
    };

    expect(persisted.issues[0]).toMatchObject({
      id: "KANBAN-AUTO-001",
      key: "KANBAN-AUTO-001",
      title: "Triage incoming GitHub issue",
      source: {
        externalId: "github-issue-1",
      },
    });
    expect(persisted.automationExecutions[0]).toMatchObject({
      ruleId: "rule-webhook",
      triggerType: "webhook",
      source: {
        provider: "github",
      },
    });
    expect(persisted.automationRules[0]?.audit).toMatchObject({
      lastTriggeredAt: "2026-04-24T12:00:00.000Z",
      lastTriggeredBy: "daemon-webhook",
    });
  });

  it("records skipped executions when the current lifecycle state is paused", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "daemon-automation-exec-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");
    await fs.writeFile(
      backlogFilePath,
      JSON.stringify({
        projects: [createProject()],
        issues: [],
        automationRules: [
          {
            ...createAutomationEvent().rule,
            state: "paused",
          },
        ],
      }),
      "utf8",
    );

    const execution = await executeAutomationTrigger(createAutomationEvent(), {
      backlogFilePath,
      now: () => "2026-04-24T12:00:00.000Z",
    });

    expect(execution.status).toBe("skipped");
    expect(execution.stateAtExecution).toBe("paused");
    expect(execution.skipReason).toContain("paused");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<unknown>;
      automationExecutions: Array<{ status: string; stateAtExecution: string }>;
    };
    expect(persisted.issues).toHaveLength(0);
    expect(persisted.automationExecutions[0]).toMatchObject({
      status: "skipped",
      stateAtExecution: "paused",
    });
  });

  it("uses the same execution path for timer rules", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "daemon-automation-exec-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");
    const timerRule = {
      ...createAutomationEvent().rule,
      id: "rule-timer",
      name: "Daily digest",
      trigger: {
        type: "timer" as const,
        cron: "0 9 * * 1-5",
        timezone: "UTC",
      },
      source: {
        kind: "config-file" as const,
        path: ".a5c/automations.json",
      },
    };

    await fs.writeFile(
      backlogFilePath,
      JSON.stringify({
        projects: [createProject()],
        issues: [],
        automationRules: [timerRule],
      }),
      "utf8",
    );

    const execution = await executeAutomationTrigger(
      {
        type: "automation",
        rule: timerRule,
      },
      {
        backlogFilePath,
        now: () => "2026-04-24T12:00:00.000Z",
      },
    );

    expect(execution.status).toBe("created");
    expect(execution.ruleId).toBe("rule-timer");
    expect(execution.triggerType).toBe("timer");
    expect(execution.metadata).toMatchObject({
      triggerType: "timer",
      cron: "0 9 * * 1-5",
      timezone: "UTC",
    });
  });

  it("attaches created work to a distinct derived board project", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "daemon-automation-exec-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");
    const rule = {
      ...createAutomationEvent().rule,
      target: {
        projectId: "canonical-project",
        boardProjectId: "board-project",
      },
      routing: {
        issue: {
          action: "canonical-issue-create" as const,
          projectId: "canonical-project",
        },
        board: {
          action: "shared-board-derive" as const,
          boardProjectId: "board-project",
        },
        mutateBoardDirectly: false as const,
      },
    };

    await fs.writeFile(
      backlogFilePath,
      JSON.stringify({
        projects: [
          createProject({ id: "canonical-project", key: "CANON", name: "Canonical" }),
          createProject({ id: "board-project", key: "BOARD", name: "Board" }),
        ],
        issues: [],
        automationRules: [rule],
      }),
      "utf8",
    );

    await executeAutomationTrigger(
      {
        type: "automation",
        rule,
      },
      {
        backlogFilePath,
        now: () => "2026-04-24T12:00:00.000Z",
      },
    );

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      projects: Array<{ id: string; issueIds: string[] }>;
    };
    const canonicalProject = persisted.projects.find((candidate) => candidate.id === "canonical-project");
    const boardProject = persisted.projects.find((candidate) => candidate.id === "board-project");

    expect(canonicalProject?.issueIds).toEqual(["CANON-AUTO-001"]);
    expect(boardProject?.issueIds).toEqual(["CANON-AUTO-001"]);
  });
});
