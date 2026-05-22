import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentApprovalController, createResource } from '../src/index.js';

function makeApproval(name, dispatchRun, action, phase = 'Pending', extra = {}) {
  const approval = createResource('AgentApproval', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    dispatchRun,
    action,
    requestedBy: 'agent-stack-1',
    ...extra
  });
  approval.status = { phase, createdAt: new Date().toISOString(), ...extra.status };
  return approval;
}

test('Create approval request returns resource with phase=Pending', () => {
  const controller = createAgentApprovalController();
  const result = controller.createApprovalRequest({
    dispatchRun: 'run-1',
    action: 'tool-use',
    requestedBy: 'agent-stack-1',
    context: 'Needs filesystem write access',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources: {}
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.duplicate, false, 'Should not be a duplicate');
  assert.ok(result.approval, 'Should return an approval resource');
  assert.equal(result.approval.kind, 'AgentApproval');
  assert.equal(result.approval.status.phase, 'Pending');
  assert.equal(result.approval.spec.action, 'tool-use');
  assert.equal(result.approval.spec.dispatchRun, 'run-1');
  assert.equal(result.approval.spec.requestedBy, 'agent-stack-1');
  assert.ok(result.approval.status.createdAt, 'Should have createdAt timestamp');
});

test('Record approve sets phase=Approved and decidedBy', () => {
  const controller = createAgentApprovalController();
  const existing = makeApproval('approval-1', 'run-1', 'tool-use', 'Pending');
  const result = controller.recordDecision({
    approvalName: 'approval-1',
    decision: 'approve',
    decidedBy: 'owner',
    reason: 'Looks safe',
    resources: { AgentApproval: [existing] }
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.approval.status.phase, 'Approved');
  assert.equal(result.approval.status.decidedBy, 'owner');
  assert.equal(result.approval.status.reason, 'Looks safe');
  assert.ok(result.approval.status.decidedAt, 'Should have decidedAt timestamp');
});

test('Record deny sets phase=Denied', () => {
  const controller = createAgentApprovalController();
  const existing = makeApproval('approval-2', 'run-1', 'secret-access', 'Pending');
  const result = controller.recordDecision({
    approvalName: 'approval-2',
    decision: 'deny',
    decidedBy: 'admin',
    reason: 'Sensitive secrets not allowed',
    resources: { AgentApproval: [existing] }
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.approval.status.phase, 'Denied');
  assert.equal(result.approval.status.decidedBy, 'admin');
  assert.equal(result.approval.status.reason, 'Sensitive secrets not allowed');
});

test('isActionApproved returns true after approval', () => {
  const controller = createAgentApprovalController();
  const approved = makeApproval('approval-3', 'run-2', 'write-back', 'Approved', { status: { decidedBy: 'owner', decidedAt: new Date().toISOString() } });
  const result = controller.isActionApproved({
    dispatchRun: 'run-2',
    action: 'write-back',
    resources: { AgentApproval: [approved] }
  });

  assert.equal(result.approved, true, 'Should be approved');
  assert.ok(result.approval, 'Should return the approval resource');
});

test('isActionApproved returns false when still pending', () => {
  const controller = createAgentApprovalController();
  const pending = makeApproval('approval-4', 'run-3', 'release', 'Pending');
  const result = controller.isActionApproved({
    dispatchRun: 'run-3',
    action: 'release',
    resources: { AgentApproval: [pending] }
  });

  assert.equal(result.approved, false, 'Should not be approved');
  assert.equal(result.reason, 'Approval is still pending');
});

test('Duplicate pending request returns existing approval', () => {
  const controller = createAgentApprovalController();
  const existing = makeApproval('approval-5', 'run-4', 'tool-use', 'Pending');
  const result = controller.createApprovalRequest({
    dispatchRun: 'run-4',
    action: 'tool-use',
    requestedBy: 'agent-stack-1',
    resources: { AgentApproval: [existing] }
  });

  assert.equal(result.error, false, 'Should succeed');
  assert.equal(result.duplicate, true, 'Should be flagged as duplicate');
  assert.equal(result.approval.metadata.name, 'approval-5', 'Should return the existing approval');
});

test('Invalid action type returns error', () => {
  const controller = createAgentApprovalController();
  const result = controller.createApprovalRequest({
    dispatchRun: 'run-5',
    action: 'invalid-action',
    requestedBy: 'agent-stack-1',
    resources: {}
  });

  assert.equal(result.error, true, 'Should fail');
  assert.equal(result.reason, 'invalid-action');
  assert.ok(result.message.includes('invalid-action'), 'Message should mention the invalid action');
});

test('Already decided approval returns error on re-decide', () => {
  const controller = createAgentApprovalController();
  const decided = makeApproval('approval-6', 'run-6', 'escalation', 'Approved', { status: { decidedBy: 'admin', decidedAt: new Date().toISOString() } });
  const result = controller.recordDecision({
    approvalName: 'approval-6',
    decision: 'deny',
    decidedBy: 'other-admin',
    resources: { AgentApproval: [decided] }
  });

  assert.equal(result.error, true, 'Should fail');
  assert.equal(result.reason, 'already-decided');
  assert.ok(result.message.includes('already been decided'), 'Message should indicate already decided');
});

test('listPendingApprovals filters by org and pending status', () => {
  const controller = createAgentApprovalController();
  const pending1 = makeApproval('p1', 'run-7', 'tool-use', 'Pending');
  const pending2 = makeApproval('p2', 'run-8', 'release', 'Pending');
  const approved = makeApproval('p3', 'run-9', 'write-back', 'Approved');

  const result = controller.listPendingApprovals({
    organizationRef: 'default',
    resources: { AgentApproval: [pending1, pending2, approved] }
  });

  assert.equal(result.length, 2, 'Should return only pending approvals');
  assert.ok(result.every(a => a.status.phase === 'Pending'), 'All should be Pending');
});

test('listApprovalsForRun filters by dispatch run', () => {
  const controller = createAgentApprovalController();
  const a1 = makeApproval('r1', 'run-10', 'tool-use', 'Pending');
  const a2 = makeApproval('r2', 'run-10', 'secret-access', 'Approved');
  const a3 = makeApproval('r3', 'run-11', 'release', 'Pending');

  const result = controller.listApprovalsForRun({
    dispatchRun: 'run-10',
    resources: { AgentApproval: [a1, a2, a3] }
  });

  assert.equal(result.length, 2, 'Should return approvals for run-10 only');
  assert.ok(result.every(a => a.spec.dispatchRun === 'run-10'), 'All should belong to run-10');
});
