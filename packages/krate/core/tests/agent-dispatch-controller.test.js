import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import { createAgentDispatchController, createAgentMuxClient, createResource } from '../src/index.js';

function makeStack(name, spec = {}) {
  return createResource('AgentStack', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    baseAgent: 'claude-code',
    adapter: 'claude-code',
    provider: 'anthropic',
    runtimeIdentity: { serviceAccountRef: 'sa-default' },
    ...spec
  });
}

function createMockResourceGateway() {
  const applied = [];
  return {
    applied,
    async apply(resource) { applied.push(resource); return resource; },
    async get() { return null; },
    async delete() {},
  };
}

function makeServiceAccount(name) {
  return createResource('AgentServiceAccount', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    namespace: 'krate-org-default',
    serviceAccountName: name
  });
}

function makeRoleBinding(name, subject) {
  return createResource('AgentRoleBinding', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    subject,
    roleRef: 'agent-developer',
    scope: 'namespace'
  });
}

function makeSecretGrant(name, subject, purpose) {
  return createResource('AgentSecretGrant', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    subject,
    secretRef: 'secret-' + purpose,
    purpose
  });
}

function buildValidResources(stackName) {
  return {
    AgentStack: [makeStack(stackName)],
    AgentServiceAccount: [makeServiceAccount('sa-default')],
    AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-default')],
    AgentSecretGrant: [makeSecretGrant('sg-model', 'sa-default', 'model-provider')]
  };
}

test('Successful dispatch with Agent Mux available', async () => {
  // Use a mux client with a mock resource gateway so job submission succeeds
  const gw = createMockResourceGateway();
  const muxClient = createAgentMuxClient({ resourceGateway: gw });
  const resources = buildValidResources('dispatch-stack');
  const controller = createAgentDispatchController({ agentMuxClient: muxClient });

  const result = await controller.createManualDispatch({
    repository: 'test-repo',
    ref: 'main',
    agentStack: 'dispatch-stack',
    actor: 'test-user',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources
  });

  assert.equal(result.error, false, 'Dispatch should succeed');
  assert.ok(result.run, 'Result should include run resource');
  assert.ok(result.attempt, 'Result should include attempt resource');
  assert.ok(result.contextBundle, 'Result should include contextBundle resource');
  assert.ok(result.permissionSnapshot, 'Result should include permissionSnapshot');
  assert.equal(result.run.kind, 'AgentDispatchRun');
  assert.equal(result.attempt.kind, 'AgentDispatchAttempt');
  assert.equal(result.run.status.phase, 'Running', 'Run phase should be Running when job submits');
  assert.ok(result.attempt.status.jobName, 'Attempt should have jobName');
  assert.ok(result.attempt.status.jobSubmitted, 'Attempt should have jobSubmitted=true');
  assert.ok(result.attempt.status.startedAt, 'Attempt should have startedAt timestamp');
  assert.ok(result.run.spec.jobRef, 'Run should have jobRef');
  assert.ok(result.jobResult, 'Result should include jobResult');
  assert.equal(result.jobResult.submitted, true, 'Job should be submitted');
  // Verify the K8s Job was applied to the gateway
  assert.equal(gw.applied.length, 1, 'One Job should be applied');
  assert.equal(gw.applied[0].kind, 'Job', 'Applied resource should be a Job');
});

test('Dispatch with Agent Mux unavailable (no resource gateway)', async () => {
  // When no resourceGateway is provided, job submission throws
  const muxClient = createAgentMuxClient({});
  const resources = buildValidResources('dispatch-stack');
  const controller = createAgentDispatchController({ agentMuxClient: muxClient });

  const result = await controller.createManualDispatch({
    repository: 'test-repo',
    ref: 'main',
    agentStack: 'dispatch-stack',
    actor: 'test-user',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources
  });

  assert.equal(result.error, false, 'Dispatch should still succeed (queued)');
  assert.equal(result.run.status.phase, 'Queued', 'Run phase should be Queued when job submission fails');
  assert.ok(result.run.status.conditions, 'Run should have conditions');
  const jobCondition = result.run.status.conditions.find(c => c.type === 'JobSubmitted');
  assert.ok(jobCondition, 'Should have JobSubmitted condition');
  assert.equal(jobCondition.status, 'False', 'JobSubmitted should be False');
});

