import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDispatchContextLabel,
  deleteDispatchContextLabel,
  createTaskTag,
  deleteTaskTag,
  loadDispatchContextLabels,
  loadTaskTags,
  postIssueDispatchContextLabels,
  updateDispatchContextLabel,
  updateTaskTag,
} from "../use-backlog";

const refreshMock = vi.fn().mockResolvedValue(undefined);

vi.mock("../use-smart-polling", () => ({
  useSmartPolling: vi.fn(() => ({
    data: undefined,
    loading: false,
    error: null,
    refresh: refreshMock,
  })),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("task tag backlog helpers", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads task tags from the task tags API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        taskTags: [
          {
            id: "task-tag-1",
            key: "bug_report",
            label: "Bug Report",
            content: "Describe the bug",
            order: 0,
            createdAt: "2026-04-24T12:00:00.000Z",
            updatedAt: "2026-04-24T12:00:00.000Z",
          },
        ],
      }),
    );

    const taskTags = await loadTaskTags();

    expect(taskTags).toHaveLength(1);
    expect(taskTags[0]?.key).toBe("bug_report");
    expect(fetch).toHaveBeenCalledWith("/api/task-tags", expect.anything());
  });

  it("posts created task tags to the task tags API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ taskTags: [] }, 201));

    await createTaskTag({
      key: "deployment_validation",
      label: "Deployment Validation",
      content: "Run release checks",
      order: 1,
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/task-tags");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(
      JSON.stringify({
        key: "deployment_validation",
        label: "Deployment Validation",
        content: "Run release checks",
        order: 1,
      }),
    );
  });

  it("patches task tags through the task tags API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ taskTags: [] }));

    await updateTaskTag("task-tag-1", { label: "Ship Validation" });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/task-tags/task-tag-1");
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify({ label: "Ship Validation" }));
  });

  it("deletes task tags through the task tags API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ taskTags: [] }));

    await deleteTaskTag("task-tag-1");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/task-tags/task-tag-1");
    expect(init?.method).toBe("DELETE");
  });
});

describe("dispatch context label backlog helpers", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads dispatch context labels from the dispatch context labels API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        dispatchContextLabels: [
          {
            id: "dispatch-context-label-1",
            key: "tests_first",
            label: "Tests First",
            instruction: "Write tests first.",
            order: 0,
            createdAt: "2026-04-24T12:00:00.000Z",
            updatedAt: "2026-04-24T12:00:00.000Z",
          },
        ],
      }),
    );

    const labels = await loadDispatchContextLabels();

    expect(labels).toHaveLength(1);
    expect(labels[0]?.key).toBe("tests_first");
    expect(fetch).toHaveBeenCalledWith("/api/dispatch-context-labels", expect.anything());
  });

  it("posts created dispatch context labels to the dispatch context labels API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ dispatchContextLabels: [] }, 201));

    await createDispatchContextLabel({
      key: "preserve_release_contract",
      label: "Preserve Release Contract",
      instruction: "Keep release checks green.",
      order: 1,
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/dispatch-context-labels");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(
      JSON.stringify({
        key: "preserve_release_contract",
        label: "Preserve Release Contract",
        instruction: "Keep release checks green.",
        order: 1,
      }),
    );
  });

  it("patches dispatch context labels through the dispatch context labels API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ dispatchContextLabels: [] }));

    await updateDispatchContextLabel("dispatch-context-label-1", { label: "Ship Contract" });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/dispatch-context-labels/dispatch-context-label-1");
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify({ label: "Ship Contract" }));
  });

  it("deletes dispatch context labels through the dispatch context labels API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ dispatchContextLabels: [] }));

    await deleteDispatchContextLabel("dispatch-context-label-1");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/dispatch-context-labels/dispatch-context-label-1");
    expect(init?.method).toBe("DELETE");
  });

  it("posts issue dispatch context label attachments through the backlog API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        snapshot: { projects: [], issues: [], dispatchContextLabels: [] },
        board: { projects: [] },
        summary: {
          projectCount: 0,
          issueCount: 0,
          readyCount: 0,
          blockedCount: 0,
          dispatchedCount: 0,
          completedCount: 0,
          needsDecompositionCount: 0,
          inProgressCount: 0,
        },
      }),
    );

    await postIssueDispatchContextLabels({
      issueId: "KANBAN-GAP-004",
      dispatchContextLabelIds: [
        "dispatch-context-label-tests-first",
        "dispatch-context-label-preserve-release-contract",
      ],
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/backlog");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(
      JSON.stringify({
        action: "update-issue-dispatch-context-labels",
        issueId: "KANBAN-GAP-004",
        dispatchContextLabelIds: [
          "dispatch-context-label-tests-first",
          "dispatch-context-label-preserve-release-contract",
        ],
      }),
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
