import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentWorkspaceController, createResource } from '../src/index.js';

function makeWorkspace(name, repository, phase = 'Ready', extra = {}) {
  const workspace = createResource('KrateWorkspace', { name, namespace: 'krate-org-default' }, {
    organizationRef: extra.organizationRef || 'default',
    repository,
    volumeSpec: extra.volumeSpec || { storageClassName: 'standard', capacity: '10Gi', accessModes: ['ReadWriteOnce'] },
    branch: extra.branch || 'main',
    pvcName: extra.pvcName || `krate-ws-${name}`,
  });
  workspace.status = { phase, createdAt: new Date().toISOString(), volumeStatus: 'Bound', ...extra.status };
  if (extra.associations) {
    workspace.spec.associations = extra.associations;
  }
  return workspace;
}

function makeRun(name, workspaceRef, phase = 'Succeeded', extra = {}) {
  const run = createResource('AgentDispatchRun', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    repository: extra.repository || 'my-repo',
    sourceRefs: extra.sourceRefs || ['main'],
    agentStack: extra.agentStack || 'code-agent',
    taskKind: extra.taskKind || 'diagnostic',
    workspaceRef,
  });
  run.status = {
    phase,
    workspaceRef,
    createdAt: extra.createdAt || new Date().toISOString(),
    ...extra.status,
  };
  return run;
}

// --- launchCodespace ---

test('launchCodespace returns valid pod spec with PVC mount', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-dev', 'my-repo');
  const result = controller.launchCodespace(ws);

  assert.equal(result.error, false);
  assert.ok(result.podSpec, 'Should return podSpec');
  assert.equal(result.podSpec.kind, 'Pod');
  assert.equal(result.podSpec.metadata.name, 'codespace-ws-dev');

  // Verify PVC mount
  const volumes = result.podSpec.spec.volumes;
  assert.ok(volumes.some((v) => v.persistentVolumeClaim?.claimName === 'krate-ws-ws-dev'), 'PVC should be mounted');
  const container = result.podSpec.spec.containers[0];
  assert.ok(container.volumeMounts.some((m) => m.mountPath === '/workspace'), 'Should mount at /workspace');
});

test('launchCodespace uses custom image when provided', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-custom', 'my-repo');
  const result = controller.launchCodespace(ws, { image: 'gitpod/openvscode-server:latest' });

  assert.equal(result.error, false);
  assert.equal(result.podSpec.spec.containers[0].image, 'gitpod/openvscode-server:latest');
});

test('launchCodespace rejects if codespace already running', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-running', 'my-repo', 'Ready', {
    status: { codespace: { running: true } },
  });
  const result = controller.launchCodespace(ws);

  assert.equal(result.error, true);
  assert.equal(result.reason, 'codespace-already-running');
});

test('launchCodespace pod spec has correct resource limits', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-limits', 'my-repo');
  const result = controller.launchCodespace(ws, { cpu: '2', memory: '4Gi' });

  assert.equal(result.error, false);
  const container = result.podSpec.spec.containers[0];
  assert.equal(container.resources.limits.cpu, '2');
  assert.equal(container.resources.limits.memory, '4Gi');
});

test('launchCodespace pod spec has correct env vars', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-env', 'my-repo');
  const result = controller.launchCodespace(ws, { gitAuthorName: 'Test User' });

  assert.equal(result.error, false);
  const container = result.podSpec.spec.containers[0];
  const envMap = {};
  for (const e of container.env) envMap[e.name] = e.value || e.valueFrom;

  assert.equal(envMap.KRATE_WORKSPACE, 'ws-env');
  assert.equal(envMap.KRATE_ORG, 'default');
  assert.equal(envMap.GIT_AUTHOR_NAME, 'Test User');
  assert.ok(envMap.GIT_AUTHOR_EMAIL, 'Should have GIT_AUTHOR_EMAIL');
});

