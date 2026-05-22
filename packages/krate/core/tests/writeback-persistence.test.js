/**
 * B2: Write-back persistence + execution tests
 * Tests for persistWriteIntent (saves AgentWriteIntent via applyResource),
 * executeWriteIntent (calls gateway for branch push, validates status checks for PR merge).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentWritebackController } from '../src/index.js';

function makePushIntent(name, runRef, branch = 'feature/x', approvalStatus = 'pending') {
  return {
    kind: 'AgentWriteIntent',
    metadata: { name, namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: {
      organizationRef: 'default',
      runRef,
      branch,
      targetRepo: 'org/my-repo',
      writeType: 'branch-push',
      requestedBy: 'agent-stack-1',
      requestedAt: new Date().toISOString()
    },
    status: { approvalStatus, phase: approvalStatus === 'approved' ? 'Approved' : 'Pending', createdAt: new Date().toISOString() }
  };
}

function makeMergeIntent(name, runRef, prRef, approvalStatus = 'pending', statusChecks = []) {
  return {
    kind: 'AgentWriteIntent',
    metadata: { name, namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: {
      organizationRef: 'default',
      runRef,
      prRef,
      writeType: 'pr-merge',
      statusChecks,
      requestedBy: 'agent-stack-1',
      requestedAt: new Date().toISOString()
    },
    status: { approvalStatus, phase: approvalStatus === 'approved' ? 'Approved' : 'Pending', createdAt: new Date().toISOString() }
  };
}

// --- persistWriteIntent ---

test('persistWriteIntent calls applyResource with the intent and returns success', async () => {
  const controller = createAgentWritebackController();
  const intent = makePushIntent('push-persist-1', 'run-persist-1', 'feature/new-thing', 'pending');

  const applied = [];
  const mockApplyResource = async (resource) => {
    applied.push(resource);
    return { ok: true, resource };
  };

  const result = await controller.persistWriteIntent({ intent, applyResource: mockApplyResource });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(applied.length, 1, 'applyResource should be called exactly once');
  assert.equal(applied[0].kind, 'AgentWriteIntent', 'Applied resource should be AgentWriteIntent');
  assert.equal(applied[0].metadata.name, 'push-persist-1');
  assert.equal(applied[0].spec.runRef, 'run-persist-1');
});

test('persistWriteIntent returns error when applyResource throws', async () => {
  const controller = createAgentWritebackController();
  const intent = makePushIntent('push-persist-2', 'run-persist-2', 'main', 'pending');

  const mockApplyResource = async () => {
    throw new Error('Storage backend unreachable');
  };

  const result = await controller.persistWriteIntent({ intent, applyResource: mockApplyResource });

  assert.equal(result.error, true, 'Should return error when applyResource throws');
  assert.equal(result.reason, 'persist-failed');
  assert.ok(result.message, 'Should include error message');
});

test('persistWriteIntent returns error when intent is missing', async () => {
  const controller = createAgentWritebackController();

  const mockApplyResource = async () => ({ ok: true });
  const result = await controller.persistWriteIntent({ intent: null, applyResource: mockApplyResource });

  assert.equal(result.error, true, 'Should fail when intent is null');
  assert.equal(result.reason, 'missing-intent');
});

test('persistWriteIntent returns error when applyResource is not provided', async () => {
  const controller = createAgentWritebackController();
  const intent = makePushIntent('push-persist-3', 'run-persist-3', 'develop', 'pending');

  const result = await controller.persistWriteIntent({ intent, applyResource: null });

  assert.equal(result.error, true, 'Should fail without applyResource');
  assert.equal(result.reason, 'missing-apply-resource');
});

test('persistWriteIntent passes applyResource result back in response', async () => {
  const controller = createAgentWritebackController();
  const intent = makePushIntent('push-persist-4', 'run-persist-4', 'hotfix/urgent', 'approved');

  const mockApplyResult = { ok: true, uid: 'some-uid-abc' };
  const mockApplyResource = async () => mockApplyResult;

  const result = await controller.persistWriteIntent({ intent, applyResource: mockApplyResource });

  assert.equal(result.error, false, 'Should succeed');
  assert.deepEqual(result.applyResult, mockApplyResult, 'Should include applyResource result');
});

// --- executeWriteIntent ---

test('executeWriteIntent calls gateway for approved branch-push intent', async () => {
  const controller = createAgentWritebackController();
  const intent = makePushIntent('push-exec-1', 'run-exec-1', 'feature/ready', 'approved');

  const gatewayCalls = [];
  const mockGateway = {
    async pushBranch({ branch, targetRepo, runRef }) {
      gatewayCalls.push({ branch, targetRepo, runRef });
      return { ok: true, sha: 'abc123def456' };
    }
  };

  const result = await controller.executeWriteIntent({ intent, gateway: mockGateway });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(gatewayCalls.length, 1, 'Gateway pushBranch should be called once');
  assert.equal(gatewayCalls[0].branch, 'feature/ready');
  assert.equal(gatewayCalls[0].targetRepo, 'org/my-repo');
  assert.equal(gatewayCalls[0].runRef, 'run-exec-1');
  assert.ok(result.executionResult, 'Should return execution result');
});

test('executeWriteIntent blocks execution when intent approval is still pending', async () => {
  const controller = createAgentWritebackController();
  const intent = makePushIntent('push-exec-2', 'run-exec-2', 'feature/unreviewed', 'pending');

  const mockGateway = {
    async pushBranch() { return { ok: true }; }
  };

  const result = await controller.executeWriteIntent({ intent, gateway: mockGateway });

  assert.equal(result.error, true, 'Should block when not approved');
  assert.equal(result.reason, 'not-approved');
});

test('executeWriteIntent validates status checks are passing for pr-merge intent', async () => {
  const controller = createAgentWritebackController();
  const intent = makeMergeIntent('merge-exec-1', 'run-exec-3', 'pr-55', 'approved', [
    { name: 'ci/build', state: 'success' },
    { name: 'ci/tests', state: 'success' }
  ]);

  const gatewayCalls = [];
  const mockGateway = {
    async mergePr({ prRef, runRef }) {
      gatewayCalls.push({ prRef, runRef });
      return { ok: true, mergeCommit: 'deadbeef' };
    }
  };

  const result = await controller.executeWriteIntent({ intent, gateway: mockGateway });

  assert.equal(result.error, false, 'Should succeed when checks pass and intent is approved');
  assert.equal(gatewayCalls.length, 1, 'Gateway mergePr should be called once');
  assert.equal(gatewayCalls[0].prRef, 'pr-55');
  assert.ok(result.executionResult, 'Should return execution result');
});

test('executeWriteIntent rejects pr-merge when status checks are failing', async () => {
  const controller = createAgentWritebackController();
  const intent = makeMergeIntent('merge-exec-2', 'run-exec-4', 'pr-66', 'approved', [
    { name: 'ci/build', state: 'success' },
    { name: 'security/scan', state: 'failure' }
  ]);

  const mockGateway = {
    async mergePr() { return { ok: true }; }
  };

  const result = await controller.executeWriteIntent({ intent, gateway: mockGateway });

  assert.equal(result.error, true, 'Should block when checks are failing');
  assert.equal(result.reason, 'status-checks-failing');
  assert.ok(result.message.includes('security/scan'), 'Message should name the failing check');
});

test('executeWriteIntent returns error when gateway throws', async () => {
  const controller = createAgentWritebackController();
  const intent = makePushIntent('push-exec-3', 'run-exec-5', 'feature/crash', 'approved');

  const mockGateway = {
    async pushBranch() {
      throw new Error('Git remote unreachable');
    }
  };

  const result = await controller.executeWriteIntent({ intent, gateway: mockGateway });

  assert.equal(result.error, true, 'Should return error when gateway throws');
  assert.equal(result.reason, 'execution-failed');
  assert.ok(result.message, 'Should include error message');
});
