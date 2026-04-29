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
});
