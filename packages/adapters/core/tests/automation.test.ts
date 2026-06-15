import { describe, expect, it } from "vitest";
import type { AutomationExecutionRecord, AutomationRule } from "../src/automation.js";

describe("automation rule types", () => {
  it("supports timer rules routed through canonical issue creation and derived boards", () => {
    const rule: AutomationRule = {
      id: "rule-daily-digest",
      name: "Daily digest task generation",
      state: "active",
      trigger: {
        type: "timer",
        cron: "0 9 * * 1-5",
        timezone: "UTC",
      },
      target: {
        projectId: "kanban-app",
        boardProjectId: "kanban-app",
      },
      template: {
        title: "Review the daily digest",
        priority: "medium",
        acceptanceCriteria: ["Digest is reviewed", "Follow-up issue is triaged"],
        issueSource: {
          kind: "run-derived",
          externalId: "digest-job",
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
        kind: "config-file",
        path: ".a5c/automations.json",
      },
      audit: {
        createdAt: "2026-04-24T00:00:00.000Z",
        createdBy: "system",
      },
    };

    expect(rule.trigger.type).toBe("timer");
    expect(rule.routing.issue.action).toBe("canonical-issue-create");
    expect(rule.routing.board.action).toBe("shared-board-derive");
    expect(rule.routing.mutateBoardDirectly).toBe(false);
  });

  it("supports webhook rules with source and audit metadata", () => {
    const rule: AutomationRule = {
      id: "rule-github-webhook",
      name: "GitHub webhook task generation",
      state: "paused",
      trigger: {
        type: "webhook",
        port: 4100,
        path: "/github/issues",
        method: "POST",
        auth: {
          type: "bearer",
          token: "secret",
        },
        sourceEvent: "issues.opened",
      },
      target: {
        projectId: "kanban-app",
        boardProjectId: "kanban-app",
      },
      template: {
        title: "Triage incoming GitHub issue",
        summary: "Capture newly opened external issues as canonical backlog work.",
        labelIds: ["external", "triage"],
        metadata: {
          sourceSystem: "github",
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
      },
      audit: {
        createdAt: "2026-04-24T00:00:00.000Z",
        updatedAt: "2026-04-24T01:00:00.000Z",
        updatedBy: "ops",
      },
    };

    expect(rule.trigger.type).toBe("webhook");
    expect(rule.source.provider).toBe("github");
    expect(rule.audit.updatedBy).toBe("ops");
  });

  it("preserves split canonical-project and board-project routing semantics in execution records", () => {
    const rule: AutomationRule = {
      id: "rule-routed-board",
      name: "Cross-project routed automation",
      state: "active",
      trigger: {
        type: "timer",
        cron: "*/15 * * * *",
        timezone: "UTC",
      },
      target: {
        projectId: "canonical-project",
        boardProjectId: "board-project",
      },
      template: {
        title: "Materialize routed canonical work",
        status: "ready",
        priority: "high",
      },
      routing: {
        issue: {
          action: "canonical-issue-create",
          projectId: "canonical-project",
        },
        board: {
          action: "shared-board-derive",
          boardProjectId: "board-project",
        },
        mutateBoardDirectly: false,
      },
      source: {
        kind: "config-file",
        path: ".a5c/automations.json",
      },
      audit: {
        createdAt: "2026-04-24T00:00:00.000Z",
      },
    };

    const execution: AutomationExecutionRecord = {
      id: "automation-execution-01",
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: rule.trigger.type,
      status: "created",
      triggeredAt: "2026-04-24T12:00:00.000Z",
      triggeredBy: "daemon-timer",
      source: rule.source,
      projectId: rule.routing.issue.projectId,
      boardProjectId: rule.routing.board.boardProjectId,
      issueId: "CANON-AUTO-001",
      issueKey: "CANON-AUTO-001",
      issueSource: {
        kind: "run-derived",
        externalId: "digest-job",
      },
      stateAtExecution: rule.state,
      metadata: {
        triggerType: "timer",
        cron: rule.trigger.cron,
      },
    };

    expect(rule.target.projectId).toBe("canonical-project");
    expect(rule.target.boardProjectId).toBe("board-project");
    expect(rule.routing.issue.projectId).toBe("canonical-project");
    expect(rule.routing.board.boardProjectId).toBe("board-project");
    expect(rule.routing.issue.projectId).not.toBe(rule.routing.board.boardProjectId);
    expect(execution.projectId).toBe("canonical-project");
    expect(execution.boardProjectId).toBe("board-project");
    expect(execution.issueKey).toBe("CANON-AUTO-001");
  });
});
