export const HOOKS_LIFECYCLE_BOUNDARY = {
  role: 'hooks-lifecycle',
  scope: 'Lifecycle event emission at key dispatch flow transitions',
  owns: ['lifecycle event emission'],
  delegatesTo: ['event-bus'],
  mustNotOwn: ['event storage', 'dispatch logic', 'session management']
};

/**
 * Create a hooks lifecycle emitter that broadcasts structured events to an event bus.
 * @param {{ emit: Function }} eventBus
 * @returns {object}
 */
export function createHooksLifecycleEmitter(eventBus) {
  if (!eventBus || typeof eventBus.emit !== 'function') {
    throw new Error('createHooksLifecycleEmitter requires an eventBus with an emit method');
  }

  return {
    emitRunCreated(run) {
      eventBus.emit({
        type: 'hook',
        event: 'RUN_CREATED',
        runId: run.metadata?.name,
        stack: run.spec?.agentStack,
        timestamp: new Date().toISOString(),
      });
    },

    emitRunCompleted(run, result) {
      const startedAt = run.status?.queuedAt ? new Date(run.status.queuedAt) : null;
      const now = new Date();
      const duration = startedAt ? now - startedAt : null;
      eventBus.emit({
        type: 'hook',
        event: 'RUN_COMPLETED',
        runId: run.metadata?.name,
        result: result?.phase || 'Completed',
        duration,
        timestamp: now.toISOString(),
      });
    },

    emitStepStarted(run, step) {
      eventBus.emit({
        type: 'hook',
        event: 'STEP_STARTED',
        runId: run.metadata?.name,
        step,
        timestamp: new Date().toISOString(),
      });
    },

    emitStepEnded(run, step, result) {
      eventBus.emit({
        type: 'hook',
        event: 'STEP_ENDED',
        runId: run.metadata?.name,
        step,
        result,
        timestamp: new Date().toISOString(),
      });
    },

    emitApprovalRequested(approval) {
      eventBus.emit({
        type: 'hook',
        event: 'APPROVAL_REQUESTED',
        approvalId: approval.metadata?.name,
        action: approval.spec?.action,
        requestedBy: approval.spec?.requestedBy,
        timestamp: new Date().toISOString(),
      });
    },

    emitApprovalDecided(approval) {
      eventBus.emit({
        type: 'hook',
        event: 'APPROVAL_DECIDED',
        approvalId: approval.metadata?.name,
        action: approval.spec?.action,
        decision: approval.status?.decision,
        timestamp: new Date().toISOString(),
      });
    },

    emitWorkspaceProvisioned(workspace) {
      eventBus.emit({
        type: 'hook',
        event: 'WORKSPACE_PROVISIONED',
        workspaceId: workspace.metadata?.name,
        repository: workspace.spec?.repository,
        timestamp: new Date().toISOString(),
      });
    },

    emitSessionStarted(session) {
      eventBus.emit({
        type: 'hook',
        event: 'SESSION_STARTED',
        sessionId: session.sessionId || session.metadata?.name,
        runId: session.runId,
        timestamp: new Date().toISOString(),
      });
    },

    emitSessionEnded(session) {
      eventBus.emit({
        type: 'hook',
        event: 'SESSION_ENDED',
        sessionId: session.sessionId || session.metadata?.name,
        runId: session.runId,
        timestamp: new Date().toISOString(),
      });
    },
  };
}
