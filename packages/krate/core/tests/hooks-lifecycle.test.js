import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHooksLifecycleEmitter, HOOKS_LIFECYCLE_BOUNDARY } from '../src/hooks-lifecycle.js';
import { createResource } from '../src/resource-model.js';
import { createAgentDispatchController } from '../src/agent-dispatch-controller.js';

function makeEventBus() {
  const events = [];
  return {
    emit(event) { events.push(event); },
    events,
  };
}

function makeRun(name, spec = {}, status = {}) {
  return createResource('AgentDispatchRun',
    { name, namespace: 'krate-org-default' },
    { organizationRef: 'default', repository: 'repo', sourceRefs: [], agentStack: 'stack-a', taskKind: 'diagnostic', ...spec },
    { phase: 'Pending', queuedAt: new Date().toISOString(), ...status }
  );
}

function makeApproval(name, spec = {}, status = {}) {
  return createResource('AgentApproval',
    { name, namespace: 'krate-org-default' },
    { organizationRef: 'default', dispatchRun: 'run-1', action: 'secret-access', requestedBy: 'user-1', ...spec },
    { phase: 'Pending', ...status }
  );
}

function makeWorkspace(name, spec = {}) {
  return createResource('KrateWorkspace',
    { name, namespace: 'krate-org-default' },
    { organizationRef: 'default', repository: 'repo', volumeSpec: {}, ...spec },
    { phase: 'Ready' }
  );
}

// ─── Factory tests ─────────────────────────────────────────────────────────

describe('HOOKS_LIFECYCLE_BOUNDARY', () => {
  it('declares expected role and scope', () => {
    assert.equal(HOOKS_LIFECYCLE_BOUNDARY.role, 'hooks-lifecycle');
    assert.ok(HOOKS_LIFECYCLE_BOUNDARY.scope.includes('Lifecycle event emission'));
  });
});

describe('createHooksLifecycleEmitter — factory', () => {
  it('throws when eventBus is null', () => {
    assert.throws(
      () => createHooksLifecycleEmitter(null),
      /requires an eventBus/
    );
  });

  it('throws when eventBus has no emit method', () => {
    assert.throws(
      () => createHooksLifecycleEmitter({ subscribe: () => {} }),
      /requires an eventBus/
    );
  });

  it('returns object with all 9 emitter methods', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    const methods = [
      'emitRunCreated', 'emitRunCompleted', 'emitStepStarted', 'emitStepEnded',
      'emitApprovalRequested', 'emitApprovalDecided', 'emitWorkspaceProvisioned',
      'emitSessionStarted', 'emitSessionEnded',
    ];
    for (const method of methods) {
      assert.equal(typeof emitter[method], 'function', `missing method: ${method}`);
    }
  });
});

// ─── emitRunCreated ─────────────────────────────────────────────────────────

describe('createHooksLifecycleEmitter — emitRunCreated', () => {
  it('emits RUN_CREATED with runId, stack, and timestamp', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    const run = makeRun('test-run-1');
    emitter.emitRunCreated(run);

    assert.equal(bus.events.length, 1);
    const ev = bus.events[0];
    assert.equal(ev.type, 'hook');
    assert.equal(ev.event, 'RUN_CREATED');
    assert.equal(ev.runId, 'test-run-1');
    assert.equal(ev.stack, 'stack-a');
    assert.ok(ev.timestamp);
  });
});

// ─── emitRunCompleted ───────────────────────────────────────────────────────

describe('createHooksLifecycleEmitter — emitRunCompleted', () => {
  it('emits RUN_COMPLETED with result and null duration when no queuedAt', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    const run = createResource('AgentDispatchRun', { name: 'r2' }, { organizationRef: 'default', repository: 'repo', sourceRefs: [], agentStack: 'stack-b', taskKind: 'diagnostic' }, { phase: 'Completed' });
    emitter.emitRunCompleted(run, { phase: 'Completed' });

    const ev = bus.events[0];
    assert.equal(ev.event, 'RUN_COMPLETED');
    assert.equal(ev.result, 'Completed');
    assert.equal(ev.duration, null);
  });

  it('emits RUN_COMPLETED with duration computed from run.status.queuedAt', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    const run = makeRun('r3', {}, { queuedAt: new Date(Date.now() - 5000).toISOString() });
    emitter.emitRunCompleted(run, { phase: 'Completed' });

    const ev = bus.events[0];
    assert.ok(ev.duration >= 4000, 'duration should be at least 4000ms');
    assert.ok(ev.duration < 10000, 'duration should be less than 10000ms');
  });
});

// ─── emitStepStarted / emitStepEnded ────────────────────────────────────────

