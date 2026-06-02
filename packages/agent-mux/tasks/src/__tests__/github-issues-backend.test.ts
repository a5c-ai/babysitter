import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { SubmitBreakpointParams } from "../backend.js";
import { GitHubIssuesBackend, parseAnswerFromComment } from "../backends/github-issues.js";

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: new Headers(),
  } as Response;
}

function errorResponse(status: number, body: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ message: body }),
    text: async () => body,
    headers: new Headers(),
  } as Response;
}

type TestIssue = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string }>;
  assignees: Array<{ login: string }>;
  created_at: string;
  updated_at: string;
};

type TestComment = {
  id: number;
  body: string;
  user: { login: string } | null;
  created_at: string;
};

function makeIssue(overrides: Partial<TestIssue> = {}): TestIssue {
  return {
    number: 101,
    title: "Question",
    body: "Description",
    state: "open",
    labels: [],
    assignees: [],
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeComment(overrides: Partial<TestComment> = {}): TestComment {
  return {
    id: 1,
    body: "## Answer\n\nHello",
    user: { login: "responder" },
    created_at: "2025-01-01T01:00:00.000Z",
    ...overrides,
  };
}

function makeSubmitParams(
  overrides: Partial<SubmitBreakpointParams> = {},
): SubmitBreakpointParams {
  return {
    text: "Need help",
    context: {
      description: "Please advise",
      codeSnippets: [],
      fileReferences: [],
      tags: [],
    },
    routing: {
      strategy: "single",
      targetResponders: [],
      timeoutMs: 60_000,
      presentToUser: false,
    },
    ...overrides,
  };
}

describe("GitHubIssuesBackend", () => {
  const backend = new GitHubIssuesBackend({
    owner: "acme",
    repo: "breakpoints",
  });

  it("rejects proven breakpoint requests until signed answers can round-trip", async () => {
    await expect(
      backend.submitBreakpoint({
        text: "Need a signed answer",
        context: {
          description: "Testing proven support",
          codeSnippets: [],
          fileReferences: [],
          tags: [],
        },
        routing: {
          strategy: "single",
          targetResponders: [],
          timeoutMs: 60_000,
          presentToUser: false,
        },
        proven: true,
      }),
    ).rejects.toThrow(/does not support ask_breakpoint\.proven/i);
  });

  it("rejects answer signing requests until signed answers can round-trip", async () => {
    await expect(
      backend.answerBreakpoint("gh-123", {
        responderId: "tal",
        responderName: "Tal M",
        text: "Signed answer",
        sign: true,
      }),
    ).rejects.toThrow(/does not support answer signing/i);
  });
});

describe("GitHubIssuesBackend durability and parity", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("uses durable gh-{number} ids across backend instances", async () => {
    const issue = makeIssue({ number: 314, title: "Durable question" });
    globalThis.fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(okResponse(issue))
      .mockResolvedValueOnce(okResponse(issue))
      .mockResolvedValueOnce(okResponse([])) as typeof globalThis.fetch;

    const backend1 = new GitHubIssuesBackend({ owner: "acme", repo: "breakpoints" });
    backend1.setToken("token");
    const created = await backend1.submitBreakpoint(makeSubmitParams());

    expect(created.id).toBe("gh-314");

    const backend2 = new GitHubIssuesBackend({ owner: "acme", repo: "breakpoints" });
    backend2.setToken("token");
    const fetched = await backend2.getBreakpoint("gh-314");

    expect(fetched.id).toBe("gh-314");
  });

  it("round-trips supported context and routing fields via issue payloads", async () => {
    const params = makeSubmitParams({
      text: "Render issue payload",
      projectId: "proj-77",
      repoId: "repo-88",
      context: {
        description: "Detailed description",
        codeSnippets: [
          "console.log('hello');",
          { filename: "app.ts", code: "export const value = 1;", language: "ts" },
        ],
        fileReferences: ["src/app.ts"],
        tags: ["alpha", "beta"],
        urgency: "high",
        title: "Issue title",
        summary: "Summary text",
        markdown: "Extra **markdown** content.",
        domain: "frontend",
        interactionKind: "clarification",
        links: [{ label: "Docs", url: "https://example.com" }],
        sections: [{ title: "Details", markdown: "Section body" }],
        artifacts: [{ label: "Trace", url: "https://example.com/trace" }],
        metadata: { owner: "team-x" },
      },
      routing: {
        strategy: "quorum",
        targetResponders: ["alice", "bob"],
        timeoutMs: 123_456,
        presentToUser: true,
        autoApproveAfterN: 2,
        breakpointId: "bp-external",
      },
    });

    let capturedBody = "";
    globalThis.fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
      async (_url: string, init?: RequestInit) => {
        const payload = JSON.parse(init?.body as string) as { title: string; body: string; labels: string[]; assignees: string[] };
        capturedBody = payload.body;
        const issue = makeIssue({
          number: 55,
          title: payload.title,
          body: payload.body,
          labels: payload.labels.map((name) => ({ name })),
          assignees: payload.assignees.map((login) => ({ login })),
        });
        return okResponse(issue);
      },
    ) as typeof globalThis.fetch;

    const backend = new GitHubIssuesBackend({ owner: "acme", repo: "breakpoints" });
    backend.setToken("token");
    const breakpoint = await backend.submitBreakpoint(params);

    expect(capturedBody).toContain("tasks-mux:issue:v1");
    expect(breakpoint.context).toMatchObject({
      description: params.context.description,
      codeSnippets: params.context.codeSnippets,
      fileReferences: params.context.fileReferences,
      tags: params.context.tags,
      urgency: params.context.urgency,
      title: params.context.title,
      summary: params.context.summary,
      markdown: params.context.markdown,
      domain: params.context.domain,
      interactionKind: params.context.interactionKind,
      links: params.context.links,
      sections: params.context.sections,
      artifacts: params.context.artifacts,
      metadata: params.context.metadata,
    });
    expect(breakpoint.routing).toMatchObject({
      strategy: params.routing.strategy,
      targetResponders: params.routing.targetResponders,
      timeoutMs: params.routing.timeoutMs,
      presentToUser: params.routing.presentToUser,
      autoApproveAfterN: params.routing.autoApproveAfterN,
      breakpointId: params.routing.breakpointId,
    });
    expect(breakpoint.projectId).toBe("proj-77");
    expect(breakpoint.repoId).toBe("repo-88");
  });

  it("restores legacy issues without payloads", async () => {
    const legacyBody = [
      "Legacy description line.",
      "",
      "## Code Snippets",
      "```",
      "console.log('legacy');",
      "```",
      "",
      "## File References",
      "- `src/legacy.ts`",
      "",
      "**Tags:** legacy, api",
      "**Urgency:** high",
      "",
      "---",
      "*Project: old-proj | Repo: old-repo*",
    ].join("\n");

    const issue = makeIssue({
      number: 77,
      title: "Legacy question",
      body: legacyBody,
      labels: [{ name: "legacy" }],
    });

    globalThis.fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(okResponse(issue))
      .mockResolvedValueOnce(okResponse([])) as typeof globalThis.fetch;

    const backend = new GitHubIssuesBackend({ owner: "acme", repo: "breakpoints" });
    backend.setToken("token");
    const breakpoint = await backend.getBreakpoint("gh-77");

    expect(breakpoint.context.description).toBe("Legacy description line.");
    expect(breakpoint.context.fileReferences).toEqual(["src/legacy.ts", "**Tags:** legacy, api", "**Urgency:** high"]);
    expect(breakpoint.context.codeSnippets).toContain("console.log('legacy');");
    expect(breakpoint.context.tags).toEqual(["legacy", "api"]);
    expect(breakpoint.context.urgency).toBe("high");
    expect(breakpoint.projectId).toBe("old-proj");
    expect(breakpoint.repoId).toBe("old-repo");
  });

  it("maps structured answer payloads with responder metadata", async () => {
    const answerPayload = {
      version: 1,
      schema: "tasks-mux:answer",
      text: "Resolved answer",
      confidence: 91,
      references: ["ref-1"],
      responderId: "agent-9",
      responderName: "Agent Nine",
      breakpointId: "gh-88",
    };
    const commentBody = `## Answer\n\nResolved answer\n\n<!-- tasks-mux:answer:v1\n${JSON.stringify(
      answerPayload,
      null,
      2,
    )}\n-->`;
    const issue = makeIssue({ number: 88, body: "Body", assignees: [{ login: "agent-9" }] });

    globalThis.fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(okResponse(issue))
      .mockResolvedValueOnce(
        okResponse([makeComment({ id: 22, body: commentBody, user: { login: "fallback" } })]),
      ) as typeof globalThis.fetch;

    const backend = new GitHubIssuesBackend({ owner: "acme", repo: "breakpoints" });
    backend.setToken("token");
    const breakpoint = await backend.getBreakpoint("gh-88");

    expect(breakpoint.answers).toHaveLength(1);
    expect(breakpoint.answers[0]).toMatchObject({
      breakpointId: "gh-88",
      responderId: "agent-9",
      responderName: "Agent Nine",
      text: "Resolved answer",
      confidence: 91,
      references: ["ref-1"],
    });
  });
});

