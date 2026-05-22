import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentWorkspaceController, createResource } from '../src/index.js';

function makeWorkspace(name, repository, runRef, phase = 'InUse', extra = {}) {
  const workspace = createResource('KrateWorkspace', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    repository,
    volumeSpec: extra.volumeSpec || { storageClassName: 'standard', capacity: '10Gi', accessModes: ['ReadWriteOnce'] },
    branch: extra.branch || 'main',
    pvcName: extra.pvcName || `krate-ws-${name}`,
  });
  workspace.status = { phase, createdAt: new Date().toISOString(), runRef: runRef || undefined, volumeStatus: 'Bound', ...extra.status };
  return workspace;
}

function makeRuntime(name, workspaceRef, status = 'provisioning') {
  const runtime = createResource('KrateWorkspaceRuntime', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    workspaceRef,
    status
  });
  runtime.status = { phase: 'Provisioning', createdAt: new Date().toISOString() };
  return runtime;
}

test('provisionWorkspace creates KrateWorkspace + KrateWorkspaceRuntime', () => {
  const controller = createAgentWorkspaceController();
  const result = controller.provisionWorkspace({
    repository: 'my-repo',
    ref: 'abc123',
    branch: 'feature-1',
    dispatchRun: 'run-1',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.ok(result.workspace, 'Should return a workspace resource');
  assert.equal(result.workspace.kind, 'KrateWorkspace');
  assert.equal(result.workspace.spec.repository, 'my-repo');
  assert.equal(result.workspace.status.runRef, 'run-1');
  assert.equal(result.workspace.status.phase, 'InUse');
  assert.ok(result.pvcManifest, 'Should return a PVC manifest');

  assert.ok(result.runtime, 'Should return a runtime resource');
  assert.equal(result.runtime.kind, 'KrateWorkspaceRuntime');
  assert.equal(result.runtime.spec.workspaceRef, result.workspace.metadata.name);
  assert.equal(result.runtime.spec.status, 'provisioning');
  assert.equal(result.runtime.status.phase, 'Provisioning');
});

test('archiveWorkspace sets phase=Archived', () => {
  const controller = createAgentWorkspaceController();
  const existing = makeWorkspace('ws-1', 'my-repo', 'run-1', 'InUse');
  const result = controller.archiveWorkspace({
    workspaceName: 'ws-1',
    reason: 'Run completed',
    resources: { KrateWorkspace: [existing] }
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.workspace.status.phase, 'Archived');
  assert.ok(result.workspace.status.archivedAt, 'Should have archivedAt timestamp');
  assert.equal(result.workspace.status.archiveReason, 'Run completed');
});

test('recoverWorkspace sets phase=Active', () => {
  const controller = createAgentWorkspaceController();
  const archived = makeWorkspace('ws-2', 'my-repo', 'run-1', 'Archived', {
    status: { archivedAt: new Date().toISOString(), archiveReason: 'Cleanup' }
  });
  const result = controller.recoverWorkspace({
    workspaceName: 'ws-2',
    resources: { KrateWorkspace: [archived] }
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.workspace.status.phase, 'Active');
  assert.equal(result.workspace.status.archivedAt, undefined, 'archivedAt should be cleared');
  assert.equal(result.workspace.status.archiveReason, undefined, 'archiveReason should be cleared');
});

test('bindSession adds session to boundSessions', () => {
  const controller = createAgentWorkspaceController();
  const existing = makeWorkspace('ws-3', 'my-repo', 'run-2', 'InUse');
  const result = controller.bindSession({
    workspaceName: 'ws-3',
    sessionRef: 'session-1',
    agent: 'code-agent',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources: { KrateWorkspace: [existing] }
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.ok(result.workspace, 'Should return updated workspace');
  assert.equal(result.workspace.status.boundSessions.length, 1, 'Should have one bound session');
  assert.equal(result.workspace.status.boundSessions[0].sessionRef, 'session-1');
  assert.equal(result.workspace.status.boundSessions[0].agent, 'code-agent');
  assert.ok(result.workspace.status.boundSessions[0].boundAt, 'Should have boundAt timestamp');
});

test('linkWorkItem creates WorkItemWorkspaceLink', () => {
  const controller = createAgentWorkspaceController();
  const result = controller.linkWorkItem({
    workspaceName: 'ws-4',
    workItemRef: 'issue-42',
    workItemKind: 'Issue',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.ok(result.link, 'Should return a link resource');
  assert.equal(result.link.kind, 'WorkItemWorkspaceLink');
  assert.equal(result.link.spec.workItemRef, 'issue-42');
  assert.equal(result.link.spec.workItemKind, 'Issue');
  assert.equal(result.link.spec.workspace, 'ws-4');
  assert.equal(result.link.spec.organizationRef, 'default');
});

test('linkWorkItemToSession creates WorkItemSessionLink', () => {
  const controller = createAgentWorkspaceController();
  const result = controller.linkWorkItemToSession({
    workItemRef: 'pr-10',
    workItemKind: 'PullRequest',
    sessionRef: 'session-5',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.ok(result.link, 'Should return a link resource');
  assert.equal(result.link.kind, 'WorkItemSessionLink');
  assert.equal(result.link.spec.workItemRef, 'pr-10');
  assert.equal(result.link.spec.workItemKind, 'PullRequest');
  assert.equal(result.link.spec.agentSession, 'session-5');
  assert.equal(result.link.spec.organizationRef, 'default');
});

test('listWorkspacesForRepo filters by repository', () => {
  const controller = createAgentWorkspaceController();
  const ws1 = makeWorkspace('ws-a', 'repo-alpha', 'run-a');
  const ws2 = makeWorkspace('ws-b', 'repo-beta', 'run-b');
  const ws3 = makeWorkspace('ws-c', 'repo-alpha', 'run-c');

  const result = controller.listWorkspacesForRepo({
    repository: 'repo-alpha',
    resources: { KrateWorkspace: [ws1, ws2, ws3] }
  });

  assert.equal(result.length, 2, 'Should return workspaces for repo-alpha only');
  assert.ok(result.every((w) => w.spec.repository === 'repo-alpha'), 'All should belong to repo-alpha');
});

test('archiveWorkspace on nonexistent returns error', () => {
  const controller = createAgentWorkspaceController();
  const result = controller.archiveWorkspace({
    workspaceName: 'ws-nonexistent',
    reason: 'Cleanup',
    resources: { KrateWorkspace: [] }
  });

  assert.equal(result.error, true, 'Should fail');
  assert.equal(result.reason, 'not-found');
  assert.ok(result.message.includes('ws-nonexistent'), 'Message should mention the workspace name');
});

test('recoverWorkspace on non-archived returns error', () => {
  const controller = createAgentWorkspaceController();
  const active = makeWorkspace('ws-active', 'my-repo', 'run-x', 'InUse');
  const result = controller.recoverWorkspace({
    workspaceName: 'ws-active',
    resources: { KrateWorkspace: [active] }
  });

  assert.equal(result.error, true, 'Should fail');
  assert.equal(result.reason, 'not-archived');
  assert.ok(result.message.includes('not archived'), 'Message should indicate not archived');
});
