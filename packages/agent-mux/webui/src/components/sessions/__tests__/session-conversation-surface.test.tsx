import type { ReactNode } from "react";
import { createStore } from "zustand/vanilla";
import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render, screen, setupUser } from "@/test/test-utils";

import { SessionConversationSurface } from "../session-conversation-surface";

vi.mock("@/hooks/use-task-tags", () => ({
  useTaskTags: () => ({
    taskTags: [],
    loading: false,
    error: null,
  }),
}));

vi.mock("@a5c-ai/compendium", () => ({
  Button: ({
    children,
    ...props
  }: {
    children?: ReactNode;
    [key: string]: unknown;
  }) => <button {...props}>{children}</button>,
  Select: ({
    value,
    onChange,
    options,
    ...props
  }: {
    value?: string;
    onChange?: (value: string) => void;
    options?: Array<{ label: string; value: string }>;
    [key: string]: unknown;
  }) => (
    <select
      {...props}
      value={value}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    >
      {(options ?? []).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  cx: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

const gatewayStore = createStore(() => ({
  agents: {
    items: ["claude"],
    byId: {
      claude: {
        agent: "claude",
        displayName: "Claude",
        supportsImageInput: true,
        supportsFileAttachments: true,
        approvalModes: ["prompt", "yolo", "deny"],
      },
    },
  },
  hooks: {
    byRunId: {
      "run-1": [
        {
          hookRequestId: "hook-1",
          runId: "run-1",
          hookKind: "preToolUse",
          payload: { tool: "apply_patch" },
          deadlineTs: 2_500,
        },
      ],
    },
  },
}));

vi.mock("@/lib/agent-mux-ui", () => ({
  useGateway: () => ({
    store: gatewayStore,
  }),
}));

describe("SessionConversationSurface", () => {
  it("attaches a referenced workspace file when the selected agent supports file attachments", async () => {
    const user = setupUser();
    render(
      <SessionConversationSurface
        sessionId="session-1"
        sessionLabel="Session 1"
        sessionAgent="claude"
        sessionStatus="active"
        sessionModel="sonnet"
        runs={[
          { runId: "run-1", agent: "claude", status: "running", startedAt: 1_000 },
        ]}
        eventBuffers={{
          "run-1": {
            events: [
              { type: "file_write", path: "src/app.ts", timestamp: 1_350 },
            ],
          },
        }}
        workspacePath="/repo/worktree"
        emptyStateTitle="Empty"
        emptyStateBody="No events"
        placeholder="Continue the session..."
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Attach file" }));

    expect(screen.getByDisplayValue("Use the attached file: src/app.ts")).toBeInTheDocument();
    expect(screen.getByText("workspace file")).toBeInTheDocument();
  });

  it("falls back to inserting a file path when the selected agent does not support file attachments", async () => {
    gatewayStore.setState({
      ...gatewayStore.getState(),
      agents: {
        items: ["codex"],
        byId: {
          codex: {
            agent: "codex",
            displayName: "Codex",
            supportsImageInput: false,
            supportsFileAttachments: false,
            approvalModes: ["prompt"],
          },
        },
      },
    });
    const user = setupUser();
    render(
      <SessionConversationSurface
        sessionId="session-2"
        sessionLabel="Session 2"
        sessionAgent="codex"
        sessionStatus="active"
        runs={[
          { runId: "run-2", agent: "codex", status: "running", startedAt: 1_000 },
        ]}
        eventBuffers={{
          "run-2": {
            events: [
              { type: "file_write", path: "src/app.ts", timestamp: 1_350 },
            ],
          },
        }}
        workspacePath="/repo/worktree"
        emptyStateTitle="Empty"
        emptyStateBody="No events"
        placeholder="Continue the session..."
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Insert path" }));

    expect(screen.getByDisplayValue("Relevant file: /repo/worktree/src/app.ts")).toBeInTheDocument();
    expect(screen.queryByText("workspace file")).not.toBeInTheDocument();
  });

  it("renders runtime hooks as passive chat history instead of approval controls", () => {
    gatewayStore.setState({
      ...gatewayStore.getState(),
      agents: {
        items: ["claude"],
        byId: {
          claude: {
            agent: "claude",
            displayName: "Claude",
            supportsImageInput: true,
            supportsFileAttachments: true,
            approvalModes: ["prompt", "yolo", "deny"],
          },
        },
      },
    });
    render(
      <SessionConversationSurface
        sessionId="session-1"
        sessionLabel="Session 1"
        sessionAgent="claude"
        sessionStatus="active"
        sessionModel="sonnet"
        runs={[
          { runId: "run-1", agent: "claude", status: "running", startedAt: 1_000 },
        ]}
        eventBuffers={{
          "run-1": {
            events: [
              { type: "user_message", text: "Please update src/app.ts", timestamp: 1_100 },
              { type: "tool_call_start", toolCallId: "tool-1", toolName: "read_file", inputAccumulated: "src/app.ts", timestamp: 1_200 },
              { type: "tool_result", toolCallId: "tool-1", toolName: "read_file", output: { path: "src/app.ts" }, timestamp: 1_300 },
              { type: "approval_request", interactionId: "approval-1", action: "Write src/app.ts", detail: "The agent wants to update the file.", toolName: "write_file", riskLevel: "medium", timestamp: 1_310 },
              { type: "approval_granted", interactionId: "approval-1", timestamp: 1_315 },
              { type: "hook_requested", hookRequestId: "hook-1", hookKind: "userPromptSubmit", payload: { prompt: "Please update src/app.ts" }, deadlineTs: 1_360, timestamp: 1_320 },
              { type: "hook_decision", hookRequestId: "hook-1", hookKind: "userPromptSubmit", decision: "allow", resolvedBy: "timeout", timestamp: 1_330 },
              { type: "file_write", path: "src/app.ts", timestamp: 1_350 },
              { type: "error", message: "Tool timeout", timestamp: 1_400 },
            ],
          },
        }}
        workspacePath="/repo/worktree"
        emptyStateTitle="Empty"
        emptyStateBody="No events"
        placeholder="Continue the session..."
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText("Conversation")).toBeInTheDocument();
    expect(screen.getAllByText("user").length).toBeGreaterThan(0);
    expect(screen.getByText("read_file")).toBeInTheDocument();
    expect(screen.getByText("approval requested")).toBeInTheDocument();
    expect(screen.getByText(/Approval requested: Write src\/app.ts/)).toBeInTheDocument();
    expect(screen.getByText("approval granted")).toBeInTheDocument();
    expect(screen.getAllByText("write src/app.ts").length).toBeGreaterThan(0);
    expect(screen.getByText("Tool timeout")).toBeInTheDocument();
    expect(screen.getByText("runtime hook userPromptSubmit")).toBeInTheDocument();
    expect(screen.getByText(/Runtime hook userPromptSubmit opened/)).toBeInTheDocument();
    expect(screen.getByText(/Runtime hook userPromptSubmit resolved: allow/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Allow" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deny" })).not.toBeInTheDocument();
    expect(screen.getByTestId("conversation-scroll-region")).toBeInTheDocument();
    expect(screen.getByTestId("conversation-composer")).toBeInTheDocument();
    expect(screen.getByTestId("conversation-composer").className).toContain("sticky");
    expect(screen.getByTestId("conversation-composer").className).toContain("bottom-0");
    expect(screen.getByTestId("conversation-stats-details")).not.toHaveAttribute("open");
    expect(screen.getByTestId("composer-options-details")).not.toHaveAttribute("open");
    expect(screen.getByPlaceholderText("Continue the session...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Attach" })).toBeEnabled();
  });

  it("auto-follows the transcript until the user scrolls away", async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);

    const props = {
      sessionId: "session-auto-follow",
      sessionLabel: "Session auto follow",
      sessionAgent: "claude",
      sessionStatus: "active",
      sessionModel: "sonnet",
      workspacePath: "/repo/worktree",
      emptyStateTitle: "Empty",
      emptyStateBody: "No events",
      placeholder: "Continue the session...",
      onSubmit: vi.fn().mockResolvedValue(undefined),
    } as const;

    const { rerender } = render(
      <SessionConversationSurface
        {...props}
        runs={[{ runId: "run-auto", agent: "claude", status: "running", startedAt: 1_000 }]}
        eventBuffers={{
          "run-auto": {
            events: [
              { type: "user_message", text: "hello", timestamp: 1_100 },
              { type: "assistant_message", text: "world", timestamp: 1_200 },
            ],
          },
        }}
      />,
    );

    const region = screen.getByTestId("conversation-scroll-region");
    let scrollTop = 0;
    let scrollHeight = 1_240;
    Object.defineProperty(region, "clientHeight", {
      configurable: true,
      value: 240,
    });
    Object.defineProperty(region, "scrollHeight", {
      configurable: true,
      get: () => scrollHeight,
    });
    Object.defineProperty(region, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });

    rerender(
      <SessionConversationSurface
        {...props}
        runs={[{ runId: "run-auto", agent: "claude", status: "running", startedAt: 1_000 }]}
        eventBuffers={{
          "run-auto": {
            events: [
              { type: "user_message", text: "hello", timestamp: 1_100 },
              { type: "user_message", text: "world", timestamp: 1_200 },
              { type: "user_message", text: "new output", timestamp: 1_300 },
            ],
          },
        }}
      />,
    );

    await waitFor(() => expect(scrollTop).toBe(scrollHeight));

    scrollTop = 120;
    fireEvent.scroll(region);

    scrollHeight = 1_480;
    rerender(
      <SessionConversationSurface
        {...props}
        runs={[{ runId: "run-auto", agent: "claude", status: "running", startedAt: 1_000 }]}
        eventBuffers={{
          "run-auto": {
            events: [
              { type: "user_message", text: "hello", timestamp: 1_100 },
              { type: "user_message", text: "world", timestamp: 1_200 },
              { type: "user_message", text: "new output", timestamp: 1_300 },
              { type: "user_message", text: "latest output", timestamp: 1_400 },
            ],
          },
        }}
      />,
    );

    await waitFor(() => expect(scrollTop).toBe(120));

    scrollTop = 1_240;
    fireEvent.scroll(region);

    scrollHeight = 1_720;
    rerender(
      <SessionConversationSurface
        {...props}
        runs={[{ runId: "run-auto", agent: "claude", status: "running", startedAt: 1_000 }]}
        eventBuffers={{
          "run-auto": {
            events: [
              { type: "user_message", text: "hello", timestamp: 1_100 },
              { type: "user_message", text: "world", timestamp: 1_200 },
              { type: "user_message", text: "new output", timestamp: 1_300 },
              { type: "user_message", text: "latest output", timestamp: 1_400 },
              { type: "user_message", text: "bottom again", timestamp: 1_500 },
            ],
          },
        }}
      />,
    );

    await waitFor(() => expect(scrollTop).toBe(scrollHeight));

    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
});