describe("parseAnswerFromComment()", () => {
  it("extracts structured answer payloads", () => {
    const payload = {
      version: 1,
      schema: "tasks-mux:answer",
      text: "Payload answer",
      confidence: 88,
      references: ["ref-a", "ref-b"],
      responderId: "res-1",
      responderName: "Responder One",
      breakpointId: "gh-900",
    };
    const body = `## Answer\n\nPayload answer\n\n<!-- tasks-mux:answer:v1\n${JSON.stringify(
      payload,
      null,
      2,
    )}\n-->`;
    const parsed = parseAnswerFromComment(body);

    expect(parsed).toMatchObject({
      text: "Payload answer",
      confidence: 88,
      references: ["ref-a", "ref-b"],
      responderId: "res-1",
      responderName: "Responder One",
      breakpointId: "gh-900",
    });
  });
});

describe("GitHubIssuesBackend cancelBreakpoint()", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("closes the GitHub issue with a PATCH to state=closed", async () => {
    const backend = new GitHubIssuesBackend({
      owner: "acme",
      repo: "widgets",
    });
    backend.setToken("test-token");
    globalThis.fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(okResponse({})) as typeof globalThis.fetch;

    await backend.cancelBreakpoint("gh-42");

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (globalThis.fetch as Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/acme/widgets/issues/42");
    expect(init.method).toBe("PATCH");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-token",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    });
    expect(JSON.parse(init.body as string)).toEqual({ state: "closed" });
  });

  it("surfaces GitHub API errors from the cancel request", async () => {
    const backend = new GitHubIssuesBackend({
      owner: "acme",
      repo: "widgets",
    });
    backend.setToken("test-token");
    globalThis.fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValue(errorResponse(500, "server exploded")) as typeof globalThis.fetch;

    await expect(backend.cancelBreakpoint("gh-42")).rejects.toThrow(
      "GitHub API error (500): server exploded",
    );
  });
});
