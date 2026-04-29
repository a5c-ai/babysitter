import type { ReactNode } from "react";
import { createStore } from "zustand/vanilla";
import { describe, expect, it, vi } from "vitest";

import { render, screen, setupUser } from "@/test/test-utils";

import { SessionConversationSurface } from "../session-conversation-surface";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: unknown }) => <a href={href}>{children}</a>,
}));

vi.mock("@/hooks/use-task-tags", () => ({
  useTaskTags: () => ({
    taskTags: [],
    loading: false,
    error: null,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children?: ReactNode;
    asChild?: boolean;
    [key: string]: unknown;
  }) => (asChild ? <>{children}</> : <button {...props}>{children}</button>),
}));

const requestMock = vi.fn();
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
    client: { request: requestMock },
    store: gatewayStore,
  }),
}));

describe("SessionConversationSurface", () => {
  it("renders parity message kinds and approval controls in one surface", async () => {
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
              { type: "user_message", text: "Please update src/app.ts", timestamp: 1_100 },
              { type: "tool_call_start", toolCallId: "tool-1", toolName: "read_file", inputAccumulated: "src/app.ts", timestamp: 1_200 },
              { type: "tool_result", toolCallId: "tool-1", toolName: "read_file", output: { path: "src/app.ts" }, timestamp: 1_300 },
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

    expect(screen.getByText("Live operator surface")).toBeInTheDocument();
    expect(screen.getAllByText("user").length).toBeGreaterThan(0);
    expect(screen.getByText("read_file")).toBeInTheDocument();
    expect(screen.getAllByText("write src/app.ts").length).toBeGreaterThan(0);
    expect(screen.getByText("Tool timeout")).toBeInTheDocument();
    expect(screen.getByText("Approval feedback loop")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Attach" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Allow" }));

    expect(requestMock).toHaveBeenCalledWith({
      type: "hook.decision",
      hookRequestId: "hook-1",
      decision: "allow",
    });
  });
});
