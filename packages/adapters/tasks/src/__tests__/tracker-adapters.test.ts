import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GenericRestTrackerAdapter,
  JiraTrackerAdapter,
  LinearTrackerAdapter,
} from "../index.js";

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: new Headers(),
  } as Response;
}

describe("external tracker provider adapters", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("maps Jira create and transition calls through REST configuration", async () => {
    const calls: Array<{ url: string; body?: unknown }> = [];
    globalThis.fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
      async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({
          url: String(url),
          body: init?.body ? JSON.parse(String(init.body)) as unknown : undefined,
        });
        if (String(url).endsWith("/transitions")) return okResponse({});
        return okResponse({
          id: "10001",
          key: "OPS-1",
          title: "Investigate",
          status: "To Do",
          createdAt: "2026-05-30T10:00:00.000Z",
          updatedAt: "2026-05-30T10:00:00.000Z",
        });
      },
    ) as typeof globalThis.fetch;

    const adapter = new JiraTrackerAdapter({
      type: "external-tracker",
      provider: "jira",
      tracker: {
        baseUrl: "https://jira.example",
        projectKey: "OPS",
        issueType: "Task",
        transitions: { answered: "31" },
      },
      statusMapping: { "To Do": "open" },
    });

    const issue = await adapter.createIssue({
      title: "Investigate",
      description: "Please inspect",
      labels: ["ops"],
      assignees: [],
      fields: { customfield_10000: "high" },
      metadata: {},
    });
    await adapter.transitionIssue(issue.ref, "answered");

    expect(calls[0]).toMatchObject({
      url: "https://jira.example/rest/api/3/issue",
      body: {
        fields: {
          project: { key: "OPS" },
          issuetype: { name: "Task" },
          summary: "Investigate",
          description: "Please inspect",
          labels: ["ops"],
          customfield_10000: "high",
        },
      },
    });
    expect(calls[1]).toMatchObject({
      url: "https://jira.example/rest/api/3/issue/OPS-1/transitions",
      body: { transition: { id: "31" } },
    });
  });

  it("maps Linear issue creation and workflow-state transitions through GraphQL", async () => {
    const bodies: unknown[] = [];
    globalThis.fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as { query: string; variables: unknown };
        bodies.push(body);
        if (body.query.includes("issueUpdate")) {
          return okResponse({ data: { issueUpdate: { success: true } } });
        }
        return okResponse({
          data: {
            issueCreate: {
              success: true,
              issue: {
                id: "lin-1",
                identifier: "ENG-1",
                title: "Implement",
                url: "https://linear.app/acme/issue/ENG-1",
                state: { name: "Todo" },
                createdAt: "2026-05-30T10:00:00.000Z",
                updatedAt: "2026-05-30T10:00:00.000Z",
              },
            },
          },
        });
      },
    ) as typeof globalThis.fetch;

    const adapter = new LinearTrackerAdapter({
      type: "external-tracker",
      provider: "linear",
      tracker: {
        baseUrl: "https://api.linear.app",
        teamId: "team-1",
        workflowStateIds: { answered: "state-answered" },
      },
      statusMapping: { Todo: "open" },
    });

    const issue = await adapter.createIssue({
      title: "Implement",
      description: "Build it",
      labels: ["feature"],
      assignees: [],
      fields: {},
      metadata: {},
    });
    await adapter.transitionIssue(issue.ref, "answered");

    expect(issue.ref).toMatchObject({ provider: "linear", id: "lin-1", key: "ENG-1" });
    expect(bodies[0]).toMatchObject({
      variables: {
        input: {
          teamId: "team-1",
          title: "Implement",
          description: "Build it",
          labelIds: ["feature"],
        },
      },
    });
    expect(bodies[1]).toMatchObject({
      variables: { id: "lin-1", input: { stateId: "state-answered" } },
    });
  });

  it("extracts Generic REST issue fields with configured mappings", async () => {
    globalThis.fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      okResponse({
        issue: {
          uuid: "rest-1",
          key: "REST-1",
          fields: {
            headline: "Mapped title",
            body: "Mapped body",
            state: "resolved",
            tags: ["support"],
            owner: ["sam"],
          },
          updated: "2026-05-30T10:00:00.000Z",
          link: "https://rest.example/REST-1",
        },
      }),
    ) as typeof globalThis.fetch;

    const adapter = new GenericRestTrackerAdapter({
      type: "external-tracker",
      provider: "generic-rest",
      tracker: {
        baseUrl: "https://rest.example",
        getPath: "/issues/{id}",
      },
      fieldMapping: {
        externalId: "issue.uuid",
        externalKey: "issue.key",
        title: "issue.fields.headline",
        description: "issue.fields.body",
        status: "issue.fields.state",
        labels: "issue.fields.tags",
        assignee: "issue.fields.owner",
        updatedAt: "issue.updated",
        url: "issue.link",
      },
    });

    const issue = await adapter.getIssue({ provider: "generic-rest", id: "rest-1" });

    expect(issue).toMatchObject({
      ref: {
        provider: "generic-rest",
        id: "rest-1",
        key: "REST-1",
        url: "https://rest.example/REST-1",
      },
      title: "Mapped title",
      description: "Mapped body",
      status: "completed",
      labels: ["support"],
      assignees: ["sam"],
      updatedAt: "2026-05-30T10:00:00.000Z",
    });
  });
});
