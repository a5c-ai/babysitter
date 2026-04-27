import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";

import { registerWorkspaceTools } from "@/mcp/tools/workspaces";

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

function getToolHandler(server: McpServer, name: string): ToolHandler {
  const tools = (
    server as unknown as {
      _registeredTools: Record<string, { handler: ToolHandler }>;
    }
  )._registeredTools;
  const tool = tools[name];
  if (!tool) {
    throw new Error(`Tool ${name} not found`);
  }
  return tool.handler;
}

function parseResult(result: { content: Array<{ text: string }> }): Record<string, unknown> {
  return JSON.parse(result.content[0]!.text) as Record<string, unknown>;
}

describe("kanban workspace MCP tools", () => {
  it("lists workspaces with linked issue projections", async () => {
    const server = new McpServer({ name: "kanban-workspace-test", version: "0.0.0" });
    registerWorkspaceTools(server, {
      backlogService: {
        getOverview: async () => ({
          snapshot: {
            generatedAt: "2026-04-26T00:00:00.000Z",
            projects: [],
              issues: [
                {
                  id: "KANBAN-001",
                  key: "KANBAN-001",
                  title: "Wire the workspace list",
                  projectId: "kanban-app",
                status: "ready",
                priority: "high",
                labels: [],
                assignees: [],
                collaborators: [],
                dependencies: [],
                acceptanceCriteria: [],
                decomposition: [],
                childIssueIds: [],
                createdAt: "2026-04-26T00:00:00.000Z",
                updatedAt: "2026-04-26T00:00:00.000Z",
                dispatch: {
                  readiness: "ready",
                  blockedReasons: [],
                  runIds: [],
                  sessionIds: [],
                  contextLabels: [],
                  contextLabelProjections: [],
                },
                activity: [],
                workspaceLinks: [
                  {
                    workspacePath: "/repo/worktrees/shared",
                    workspaceName: "shared",
                    linkedAt: "2026-04-26T00:00:00.000Z",
                    source: "linked-existing-workspace",
                  },
                ],
              },
            ],
            taskTags: [],
            dispatchContextLabels: [],
          },
          board: {
            generatedAt: "2026-04-26T00:00:00.000Z",
            projects: [],
          },
          summary: {
            projectCount: 0,
            issueCount: 1,
            readyCount: 1,
            blockedCount: 0,
            dispatchedCount: 0,
            completedCount: 0,
            needsDecompositionCount: 0,
            inProgressCount: 0,
          },
        }),
      },
      workspaceService: {
        listWorkspaces: async ({ linkedIssuesByWorkspacePath }) => ({
          workspaces: [
            {
              path: "/repo/worktrees/shared",
              name: "shared",
              status: "idle",
              missing: false,
              archivedAt: null,
              cleanedAt: null,
              lastActivityAt: null,
              git: {
                root: "/repo",
                commonDir: "/repo/.git",
                trackingBranch: "origin/main",
                branch: "vk/shared",
                head: "abc123",
                ahead: 0,
                behind: 0,
                dirty: false,
                uncommittedCount: 0,
                isWorktree: true,
                isPrimary: false,
              },
              notes: { value: "", updatedAt: null },
              links: { editorHref: "vscode://file/repo/worktrees/shared" },
              sessions: { total: 0, active: 0, items: [] },
              runs: { total: 0, active: 0, items: [] },
              actions: {
                canArchive: true,
                canCleanup: false,
                canRecover: false,
                canRebaseStart: false,
                canRebaseAutoResolve: false,
                canRebaseOpenInEditor: false,
                canRebaseMarkResolved: false,
                canRebaseAbort: false,
              },
              issues: [...(linkedIssuesByWorkspacePath?.get("/repo/worktrees/shared") ?? [])],
            },
          ],
          summary: {
            total: 1,
            active: 0,
            idle: 1,
            archived: 0,
            missing: 0,
          },
        }),
        applyAction: vi.fn(),
      },
    });

    const handler = getToolHandler(server, "kanban_workspaces_list");
    const result = await handler({});
    const data = parseResult(result);
    const workspaces = data.workspaces as Array<{ issues?: Array<{ issueKey: string }> }>;

    expect(result.isError).toBeUndefined();
    expect(workspaces[0]?.issues?.[0]?.issueKey).toBe("KANBAN-001");
    expect((workspaces[0]?.issues?.[0] as { projectKey?: string } | undefined)?.projectKey).toBe("kanban-app");
  });

  it("applies an action and returns the refreshed inventory", async () => {
    const applyAction = vi.fn().mockResolvedValue({
      ok: true,
      workspacePath: "/repo/worktrees/shared",
      action: "notes-save",
      message: "Saved workspace notes for /repo/worktrees/shared.",
    });
    const server = new McpServer({ name: "kanban-workspace-action-test", version: "0.0.0" });
    registerWorkspaceTools(server, {
      backlogService: {
        getOverview: async () => ({
          snapshot: {
            generatedAt: "2026-04-26T00:00:00.000Z",
            projects: [],
            issues: [],
            taskTags: [],
            dispatchContextLabels: [],
          },
          board: {
            generatedAt: "2026-04-26T00:00:00.000Z",
            projects: [],
          },
          summary: {
            projectCount: 0,
            issueCount: 0,
            readyCount: 0,
            blockedCount: 0,
            dispatchedCount: 0,
            completedCount: 0,
            needsDecompositionCount: 0,
            inProgressCount: 0,
          },
        }),
      },
      workspaceService: {
        applyAction,
        listWorkspaces: async () => ({
          workspaces: [],
          summary: {
            total: 0,
            active: 0,
            idle: 0,
            archived: 0,
            missing: 0,
          },
        }),
      },
    });

    const handler = getToolHandler(server, "kanban_workspace_action");
    const result = await handler({
      action: "notes-save",
      workspacePath: "/repo/worktrees/shared",
      note: "keep this workspace warm",
    });
    const data = parseResult(result);

    expect(result.isError).toBeUndefined();
    expect(applyAction).toHaveBeenCalledWith({
      action: "notes-save",
      workspacePath: "/repo/worktrees/shared",
      note: "keep this workspace warm",
      sessions: undefined,
    });
    expect((data.result as { ok: boolean }).ok).toBe(true);
    expect((data.inventory as { summary: { total: number } }).summary.total).toBe(0);
  });
});
