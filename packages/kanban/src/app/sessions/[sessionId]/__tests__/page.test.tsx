import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { createStore } from "zustand/vanilla";
import { describe, expect, it, vi } from "vitest";

import { render, screen, setupUser } from "@/test/test-utils";

import SessionDetailPage from "../page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: unknown }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "session-1" }),
}));

vi.mock("@a5c-ai/compendium", () => ({
  Button: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Textarea: (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));

vi.mock("@/components/agent-mux/require-gateway-auth", () => ({
  RequireGatewayAuth: ({ children }: { children: unknown }) => <>{children}</>,
}));

vi.mock("@/components/sessions/session-observability-panel", () => ({
  SessionObservabilityPanel: () => <div data-testid="session-observability-panel" />,
}));

vi.mock("@/components/workspaces/workspace-runtime-panel", () => ({
  WorkspaceRuntimePanel: () => <div data-testid="workspace-runtime-panel" />,
}));

vi.mock("@/components/agent-mux/gateway-provider", () => ({
  useGatewayFetch: () => vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    asChild,
    children,
    ...props
  }: {
    asChild?: boolean;
    children: ReactNode;
  } & Record<string, unknown>) =>
    asChild ? <>{children}</> : <button {...props}>{children}</button>,
}));

vi.mock("@/hooks/use-task-tags", () => ({
  useTaskTags: () => ({
    taskTags: [
      {
        id: "task-tag-deployment-validation",
        key: "deployment_validation",
        label: "Deployment Validation",
        content: "Validate staging deploy, smoke tests, and rollback path.",
        order: 0,
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:00:00.000Z",
      },
    ],
    loading: false,
    error: null,
  }),
}));

const store = createStore(() => ({
  sessions: {
    byId: {
      "session-1": {
        sessionId: "session-1",
        title: "Live session transcript",
        agent: "codex",
        status: "active",
      },
    },
  },
  runs: {
    byId: {},
  },
  events: {
    byRunId: {},
  },
  actions: {
    mergeRun: vi.fn(),
    mergeSession: vi.fn(),
  },
}));

vi.mock("@/lib/agent-mux-ui", () => ({
  useGateway: () => ({ store }),
}));

describe("SessionDetailPage", () => {
  it("inserts Task Tag snippets into the follow-up prompt", async () => {
    const user = setupUser();
    render(<SessionDetailPage />);

    const prompt = screen.getByPlaceholderText("Continue the session...");
    await user.type(prompt, "@deploy");
    await user.click(screen.getByText("Deployment Validation"));

    expect(prompt).toHaveValue("Validate staging deploy, smoke tests, and rollback path.");
  });
});
