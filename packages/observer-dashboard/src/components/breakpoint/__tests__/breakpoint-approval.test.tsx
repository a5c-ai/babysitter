import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, setupUser } from "@/test/test-utils";
import { BreakpointApproval } from "../breakpoint-approval";
import { createMockTaskDetail } from "@/test/fixtures";
import type { TaskDetail } from "@/types";

// Mock the server action
const mockApproveBreakpoint = vi.fn();
vi.mock("@/app/actions/approve-breakpoint", () => ({
  approveBreakpoint: (...args: unknown[]) => mockApproveBreakpoint(...args),
}));

describe("BreakpointApproval", () => {
  const defaultRunId = "run-123";

  function makeBreakpointTask(overrides: Partial<TaskDetail> = {}): TaskDetail {
    return createMockTaskDetail({
      kind: "breakpoint",
      status: "requested",
      breakpointQuestion: "Should we deploy to production?",
      title: "Deploy Approval",
      breakpoint: {
        question: "Should we deploy to production?",
        title: "Deploy Approval",
        context: { files: [] },
      },
      ...overrides,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockApproveBreakpoint.mockResolvedValue({ success: true });
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it("renders for a waiting breakpoint task", () => {
    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    expect(screen.getByTestId("breakpoint-approval")).toBeInTheDocument();
    expect(screen.getByTestId("approve-btn")).toBeInTheDocument();
    expect(screen.getByTestId("custom-answer-input")).toBeInTheDocument();
  });

  it("does not render for a resolved task", () => {
    const task = makeBreakpointTask({ status: "resolved" });
    const { container } = render(
      <BreakpointApproval task={task} runId={defaultRunId} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("does not render for an error task", () => {
    const task = makeBreakpointTask({ status: "error" });
    const { container } = render(
      <BreakpointApproval task={task} runId={defaultRunId} />
    );

    expect(container.innerHTML).toBe("");
  });

  // -------------------------------------------------------------------------
  // Option buttons
  // -------------------------------------------------------------------------

  it("renders option buttons when options are provided", () => {
    const task = makeBreakpointTask({
      breakpoint: {
        question: "Choose environment",
        title: "Deploy",
        options: ["staging", "production"],
        context: { files: [] },
      },
    });
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    expect(screen.getByTestId("breakpoint-options")).toBeInTheDocument();
    expect(screen.getByTestId("option-btn-staging")).toBeInTheDocument();
    expect(screen.getByTestId("option-btn-production")).toBeInTheDocument();
  });

  it("does not render option section when no options", () => {
    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    expect(screen.queryByTestId("breakpoint-options")).not.toBeInTheDocument();
  });

  it("calls server action when an option button is clicked", async () => {
    const user = setupUser();
    const task = makeBreakpointTask({
      breakpoint: {
        question: "Choose environment",
        title: "Deploy",
        options: ["staging", "production"],
        context: { files: [] },
      },
    });
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    await user.click(screen.getByTestId("option-btn-staging"));

    expect(mockApproveBreakpoint).toHaveBeenCalledWith(
      defaultRunId,
      task.effectId,
      "staging"
    );
  });

  // -------------------------------------------------------------------------
  // Custom answer
  // -------------------------------------------------------------------------

  it("disables the approve button when input is empty", () => {
    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    expect(screen.getByTestId("approve-btn")).toBeDisabled();
  });

  it("enables the approve button when input has text", async () => {
    const user = setupUser();
    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    await user.type(screen.getByTestId("custom-answer-input"), "yes");

    expect(screen.getByTestId("approve-btn")).not.toBeDisabled();
  });

  it("calls server action on form submit with custom answer", async () => {
    const user = setupUser();
    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    await user.type(screen.getByTestId("custom-answer-input"), "Deploy to staging");
    await user.click(screen.getByTestId("approve-btn"));

    expect(mockApproveBreakpoint).toHaveBeenCalledWith(
      defaultRunId,
      task.effectId,
      "Deploy to staging"
    );
  });

  // -------------------------------------------------------------------------
  // Result feedback
  // -------------------------------------------------------------------------

  it("shows success message after approval", async () => {
    const user = setupUser();
    mockApproveBreakpoint.mockResolvedValue({ success: true });

    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    await user.type(screen.getByTestId("custom-answer-input"), "yes");
    await user.click(screen.getByTestId("approve-btn"));

    const resultEl = await screen.findByTestId("approval-result");
    expect(resultEl).toBeInTheDocument();
    expect(resultEl.textContent).toContain("approved successfully");
  });

  it("shows the orphaned post-submit confirmation VERBATIM when orphaned (UX-R2 §13.4 / AC-45)", async () => {
    const user = setupUser();
    mockApproveBreakpoint.mockResolvedValue({ success: true });

    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} orphaned />);

    await user.type(screen.getByTestId("custom-answer-input"), "yes");
    await user.click(screen.getByTestId("approve-btn"));

    const resultEl = await screen.findByTestId("approval-result");
    expect(resultEl.textContent).toContain(
      "Answer recorded. It will be applied when the run is resumed."
    );
    expect(resultEl.textContent).not.toContain("approved successfully");
    // The write path is unchanged — same server-action call either way.
    expect(mockApproveBreakpoint).toHaveBeenCalledWith(
      defaultRunId,
      task.effectId,
      "yes"
    );
  });

  it("shows error message on failure", async () => {
    const user = setupUser();
    mockApproveBreakpoint.mockResolvedValue({
      success: false,
      error: "Task directory not found",
    });

    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    await user.type(screen.getByTestId("custom-answer-input"), "yes");
    await user.click(screen.getByTestId("approve-btn"));

    const resultEl = await screen.findByTestId("approval-result");
    expect(resultEl).toBeInTheDocument();
    expect(resultEl.textContent).toContain("Task directory not found");
  });

  // -------------------------------------------------------------------------
  // Label text
  // -------------------------------------------------------------------------

  it('shows "Or provide a custom answer" when options exist', () => {
    const task = makeBreakpointTask({
      breakpoint: {
        question: "Pick",
        title: "Pick",
        options: ["a", "b"],
        context: { files: [] },
      },
    });
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    expect(screen.getByText("Or provide a custom answer")).toBeInTheDocument();
  });

  it('shows "Provide an answer" when no options exist', () => {
    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    expect(screen.getByText("Provide an answer")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // UX-R3 §14.5 — write-path truth (AC-58..AC-62)
  // -------------------------------------------------------------------------

  it("AC-58: the submit reads 'Record answer' — never 'Approve'/'Approving'", () => {
    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} />);

    const submit = screen.getByTestId("approve-btn");
    expect(submit).toHaveTextContent("Record answer");
    expect(submit).not.toHaveTextContent(/Approve|Approving/);
  });

  it("AC-59: the orphaned success chip is the amber-gray 'awaiting resume' state, not the green 'done' copy", async () => {
    const user = setupUser();
    mockApproveBreakpoint.mockResolvedValue({ success: true });
    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} orphaned />);

    await user.type(screen.getByTestId("custom-answer-input"), "yes");
    await user.click(screen.getByTestId("approve-btn"));

    const resultEl = await screen.findByTestId("approval-result");
    // owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
    expect(resultEl.textContent).toContain("Answer recorded, awaiting resume");
    // NOT the green "done"-flavored copy.
    expect(resultEl.textContent).not.toContain("approved successfully");
    // Amber-gray, never green: the chip uses the stalled token, not status-ok.
    expect(resultEl.className).toContain("status-stalled");
    expect(resultEl.className).not.toContain("success");
  });

  it("AC-60: an orphaned panel renders the copyable, inert run:iterate command", () => {
    const task = makeBreakpointTask();
    render(<BreakpointApproval task={task} runId={defaultRunId} orphaned />);

    const cmd = screen.getByTestId("kanban-bp-run-iterate-text");
    expect(cmd).toHaveTextContent(`babysitter run:iterate ${defaultRunId}`);
    // Copy invokes NO server action.
    expect(mockApproveBreakpoint).not.toHaveBeenCalled();
  });

  it("AC-62: overwrite mode renders on an already-recorded task, shows the existing answer, and relabels the submit to 'Overwrite answer'", () => {
    // A resolved task would normally render nothing — recordedAnswer flips it
    // into overwrite mode.
    const task = makeBreakpointTask({ status: "resolved" });
    render(
      <BreakpointApproval
        task={task}
        runId={defaultRunId}
        orphaned
        recordedAnswer="first choice"
      />
    );

    expect(screen.getByTestId("breakpoint-approval")).toBeInTheDocument();
    expect(screen.getByTestId("bp-recorded-answer")).toHaveTextContent(
      "Recorded answer: first choice"
    );
    expect(screen.getByTestId("approve-btn")).toHaveTextContent("Overwrite answer");
  });
});
