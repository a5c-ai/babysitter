import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AutomationRuleService } from "../automation-rule-service";

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
});