test('Dispatch denied by permission review', async () => {
  const resources = {
    AgentStack: [makeStack('denied-stack', { runtimeIdentity: { serviceAccountRef: 'sa-missing' } })],
    // No service account, no role binding, no secret grant — permission review will deny
  };
  const controller = createAgentDispatchController();

  const result = await controller.createManualDispatch({
    repository: 'test-repo',
    ref: 'main',
    agentStack: 'denied-stack',
    actor: 'test-user',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources
  });

  assert.equal(result.error, true, 'Dispatch should be denied');
  assert.equal(result.reason, 'permission-denied', 'Reason should be permission-denied');
  assert.ok(result.review, 'Result should include the review details');
  assert.equal(result.review.decision, 'denied');
});

test('Stack not found', async () => {
  const resources = buildValidResources('existing-stack');
  const controller = createAgentDispatchController();

  const result = await controller.createManualDispatch({
    repository: 'test-repo',
    ref: 'main',
    agentStack: 'nonexistent-stack',
    actor: 'test-user',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources
  });

  assert.equal(result.error, true, 'Dispatch should fail');
  assert.equal(result.reason, 'stack-not-found', 'Reason should be stack-not-found');
  assert.ok(result.message.includes('nonexistent-stack'), 'Message should name the missing stack');
});

test('Context bundle referenced correctly', async () => {
  const muxClient = createAgentMuxClient({ gateway: '', enabled: false });
  const resources = buildValidResources('ref-stack');
  const controller = createAgentDispatchController({ agentMuxClient: muxClient });

  const result = await controller.createManualDispatch({
    repository: 'test-repo',
    ref: 'main',
    agentStack: 'ref-stack',
    actor: 'test-user',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources
  });

  assert.equal(result.error, false, 'Dispatch should succeed');
  assert.ok(result.contextBundle.spec.digest, 'Context bundle should have a digest');
  assert.equal(
    result.attempt.spec.contextBundleDigest,
    result.contextBundle.spec.digest,
    'Attempt contextBundleDigest should match context bundle digest'
  );
  assert.equal(
    result.run.spec.contextBundleRef,
    result.contextBundle.metadata.name,
    'Run contextBundleRef should match context bundle name'
  );
});

function makeMemoryRepository(name) {
  return createResource('AgentMemoryRepository', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    repositoryRef: 'memory-repo',
    defaultBranch: 'main',
    layoutProfile: 'standard',
  });
}

test('Dispatch with AgentMemoryRepository creates memorySnapshot', async () => {
  const muxClient = createAgentMuxClient({ gateway: '', enabled: false });
  const resources = {
    ...buildValidResources('mem-stack'),
    AgentMemoryRepository: [makeMemoryRepository('org-memory')],
  };
  const controller = createAgentDispatchController({ agentMuxClient: muxClient });

  const result = await controller.createManualDispatch({
    repository: 'test-repo',
    ref: 'main',
    agentStack: 'mem-stack',
    actor: 'test-user',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources,
  });

  assert.equal(result.error, false, 'Dispatch should succeed');
  assert.ok(result.memorySnapshot, 'Result should include memorySnapshot');
  assert.equal(result.memorySnapshot.kind, 'AgentMemorySnapshot', 'memorySnapshot should be an AgentMemorySnapshot');
  assert.equal(result.memorySnapshot.spec.memoryRepository, 'org-memory', 'memorySnapshot should reference the memory repo');
  assert.equal(result.memorySnapshot.status.phase, 'Pinned', 'memorySnapshot should be Pinned');
  assert.equal(result.run.spec.memorySnapshotRef, result.memorySnapshot.metadata.name, 'Run should reference memorySnapshot');
});

