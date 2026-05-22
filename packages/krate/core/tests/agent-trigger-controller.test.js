import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentTriggerController, createResource } from '../src/index.js';

function makeTriggerRule(name, spec = {}) {
  return createResource('AgentTriggerRule', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    sources: ['ci-failure'],
    agentStack: 'debug-stack',
    taskKind: 'diagnostic',
    ...spec
  });
}

function makeEvent(overrides = {}) {
  return {
    type: 'ci-failure',
    repository: 'myapp',
    ref: 'main',
    actor: 'alice',
    source: { kind: 'Pipeline', name: 'pipeline-123' },
    ...overrides
  };
}

function makeExecution(ruleName, eventUid, phase = 'Dispatched') {
  const exec = createResource('AgentTriggerExecution', { name: `exec-${ruleName}-1`, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    triggerRule: ruleName,
    sourceEvent: eventUid,
    decision: phase
  });
  exec.status = { phase };
  return exec;
}

// 1. matchRule: event type matches
test('matchRule: event type matches rule sources', () => {
  const controller = createAgentTriggerController();
  const rule = makeTriggerRule('rule-1', { sources: ['ci-failure'] });
  const event = makeEvent({ type: 'ci-failure' });

  const result = controller.matchRule(rule, event);

  assert.equal(result.matches, true);
  assert.equal(result.reason, 'All conditions met');
});

// 2. matchRule: event type doesn't match
test('matchRule: event type does not match rule sources', () => {
  const controller = createAgentTriggerController();
  const rule = makeTriggerRule('rule-2', { sources: ['ci-failure'] });
  const event = makeEvent({ type: 'webhook' });

  const result = controller.matchRule(rule, event);

  assert.equal(result.matches, false);
  assert.ok(result.reason.includes("'webhook'"), 'Reason should mention the event type');
  assert.ok(result.reason.includes('ci-failure'), 'Reason should mention the expected source');
});

// 3. matchRule: repository scope match
test('matchRule: repository scope matches', () => {
  const controller = createAgentTriggerController();
  const rule = makeTriggerRule('rule-3', { sources: ['ci-failure'], repository: 'myapp' });
  const event = makeEvent({ type: 'ci-failure', repository: 'myapp' });

  const result = controller.matchRule(rule, event);

  assert.equal(result.matches, true);
  assert.equal(result.reason, 'All conditions met');
});

// 4. matchRule: repository scope mismatch
test('matchRule: repository scope mismatch', () => {
  const controller = createAgentTriggerController();
  const rule = makeTriggerRule('rule-4', { sources: ['ci-failure'], repository: 'myapp' });
  const event = makeEvent({ type: 'ci-failure', repository: 'other' });

  const result = controller.matchRule(rule, event);

  assert.equal(result.matches, false);
  assert.ok(result.reason.includes("'other'"), 'Reason should mention the event repository');
  assert.ok(result.reason.includes("'myapp'"), 'Reason should mention the rule scope');
});

// 5. matchRule: actor filter
test('matchRule: actor not in allowedActors', () => {
  const controller = createAgentTriggerController();
  const rule = makeTriggerRule('rule-5', { sources: ['ci-failure'], allowedActors: ['alice'] });
  const event = makeEvent({ type: 'ci-failure', actor: 'bob' });

  const result = controller.matchRule(rule, event);

  assert.equal(result.matches, false);
  assert.ok(result.reason.includes("'bob'"), 'Reason should mention the rejected actor');
});

// 6. evaluateEvent: deduplication
test('evaluateEvent: marks duplicate when existing execution matches', () => {
  const controller = createAgentTriggerController();
  const rule = makeTriggerRule('rule-dedup');
  const event = makeEvent();
  const eventUid = `${event.type}:${event.source.kind}:${event.source.name}`;
  const existingExecution = makeExecution('rule-dedup', eventUid, 'Dispatched');

  const resources = {
    AgentTriggerRule: [rule],
    AgentTriggerExecution: [existingExecution]
  };

  const evaluations = controller.evaluateEvent({ event, resources });

  assert.equal(evaluations.length, 1);
  assert.equal(evaluations[0].matches, true);
  assert.equal(evaluations[0].isDuplicate, true);
});