test('launchCodespace service spec exposes port 8080', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-svc', 'my-repo');
  const result = controller.launchCodespace(ws);

  assert.equal(result.error, false);
  assert.ok(result.serviceSpec, 'Should return serviceSpec');
  assert.equal(result.serviceSpec.kind, 'Service');
  const ports = result.serviceSpec.spec.ports;
  assert.ok(ports.some((p) => p.port === 8080), 'Service should expose port 8080');
});

test('launchCodespace returns codespace URL', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-url', 'my-repo');
  const result = controller.launchCodespace(ws);

  assert.equal(result.error, false);
  assert.ok(result.codespaceUrl, 'Should return codespaceUrl');
  assert.ok(result.codespaceUrl.includes('codespace-svc-ws-url'), 'URL should reference service name');
  assert.ok(result.codespaceUrl.includes('8080'), 'URL should include port');
});

test('launchCodespace includes password secret ref when provided', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-pw', 'my-repo');
  const secretRef = { name: 'my-secret', key: 'password' };
  const result = controller.launchCodespace(ws, { passwordSecretRef: secretRef });

  assert.equal(result.error, false);
  const container = result.podSpec.spec.containers[0];
  const pwEnv = container.env.find((e) => e.name === 'PASSWORD');
  assert.ok(pwEnv, 'Should have PASSWORD env');
  assert.deepEqual(pwEnv.valueFrom.secretKeyRef, secretRef);
});

test('launchCodespace returns error when workspace is null', () => {
  const controller = createAgentWorkspaceController();
  const result = controller.launchCodespace(null);

  assert.equal(result.error, true);
  assert.equal(result.reason, 'missing-workspace');
});

// --- stopCodespace ---

test('stopCodespace returns delete manifests for pod and service', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-stop', 'my-repo');
  const result = controller.stopCodespace(ws);

  assert.equal(result.error, false);
  assert.ok(result.podDeleteManifest, 'Should return pod delete manifest');
  assert.equal(result.podDeleteManifest.kind, 'Pod');
  assert.equal(result.podDeleteManifest.metadata.name, 'codespace-ws-stop');
  assert.equal(result.podDeleteManifest.action, 'delete');

  assert.ok(result.serviceDeleteManifest, 'Should return service delete manifest');
  assert.equal(result.serviceDeleteManifest.kind, 'Service');
  assert.equal(result.serviceDeleteManifest.metadata.name, 'codespace-svc-ws-stop');
  assert.equal(result.serviceDeleteManifest.action, 'delete');
});

// --- getCodespaceStatus ---

test('getCodespaceStatus returns running state when pod is Running', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-status', 'my-repo');
  const result = controller.getCodespaceStatus(ws, { phase: 'Running', startTime: '2026-05-13T10:00:00Z', connectedUsers: 2 });

  assert.equal(result.error, false);
  assert.equal(result.running, true);
  assert.ok(result.url, 'Should have URL when running');
  assert.equal(result.port, 8080);
  assert.equal(result.connectedUsers, 2);
  assert.equal(result.startTime, '2026-05-13T10:00:00Z');
});

test('getCodespaceStatus returns not running when no pod status', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-status-off', 'my-repo');
  const result = controller.getCodespaceStatus(ws);

  assert.equal(result.error, false);
  assert.equal(result.running, false);
  assert.equal(result.url, null);
  assert.equal(result.phase, 'Unknown');
});

// --- addAssociation ---

test('addAssociation adds to associations array', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-assoc', 'my-repo');
  const result = controller.addAssociation(ws, { kind: 'User', name: 'alice' });

  assert.equal(result.error, false);
  assert.equal(result.workspace.spec.associations.length, 1);
  assert.equal(result.workspace.spec.associations[0].kind, 'User');
  assert.equal(result.workspace.spec.associations[0].name, 'alice');
  assert.ok(result.workspace.spec.associations[0].addedAt, 'Should have addedAt timestamp');
});

test('addAssociation rejects duplicate', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-dup', 'my-repo', 'Ready', {
    associations: [{ kind: 'User', name: 'alice', addedAt: new Date().toISOString() }],
  });
  const result = controller.addAssociation(ws, { kind: 'User', name: 'alice' });

  assert.equal(result.error, true);
  assert.equal(result.reason, 'duplicate-association');
});