test('Dispatch without memory repos has null memorySnapshot', async () => {
  const muxClient = createAgentMuxClient({ gateway: '', enabled: false });
  const resources = buildValidResources('no-mem-stack');
  const controller = createAgentDispatchController({ agentMuxClient: muxClient });

  const result = await controller.createManualDispatch({
    repository: 'test-repo',
    ref: 'main',
    agentStack: 'no-mem-stack',
    actor: 'test-user',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources,
  });

  assert.equal(result.error, false, 'Dispatch should succeed');
  assert.equal(result.memorySnapshot, null, 'memorySnapshot should be null when no AgentMemoryRepository');
  assert.equal(result.run.spec.memorySnapshotRef, undefined, 'Run should not have memorySnapshotRef');
});

test('Dispatch with requires-approval returns early with awaitingApproval', async () => {
  // Build resources where the secret grant has requiredApproval set,
  // which causes the permission reviewer to return 'requires-approval'
  const stack = makeStack('approval-stack');
  const resources = {
    AgentStack: [stack],
    AgentServiceAccount: [makeServiceAccount('sa-default')],
    AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-default')],
    AgentSecretGrant: [makeSecretGrant('sg-model', 'sa-default', 'model-provider')],
  };
  // Add requiredApproval to the secret grant so permission review returns 'requires-approval'
  resources.AgentSecretGrant[0].spec.requiredApproval = 'manager';

  const controller = createAgentDispatchController();

  const result = await controller.createManualDispatch({
    repository: 'test-repo',
    ref: 'main',
    agentStack: 'approval-stack',
    actor: 'test-user',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources,
  });

  assert.equal(result.error, false, 'Dispatch should not error — it is awaiting approval');
  assert.equal(result.awaitingApproval, true, 'Result should indicate awaitingApproval');
  assert.equal(result.run.status.phase, 'AwaitingApproval', 'Run phase should be AwaitingApproval');
  assert.ok(result.approval, 'Result should include the approval resource');
  assert.equal(result.approval.kind, 'AgentApproval', 'Approval should be an AgentApproval resource');
  assert.equal(result.approval.status.phase, 'Pending', 'Approval should be in Pending phase');
  assert.ok(result.permissionSnapshot, 'Result should include permissionSnapshot');
  // No contextBundle or attempt since we returned early
  assert.equal(result.contextBundle, undefined, 'No contextBundle when awaiting approval');
  assert.equal(result.attempt, undefined, 'No attempt when awaiting approval');
});

test('Successful launch creates jobRef on run', async () => {
  const gw = createMockResourceGateway();
  const muxClient = createAgentMuxClient({ resourceGateway: gw });
  const resources = buildValidResources('transcript-stack');
  const controller = createAgentDispatchController({ agentMuxClient: muxClient });

  const result = await controller.createManualDispatch({
    repository: 'test-repo',
    ref: 'main',
    agentStack: 'transcript-stack',
    actor: 'test-user',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources,
  });

  assert.equal(result.error, false, 'Dispatch should succeed');
  assert.equal(result.run.status.phase, 'Running', 'Run phase should be Running');
  assert.ok(result.run.spec.jobRef, 'Run should have jobRef in spec');
  assert.ok(result.attempt.status.jobName, 'Attempt should have jobName');
  assert.equal(result.attempt.status.jobSubmitted, true, 'Job should be submitted');
  assert.equal(result.jobResult.submitted, true, 'jobResult.submitted should be true');
});

// ─── Budget Enforcement Tests ───────────────────────────────────────────────

