import { describe, expect, it, vi } from 'vitest';

import { createKanbanControlPlane } from '../src/kanban-control-plane.js';

describe('kanban control plane', () => {
  it('routes backlog and workspace operations through the typed tool invoker', async () => {
    const invokeTool = vi.fn(async (name: string, args: unknown) => ({ name, args }));
    const controlPlane = createKanbanControlPlane(invokeTool as never);

    await controlPlane.loadOverview();
    await controlPlane.createIssue({
      title: 'AMTUI-KW-1',
      priority: 'high',
    });
    await controlPlane.moveIssue({
      issueId: 'issue-1',
      toState: 'review',
    });
    await controlPlane.updateIssue({
      issueId: 'issue-1',
      description: 'Update detail',
    });
    await controlPlane.createIssueWorkspace('issue-1');
    await controlPlane.linkIssueWorkspace({
      issueId: 'issue-1',
      workspacePath: '/tmp/workspace',
    });
    await controlPlane.listWorkspaces();
    await controlPlane.applyWorkspaceAction({
      action: 'archive',
      workspacePath: '/tmp/workspace',
    });

    expect(invokeTool.mock.calls).toEqual([
      ['kanban_overview', {}],
      ['kanban_issue_create', { title: 'AMTUI-KW-1', priority: 'high' }],
      ['kanban_issue_move', { issueId: 'issue-1', toState: 'review' }],
      ['kanban_issue_update', { issueId: 'issue-1', description: 'Update detail' }],
      ['kanban_issue_workspace_create', { issueId: 'issue-1' }],
      ['kanban_issue_workspace_link', { issueId: 'issue-1', workspacePath: '/tmp/workspace' }],
      ['kanban_workspaces_list', {}],
      ['kanban_workspace_action', { action: 'archive', workspacePath: '/tmp/workspace' }],
    ]);
  });
});
