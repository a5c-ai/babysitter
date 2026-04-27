import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import { render, setupUser } from "@/test/test-utils";
import { AutomationsPage } from "../automations-page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: unknown }) => (
    <a href={href}>{children}</a>
  ),
}));

const initialCollection = {
  generatedAt: "2026-04-24T12:00:00.000Z",
  rules: [
    {
      id: "automation-timer-1",
      name: "Daily digest",
      state: "active",
      target: { projectId: "kanban-app", boardProjectId: "kanban-app" },
      template: {
        title: "Review the daily digest",
        summary: "Create a triage issue",
        priority: "high",
        acceptanceCriteria: ["Digest is reviewed"],
      },
      routing: {
        issue: { action: "canonical-issue-create", projectId: "kanban-app" },
        board: { action: "shared-board-derive", boardProjectId: "kanban-app" },
        mutateBoardDirectly: false,
      },
      source: { kind: "manual", provider: "ops" },
      audit: {
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:30:00.000Z",
        lastTriggeredAt: "2026-04-24T12:45:00.000Z",
      },
      trigger: { type: "timer", cron: "0 9 * * 1-5", timezone: "UTC" },
      allowedActions: ["pause", "disable", "delete"],
      isEnabled: true,
      triggerType: "timer",
      executionSummary: {
        totalCount: 1,
        createdCount: 0,
        coalescedCount: 0,
        rejectedCount: 1,
        latestStatus: "rejected",
        lastTriggeredAt: "2026-04-24T12:45:00.000Z",
        lastFailureAt: "2026-04-24T12:45:00.000Z",
        isFailing: true,
      },
      recentExecutions: [
        {
          id: "automation-execution-timer-1",
          ruleId: "automation-timer-1",
          ruleName: "Daily digest",
          triggerType: "timer",
          status: "rejected",
          triggeredAt: "2026-04-24T12:45:00.000Z",
          triggeredBy: "automation-daemon",
          source: { kind: "manual", provider: "ops" },
          projectId: "kanban-app",
          boardProjectId: "kanban-app",
          stateAtExecution: "active",
          deliveryId: "evt-100",
          reason: "Automation routing failed: Project kanban-app not found.",
          metadata: {
            triggerEventSource: "digest.ready",
            triggerEventSummary: "Daily digest fired",
          },
        },
      ],
    },
    {
      id: "automation-webhook-1",
      name: "GitHub issue webhook",
      state: "paused",
      target: { projectId: "kanban-app", boardProjectId: "kanban-app" },
      template: {
        title: "Triage GitHub issue",
        summary: "Create an inbox item",
        priority: "medium",
      },
      routing: {
        issue: { action: "canonical-issue-create", projectId: "kanban-app" },
        board: { action: "shared-board-derive", boardProjectId: "kanban-app" },
        mutateBoardDirectly: false,
      },
      source: { kind: "external-system", provider: "github", externalId: "issue.created" },
      audit: {
        createdAt: "2026-04-24T12:00:00.000Z",
        lastTriggeredAt: "2026-04-24T12:40:00.000Z",
      },
      trigger: {
        type: "webhook",
        port: 4100,
        path: "/github/issues",
        method: "POST",
        auth: { type: "bearer", token: "secret" },
        sourceEvent: "github.issue.created",
      },
      allowedActions: ["resume", "disable", "delete"],
      isEnabled: false,
      triggerType: "webhook",
      executionSummary: {
        totalCount: 1,
        createdCount: 1,
        coalescedCount: 0,
        rejectedCount: 0,
        latestStatus: "created",
        lastTriggeredAt: "2026-04-24T12:40:00.000Z",
        isFailing: false,
      },
      recentExecutions: [
        {
          id: "automation-execution-webhook-1",
          ruleId: "automation-webhook-1",
          ruleName: "GitHub issue webhook",
          triggerType: "webhook",
          status: "created",
          triggeredAt: "2026-04-24T12:40:00.000Z",
          triggeredBy: "webhook:github",
          source: { kind: "external-system", provider: "github", externalId: "issue.created" },
          projectId: "kanban-app",
          boardProjectId: "kanban-app",
          issueId: "KANBAN-AUTO-201",
          issueKey: "KANBAN-AUTO-201",
          stateAtExecution: "paused",
          deliveryId: "gh-201",
          reason: "Created issue KANBAN-AUTO-201 from webhook delivery gh-201.",
          metadata: {
            triggerEventSource: "github.issue.created",
            triggerEventSummary: "GitHub issue opened",
          },
        },
      ],
    },
  ],
  summary: {
    totalCount: 2,
    visibleCount: 2,
    stateCounts: { draft: 0, active: 1, paused: 1, disabled: 0, archived: 0 },
    triggerCounts: { timer: 1, webhook: 1 },
    executionCount: 2,
    failureCount: 1,
    failingCount: 1,
  },
  availableStates: ["draft", "active", "paused", "disabled", "archived"],
  availableTriggerTypes: ["timer", "webhook"],
  targetOptions: [
    {
      projectId: "kanban-app",
      boardProjectId: "kanban-app",
      key: "KANBAN",
      name: "Kanban App",
      linkedRunProjectName: "kanban",
    },
  ],
};

