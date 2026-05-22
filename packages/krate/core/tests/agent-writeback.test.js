import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentWritebackController, createResource } from '../src/index.js';

function makeArtifact(name, runRef, contentRef, extra = {}) {
  const artifact = createResource('KrateArtifact', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    dispatchRun: runRef,
    kind: 'output',
    digest: contentRef,
    ...extra.spec
  });
  artifact.status = { phase: 'Available', createdAt: new Date().toISOString(), ...extra.status };
  return artifact;
}

// --- createArtifact ---

test('createArtifact creates an artifact resource with name, runRef, and content ref', () => {
  const controller = createAgentWritebackController();
  const result = controller.createArtifact({
    name: 'output-1',
    runRef: 'run-abc',
    contentRef: 'sha256:deadbeef',
    kind: 'output',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.ok(result.artifact, 'Should return an artifact resource');
  assert.equal(result.artifact.kind, 'KrateArtifact');
  assert.equal(result.artifact.spec.dispatchRun, 'run-abc');
  assert.equal(result.artifact.spec.digest, 'sha256:deadbeef');
  assert.ok(result.artifact.metadata.name, 'Should have a name');
  assert.equal(result.artifact.status.phase, 'Available');
  assert.ok(result.artifact.status.createdAt, 'Should have createdAt timestamp');
});

test('createArtifact rejects missing runRef', () => {
  const controller = createAgentWritebackController();
  const result = controller.createArtifact({
    name: 'output-2',
    contentRef: 'sha256:aabbcc',
    kind: 'output',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, true, 'Should fail');
  assert.equal(result.reason, 'missing-run-ref');
  assert.ok(result.message.includes('runRef'), 'Message should mention runRef');
});

test('createArtifact rejects missing contentRef', () => {
  const controller = createAgentWritebackController();
  const result = controller.createArtifact({
    name: 'output-3',
    runRef: 'run-xyz',
    kind: 'output',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, true, 'Should fail');
  assert.equal(result.reason, 'missing-content-ref');
  assert.ok(result.message.includes('contentRef'), 'Message should mention contentRef');
});

// --- validateArtifact ---

test('validateArtifact accepts valid artifact', () => {
  const controller = createAgentWritebackController();
  const artifact = makeArtifact('artifact-valid', 'run-1', 'sha256:cafebabe');
  const result = controller.validateArtifact({ artifact });

  assert.equal(result.valid, true, 'Should be valid');
  assert.equal(result.error, false, 'Should not have error');
});

// --- listArtifactsForRun ---

test('listArtifactsForRun returns artifacts filtered by runRef', () => {
  const controller = createAgentWritebackController();
  const a1 = makeArtifact('art-1', 'run-10', 'sha256:111');
  const a2 = makeArtifact('art-2', 'run-10', 'sha256:222');
  const a3 = makeArtifact('art-3', 'run-99', 'sha256:333');

  const result = controller.listArtifactsForRun({
    runRef: 'run-10',
    resources: { KrateArtifact: [a1, a2, a3] }
  });

  assert.equal(result.length, 2, 'Should return only artifacts for run-10');
  assert.ok(result.every((a) => a.spec.dispatchRun === 'run-10'), 'All should belong to run-10');
});

// --- requestBranchPush ---

test('requestBranchPush creates a push request with branch, target repo, approval status', () => {
  const controller = createAgentWritebackController();
  const result = controller.requestBranchPush({
    runRef: 'run-abc',
    branch: 'feature/new-thing',
    targetRepo: 'org/my-repo',
    requestedBy: 'agent-stack-1',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.ok(result.pushRequest, 'Should return a push request');
  assert.equal(result.pushRequest.spec.branch, 'feature/new-thing');
  assert.equal(result.pushRequest.spec.targetRepo, 'org/my-repo');
  assert.equal(result.pushRequest.spec.runRef, 'run-abc');
  assert.ok(result.pushRequest.status.approvalStatus, 'Should have approvalStatus');
});

test('requestBranchPush defaults approval to pending', () => {
  const controller = createAgentWritebackController();
  const result = controller.requestBranchPush({
    runRef: 'run-def',
    branch: 'fix/buggy',
    targetRepo: 'org/other-repo',
    requestedBy: 'agent-stack-2',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.pushRequest.status.approvalStatus, 'pending', 'Default approval should be pending');
});

test('approveBranchPush transitions approval to approved', () => {
  const controller = createAgentWritebackController();
  const pushRequest = {
    kind: 'AgentWriteIntent',
    metadata: { name: 'push-req-1', namespace: 'krate-org-default' },
    spec: { runRef: 'run-1', branch: 'main', targetRepo: 'org/repo', writeType: 'branch-push', requestedBy: 'agent-1' },
    status: { approvalStatus: 'pending', phase: 'Pending' }
  };

  const result = controller.approveBranchPush({
    intentName: 'push-req-1',
    approvedBy: 'owner',
    reason: 'Looks safe',
    resources: { AgentWriteIntent: [pushRequest] }
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.pushRequest.status.approvalStatus, 'approved', 'Should be approved');
  assert.equal(result.pushRequest.status.approvedBy, 'owner');
  assert.ok(result.pushRequest.status.approvedAt, 'Should have approvedAt timestamp');
});

test('denyBranchPush transitions approval to denied', () => {
  const controller = createAgentWritebackController();
  const pushRequest = {
    kind: 'AgentWriteIntent',
    metadata: { name: 'push-req-2', namespace: 'krate-org-default' },
    spec: { runRef: 'run-2', branch: 'feature/x', targetRepo: 'org/repo', writeType: 'branch-push', requestedBy: 'agent-2' },
    status: { approvalStatus: 'pending', phase: 'Pending' }
  };

  const result = controller.denyBranchPush({
    intentName: 'push-req-2',
    deniedBy: 'admin',
    reason: 'Not allowed in this repo',
    resources: { AgentWriteIntent: [pushRequest] }
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.pushRequest.status.approvalStatus, 'denied', 'Should be denied');
  assert.equal(result.pushRequest.status.deniedBy, 'admin');
  assert.ok(result.pushRequest.status.deniedAt, 'Should have deniedAt timestamp');
});

// --- requestPrMerge ---

test('requestPrMerge creates a merge request with PR ref and checks status', () => {
  const controller = createAgentWritebackController();
  const result = controller.requestPrMerge({
    runRef: 'run-merge-1',
    prRef: 'pr-42',
    statusChecks: [
      { name: 'ci/build', state: 'success' },
      { name: 'ci/lint', state: 'success' }
    ],
    requestedBy: 'agent-stack-3',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.ok(result.mergeRequest, 'Should return a merge request');
  assert.equal(result.mergeRequest.spec.prRef, 'pr-42');
  assert.equal(result.mergeRequest.spec.runRef, 'run-merge-1');
  assert.ok(Array.isArray(result.mergeRequest.spec.statusChecks), 'Should have statusChecks');
});

test('requestPrMerge rejects when status checks are failing', () => {
  const controller = createAgentWritebackController();
  const result = controller.requestPrMerge({
    runRef: 'run-merge-2',
    prRef: 'pr-99',
    statusChecks: [
      { name: 'ci/build', state: 'success' },
      { name: 'ci/tests', state: 'failure' }
    ],
    requestedBy: 'agent-stack-4',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, true, 'Should fail');
  assert.equal(result.reason, 'status-checks-failing');
  assert.ok(result.message.includes('ci/tests'), 'Message should name the failing check');
});

test('requestPrMerge accepts when all status checks pass', () => {
  const controller = createAgentWritebackController();
  const result = controller.requestPrMerge({
    runRef: 'run-merge-3',
    prRef: 'pr-77',
    statusChecks: [
      { name: 'ci/build', state: 'success' },
      { name: 'ci/lint', state: 'success' },
      { name: 'security/scan', state: 'success' }
    ],
    requestedBy: 'agent-stack-5',
    namespace: 'krate-org-default',
    organizationRef: 'default'
  });

  assert.equal(result.error, false, 'Should succeed when all checks pass');
  assert.ok(result.mergeRequest, 'Should return a merge request');
  assert.equal(result.mergeRequest.spec.prRef, 'pr-77');
});

// --- validateWriteIntent ---

test('validateWriteIntent accepts valid write intent (artifact, push, or merge)', () => {
  const controller = createAgentWritebackController();
  const intent = {
    kind: 'AgentWriteIntent',
    metadata: { name: 'intent-valid', namespace: 'krate-org-default' },
    spec: { runRef: 'run-1', writeType: 'artifact', requestedBy: 'agent-1' },
    status: { approvalStatus: 'pending', phase: 'Pending' }
  };

  const result = controller.validateWriteIntent({ intent });
  assert.equal(result.valid, true, 'Should be valid for artifact type');
  assert.equal(result.error, false);
});

test('validateWriteIntent rejects unknown write type', () => {
  const controller = createAgentWritebackController();
  const intent = {
    kind: 'AgentWriteIntent',
    metadata: { name: 'intent-bad', namespace: 'krate-org-default' },
    spec: { runRef: 'run-1', writeType: 'unknown-type', requestedBy: 'agent-1' },
    status: { approvalStatus: 'pending', phase: 'Pending' }
  };

  const result = controller.validateWriteIntent({ intent });
  assert.equal(result.valid, false, 'Should be invalid');
  assert.equal(result.error, true);
  assert.ok(result.message.includes('unknown-type'), 'Message should mention the bad type');
});

// --- getWriteIntentStatus ---

test('getWriteIntentStatus returns current approval/execution status', () => {
  const controller = createAgentWritebackController();
  const intent = {
    kind: 'AgentWriteIntent',
    metadata: { name: 'intent-status-1', namespace: 'krate-org-default' },
    spec: { runRef: 'run-1', writeType: 'branch-push', branch: 'main', targetRepo: 'org/repo', requestedBy: 'agent-1' },
    status: { approvalStatus: 'approved', phase: 'Executing', approvedBy: 'owner', approvedAt: new Date().toISOString() }
  };

  const result = controller.getWriteIntentStatus({
    intentName: 'intent-status-1',
    resources: { AgentWriteIntent: [intent] }
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.approvalStatus, 'approved');
  assert.equal(result.phase, 'Executing');
  assert.equal(result.approvedBy, 'owner');
  assert.ok(result.intent, 'Should return the intent resource');
});
