import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentWorkspaceController, AGENT_WORKSPACE_CONTROLLER_BOUNDARY, createResource } from '../src/index.js';

function makeWorkspace(name, opts = {}) {
  const ws = createResource('KrateWorkspace', { name, namespace: opts.namespace || 'default' }, {
    organizationRef: opts.organizationRef || 'default',
    repository: opts.repository || 'https://github.com/acme/app.git',
    volumeSpec: opts.volumeSpec || { storageClassName: 'standard', capacity: '10Gi', accessModes: ['ReadWriteOnce'] },
    branch: opts.branch || 'main',
    pvcName: opts.pvcName || `krate-ws-${name}`,
  });
  ws.status = {
    phase: opts.phase || 'Ready',
    volumeStatus: opts.volumeStatus || 'Bound',
    createdAt: new Date().toISOString(),
    ...(opts.status || {}),
  };
  return ws;
}

// --- createWorkspace ---

test('createWorkspace generates valid PVC manifest with correct labels and capacity', () => {
  const ctrl = createAgentWorkspaceController();
  const result = ctrl.createWorkspace({
    name: 'my-ws',
    organizationRef: 'acme',
    repository: 'https://github.com/acme/app.git',
    volumeSpec: { capacity: '20Gi' },
  });

  assert.equal(result.error, false);
  assert.ok(result.workspace);
  assert.ok(result.pvcManifest);
  assert.equal(result.pvcManifest.kind, 'PersistentVolumeClaim');
  assert.equal(result.pvcManifest.metadata.name, 'krate-ws-my-ws');
  assert.equal(result.pvcManifest.metadata.labels['krate.a5c.ai/workspace'], 'my-ws');
  assert.equal(result.pvcManifest.metadata.labels['krate.a5c.ai/org'], 'acme');
  assert.equal(result.pvcManifest.spec.resources.requests.storage, '20Gi');
});

test('createWorkspace uses custom storageClassName when provided', () => {
  const ctrl = createAgentWorkspaceController();
  const result = ctrl.createWorkspace({
    name: 'custom-sc',
    organizationRef: 'acme',
    repository: 'https://github.com/acme/app.git',
    volumeSpec: { storageClassName: 'fast-ssd' },
  });

  assert.equal(result.error, false);
  assert.equal(result.pvcManifest.spec.storageClassName, 'fast-ssd');
  assert.equal(result.workspace.spec.volumeSpec.storageClassName, 'fast-ssd');
});

test('createWorkspace defaults to 10Gi capacity', () => {
  const ctrl = createAgentWorkspaceController();
  const result = ctrl.createWorkspace({
    name: 'default-cap',
    organizationRef: 'acme',
    repository: 'https://github.com/acme/app.git',
  });

  assert.equal(result.error, false);
  assert.equal(result.pvcManifest.spec.resources.requests.storage, '10Gi');
  assert.equal(result.workspace.spec.volumeSpec.capacity, '10Gi');
});

test('createWorkspace validates required fields (org, repository)', () => {
  const ctrl = createAgentWorkspaceController();

  const noOrg = ctrl.createWorkspace({ name: 'x', repository: 'repo' });
  assert.equal(noOrg.error, true);
  assert.equal(noOrg.reason, 'missing-org');

  const noRepo = ctrl.createWorkspace({ name: 'x', organizationRef: 'acme' });
  assert.equal(noRepo.error, true);
  assert.equal(noRepo.reason, 'missing-repository');
});

test('createWorkspace rejects null resource (missing both org and repo)', () => {
  const ctrl = createAgentWorkspaceController();
  const result = ctrl.createWorkspace({});
  assert.equal(result.error, true);
});

// --- deleteWorkspace ---

test('deleteWorkspace generates PVC delete manifest', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('del-ws', { phase: 'Ready' });

  const result = ctrl.deleteWorkspace({ name: 'del-ws', resources: { KrateWorkspace: [ws] } });

  assert.equal(result.error, false);
  assert.equal(result.workspace.status.phase, 'Terminating');
  assert.ok(result.pvcDeleteManifest);
  assert.equal(result.pvcDeleteManifest.metadata.name, 'krate-ws-del-ws');
  assert.equal(result.pvcDeleteManifest.action, 'delete');
});

// --- getWorkspaceStatus ---

test('getWorkspaceStatus returns Pending for new workspace', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('new-ws', { phase: 'Pending', volumeStatus: 'Pending' });

  const result = ctrl.getWorkspaceStatus({ name: 'new-ws', resources: { KrateWorkspace: [ws] } });

  assert.equal(result.error, false);
  assert.equal(result.volumeStatus, 'Pending');
  assert.equal(result.phase, 'Pending');
});

// --- initializeWorkspace ---

test('initializeWorkspace returns git clone command for https repo', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('https-ws', { repository: 'https://github.com/acme/app.git' });

  const result = ctrl.initializeWorkspace({ workspace: ws });

  assert.equal(result.error, false);
  assert.equal(result.commandSpec.command, 'git');
  assert.deepEqual(result.commandSpec.args, ['clone', 'https://github.com/acme/app.git', '/workspace']);
  assert.equal(Object.keys(result.commandSpec.env).length, 0, 'No special env for https');
});

test('initializeWorkspace returns git clone command for ssh repo', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('ssh-ws', { repository: 'git@github.com:acme/app.git' });

  const result = ctrl.initializeWorkspace({ workspace: ws });

  assert.equal(result.error, false);
  assert.equal(result.commandSpec.command, 'git');
  assert.deepEqual(result.commandSpec.args, ['clone', 'git@github.com:acme/app.git', '/workspace']);
  assert.ok(result.commandSpec.env.GIT_SSH_COMMAND, 'Should set GIT_SSH_COMMAND for SSH repos');
});

