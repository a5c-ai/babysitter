import { describe, expect, it } from "vitest";
import type { AutomationRule } from "../src/automation.js";

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
});