// 7. processEvent: dispatches matching rules
test('processEvent: dispatches matching rules via dispatch controller', async () => {
  let dispatchCalled = false;
  const mockDispatchController = {
    async createManualDispatch(input) {
      dispatchCalled = true;
      const run = createResource('AgentDispatchRun', { name: `dispatch-${Date.now()}`, namespace: input.namespace }, {
        organizationRef: input.organizationRef,
        repository: input.repository,
        sourceRefs: input.sourceRefs,
        agentStack: input.agentStack,
        taskKind: input.taskKind
      });
      run.status = { phase: 'Queued' };
      return { error: false, run };
    }
  };
  const controller = createAgentTriggerController({ dispatchController: mockDispatchController });
  const rule = makeTriggerRule('rule-dispatch');
  const event = makeEvent();
  const resources = { AgentTriggerRule: [rule], AgentTriggerExecution: [] };

  const result = await controller.processEvent({ event, resources, namespace: 'krate-org-default', organizationRef: 'default' });

  assert.equal(dispatchCalled, true, 'Dispatch controller should be called');
  assert.equal(result.dispatched, 1);
  assert.equal(result.skipped, 0);
  assert.equal(result.processed, 1);
  assert.equal(result.executions.length, 1);
  assert.equal(result.executions[0].status.phase, 'Dispatched');
  assert.ok(result.executions[0].status.dispatchRunRef, 'Execution should reference the dispatch run');
});

// 8. processEvent: skips non-matching
test('processEvent: skips non-matching rules', async () => {
  const controller = createAgentTriggerController();
  const rule = makeTriggerRule('rule-skip', { sources: ['ci-failure'] });
  const event = makeEvent({ type: 'webhook' });
  const resources = { AgentTriggerRule: [rule], AgentTriggerExecution: [] };

  const result = await controller.processEvent({ event, resources });

  assert.equal(result.dispatched, 0);
  assert.equal(result.skipped, 1);
  assert.equal(result.processed, 1);
  assert.equal(result.executions[0].status.phase, 'Skipped');
});

// 9. processEvent: multiple rules match same event
test('processEvent: multiple rules match same event', async () => {
  let dispatchCount = 0;
  const mockDispatchController = {
    async createManualDispatch(input) {
      dispatchCount++;
      const run = createResource('AgentDispatchRun', { name: `dispatch-${Date.now()}-${dispatchCount}`, namespace: input.namespace }, {
        organizationRef: input.organizationRef,
        repository: input.repository,
        sourceRefs: input.sourceRefs,
        agentStack: input.agentStack,
        taskKind: input.taskKind
      });
      run.status = { phase: 'Queued' };
      return { error: false, run };
    }
  };
  const controller = createAgentTriggerController({ dispatchController: mockDispatchController });
  const rule1 = makeTriggerRule('rule-multi-1', { sources: ['ci-failure'], agentStack: 'stack-a' });
  const rule2 = makeTriggerRule('rule-multi-2', { sources: ['ci-failure'], agentStack: 'stack-b' });
  const event = makeEvent();
  const resources = { AgentTriggerRule: [rule1, rule2], AgentTriggerExecution: [] };

  const result = await controller.processEvent({ event, resources, namespace: 'krate-org-default', organizationRef: 'default' });

  assert.equal(dispatchCount, 2, 'Dispatch should be called twice');
  assert.equal(result.dispatched, 2);
  assert.equal(result.skipped, 0);
  assert.equal(result.processed, 2);
  assert.equal(result.executions.length, 2);
});

// 10. processEvent: no rules
test('processEvent: empty rules array', async () => {
  const controller = createAgentTriggerController();
  const event = makeEvent();
  const resources = { AgentTriggerRule: [], AgentTriggerExecution: [] };

  const result = await controller.processEvent({ event, resources });

  assert.equal(result.processed, 0);
  assert.equal(result.dispatched, 0);
  assert.equal(result.skipped, 0);
  assert.equal(result.executions.length, 0);
});
