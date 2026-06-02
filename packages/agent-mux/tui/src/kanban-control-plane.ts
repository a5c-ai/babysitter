import type {
  KanbanBacklogOverview,
  KanbanIssueCreateInput,
  KanbanIssueCreateResult,
  KanbanIssueMoveInput,
  KanbanIssueUpdateInput,
  KanbanIssueWorkspaceCreateResult,
  KanbanWorkspaceActionInput,
  KanbanWorkspaceActionResponse,
  KanbanWorkspaceInventory,
  KanbanWorkspaceInventoryQuery,
} from '@a5c-ai/agent-mux-comm/kanban';

type EmptyToolArgs = Record<string, never>;

export interface KanbanControlPlaneToolArgsByName {
  readonly kanban_overview: EmptyToolArgs;
  readonly kanban_issue_create: KanbanIssueCreateInput;
  readonly kanban_issue_move: KanbanIssueMoveInput;
  readonly kanban_issue_update: KanbanIssueUpdateInput;
  readonly kanban_issue_workspace_create: {
    readonly issueId: string;
  };
  readonly kanban_issue_workspace_link: {
    readonly issueId: string;
    readonly workspacePath: string;
  };
  readonly kanban_workspaces_list: KanbanWorkspaceInventoryQuery;
  readonly kanban_workspace_action: KanbanWorkspaceActionInput;
}

export interface KanbanControlPlaneToolResultByName {
  readonly kanban_overview: KanbanBacklogOverview;
  readonly kanban_issue_create: KanbanIssueCreateResult;
  readonly kanban_issue_move: KanbanBacklogOverview;
  readonly kanban_issue_update: KanbanBacklogOverview;
  readonly kanban_issue_workspace_create: KanbanIssueWorkspaceCreateResult;
  readonly kanban_issue_workspace_link: KanbanBacklogOverview;
  readonly kanban_workspaces_list: KanbanWorkspaceInventory;
  readonly kanban_workspace_action: KanbanWorkspaceActionResponse;
}

export type KanbanControlPlaneToolName = keyof KanbanControlPlaneToolArgsByName;

export type KanbanControlPlaneToolInvoker = <TName extends KanbanControlPlaneToolName>(
  name: TName,
  args: KanbanControlPlaneToolArgsByName[TName],
) => Promise<KanbanControlPlaneToolResultByName[TName]>;

export interface KanbanControlPlane {
  loadOverview(): Promise<KanbanBacklogOverview>;
  createIssue(input: KanbanIssueCreateInput): Promise<KanbanIssueCreateResult>;
  moveIssue(input: KanbanIssueMoveInput): Promise<KanbanBacklogOverview>;
  updateIssue(input: KanbanIssueUpdateInput): Promise<KanbanBacklogOverview>;
  createIssueWorkspace(issueId: string): Promise<KanbanIssueWorkspaceCreateResult>;
  linkIssueWorkspace(input: {
    readonly issueId: string;
    readonly workspacePath: string;
  }): Promise<KanbanBacklogOverview>;
  listWorkspaces(query?: KanbanWorkspaceInventoryQuery): Promise<KanbanWorkspaceInventory>;
  applyWorkspaceAction(input: KanbanWorkspaceActionInput): Promise<KanbanWorkspaceActionResponse>;
}

const EMPTY_TOOL_ARGS: EmptyToolArgs = {};

export function createKanbanControlPlane(
  invokeTool: KanbanControlPlaneToolInvoker,
): KanbanControlPlane {
  return {
    loadOverview() {
      return invokeTool('kanban_overview', EMPTY_TOOL_ARGS);
    },
    createIssue(input) {
      return invokeTool('kanban_issue_create', input);
    },
    moveIssue(input) {
      return invokeTool('kanban_issue_move', input);
    },
    updateIssue(input) {
      return invokeTool('kanban_issue_update', input);
    },
    createIssueWorkspace(issueId) {
      return invokeTool('kanban_issue_workspace_create', { issueId });
    },
    linkIssueWorkspace(input) {
      return invokeTool('kanban_issue_workspace_link', input);
    },
    listWorkspaces(query = EMPTY_TOOL_ARGS) {
      return invokeTool('kanban_workspaces_list', query);
    },
    applyWorkspaceAction(input) {
      return invokeTool('kanban_workspace_action', input);
    },
  };
}
