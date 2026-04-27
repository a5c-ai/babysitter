import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../error-handler";
import { AutomationRuleService } from "../automation-rule-service";

vi.mock("../backlog-query-service", () => ({
  BacklogQueryService: class BacklogQueryService {},
}));

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

function createBacklogOverview() {
  return {
    snapshot: {
      projects: [
        {
          id: "kanban-app",
          key: "KANBAN",
          name: "Kanban App",
          linkedRunProjectName: "kanban",
        },
      ],
    },
  } as never;
}

function createService(backlogFilePath: string) {
  return new AutomationRuleService({
    backlogFilePath,
    now: () => "2026-04-24T12:00:00.000Z",
    backlogQueryService: {
      getOverview: async () => createBacklogOverview(),
      createIssue: async (input: {
        projectId: string;
        title: string;
        summary?: string;
        description?: string;
        status?: string;
        priority?: string;
        labelIds?: readonly string[];
        assigneeIds?: readonly string[];
        acceptanceCriteria?: readonly {
          title: string;
          satisfied?: boolean;
          notes?: string;
        }[];
        decomposition?: readonly { title: string; kind: string; status: string }[];
        source?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      }) => {
        const raw = await fs.readFile(backlogFilePath, "utf8").catch(() => "{}");
        const storage = JSON.parse(raw) as {
          projects?: Array<{
            id: string;
            key: string;
            name: string;
            issueIds?: string[];
            labels?: Array<{ id: string; name: string }>;
            assignees?: Array<{ id: string; displayName: string; email?: string }>;
            statuses?: Array<{ id: string; name: string }>;
            repositories?: unknown[];
          }>;
          issues?: Array<{ id: string; key: string }>;
          automationRules?: unknown[];
          automationExecutions?: unknown[];
        };

        const seededProjects =
          storage.projects && storage.projects.length > 0
            ? storage.projects
            : [
                {
                  id: "kanban-app",
                  key: "KANBAN",
                  name: "Kanban App",
                  issueIds: [],
                  labels: [{ id: "label-debt", name: "debt" }],
                  assignees: [],
                  statuses: [],
                  repositories: [],
                },
              ];
        const project = seededProjects.find((candidate) => candidate.id === input.projectId);
        if (!project) {
          throw new AppError(`Project ${input.projectId} not found.`, "NOT_FOUND", 404);
        }

        const nextNumber = String((storage.issues?.length ?? 0) + 1).padStart(3, "0");
        const issueKey = `${project.key}-AUTO-${nextNumber}`;
        const issue = {
          id: issueKey,
          key: issueKey,
          projectId: input.projectId,
          title: input.title,
          summary: input.summary,
          description: input.description,
          status: input.status ?? "backlog",
          priority: input.priority ?? "medium",
          labels: (input.labelIds ?? []).map((labelId) => ({ id: labelId, name: labelId })),
          assignees: (input.assigneeIds ?? []).map((assigneeId) => ({
            id: assigneeId,
            displayName: assigneeId,
          })),
          dependencies: [],
          acceptanceCriteria: (input.acceptanceCriteria ?? []).map((criterion, index) => ({
            id: `${issueKey}-ac-${index + 1}`,
            title: criterion.title,
            satisfied: criterion.satisfied ?? false,
            notes: criterion.notes,
          })),
          decomposition: (input.decomposition ?? []).map((item, index) => ({
            id: `${issueKey}-decomp-${index + 1}`,
            title: item.title,
            kind: item.kind,
            status: item.status,
          })),
          childIssueIds: [],
          createdAt: "2026-04-24T12:00:00.000Z",
          updatedAt: "2026-04-24T12:00:00.000Z",
          source: input.source,
          metadata: input.metadata,
          dispatch: {
            readiness: input.status === "ready" ? "ready" : "needs-triage",
            blockedReasons: [],
            runIds: [],
            sessionIds: [],
          },
        };

        await fs.writeFile(
          backlogFilePath,
          JSON.stringify(
            {
              ...storage,
              projects: seededProjects.map((candidate) =>
                candidate.id === project.id
                  ? {
                      ...candidate,
                      issueIds: [...(candidate.issueIds ?? []), issue.id],
                    }
                  : candidate,
              ),
              issues: [...(storage.issues ?? []), issue],
            },
            null,
            2,
          ),
          "utf8",
        );

        return {
          overview: {
            snapshot: {
              projects: seededProjects,
              issues: [...(storage.issues ?? []), issue],
            },
          },
          issue,
        } as never;
      },
    },
  });
}

