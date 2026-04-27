import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { BacklogOverview } from "@/lib/services/backlog-query-service";
import { BacklogQueryService } from "@/lib/services/backlog-query-service";
import type {
  WorkspaceActionResult,
  WorkspaceInventoryResponse,
  WorkspaceIssueLink,
  WorkspaceLifecycleService,
  WorkspaceSessionSnapshot,
} from "@/lib/workspace-lifecycle";
import { WorkspaceLifecycleService as DefaultWorkspaceLifecycleService } from "@/lib/workspace-lifecycle";
import { toolError, toolResult } from "@/mcp/util/errors";

type BacklogServiceLike = Pick<BacklogQueryService, "getOverview">;
type WorkspaceServiceLike = Pick<WorkspaceLifecycleService, "listWorkspaces" | "applyAction">;

export interface KanbanWorkspaceToolDeps {
  backlogService?: BacklogServiceLike;
  workspaceService?: WorkspaceServiceLike;
}

const workspaceActionSchema = z.enum([
  "archive",
  "cleanup",
  "recover",
  "notes-save",
  "rebase-start",
  "rebase-auto-resolve",
  "rebase-open-in-editor",
  "rebase-mark-resolved",
  "rebase-abort",
]);

const workspaceSessionSchema = z.object({
  sessionId: z.string(),
  agent: z.string(),
  status: z.enum(["active", "inactive"]),
  cwd: z.string().optional(),
  title: z.string().optional(),
  updatedAt: z.number().optional(),
  activeRunId: z.string().nullable().optional(),
  latestRunId: z.string().nullable().optional(),
  runtime: z.any().optional(),
});

function defaultDeps(): Required<KanbanWorkspaceToolDeps> {
  return {
    backlogService: new BacklogQueryService(),
    workspaceService: new DefaultWorkspaceLifecycleService(),
  };
}

function buildLinkedIssuesByWorkspacePath(
  overview: BacklogOverview,
): ReadonlyMap<string, readonly WorkspaceIssueLink[]> {
  const map = new Map<string, WorkspaceIssueLink[]>();
  const projectById = new Map(overview.snapshot.projects.map((project) => [project.id, project] as const));

  for (const issue of overview.snapshot.issues) {
    const project = projectById.get(issue.projectId);
    for (const workspaceLink of issue.workspaceLinks ?? []) {
      const current = map.get(workspaceLink.workspacePath) ?? [];
      current.push({
        issueId: issue.id,
        issueKey: issue.key,
        issueTitle: issue.title,
        projectId: issue.projectId,
        projectKey: project?.key ?? issue.projectId,
        projectName: project?.name ?? issue.projectId,
        linkedAt: workspaceLink.linkedAt,
        source: workspaceLink.source,
      });
      map.set(workspaceLink.workspacePath, current);
    }
  }

  for (const [workspacePath, issues] of map.entries()) {
    issues.sort((left, right) => left.issueKey.localeCompare(right.issueKey));
    map.set(workspacePath, issues);
  }

  return map;
}

async function listInventory(
  backlogService: BacklogServiceLike,
  workspaceService: WorkspaceServiceLike,
  sessions?: WorkspaceSessionSnapshot[],
): Promise<WorkspaceInventoryResponse> {
  const overview = await backlogService.getOverview();
  return workspaceService.listWorkspaces({
    sessions,
    linkedIssuesByWorkspacePath: buildLinkedIssuesByWorkspacePath(overview),
  });
}

export function registerWorkspaceTools(server: McpServer, deps?: KanbanWorkspaceToolDeps): void {
  const resolved = { ...defaultDeps(), ...deps };

  server.tool(
    "kanban_workspaces_list",
    "List managed workspaces together with linked kanban issues and activity summary",
    {
      sessions: z.array(workspaceSessionSchema).optional().describe("Optional live session snapshots to fold into workspace activity"),
    },
    async (args: { sessions?: WorkspaceSessionSnapshot[] }) => {
      try {
        const inventory = await listInventory(
          resolved.backlogService,
          resolved.workspaceService,
          args.sessions,
        );
        return toolResult(inventory);
      } catch (error) {
        return toolError(error instanceof Error ? error.message : String(error));
      }
    },
  );

  server.tool(
    "kanban_workspace_action",
    "Apply a workspace lifecycle action and return the refreshed workspace inventory",
    {
      action: workspaceActionSchema.describe("Lifecycle action to apply to the workspace"),
      workspacePath: z.string().describe("Workspace path to mutate"),
      note: z.string().optional().describe("Workspace notes for notes-save"),
      sessions: z.array(workspaceSessionSchema).optional().describe("Optional live session snapshots to validate action eligibility"),
    },
    async (args: {
      action:
        | "archive"
        | "cleanup"
        | "recover"
        | "notes-save"
        | "rebase-start"
        | "rebase-auto-resolve"
        | "rebase-open-in-editor"
        | "rebase-mark-resolved"
        | "rebase-abort";
      workspacePath: string;
      note?: string;
      sessions?: WorkspaceSessionSnapshot[];
    }) => {
      try {
        const result: WorkspaceActionResult = await resolved.workspaceService.applyAction({
          action: args.action,
          workspacePath: args.workspacePath,
          note: args.note,
          sessions: args.sessions,
        });
        const inventory = await listInventory(
          resolved.backlogService,
          resolved.workspaceService,
          args.sessions,
        );
        return toolResult({ result, inventory });
      } catch (error) {
        return toolError(error instanceof Error ? error.message : String(error));
      }
    },
  );
}