describe('checkBudget', () => {
  const controller = createAgentDispatchController();

  function makeRunWithBudget(name, budget = {}) {
    const run = createResource('AgentDispatchRun', { name, namespace: 'default' }, {
      organizationRef: 'default', repository: 'repo', sourceRefs: [], agentStack: 'stack', taskKind: 'diagnostic',
      budget,
    });
    run.status = { phase: 'Running' };
    return run;
  }

  it('returns exceeded=false when no budget set and event has no usage', () => {
    const run = makeRunWithBudget('r1');
    const result = controller.checkBudget(run, { type: 'message', role: 'assistant', content: 'hi' });
    assert.equal(result.exceeded, false);
  });

  it('returns exceeded=false when tokens under maxTokens limit', () => {
    const run = makeRunWithBudget('r2', { maxTokens: 10000 });
    const result = controller.checkBudget(run, { usage: { inputTokens: 100, outputTokens: 50 } });
    assert.equal(result.exceeded, false);
    assert.equal(result.totalTokens, 150);
  });

  it('returns exceeded=true reason=token_limit when tokens exceed maxTokens', () => {
    const run = makeRunWithBudget('r3', { maxTokens: 100 });
    const result = controller.checkBudget(run, { usage: { inputTokens: 80, outputTokens: 50 } });
    assert.equal(result.exceeded, true);
    assert.equal(result.reason, 'token_limit');
    assert.equal(result.current, 130);
    assert.equal(result.limit, 100);
  });

  it('returns exceeded=false when cost under maxCostUsd', () => {
    const run = makeRunWithBudget('r4', { maxCostUsd: 1.0 });
    // claude-sonnet: 0.003/1k input, 0.015/1k output → 100 input + 50 output = 0.0003 + 0.00075 = ~$0.00105
    const result = controller.checkBudget(run, { usage: { inputTokens: 100, outputTokens: 50 } });
    assert.equal(result.exceeded, false);
  });

  it('returns exceeded=true reason=cost_limit when cost exceeds maxCostUsd', () => {
    const run = makeRunWithBudget('r5', { maxCostUsd: 0.001 });
    // 1M input tokens at $0.003/1k = $3.00 → exceeds $0.001
    const result = controller.checkBudget(run, { usage: { inputTokens: 1000000, outputTokens: 0 } });
    assert.equal(result.exceeded, true);
    assert.equal(result.reason, 'cost_limit');
  });

  it('accumulates existing run.status.tokenUsage.totalTokens with event tokens', () => {
    const run = makeRunWithBudget('r6', { maxTokens: 10000 });
    run.status.tokenUsage = { inputTokens: 900, outputTokens: 100, totalTokens: 1000 };
    const result = controller.checkBudget(run, { usage: { inputTokens: 50, outputTokens: 50 } });
    assert.equal(result.exceeded, false);
    assert.equal(result.totalTokens, 1100);
  });

  it('accumulates existing run.status.costUsd with event cost', () => {
    const run = makeRunWithBudget('r7', { maxCostUsd: 100 });
    run.status.costUsd = 50;
    const result = controller.checkBudget(run, { usage: { inputTokens: 1000, outputTokens: 500 } });
    assert.equal(result.exceeded, false);
    assert.ok(result.totalCost > 50, 'totalCost should include existing costUsd');
  });

  it('uses Infinity limits when budget not set in spec', () => {
    const run = makeRunWithBudget('r8');
    // Very large usage — should not exceed Infinity
    const result = controller.checkBudget(run, { usage: { inputTokens: 999999999, outputTokens: 999999999 } });
    assert.equal(result.exceeded, false);
  });
});