function createTimerTemplate() {
  return {
    title: "Review the daily digest",
    priority: "medium",
    acceptanceCriteria: ["Digest is reviewed"],
    issueSource: {
      kind: "run-derived",
      externalId: "digest-job",
    },
  };
}

function createTimerRuleInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "Daily digest",
    trigger: {
      type: "timer",
      cron: "0 9 * * 1-5",
      timezone: "UTC",
    },
    target: {
      projectId: "kanban-app",
      boardProjectId: "kanban-app",
    },
    template: createTimerTemplate(),
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
    ...overrides,
  };
}

function createTriggerEventBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    triggeredBy: "automation-daemon",
    triggerEvent: {
      id: "evt-001",
      summary: "Daily digest fired",
      sourceEvent: "digest.ready",
      receivedAt: "2026-04-24T11:59:00.000Z",
      payload: {
        digestId: "digest-42",
      },
      metadata: {
        source: "scheduler",
      },
    },
    metadata: {
      requestId: "req-123",
    },
    ...overrides,
  };
}

describe("AutomationRuleService", () => {
  it("creates rules, preserves backlog data, and persists lifecycle transitions", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-automation-rules-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");
    await fs.writeFile(
      backlogFilePath,
      JSON.stringify({
        projects: [{ id: "existing-project" }],
        issues: [{ id: "existing-issue" }],
      }),
      "utf8",
    );

    const service = createService(backlogFilePath);

    const created = await service.createRule(createTimerRuleInput({ createdBy: "ops" }));
    const ruleId = created.rule.id;

    expect(created.rule.state).toBe("draft");
    expect(created.rule.allowedActions).toEqual(["enable", "disable", "delete"]);
    expect(created.rule.audit.createdBy).toBe("ops");

    await service.transitionRule(ruleId, "enable", "ops");
    const paused = await service.transitionRule(ruleId, "pause", "ops");
    expect(paused.rule.state).toBe("paused");
    expect(paused.rule.allowedActions).toEqual(["resume", "disable", "delete"]);
    expect(paused.rule.audit.updatedBy).toBe("ops");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      projects: Array<{ id: string }>;
      issues: Array<{ id: string }>;
      automationRules: Array<{ id: string; state: string; audit?: { updatedBy?: string } }>;
    };

    expect(persisted.projects[0]?.id).toBe("existing-project");
    expect(persisted.issues[0]?.id).toBe("existing-issue");
    expect(persisted.automationRules[0]?.id).toBe(ruleId);
    expect(persisted.automationRules[0]?.state).toBe("paused");
    expect(persisted.automationRules[0]?.audit?.updatedBy).toBe("ops");
  });

  it("supports editing rules and filtering list responses", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-automation-rules-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = createService(backlogFilePath);

    const created = await service.createRule(
      createTimerRuleInput({
        state: "active",
        name: "Daily digest",
      }),
    );

    await service.createRule({
      ...createTimerRuleInput({
        name: "GitHub webhook triage",
        state: "disabled",
      }),
      trigger: {
        type: "webhook",
        port: 4100,
        path: "/github/issues",
        method: "POST",
        auth: {
          type: "bearer",
          token: "secret",
        },
      },
      source: {
        kind: "external-system",
        provider: "github",
      },
    });

    const updated = await service.updateRule(created.rule.id, {
      name: "Daily digest triage",
      updatedBy: "maintainer",
      template: {
        ...createTimerTemplate(),
        title: "Review the daily digest and triage follow-up",
        priority: "high",
      },
    });

    expect(updated.rule.name).toBe("Daily digest triage");
    expect(updated.rule.template.priority).toBe("high");
    expect(updated.rule.audit.updatedBy).toBe("maintainer");

    const filtered = await service.listRules({ state: ["active"], triggerType: ["timer"] });

    expect(filtered.summary.totalCount).toBe(2);
    expect(filtered.summary.visibleCount).toBe(1);
    expect(filtered.summary.stateCounts.active).toBe(1);
    expect(filtered.summary.stateCounts.disabled).toBe(1);
    expect(filtered.summary.triggerCounts.timer).toBe(1);
    expect(filtered.summary.triggerCounts.webhook).toBe(1);
    expect(filtered.rules[0]?.triggerType).toBe("timer");
    expect(filtered.rules[0]?.allowedActions).toEqual(["pause", "disable", "delete"]);
    expect(filtered.targetOptions[0]).toMatchObject({
      projectId: "kanban-app",
      boardProjectId: "kanban-app",
      key: "KANBAN",
    });
  });

  it("rejects invalid lifecycle transitions and direct state edits", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-automation-rules-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = createService(backlogFilePath);
    const created = await service.createRule(createTimerRuleInput());

    await expect(service.transitionRule(created.rule.id, "pause", "ops")).rejects.toMatchObject({
      code: "AUTOMATION_RULE_INVALID_TRANSITION",
      status: 409,
    });

    await expect(
      service.updateRule(created.rule.id, {
        state: "active",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      status: 400,
    });
  });

  it("materializes fired automation events into canonical issues and execution records", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-automation-rules-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = createService(backlogFilePath);
    const created = await service.createRule(
      createTimerRuleInput({
        state: "active",
        template: {
          ...createTimerTemplate(),
          status: "ready",
          labelIds: ["label-debt"],
          metadata: {
            automationTemplate: true,
          },
          issueSource: {
            kind: "run-derived",
            externalId: "digest-job",
            metadata: {
              upstream: "digest",
            },
          },
        },
      }),
    );

    const materialized = await service.materializeEvent(
      created.rule.id,
      createTriggerEventBody(),
    );

    expect(materialized.issue.key).toMatch(/^KANBAN-AUTO-\d{3}$/);
    expect(materialized.issue.projectId).toBe("kanban-app");
    expect(materialized.issue.status).toBe("ready");
    expect(materialized.issue.dispatch.readiness).toBe("ready");
    expect(materialized.issue.source?.metadata).toMatchObject({
      upstream: "digest",
      automationRuleId: created.rule.id,
      triggerEventId: "evt-001",
      routeProjectId: "kanban-app",
      routeBoardProjectId: "kanban-app",
    });
    expect(materialized.execution.issueId).toBe(materialized.issue.id);
    expect(materialized.execution.projectId).toBe("kanban-app");
    expect(materialized.execution.boardProjectId).toBe("kanban-app");
    expect(materialized.execution.metadata).toMatchObject({
      requestId: "req-123",
      triggerEventId: "evt-001",
      triggerEventSource: "digest.ready",
    });
    expect(materialized.rule.audit.lastTriggeredBy).toBe("automation-daemon");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{
        id: string;
        source?: { metadata?: { automationRuleId?: string; triggerEventId?: string } };
        metadata?: { automationTemplate?: boolean };
      }>;
      automationExecutions: Array<{ issueId?: string; boardProjectId: string }>;
      automationRules: Array<{ id: string; audit?: { lastTriggeredBy?: string } }>;
    };

    expect(
      persisted.issues.find((issue) => issue.id === materialized.issue.id)?.source?.metadata,
    ).toMatchObject({
      automationRuleId: created.rule.id,
      triggerEventId: "evt-001",
    });
    expect(
      persisted.issues.find((issue) => issue.id === materialized.issue.id)?.metadata
        ?.automationTemplate,
    ).toBe(true);
    expect(persisted.automationExecutions[0]?.issueId).toBe(materialized.issue.id);
    expect(persisted.automationExecutions[0]?.boardProjectId).toBe("kanban-app");
    expect(
      persisted.automationRules.find((rule) => rule.id === created.rule.id)?.audit?.lastTriggeredBy,
    ).toBe("automation-daemon");
  });

  it("surfaces routing failures as explicit errors", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-automation-rules-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = createService(backlogFilePath);
    const created = await service.createRule(
      createTimerRuleInput({
        state: "active",
      }),
    );

    await fs.writeFile(
      backlogFilePath,
      JSON.stringify({
        projects: [
          {
            id: "other-project",
            key: "OTHER",
            name: "Other Project",
            issueIds: [],
            labels: [],
            assignees: [],
            statuses: [],
            repositories: [],
          },
        ],
        issues: [],
        automationRules: [
          {
            ...(created.rule as Record<string, unknown>),
          },
        ],
      }),
      "utf8",
    );

    await expect(
      service.materializeEvent(created.rule.id, createTriggerEventBody()),
    ).rejects.toMatchObject({
      code: "AUTOMATION_ROUTING_FAILED",
      status: 409,
    });

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      automationExecutions: Array<{ status: string; reason?: string; triggerType: string }>;
    };

    expect(persisted.automationExecutions[0]).toMatchObject({
      status: "rejected",
      triggerType: "timer",
      reason: expect.stringContaining("Automation routing failed"),
    });
  });
});
