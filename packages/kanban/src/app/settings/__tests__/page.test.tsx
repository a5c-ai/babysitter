import type React from "react";

import { render, screen } from "@/test/test-utils";

import SettingsPage from "../page";

vi.mock("@a5c-ai/compendium", () => ({
  LogoWordmark: () => <div data-testid="logo-wordmark" />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/agent-mux/gateway-provider", () => ({
  useGatewayAuth: () => ({
    auth: null,
    logout: vi.fn(),
    isAuthenticated: false,
  }),
}));

vi.mock("@/hooks/use-backlog", () => ({
  useBacklog: () => ({
    snapshot: {
      projects: [
        {
          id: "kanban-app",
          key: "KANBAN",
          name: "Kanban App",
          issueIds: [],
          labels: [],
          assignees: [],
          team: {
            id: "team-kanban",
            name: "Kanban Core",
            members: [
              { id: "tal", displayName: "Tal Muskal", email: "tal@a5c.ai", role: "owner" },
              { id: "qa", displayName: "QA Lead", email: "qa@a5c.ai", role: "maintainer" },
            ],
            settings: {
              visibility: "team",
              defaultRole: "contributor",
              allowSelfAssign: true,
            },
          },
          settings: {
            reviewRequiredForDone: true,
            activityScope: "all-board-entities",
            workspaceProvisioning: "owners-maintainers",
          },
          permissions: [
            {
              action: "manage-project-settings",
              roles: ["owner", "maintainer"],
              description: "Elevated roles only.",
            },
          ],
          activity: [
            {
              id: "activity-1",
              entityType: "project",
              entityId: "kanban-app",
              action: "updated-project-collaboration",
              summary: "Updated shared team settings, roster, and permission policy.",
              actor: { kind: "human", id: "tal", displayName: "Tal Muskal", role: "owner" },
              createdAt: "2026-04-24T14:00:00.000Z",
            },
          ],
          statuses: [],
          repositories: [],
          metrics: {
            totalIssues: 0,
            readyIssues: 0,
            blockedIssues: 0,
            dispatchedIssues: 0,
            completedIssues: 0,
            needsDecompositionIssues: 0,
            inProgressIssues: 0,
          },
        },
      ],
    },
  }),
}));

vi.mock("@/lib/agent-mux-ui", () => ({
  useConnection: () => ({ status: "disconnected", error: null }),
  useGateway: () => ({ store: { getState: () => ({ agents: { items: [] }, sessions: { byId: {} }, runs: { byId: {} } }) } }),
}));

describe("SettingsPage", () => {
  it("renders collaboration and permission summaries from the backlog model", () => {
    render(<SettingsPage />);

    expect(screen.getByTestId("collaboration-settings")).toBeInTheDocument();
    expect(screen.getByText("Team and collaboration")).toBeInTheDocument();
    expect(screen.getByText("Kanban Core (2 members)")).toBeInTheDocument();
    expect(screen.getByText("manage-project-settings")).toBeInTheDocument();
    expect(screen.getByText("Updated shared team settings, roster, and permission policy.")).toBeInTheDocument();
  });
});
