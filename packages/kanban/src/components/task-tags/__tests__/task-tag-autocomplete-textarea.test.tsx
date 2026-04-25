import { useState } from "react";
import { describe, expect, it } from "vitest";

import { fireEvent, render, screen, setupUser } from "@/test/test-utils";

import { TaskTagAutocompleteTextarea } from "../task-tag-autocomplete-textarea";

const taskTags = [
  {
    id: "task-tag-bug-report",
    key: "bug_report",
    label: "Bug Report",
    content: "Describe the bug in detail.",
    description: "Capture reproduction details and observed behavior.",
    order: 0,
    createdAt: "2026-04-24T12:00:00.000Z",
    updatedAt: "2026-04-24T12:00:00.000Z",
  },
  {
    id: "task-tag-deployment-validation",
    key: "deployment_validation",
    label: "Deployment Validation",
    content: "Validate staging deploy, smoke tests, and rollback path.",
    description: "Release checklist scaffold.",
    order: 1,
    createdAt: "2026-04-24T12:00:00.000Z",
    updatedAt: "2026-04-24T12:00:00.000Z",
  },
  {
    id: "task-tag-code-review",
    key: "code_review_checklist",
    label: "Code Review Checklist",
    content: "Review correctness, tests, release notes, and rollback risk.",
    description: "Checklist for human review.",
    order: 2,
    createdAt: "2026-04-24T12:00:00.000Z",
    updatedAt: "2026-04-24T12:00:00.000Z",
  },
] as const;

function Harness({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <TaskTagAutocompleteTextarea
        taskTags={taskTags}
        value={value}
        onValueChange={setValue}
        renderTextarea={(props) => <textarea {...props} aria-label="Task Tag Input" />}
      />
      <div data-testid="task-tag-value">{value}</div>
    </>
  );
}

describe("TaskTagAutocompleteTextarea", () => {
  it("filters suggestions and inserts the selected snippet with keyboard navigation", async () => {
    const user = setupUser();
    render(<Harness />);

    const input = screen.getByLabelText("Task Tag Input");
    await user.type(input, "@");

    expect(screen.getByText("Bug Report")).toBeInTheDocument();
    expect(screen.getByText("Deployment Validation")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByTestId("task-tag-value")).toHaveTextContent(
      "Validate staging deploy, smoke tests, and rollback path.",
    );
    expect(screen.queryByText("Bug Report")).not.toBeInTheDocument();
  });

  it("matches by partial key or label text", async () => {
    const user = setupUser();
    render(<Harness />);

    const input = screen.getByLabelText("Task Tag Input");
    await user.type(input, "@review");

    expect(screen.getByText("Code Review Checklist")).toBeInTheDocument();
    expect(screen.queryByText("Bug Report")).not.toBeInTheDocument();
  });

  it("does not open autocomplete for email-like text", async () => {
    const user = setupUser();
    render(<Harness />);

    const input = screen.getByLabelText("Task Tag Input");
    await user.type(input, "owner@bug");

    expect(screen.queryByText("Bug Report")).not.toBeInTheDocument();
  });

  it("replaces the @query at the cursor position without touching surrounding text", async () => {
    const user = setupUser();
    render(<Harness initialValue="Before @bug after" />);

    const input = screen.getByLabelText("Task Tag Input");
    input.focus();
    input.setSelectionRange("Before @bug".length, "Before @bug".length);
    fireEvent.select(input);

    await user.click(screen.getByText("Bug Report"));

    expect(screen.getByTestId("task-tag-value")).toHaveTextContent(
      "Before Describe the bug in detail. after",
    );
  });
});