describe('persistSessionEvent — budget enforcement', () => {
  const controller = createAgentDispatchController();

  function makeRunWithBudget(name, budget = {}) {
    const run = createResource('AgentDispatchRun', { name, namespace: 'default' }, {
      organizationRef: 'default', repository: 'repo', sourceRefs: [], agentStack: 'stack', taskKind: 'diagnostic',
      budget,
    });
    run.status = { phase: 'Running' };
    return run;
  }

  function makeAttempt(runName) {
    const attempt = createResource('AgentDispatchAttempt', { name: `${runName}-attempt-1` }, {
      organizationRef: 'default', agentDispatchRun: runName, attemptReason: 'initial', agentStackSnapshot: {},
    });
    attempt.status = { agentMuxSessionId: 'sess-1', agentMuxRunId: 'amux-1' };
    return attempt;
  }

  it('returns Failed run with failureReason=budget_exceeded when token limit exceeded', () => {
    const run = makeRunWithBudget('bp1', { maxTokens: 10 });
    const attempt = makeAttempt('bp1');
    const result = controller.persistSessionEvent(
      { type: 'message', role: 'assistant', content: 'hi', usage: { inputTokens: 5, outputTokens: 10 } },
      run, attempt
    );
    assert.equal(result.run.status.phase, 'Failed');
    assert.equal(result.run.status.failureReason, 'budget_exceeded');
    assert.ok(result.run.status.budgetExceeded);
    assert.equal(result.run.status.budgetExceeded.reason, 'token_limit');
  });

  it('budget-exceeded notification has reason=budget_exceeded', () => {
    const run = makeRunWithBudget('bp2', { maxTokens: 1 });
    const attempt = makeAttempt('bp2');
    const result = controller.persistSessionEvent(
      { type: 'message', role: 'assistant', content: 'hi', usage: { inputTokens: 5, outputTokens: 5 } },
      run, attempt
    );
    assert.ok(result.notification, 'notification should be returned');
    assert.equal(result.notification.reason, 'budget_exceeded');
    assert.equal(result.notification.status, 'failed');
  });

  it('normal event with usage accumulates tokenUsage on run.status', () => {
    const run = makeRunWithBudget('bp3', { maxTokens: 100000 });
    const attempt = makeAttempt('bp3');
    controller.persistSessionEvent(
      { type: 'message', role: 'assistant', content: 'hello', usage: { inputTokens: 100, outputTokens: 50 } },
      run, attempt
    );
    assert.ok(run.status.tokenUsage, 'run.status.tokenUsage should be set');
    assert.equal(run.status.tokenUsage.inputTokens, 100);
    assert.equal(run.status.tokenUsage.outputTokens, 50);
    assert.equal(run.status.tokenUsage.totalTokens, 150);
  });

  it('event with usage accumulates costUsd on run.status', () => {
    const run = makeRunWithBudget('bp4', { maxCostUsd: 1000 });
    const attempt = makeAttempt('bp4');
    controller.persistSessionEvent(
      { type: 'message', role: 'assistant', content: 'hello', usage: { inputTokens: 1000, outputTokens: 500 }, model: 'claude-sonnet-4-20250514' },
      run, attempt
    );
    // 1000 input at $0.003/1k + 500 output at $0.015/1k = $0.003 + $0.0075 = $0.0105
    assert.ok(run.status.costUsd > 0, 'run.status.costUsd should be set');
    assert.ok(Math.abs(run.status.costUsd - 0.0105) < 0.0001, `costUsd should be ~0.0105 but got ${run.status.costUsd}`);
  });

  it('budget check prevents event from being appended when limit exceeded', () => {
    const run = makeRunWithBudget('bp5', { maxTokens: 10 });
    const attempt = makeAttempt('bp5');
    // Pre-set transcript to check it is NOT mutated
    const existingTranscript = { spec: { messages: [] } };
    const result = controller.persistSessionEvent(
      { type: 'message', role: 'assistant', content: 'hi', usage: { inputTokens: 100, outputTokens: 100 } },
      run, attempt, { transcript: existingTranscript }
    );
    // Budget exceeded before appending — messages should still be empty
    assert.equal(result.transcript.spec.messages.length, 0);
    assert.equal(result.run.status.phase, 'Failed');
  });
});

describe('estimateCost — via checkBudget', () => {
  const controller = createAgentDispatchController();

  function makeRunWithBudget(name, budget = {}) {
    const run = createResource('AgentDispatchRun', { name, namespace: 'default' }, {
      organizationRef: 'default', repository: 'repo', sourceRefs: [], agentStack: 'stack', taskKind: 'diagnostic', budget,
    });
    run.status = { phase: 'Running' };
    return run;
  }

  it('cost is 0 when event has no usage', () => {
    const run = makeRunWithBudget('ec1');
    const result = controller.checkBudget(run, { type: 'message', role: 'assistant', content: 'hi' });
    assert.equal(result.totalCost, 0);
  });

  it('cost computed correctly for claude-sonnet-4-20250514 rates', () => {
    const run = makeRunWithBudget('ec2');
    // 1000 input @ $0.003/1k + 1000 output @ $0.015/1k = $0.003 + $0.015 = $0.018
    const result = controller.checkBudget(run, {
      usage: { inputTokens: 1000, outputTokens: 1000 },
      model: 'claude-sonnet-4-20250514',
    });
    assert.ok(Math.abs(result.totalCost - 0.018) < 0.0001, `totalCost should be ~0.018 but got ${result.totalCost}`);
  });
});