test('addAssociation rejects invalid kind', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-bad-kind', 'my-repo');
  const result = controller.addAssociation(ws, { kind: 'InvalidKind', name: 'foo' });

  assert.equal(result.error, true);
  assert.equal(result.reason, 'invalid-ref-kind');
});

// --- removeAssociation ---

test('removeAssociation removes from array', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-rm', 'my-repo', 'Ready', {
    associations: [
      { kind: 'User', name: 'alice', addedAt: new Date().toISOString() },
      { kind: 'AgentSession', name: 'sess-1', addedAt: new Date().toISOString() },
    ],
  });
  const result = controller.removeAssociation(ws, { kind: 'User', name: 'alice' });

  assert.equal(result.error, false);
  assert.equal(result.workspace.spec.associations.length, 1);
  assert.equal(result.workspace.spec.associations[0].kind, 'AgentSession');
});

test('removeAssociation returns error if not found', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-rm-nf', 'my-repo');
  const result = controller.removeAssociation(ws, { kind: 'User', name: 'nobody' });

  assert.equal(result.error, true);
  assert.equal(result.reason, 'not-found');
});

// --- listAssociations ---

test('listAssociations returns all with kind/name', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-list', 'my-repo', 'Ready', {
    associations: [
      { kind: 'User', name: 'alice', addedAt: '2026-01-01T00:00:00Z' },
      { kind: 'AgentDispatchRun', name: 'run-1', addedAt: '2026-01-02T00:00:00Z' },
      { kind: 'AgentSession', name: 'sess-1', addedAt: '2026-01-03T00:00:00Z' },
    ],
  });
  const result = controller.listAssociations(ws);

  assert.equal(result.error, false);
  assert.equal(result.associations.length, 3);
  assert.equal(result.associations[0].kind, 'User');
  assert.equal(result.associations[1].kind, 'AgentDispatchRun');
  assert.equal(result.associations[2].kind, 'AgentSession');
});

// --- getWorkspaceRuns ---

test('getWorkspaceRuns filters active vs history', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-runs', 'my-repo');

  const activeRun = makeRun('run-active', 'ws-runs', 'Running');
  const doneRun = makeRun('run-done', 'ws-runs', 'Succeeded');
  const failedRun = makeRun('run-failed', 'ws-runs', 'Failed');
  const unrelatedRun = makeRun('run-other', 'ws-other', 'Running');

  const result = controller.getWorkspaceRuns(ws, [activeRun, doneRun, failedRun, unrelatedRun]);

  assert.equal(result.error, false);
  assert.equal(result.active.length, 1, 'Should have one active run');
  assert.equal(result.active[0].metadata.name, 'run-active');
  assert.equal(result.history.length, 2, 'Should have two history runs');
});

test('getWorkspaceRuns finds runs by association', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-assoc-runs', 'my-repo', 'Ready', {
    associations: [{ kind: 'AgentDispatchRun', name: 'run-linked', addedAt: new Date().toISOString() }],
  });

  // This run has no workspaceRef but is linked via association
  const linkedRun = makeRun('run-linked', null, 'Succeeded');
  delete linkedRun.status.workspaceRef;
  delete linkedRun.spec.workspaceRef;

  const result = controller.getWorkspaceRuns(ws, [linkedRun]);

  assert.equal(result.error, false);
  assert.equal(result.history.length, 1, 'Should find run via association');
  assert.equal(result.history[0].metadata.name, 'run-linked');
});

test('getWorkspaceRuns returns empty when no matching runs', () => {
  const controller = createAgentWorkspaceController();
  const ws = makeWorkspace('ws-empty', 'my-repo');
  const result = controller.getWorkspaceRuns(ws, []);

  assert.equal(result.error, false);
  assert.equal(result.active.length, 0);
  assert.equal(result.history.length, 0);
});
