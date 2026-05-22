/**
 * B1: Approval persistence tests
 * Tests for persistApproval (saves AgentApproval via applyResource) and
 * enforceApproval (gates dispatch when approval is pending/missing).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentApprovalController, createResource } from '../src/index.js';

function makeApproval(name, dispatchRun, action, phase = 'Pending') {
  const approval = createResource('AgentApproval', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    dispatchRun,
    action,
    requestedBy: 'agent-stack-1',
    description: `Request to perform: ${action}`,
    requestedAt: new Date().toISOString()
  });
  approval.status = { phase, createdAt: new Date().toISOString() };
  return approval;
}

// --- persistApproval ---

test('persistApproval calls applyResource with the approval resource', async () => {
  const controller = createAgentApprovalController();
  const approval = makeApproval('approval-persist-1', 'run-persist-1', 'tool-use', 'Pending');

  const applied = [];
  const mockApplyResource = async (resource) => {
    applied.push(resource);
    return { ok: true, resource };
  };

  const result = await controller.persistApproval({ approval, applyResource: mockApplyResource });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(applied.length, 1, 'applyResource should be called exactly once');
  assert.equal(applied[0].kind, 'AgentApproval', 'Applied resource should be AgentApproval');
  assert.equal(applied[0].metadata.name, 'approval-persist-1');
  assert.equal(applied[0].spec.dispatchRun, 'run-persist-1');
});

test('persistApproval returns error when applyResource throws', async () => {
  const controller = createAgentApprovalController();
  const approval = makeApproval('approval-persist-2', 'run-persist-2', 'secret-access', 'Pending');

  const mockApplyResource = async () => {
    throw new Error('Kubernetes API unavailable');
  };

  const result = await controller.persistApproval({ approval, applyResource: mockApplyResource });

  assert.equal(result.error, true, 'Should return error when applyResource throws');
  assert.equal(result.reason, 'persist-failed');
  assert.ok(result.message, 'Should include error message');
});

test('persistApproval returns error when approval is missing', async () => {
  const controller = createAgentApprovalController();

  const mockApplyResource = async () => ({ ok: true });
  const result = await controller.persistApproval({ approval: null, applyResource: mockApplyResource });

  assert.equal(result.error, true, 'Should fail when approval is null');
  assert.equal(result.reason, 'missing-approval');
});

test('persistApproval returns error when applyResource is not provided', async () => {
  const controller = createAgentApprovalController();
  const approval = makeApproval('approval-persist-3', 'run-persist-3', 'release', 'Pending');

  const result = await controller.persistApproval({ approval, applyResource: null });

  assert.equal(result.error, true, 'Should fail without applyResource');
  assert.equal(result.reason, 'missing-apply-resource');
});

// --- enforceApproval ---

test('enforceApproval blocks dispatch when no approval exists for the action', () => {
  const controller = createAgentApprovalController();

  const result = controller.enforceApproval({
    dispatchRun: 'run-enforce-1',
    action: 'write-back',
    resources: {}
  });

  assert.equal(result.allowed, false, 'Should block when no approval exists');
  assert.equal(result.reason, 'no-approval-found');
  assert.ok(result.message, 'Should include blocking reason message');
});

test('enforceApproval blocks dispatch when approval is still Pending', () => {
  const controller = createAgentApprovalController();
  const pending = makeApproval('approval-enforce-1', 'run-enforce-2', 'secret-access', 'Pending');

  const result = controller.enforceApproval({
    dispatchRun: 'run-enforce-2',
    action: 'secret-access',
    resources: { AgentApproval: [pending] }
  });

  assert.equal(result.allowed, false, 'Should block when approval is Pending');
  assert.equal(result.reason, 'approval-pending');
  assert.ok(result.message, 'Should include blocking reason');
  assert.ok(result.approval, 'Should return the approval resource');
});

test('enforceApproval allows dispatch when approval is Approved', () => {
  const controller = createAgentApprovalController();
  const approved = makeApproval('approval-enforce-2', 'run-enforce-3', 'tool-use', 'Approved');
  approved.status.decidedBy = 'owner';
  approved.status.decidedAt = new Date().toISOString();

  const result = controller.enforceApproval({
    dispatchRun: 'run-enforce-3',
    action: 'tool-use',
    resources: { AgentApproval: [approved] }
  });

  assert.equal(result.allowed, true, 'Should allow when approval is Approved');
  assert.ok(result.approval, 'Should return the approval resource');
  assert.equal(result.approval.status.phase, 'Approved');
});

test('enforceApproval blocks dispatch when approval was Denied', () => {
  const controller = createAgentApprovalController();
  const denied = makeApproval('approval-enforce-3', 'run-enforce-4', 'release', 'Denied');
  denied.status.decidedBy = 'admin';
  denied.status.decidedAt = new Date().toISOString();

  const result = controller.enforceApproval({
    dispatchRun: 'run-enforce-4',
    action: 'release',
    resources: { AgentApproval: [denied] }
  });

  assert.equal(result.allowed, false, 'Should block when approval was Denied');
  assert.equal(result.reason, 'approval-denied');
  assert.ok(result.approval, 'Should return the denial record');
});

test('persistApproval passes applyResource result back in response', async () => {
  const controller = createAgentApprovalController();
  const approval = makeApproval('approval-persist-4', 'run-persist-4', 'escalation', 'Pending');

  const mockApplyResult = { ok: true, uid: 'test-uid-1234', resource: approval };
  const mockApplyResource = async () => mockApplyResult;

  const result = await controller.persistApproval({ approval, applyResource: mockApplyResource });

  assert.equal(result.error, false, 'Should succeed');
  assert.deepEqual(result.applyResult, mockApplyResult, 'Should include applyResource result');
});

test('enforceApproval checks the correct action type (no cross-action interference)', () => {
  const controller = createAgentApprovalController();
  // Approval for 'tool-use' but checking 'secret-access' — should block
  const wrongAction = makeApproval('approval-enforce-5', 'run-enforce-5', 'tool-use', 'Approved');

  const result = controller.enforceApproval({
    dispatchRun: 'run-enforce-5',
    action: 'secret-access',
    resources: { AgentApproval: [wrongAction] }
  });

  assert.equal(result.allowed, false, 'Should block when matching action is not found');
  assert.equal(result.reason, 'no-approval-found');
});
