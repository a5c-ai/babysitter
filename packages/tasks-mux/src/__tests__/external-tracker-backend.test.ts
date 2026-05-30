import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BackendConfigSchema,
  ExternalTrackerBackend,
  createBackend,
  listRegisteredBackends,
  redactExternalTrackerSecrets,
} from "../index.js";
import type { SubmitBreakpointParams } from "../index.js";

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: new Headers(),
  } as Response;
}

function makeSubmitParams(
  overrides: Partial<SubmitBreakpointParams> = {},
): SubmitBreakpointParams {
  return {
    text: "Need tracker help",
    context: {
      title: "Tracker title",
      description: "Please inspect this task",
      codeSnippets: [],
      fileReferences: [],
      tags: ["backend"],
      urgency: "high",
      metadata: { customer: "acme" },
    },
    routing: {
      strategy: "single",
      targetResponders: ["tal"],
      timeoutMs: 60_000,
      presentToUser: false,
    },
    projectId: "proj-1",
    repoId: "repo-1",
    ...overrides,
  };
}

describe("ExternalTrackerBackend config and factory", () => {
  it("accepts external-tracker config without breaking existing backend configs", () => {
    expect(BackendConfigSchema.safeParse({ type: "git-native" }).success).toBe(true);
    expect(BackendConfigSchema.safeParse({
      type: "external-tracker",
      provider: "generic-rest",
      tracker: { baseUrl: "https://tracker.example", createPath: "/issues" },
      fieldMapping: {
        title: "summary",
        description: "body",
        labels: "labels",
        assignee: "assignees",
        priority: "priority",
      },
      statusMapping: { open: "open", done: "completed" },
      syncDirection: "bidirectional",
      conflictStrategy: "newest-wins",
    }).success).toBe(true);
  });

  it("registers the external-tracker backend factory", () => {
    expect(listRegisteredBackends()).toContain("external-tracker");
    const backend = createBackend("external-tracker", {
      type: "external-tracker",
      provider: "generic-rest",
      tracker: { baseUrl: "https://tracker.example" },
    });
    expect(backend).toBeInstanceOf(ExternalTrackerBackend);
  });
});

