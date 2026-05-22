import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, setupUser, waitFor } from "@/test/test-utils";

import { WorkspaceProvisioningPage } from "../workspace-provisioning-page";

const push = vi.fn();
const backlogState = {
  projects: [
    {
      id: "kanban-app",
      key: "KANBAN",
      name: "Kanban App",
      integrations: [
        {
          provider: "github",
          label: "GitHub",
          accountLabel: "a5c-ai",
          guidance: "GitHub is ready.",
          prerequisites: [{ key: "github-auth", label: "Connected", satisfied: true }],
        },
      ],
    },
  ],
  issues: [
    {
      id: "KANBAN-GAP-007",
      projectId: "kanban-app",
      key: "KANBAN-GAP-007",
      title: "Add issue-scoped workspace provisioning",
    },
  ],
};

vi.mock("react-router-dom-v6", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom-v6")>("react-router-dom-v6");
  return {
    ...actual,
    useNavigate: () => push,
  };
});

vi.mock("@a5c-ai/compendium", () => ({
  Button: ({
    asChild,
    children,
    ...props
  }: {
    asChild?: boolean;
    children: ReactNode;
  } & Record<string, unknown>) => (asChild ? <>{children}</> : <button {...props}>{children}</button>),
  cx: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/hooks/use-backlog", () => ({
  useBacklog: () => ({
    snapshot: backlogState,
    loading: false,
    error: null,
  }),
}));

describe("WorkspaceProvisioningPage", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("provisions an issue-owned workspace and redirects into the workspace shell", async () => {
    const user = setupUser();
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          workspace: {
            workspacePath: "/repo/worktrees/kanban-gap-007",
            workspaceName: "KANBAN-GAP-007",
            branchName: "vk/kanban-gap-007",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    render(<WorkspaceProvisioningPage mode="issue" projectId="kanban-app" issueId="KANBAN-GAP-007" />);

    await user.click(screen.getByRole("button", { name: "Create workspace" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/workspaces",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            action: "provision",
            scope: "issue",
            projectId: "kanban-app",
            issueId: "KANBAN-GAP-007",
            hostProvider: "github",
            workspaceName: "KANBAN-GAP-007",
          }),
        }),
      );
    });
    expect(push).toHaveBeenCalledWith("/workspaces?workspace=%2Frepo%2Fworktrees%2Fkanban-gap-007");
  });
});