describe("AutomationsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders routing metadata and lifecycle state from the shared automation API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(initialCollection), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    render(<AutomationsPage />);

    expect(await screen.findByText("Dedicated rule authoring and operational control")).toBeInTheDocument();
    expect(await screen.findByText("Daily digest")).toBeInTheDocument();
    expect(screen.getAllByText("KANBAN · Kanban App").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Issue target: kanban-app").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Board target: kanban-app").length).toBeGreaterThan(0);
    expect(screen.getByText("Allowed actions: pause, disable, delete")).toBeInTheDocument();
    expect(screen.getByText("POST /github/issues · :4100 · event github.issue.created")).toBeInTheDocument();
    expect(screen.getByText("failing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /KANBAN-AUTO-201/i })).toHaveAttribute(
      "href",
      "/issues/KANBAN-AUTO-201",
    );
  });

  it("creates a webhook rule using the existing API contract", async () => {
    const user = setupUser();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(initialCollection), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rule: {} }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(initialCollection), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AutomationsPage />);

    await screen.findByText("Daily digest");

    await user.clear(screen.getByLabelText("Rule name"));
    await user.type(screen.getByLabelText("Rule name"), "Incoming webhook triage");
    await user.selectOptions(screen.getByLabelText("Trigger type"), "webhook");
    await user.clear(screen.getByLabelText("Webhook port"));
    await user.type(screen.getByLabelText("Webhook port"), "4201");
    await user.clear(screen.getByLabelText("Webhook path"));
    await user.type(screen.getByLabelText("Webhook path"), "/hooks/github");
    await user.selectOptions(screen.getByLabelText("Auth"), "bearer");
    await user.type(screen.getByLabelText("Bearer token"), "super-secret");
    await user.type(screen.getByLabelText("Source event"), "github.issue.opened");
    await user.clear(screen.getByLabelText("Task title"));
    await user.type(screen.getByLabelText("Task title"), "Triage webhook issue");

    await user.click(screen.getByRole("button", { name: "Create rule" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    const createCall = fetchMock.mock.calls[1];
    expect(createCall?.[0]).toBe("/api/automations");
    expect(createCall?.[1]).toMatchObject({ method: "POST" });
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      name: "Incoming webhook triage",
      createdBy: "operator",
      trigger: {
        type: "webhook",
        port: 4201,
        path: "/hooks/github",
        method: "POST",
        auth: {
          type: "bearer",
          token: "super-secret",
        },
        sourceEvent: "github.issue.opened",
      },
      routing: {
        issue: { action: "canonical-issue-create", projectId: "kanban-app" },
        board: { action: "shared-board-derive", boardProjectId: "kanban-app" },
        mutateBoardDirectly: false,
      },
    });
  });

  it("edits timer and webhook rules and posts lifecycle actions through the shared endpoints", async () => {
    const user = setupUser();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(initialCollection), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rule: {} }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(initialCollection), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rule: {} }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(initialCollection), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rule: {} }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(initialCollection), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AutomationsPage />);
    await screen.findByText("Daily digest");

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    await user.clear(screen.getByLabelText("Cron schedule"));
    await user.type(screen.getByLabelText("Cron schedule"), "0 7 * * *");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const patchTimerCall = fetchMock.mock.calls[1];
    expect(patchTimerCall?.[0]).toBe("/api/automations/automation-timer-1");
    expect(JSON.parse(String(patchTimerCall?.[1]?.body))).toMatchObject({
      updatedBy: "operator",
      trigger: {
        type: "timer",
        cron: "0 7 * * *",
        timezone: "UTC",
      },
    });

    await user.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    await user.clear(screen.getByLabelText("Webhook path"));
    await user.type(screen.getByLabelText("Webhook path"), "/hooks/issues");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    const patchWebhookCall = fetchMock.mock.calls[3];
    expect(patchWebhookCall?.[0]).toBe("/api/automations/automation-webhook-1");
    expect(JSON.parse(String(patchWebhookCall?.[1]?.body))).toMatchObject({
      updatedBy: "operator",
      trigger: {
        type: "webhook",
        path: "/hooks/issues",
        port: 4100,
      },
    });

    await user.click(screen.getByRole("button", { name: "Pause" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(7));
    const lifecycleCall = fetchMock.mock.calls[5];
    expect(lifecycleCall?.[0]).toBe("/api/automations/automation-timer-1/lifecycle");
    expect(JSON.parse(String(lifecycleCall?.[1]?.body))).toEqual({
      action: "pause",
      updatedBy: "operator",
    });
  }, 10000);
});