describe("ExternalTrackerBackend generic REST sync", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("creates an external issue from breakpoint fields and returns a durable tracker id", async () => {
    const calls: Array<{ url: string; body?: unknown }> = [];
    globalThis.fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
      async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({
          url: String(url),
          body: init?.body ? JSON.parse(String(init.body)) as unknown : undefined,
        });
        return okResponse({
          id: "EXT-1",
          title: "Tracker title",
          description: "Please inspect this task",
          status: "open",
          labels: ["backend"],
          assignees: ["tal"],
          createdAt: "2026-05-30T10:00:00.000Z",
          updatedAt: "2026-05-30T10:00:00.000Z",
          url: "https://tracker.example/issues/EXT-1",
        });
      },
    ) as typeof globalThis.fetch;

    const backend = new ExternalTrackerBackend({
      type: "external-tracker",
      provider: "generic-rest",
      tracker: {
        baseUrl: "https://tracker.example",
        createPath: "/api/issues",
      },
      fieldMapping: {
        title: "summary",
        description: "body",
        labels: "labels",
        assignee: "assignees",
        priority: "priority",
        metadata: { customer: "custom.customer" },
      },
    });

    const breakpoint = await backend.submitBreakpoint(makeSubmitParams());

    expect(calls[0].url).toBe("https://tracker.example/api/issues");
    expect(calls[0].body).toMatchObject({
      title: "Tracker title",
      description: "Please inspect this task",
      fields: {
        summary: "Tracker title",
        body: "Please inspect this task",
        labels: ["backend"],
        assignees: ["tal"],
        priority: "high",
        "custom.customer": "acme",
      },
    });
    expect(breakpoint.id).toMatch(/^tracker-generic-rest-/);
    expect(breakpoint.context.metadata).toMatchObject({
      externalTracker: { provider: "generic-rest", id: "EXT-1" },
    });
  });

  it("posts answers as tracker comments and transitions the external issue", async () => {
    const urls: string[] = [];
    globalThis.fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
      async (url: string | URL | Request, init?: RequestInit) => {
        urls.push(`${init?.method ?? "GET"} ${String(url)}`);
        if (String(url).endsWith("/comments")) {
          const body = JSON.parse(String(init?.body)) as { body: string };
          expect(body.body).toContain("tasks-mux:tracker-answer:v1");
          expect(body.body).toContain("Looks good");
          return okResponse({
            id: "comment-1",
            body: body.body,
            authorId: "tal",
            authorName: "Tal",
            createdAt: "2026-05-30T10:05:00.000Z",
          });
        }
        return okResponse({});
      },
    ) as typeof globalThis.fetch;

    const backend = new ExternalTrackerBackend({
      type: "external-tracker",
      provider: "generic-rest",
      tracker: {
        baseUrl: "https://tracker.example",
        commentPath: "/issues/{id}/comments",
        transitionPath: "/issues/{id}",
      },
    });

    const answer = await backend.answerBreakpoint("tracker-generic-rest-RVhULTI", {
      responderId: "tal",
      responderName: "Tal",
      text: "Looks good",
      confidence: 95,
    });

    expect(answer.text).toBe("Looks good");
    expect(urls).toEqual([
      "POST https://tracker.example/issues/EXT-2/comments",
      "PATCH https://tracker.example/issues/EXT-2",
    ]);
  });

  it("normalizes and deduplicates inbound webhook events", () => {
    const backend = new ExternalTrackerBackend({
      type: "external-tracker",
      provider: "generic-rest",
      tracker: { baseUrl: "https://tracker.example" },
    });
    const payload = {
      eventId: "evt-1",
      issue: {
        id: "EXT-3",
        title: "Webhook task",
        description: "Updated remotely",
        status: "done",
        labels: ["ops"],
        assignees: ["sam"],
        createdAt: "2026-05-30T10:00:00.000Z",
        updatedAt: "2026-05-30T10:10:00.000Z",
      },
      comment: {
        id: "c1",
        body: "## Answer\n\nRemote answer",
        authorId: "sam",
        authorName: "Sam",
        createdAt: "2026-05-30T10:10:00.000Z",
      },
    };

    const first = backend.handleWebhook(payload);
    const second = backend.handleWebhook(payload);

    expect(first.accepted).toBe(true);
    expect(first.duplicate).toBe(false);
    expect(first.breakpoint?.status).toBe("completed");
    expect(first.answer?.text).toBe("Remote answer");
    expect(second.accepted).toBe(true);
    expect(second.duplicate).toBe(true);
  });

  it("exposes tracker responders with routable tracker metadata", async () => {
    const backend = new ExternalTrackerBackend({
      type: "external-tracker",
      provider: "linear",
      tracker: {
        baseUrl: "https://api.linear.app",
        teamId: "team-1",
        responders: ["linear-tracker"],
        apiToken: "must-not-leak",
      },
    });

    await expect(backend.listResponders()).resolves.toEqual([
      expect.objectContaining({
        id: "linear-tracker",
        type: "tracker",
        trackerBackend: "linear",
        trackerConfig: {
          baseUrl: "https://api.linear.app",
          teamId: "team-1",
          responders: ["linear-tracker"],
          apiToken: "[REDACTED]",
        },
      }),
    ]);
  });

  it("redacts secrets from nested tracker metadata", () => {
    expect(redactExternalTrackerSecrets({
      token: "secret-token",
      nested: {
        apiToken: "secret-api-token",
        safe: "visible",
      },
    })).toEqual({
      token: "[REDACTED]",
      nested: {
        apiToken: "[REDACTED]",
        safe: "visible",
      },
    });
  });
});