// --- checkoutBranch ---

test('checkoutBranch returns git checkout command', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('co-ws');

  const result = ctrl.checkoutBranch({ workspace: ws, branch: 'feature-42' });

  assert.equal(result.error, false);
  assert.equal(result.commandSpec.command, 'git');
  assert.deepEqual(result.commandSpec.args, ['checkout', 'feature-42']);
  assert.equal(result.commandSpec.cwd, '/workspace');
});

// --- syncWorkspace ---

test('syncWorkspace returns git fetch + reset commands', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('sync-ws', { branch: 'develop' });

  const result = ctrl.syncWorkspace({ workspace: ws });

  assert.equal(result.error, false);
  assert.equal(result.commandSpecs.length, 2);
  assert.deepEqual(result.commandSpecs[0].args, ['fetch', 'origin']);
  assert.deepEqual(result.commandSpecs[1].args, ['reset', '--hard', 'origin/develop']);
});

// --- getMountSpec ---

test('getMountSpec returns valid K8s volume and volumeMount', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('mount-ws', { pvcName: 'krate-ws-mount-ws' });

  const result = ctrl.getMountSpec({ workspace: ws });

  assert.equal(result.error, false);
  assert.ok(result.volume);
  assert.ok(result.volumeMount);
  assert.equal(result.volume.name, 'workspace');
  assert.equal(result.volumeMount.name, 'workspace');
  assert.equal(result.volumeMount.mountPath, '/workspace');
});

test('getMountSpec uses correct PVC claim name', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('pvc-test', { pvcName: 'krate-ws-pvc-test' });

  const result = ctrl.getMountSpec({ workspace: ws });

  assert.equal(result.error, false);
  assert.equal(result.volume.persistentVolumeClaim.claimName, 'krate-ws-pvc-test');
});

// --- findReusableWorkspace ---

test('findReusableWorkspace returns matching Ready workspace', () => {
  const ctrl = createAgentWorkspaceController();
  const ws1 = makeWorkspace('reuse-ws', {
    organizationRef: 'acme',
    repository: 'https://github.com/acme/app.git',
    branch: 'main',
    phase: 'Ready',
  });
  const ws2 = makeWorkspace('other-ws', {
    organizationRef: 'acme',
    repository: 'https://github.com/acme/other.git',
    branch: 'main',
    phase: 'Ready',
  });

  const result = ctrl.findReusableWorkspace({
    organizationRef: 'acme',
    repository: 'https://github.com/acme/app.git',
    branch: 'main',
    resources: { KrateWorkspace: [ws1, ws2] },
  });

  assert.ok(result);
  assert.equal(result.metadata.name, 'reuse-ws');
});

test('findReusableWorkspace returns null when no match', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('busy-ws', {
    organizationRef: 'acme',
    repository: 'https://github.com/acme/app.git',
    branch: 'main',
    phase: 'InUse',
  });

  const result = ctrl.findReusableWorkspace({
    organizationRef: 'acme',
    repository: 'https://github.com/acme/app.git',
    branch: 'main',
    resources: { KrateWorkspace: [ws] },
  });

  assert.equal(result, null);
});

// --- claimWorkspace ---

test('claimWorkspace transitions to InUse with runRef', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('claim-ws', { phase: 'Ready' });

  const result = ctrl.claimWorkspace({
    name: 'claim-ws',
    runRef: 'run-123',
    resources: { KrateWorkspace: [ws] },
  });

  assert.equal(result.error, false);
  assert.equal(result.workspace.status.phase, 'InUse');
  assert.equal(result.workspace.status.runRef, 'run-123');
  assert.ok(result.workspace.status.claimedAt);
});

test('claimWorkspace rejects already-InUse workspace', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('busy-ws', { phase: 'InUse', status: { runRef: 'run-existing' } });

  const result = ctrl.claimWorkspace({
    name: 'busy-ws',
    runRef: 'run-new',
    resources: { KrateWorkspace: [ws] },
  });

  assert.equal(result.error, true);
  assert.equal(result.reason, 'already-in-use');
});

// --- releaseWorkspace ---

test('releaseWorkspace transitions to Ready', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('release-ws', { phase: 'InUse', status: { runRef: 'run-done' } });

  const result = ctrl.releaseWorkspace({
    name: 'release-ws',
    resources: { KrateWorkspace: [ws] },
  });

  assert.equal(result.error, false);
  assert.equal(result.workspace.status.phase, 'Ready');
  assert.equal(result.workspace.status.runRef, undefined);
  assert.ok(result.workspace.status.releasedAt);
});

test('releaseWorkspace rejects non-InUse workspace', () => {
  const ctrl = createAgentWorkspaceController();
  const ws = makeWorkspace('ready-ws', { phase: 'Ready' });

  const result = ctrl.releaseWorkspace({
    name: 'ready-ws',
    resources: { KrateWorkspace: [ws] },
  });

  assert.equal(result.error, true);
  assert.equal(result.reason, 'not-in-use');
});

// --- BOUNDARY export ---

test('BOUNDARY exported', () => {
  assert.ok(AGENT_WORKSPACE_CONTROLLER_BOUNDARY);
  assert.equal(AGENT_WORKSPACE_CONTROLLER_BOUNDARY.role, 'agent-workspace-controller');
  assert.ok(AGENT_WORKSPACE_CONTROLLER_BOUNDARY.owns.includes('PVC manifest generation'));
  assert.ok(AGENT_WORKSPACE_CONTROLLER_BOUNDARY.owns.includes('workspace reuse'));
});
