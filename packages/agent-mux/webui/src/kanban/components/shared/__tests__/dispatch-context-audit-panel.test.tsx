import React from "react";
import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/test-utils";
import { DispatchContextAuditPanel } from "../dispatch-context-audit-panel";

describe("DispatchContextAuditPanel", () => {
  it("renders an empty state when no audits are present", () => {
    render(<DispatchContextAuditPanel title="Execution context" audits={[]} emptyText="Nothing linked yet." />);
    expect(screen.getByText("Execution context")).toBeInTheDocument();
    expect(screen.getByText("Nothing linked yet.")).toBeInTheDocument();
  });

  it("renders issue linkage, metadata, and the rendered execution block", () => {
    render(
      <DispatchContextAuditPanel
        title="Execution context"
        emptyText="Nothing linked yet."
        audits={[
          {
            issueId: "issue-1",
            issueKey: "KANBAN-GAP-007",
            issueTitle: "Audit the runtime panel",
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
        ]}
      />,
    );

    expect(screen.getByText("KANBAN-GAP-007")).toBeInTheDocument();
    expect(screen.getByText("Audit the runtime panel")).toBeInTheDocument();
    expect(screen.getByText("tests_first")).toBeInTheDocument();
    expect(screen.getByText("dispatch-context-labels")).toBeInTheDocument();
    expect(screen.getByText("dispatch-context-label-tests-first")).toBeInTheDocument();
    expect(screen.getByText(/Write tests first\./)).toBeInTheDocument();
  });
});
