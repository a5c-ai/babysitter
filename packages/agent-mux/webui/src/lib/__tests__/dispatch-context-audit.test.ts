import { describe, expect, it } from "vitest";

import { findDispatchContextAuditsByRunId, findDispatchContextAuditsBySessionId } from "../dispatch-context-audit";

const snapshot = {
  projects: [],
  issues: [
    {
      id: "issue-2",
      key: "KANBAN-GAP-200",
      title: "Later dispatch",
      dispatch: {
        runIds: ["run-1"],
        sessionIds: ["session-1"],
        lastDispatchedAt: "2026-04-25T10:00:00.000Z",
        executionContext: {
          source: "dispatch-context-labels",
          appliedLabels: [
            {
              labelId: "dispatch-context-label-tests-first",
              key: "tests_first",
              label: "Tests First",
              instruction: "Write tests first.",
            },
          ],
          renderedBlock: "- [tests_first] Write tests first.",
          metadata: {
            labelIds: ["dispatch-context-label-tests-first"],
            labelKeys: ["tests_first"],
            labelCount: 1,
          },
        },
      },
    },
    {
      id: "issue-1",
      key: "KANBAN-GAP-100",
      title: "Earlier dispatch",
      dispatch: {
        runIds: ["run-1", "run-2"],
        sessionIds: ["session-1"],
        lastDispatchedAt: "2026-04-24T10:00:00.000Z",
        executionContext: {
          source: "dispatch-context-labels",
          appliedLabels: [
            {
              labelId: "dispatch-context-label-ui-copy-review",
              key: "ui_copy_review",
              label: "UI Copy Review",
              instruction: "Keep review text inspectable.",
            },
          ],
          renderedBlock: "- [ui_copy_review] Keep review text inspectable.",
          metadata: {
            labelIds: ["dispatch-context-label-ui-copy-review"],
            labelKeys: ["ui_copy_review"],
            labelCount: 1,
          },
        },
      },
    },
    {
      id: "issue-3",
      key: "KANBAN-GAP-300",
      title: "No envelope",
      dispatch: {
        runIds: ["run-3"],
        sessionIds: ["session-2"],
      },
    },
  ],
  dispatchContextLabels: [],
} as const;

describe("dispatch-context audit helpers", () => {
  it("returns audits matched by run id in latest-dispatch order", () => {
    expect(findDispatchContextAuditsByRunId(snapshot as never, "run-1").map((audit) => audit.issueId)).toEqual([
      "issue-2",
      "issue-1",
    ]);
  });

  it("returns audits matched by session id and ignores issues without an envelope", () => {
    expect(findDispatchContextAuditsBySessionId(snapshot as never, "session-1").map((audit) => audit.issueKey)).toEqual([
      "KANBAN-GAP-200",
      "KANBAN-GAP-100",
    ]);
    expect(findDispatchContextAuditsBySessionId(snapshot as never, "session-2")).toEqual([]);
  });
});