describe('createHooksLifecycleEmitter — emitStepStarted / emitStepEnded', () => {
  it('emitStepStarted emits STEP_STARTED with runId and step', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    const run = makeRun('r4');
    emitter.emitStepStarted(run, 'launch');

    const ev = bus.events[0];
    assert.equal(ev.event, 'STEP_STARTED');
    assert.equal(ev.runId, 'r4');
    assert.equal(ev.step, 'launch');
    assert.ok(ev.timestamp);
  });

  it('emitStepEnded emits STEP_ENDED with runId, step, and result', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    const run = makeRun('r5');
    emitter.emitStepEnded(run, 'launch', { success: true });

    const ev = bus.events[0];
    assert.equal(ev.event, 'STEP_ENDED');
    assert.equal(ev.runId, 'r5');
    assert.equal(ev.step, 'launch');
    assert.deepEqual(ev.result, { success: true });
  });
});

// ─── emitApprovalRequested / emitApprovalDecided ────────────────────────────

describe('createHooksLifecycleEmitter — emitApprovalRequested / emitApprovalDecided', () => {
  it('emitApprovalRequested emits APPROVAL_REQUESTED with approvalId, action, requestedBy', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    const approval = makeApproval('appr-1');
    emitter.emitApprovalRequested(approval);

    const ev = bus.events[0];
    assert.equal(ev.event, 'APPROVAL_REQUESTED');
    assert.equal(ev.approvalId, 'appr-1');
    assert.equal(ev.action, 'secret-access');
    assert.equal(ev.requestedBy, 'user-1');
  });

  it('emitApprovalDecided emits APPROVAL_DECIDED with decision', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    const approval = makeApproval('appr-2', {}, { decision: 'approved' });
    emitter.emitApprovalDecided(approval);

    const ev = bus.events[0];
    assert.equal(ev.event, 'APPROVAL_DECIDED');
    assert.equal(ev.approvalId, 'appr-2');
    assert.equal(ev.decision, 'approved');
  });
});

// ─── emitWorkspaceProvisioned ────────────────────────────────────────────────

describe('createHooksLifecycleEmitter — emitWorkspaceProvisioned', () => {
  it('emits WORKSPACE_PROVISIONED with workspaceId and repository', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    const workspace = makeWorkspace('ws-1', { repository: 'my-repo' });
    emitter.emitWorkspaceProvisioned(workspace);

    const ev = bus.events[0];
    assert.equal(ev.event, 'WORKSPACE_PROVISIONED');
    assert.equal(ev.workspaceId, 'ws-1');
    assert.equal(ev.repository, 'my-repo');
  });
});

// ─── emitSessionStarted / emitSessionEnded ───────────────────────────────────

describe('createHooksLifecycleEmitter — emitSessionStarted / emitSessionEnded', () => {
  it('emitSessionStarted emits SESSION_STARTED with sessionId and runId', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    emitter.emitSessionStarted({ sessionId: 'sess-abc', runId: 'run-xyz' });

    const ev = bus.events[0];
    assert.equal(ev.event, 'SESSION_STARTED');
    assert.equal(ev.sessionId, 'sess-abc');
    assert.equal(ev.runId, 'run-xyz');
  });

  it('emitSessionEnded emits SESSION_ENDED with sessionId and runId', () => {
    const bus = makeEventBus();
    const emitter = createHooksLifecycleEmitter(bus);
    emitter.emitSessionEnded({ sessionId: 'sess-abc', runId: 'run-xyz' });

    const ev = bus.events[0];
    assert.equal(ev.event, 'SESSION_ENDED');
    assert.equal(ev.sessionId, 'sess-abc');
    assert.equal(ev.runId, 'run-xyz');
  });
});

// ─── Wiring in agent-dispatch-controller ────────────────────────────────────

