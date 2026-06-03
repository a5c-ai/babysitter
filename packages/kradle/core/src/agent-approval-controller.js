import { createResource, clone } from './resource-model.js';

export const AGENT_APPROVAL_CONTROLLER_BOUNDARY = {
  role: 'agent-approval-controller',
  scope: 'Human gate lifecycle for agent tool-use, secret-access, write-back, release, and escalation actions',
  owns: ['approval creation', 'decision recording', 'approval lookup', 'duplicate detection'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['secret values', 'agent execution', 'UI rendering']
};

const VALID_ACTIONS = new Set(['tool-use', 'secret-access', 'write-back', 'release', 'escalation']);

export function createAgentApprovalController() {
  return {
    role: 'agent-approval-controller',

    createApprovalRequest({ dispatchRun, action, requestedBy, context, namespace = 'default', organizationRef = 'default', resources = {} }) {
      if (!action || !VALID_ACTIONS.has(action)) {
        return { error: true, reason: 'invalid-action', message: `Invalid action type: ${action}. Must be one of: ${[...VALID_ACTIONS].join(', ')}` };
      }
      if (!dispatchRun) {
        return { error: true, reason: 'missing-dispatch-run', message: 'dispatchRun is required' };
      }
      if (!requestedBy) {
        return { error: true, reason: 'missing-requested-by', message: 'requestedBy is required' };
      }

      // Check for duplicate pending approval
      const existing = (resources.AgentApproval || []).find(
        (a) => a.spec?.dispatchRun === dispatchRun && a.spec?.action === action && (!a.status?.phase || a.status.phase === 'Pending')
      );
      if (existing) {
        return { error: false, approval: clone(existing), duplicate: true };
      }

      const now = new Date().toISOString();
      const approvalName = `approval-${dispatchRun}-${action}-${Date.now()}`;

      const approval = createResource('AgentApproval', { name: approvalName, namespace }, {
        organizationRef,
        dispatchRun,
        action,
        requestedBy,
        description: context || `Agent requests permission to perform: ${action}`,
        requestedAt: now
      });
      approval.status = { phase: 'Pending', createdAt: now };

      return { error: false, approval, duplicate: false };
    },

    recordDecision({ approvalName, decision, decidedBy, reason, namespace = 'default', organizationRef = 'default', resources = {} }) {
      if (!approvalName) {
        return { error: true, reason: 'missing-approval-name', message: 'approvalName is required' };
      }
      if (!decision || (decision !== 'approve' && decision !== 'deny')) {
        return { error: true, reason: 'invalid-decision', message: `Invalid decision: ${decision}. Must be 'approve' or 'deny'` };
      }
      if (!decidedBy) {
        return { error: true, reason: 'missing-decided-by', message: 'decidedBy is required' };
      }

      const approvals = resources.AgentApproval || [];
      const approval = approvals.find((a) => a.metadata?.name === approvalName);
      if (!approval) {
        return { error: true, reason: 'not-found', message: `AgentApproval not found: ${approvalName}` };
      }

      if (approval.status?.phase && approval.status.phase !== 'Pending') {
        return { error: true, reason: 'already-decided', message: `AgentApproval ${approvalName} has already been decided: ${approval.status.phase}` };
      }

      const now = new Date().toISOString();
      const phase = decision === 'approve' ? 'Approved' : 'Denied';

      const updated = clone(approval);
      updated.status = {
        ...updated.status,
        phase,
        decidedBy,
        decidedAt: now,
        reason: reason || undefined
      };

      return { error: false, approval: updated };
    },

    isActionApproved({ dispatchRun, action, resources = {} }) {
      const approvals = resources.AgentApproval || [];
      const match = approvals.find(
        (a) => a.spec?.dispatchRun === dispatchRun && a.spec?.action === action
      );

      if (!match) {
        return { approved: false, approval: null, reason: 'No approval request found' };
      }

      if (match.status?.phase === 'Approved') {
        return { approved: true, approval: clone(match), reason: match.status.reason || 'Approved' };
      }

      if (match.status?.phase === 'Denied') {
        return { approved: false, approval: clone(match), reason: match.status.reason || 'Denied' };
      }

      return { approved: false, approval: clone(match), reason: 'Approval is still pending' };
    },

    listPendingApprovals({ organizationRef, resources = {} }) {
      const approvals = resources.AgentApproval || [];
      return approvals.filter((a) => {
        const matchesOrg = !organizationRef || a.spec?.organizationRef === organizationRef;
        const isPending = !a.status?.phase || a.status.phase === 'Pending';
        return matchesOrg && isPending;
      }).map(clone);
    },

    listApprovalsForRun({ dispatchRun, resources = {} }) {
      const approvals = resources.AgentApproval || [];
      return approvals.filter((a) => a.spec?.dispatchRun === dispatchRun).map(clone);
    },

    // -----------------------------------------------------------------------
    // B1: Persistence
    // -----------------------------------------------------------------------

    async persistApproval({ approval, applyResource }) {
      if (!approval) {
        return { error: true, reason: 'missing-approval', message: 'approval is required' };
      }
      if (typeof applyResource !== 'function') {
        return { error: true, reason: 'missing-apply-resource', message: 'applyResource function is required' };
      }
      try {
        const applyResult = await applyResource(approval);
        return { error: false, approval, applyResult };
      } catch (err) {
        return { error: true, reason: 'persist-failed', message: err?.message || 'applyResource failed' };
      }
    },

    // -----------------------------------------------------------------------
    // B1: Enforcement gate
    // -----------------------------------------------------------------------

    enforceApproval({ dispatchRun, action, resources = {} }) {
      const approvals = resources.AgentApproval || [];
      const match = approvals.find(
        (a) => a.spec?.dispatchRun === dispatchRun && a.spec?.action === action
      );

      if (!match) {
        return { allowed: false, reason: 'no-approval-found', message: `No approval found for dispatchRun=${dispatchRun} action=${action}`, approval: null };
      }

      const phase = match.status?.phase;

      if (phase === 'Approved') {
        return { allowed: true, approval: clone(match), reason: 'approved' };
      }

      if (phase === 'Denied') {
        return { allowed: false, reason: 'approval-denied', message: `Approval for dispatchRun=${dispatchRun} action=${action} was denied`, approval: clone(match) };
      }

      // Pending or unknown
      return { allowed: false, reason: 'approval-pending', message: `Approval for dispatchRun=${dispatchRun} action=${action} is still pending`, approval: clone(match) };
    }
  };
}