describe('agent-dispatch-controller — lifecycleEmitter wiring', () => {
  function buildValidResources(stackName) {
    const stack = createResource('AgentStack', { name: stackName, namespace: 'krate-org-default' }, {
      organizationRef: 'default',
      baseAgent: 'claude-code',
      adapter: 'claude-code',
      runtimeIdentity: { serviceAccountRef: 'sa-default' },
    });
    const sa = createResource('AgentServiceAccount', { name: 'sa-default', namespace: 'krate-org-default' }, {
      organizationRef: 'default', namespace: 'krate-org-default', serviceAccountName: 'sa-default',
    });
    const rb = createResource('AgentRoleBinding', { name: 'rb-1', namespace: 'krate-org-default' }, {
      organizationRef: 'default', subject: 'sa-default', roleRef: 'agent-developer', scope: 'namespace',
    });
    const sg = createResource('AgentSecretGrant', { name: 'sg-1', namespace: 'krate-org-default' }, {
      organizationRef: 'default', subject: 'sa-default', secretRef: 'secret-model-provider', purpose: 'model-provider',
    });
    return { AgentStack: [stack], AgentServiceAccount: [sa], AgentRoleBinding: [rb], AgentSecretGrant: [sg] };
  }

  it('emits RUN_CREATED via lifecycleEmitter during createManualDispatch', async () => {
    const bus = makeEventBus();
    const emittedEvents = [];
    const mockLifecycleEmitter = {
      emitRunCreated(run) { emittedEvents.push({ event: 'RUN_CREATED', runId: run.metadata?.name }); },
      emitRunCompleted() {},
      emitStepStarted() {},
      emitStepEnded() {},
      emitApprovalRequested() {},
      emitApprovalDecided() {},
      emitWorkspaceProvisioned() {},
      emitSessionStarted() {},
      emitSessionEnded() {},
    };

    // Mock mux client that returns no resource gateway (no job submission)
    const mockMuxClient = {
      isAvailable() { return false; },
      createAgentJob() { throw new Error('no resource gateway'); },
      submitAgentJob() { throw new Error('no resource gateway'); },
    };

    const controller = createAgentDispatchController({
      lifecycleEmitter: mockLifecycleEmitter,
      agentMuxClient: mockMuxClient,
    });

    const resources = buildValidResources('stack-lc');
    const result = await controller.createManualDispatch({
      repository: 'test-repo',
      ref: 'main',
      agentStack: 'stack-lc',
      actor: 'test-user',
      namespace: 'krate-org-default',
      organizationRef: 'default',
      resources,
    });

    assert.equal(result.error, false);
    const created = emittedEvents.find(e => e.event === 'RUN_CREATED');
    assert.ok(created, 'RUN_CREATED should have been emitted');
    assert.ok(created.runId, 'RUN_CREATED should include runId');
  });

  it('emits WORKSPACE_PROVISIONED when workspace is created during createManualDispatch', async () => {
    const emittedEvents = [];
    const mockLifecycleEmitter = {
      emitRunCreated() {},
      emitRunCompleted() {},
      emitStepStarted() {},
      emitStepEnded() {},
      emitApprovalRequested() {},
      emitApprovalDecided() {},
      emitWorkspaceProvisioned(ws) { emittedEvents.push({ event: 'WORKSPACE_PROVISIONED', workspaceId: ws.metadata?.name }); },
      emitSessionStarted() {},
      emitSessionEnded() {},
    };

    const mockMuxClient = {
      isAvailable() { return false; },
      createAgentJob() { throw new Error('no resource gateway'); },
      submitAgentJob() { throw new Error('no resource gateway'); },
    };

    const controller = createAgentDispatchController({
      lifecycleEmitter: mockLifecycleEmitter,
      agentMuxClient: mockMuxClient,
    });

    const resources = buildValidResources('stack-ws');
    const result = await controller.createManualDispatch({
      repository: 'test-repo',
      ref: 'main',
      agentStack: 'stack-ws',
      actor: 'test-user',
      namespace: 'krate-org-default',
      organizationRef: 'default',
      resources,
    });

    assert.equal(result.error, false);
    const wsEvent = emittedEvents.find(e => e.event === 'WORKSPACE_PROVISIONED');
    assert.ok(wsEvent, 'WORKSPACE_PROVISIONED should have been emitted');
  });

  it('emits RUN_COMPLETED via lifecycleEmitter when persistSessionEvent receives completion event', () => {
    const emittedEvents = [];
    const mockLifecycleEmitter = {
      emitRunCreated() {},
      emitRunCompleted(run, result) { emittedEvents.push({ event: 'RUN_COMPLETED', result: result.phase }); },
      emitStepStarted() {},
      emitStepEnded() {},
      emitApprovalRequested() {},
      emitApprovalDecided() {},
      emitWorkspaceProvisioned() {},
      emitSessionStarted() {},
      emitSessionEnded(session) { emittedEvents.push({ event: 'SESSION_ENDED', sessionId: session.sessionId }); },
    };

    const controller = createAgentDispatchController({ lifecycleEmitter: mockLifecycleEmitter });
    const run = makeRun('run-persist');
    const attempt = createResource('AgentDispatchAttempt', { name: 'attempt-1' }, {
      organizationRef: 'default', agentDispatchRun: 'run-persist', attemptReason: 'initial',
      agentStackSnapshot: {},
    }, { agentMuxSessionId: 'sess-xyz', agentMuxRunId: 'amux-run-1' });

    controller.persistSessionEvent(
      { type: 'completion', role: 'system', content: 'done' },
      run, attempt, { namespace: 'default', organizationRef: 'default' }
    );

    const completed = emittedEvents.find(e => e.event === 'RUN_COMPLETED');
    assert.ok(completed, 'RUN_COMPLETED should have been emitted');
    assert.equal(completed.result, 'Completed');

    const ended = emittedEvents.find(e => e.event === 'SESSION_ENDED');
    assert.ok(ended, 'SESSION_ENDED should have been emitted on completion');
  });
});
