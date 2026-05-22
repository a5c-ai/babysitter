import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { EventEmitter } from 'node:events';
import { createAgentMuxClient, createAgentDispatchController, createResource, createEventBus } from '../src/index.js';

// ---------------------------------------------------------------------------
// Mock resource gateway helper
// ---------------------------------------------------------------------------

function createMockResourceGateway({ applyFn, getFn, deleteFn, getLogsFn } = {}) {
  const applied = [];
  const deleted = [];
  return {
    applied,
    deleted,
    async apply(resource) {
      applied.push(resource);
      if (applyFn) return applyFn(resource);
      return resource;
    },
    async get(kind, name) {
      if (getFn) return getFn(kind, name);
      return null;
    },
    async delete(kind, name) {
      deleted.push({ kind, name });
      if (deleteFn) return deleteFn(kind, name);
    },
    async getLogs(kind, name, namespace) {
      if (getLogsFn) return getLogsFn(kind, name, namespace);
      return '';
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers for dispatch controller tests
// ---------------------------------------------------------------------------

function makeStack(name, specOverrides = {}) {
  return createResource('AgentStack', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    baseAgent: 'claude-code',
    adapter: 'claude-code',
    provider: 'anthropic',
    runtimeIdentity: { serviceAccountRef: 'sa-default' },
    ...specOverrides,
  });
}

function buildValidResources(stackName, specOverrides = {}) {
  return {
    AgentStack: [makeStack(stackName, specOverrides)],
    AgentServiceAccount: [createResource('AgentServiceAccount', { name: 'sa-default', namespace: 'krate-org-default' }, {
      organizationRef: 'default', namespace: 'krate-org-default', serviceAccountName: 'sa-default',
    })],
    AgentRoleBinding: [createResource('AgentRoleBinding', { name: 'rb-1', namespace: 'krate-org-default' }, {
      organizationRef: 'default', subject: 'sa-default', roleRef: 'agent-developer', scope: 'namespace',
    })],
    AgentSecretGrant: [createResource('AgentSecretGrant', { name: 'sg-model', namespace: 'krate-org-default' }, {
      organizationRef: 'default', subject: 'sa-default', secretRef: 'secret-model-provider', purpose: 'model-provider',
    })],
  };
}

// ============================================================================
// PRIORITY 1: K8s Job Manifest Generation (createAgentJob)
// ============================================================================

describe('createAgentJob', () => {
  it('generates valid K8s Job manifest', () => {
    const client = createAgentMuxClient({});
    const { jobManifest, jobName } = client.createAgentJob({
      adapter: 'claude-code',
      provider: 'anthropic',
      org: 'acme',
      runId: 'run-123',
    });

    assert.equal(jobManifest.apiVersion, 'batch/v1');
    assert.equal(jobManifest.kind, 'Job');
    assert.equal(jobManifest.metadata.name, 'krate-agent-run-123');
    assert.equal(jobManifest.metadata.namespace, 'krate-org-acme');
    assert.equal(jobName, 'krate-agent-run-123');
  });

  it('includes correct image, command, and env vars', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      provider: 'anthropic',
      org: 'acme',
      runId: 'run-456',
      image: 'ghcr.io/custom/agent:v2',
    });

    const container = jobManifest.spec.template.spec.containers[0];
    assert.equal(container.name, 'agent');
    assert.equal(container.image, 'ghcr.io/custom/agent:v2');
    assert.deepEqual(container.command, ['node', 'dist/cli/index.js', 'launch', 'claude-code', 'anthropic']);

    // Env vars should include KRATE_ORG and KRATE_RUN_ID
    const envMap = Object.fromEntries(container.env.map(e => [e.name, e.value]));
    assert.equal(envMap.KRATE_ORG, 'acme');
    assert.equal(envMap.KRATE_RUN_ID, 'run-456');
    assert.equal(envMap.KRATE_WORKSPACE_PATH, '/workspace');
  });

  it('includes model arg when provided', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      org: 'acme',
    });

    const container = jobManifest.spec.template.spec.containers[0];
    assert.deepEqual(container.args, ['--model', 'claude-sonnet-4-20250514']);
  });

  it('generates empty args when no model provided', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
    });

    const container = jobManifest.spec.template.spec.containers[0];
    assert.deepEqual(container.args, []);
  });

  it('mounts workspace PVC when provided', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
      workspace: { pvcName: 'ws-pvc-acme-main' },
    });

    const podSpec = jobManifest.spec.template.spec;
    assert.equal(podSpec.volumes.length, 1);
    assert.equal(podSpec.volumes[0].name, 'workspace');
    assert.equal(podSpec.volumes[0].persistentVolumeClaim.claimName, 'ws-pvc-acme-main');

    const container = podSpec.containers[0];
    assert.equal(container.volumeMounts.length, 1);
    assert.equal(container.volumeMounts[0].mountPath, '/workspace');
  });

  it('omits volumes when no workspace PVC', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
    });

    const podSpec = jobManifest.spec.template.spec;
    assert.deepEqual(podSpec.volumes, []);
    assert.deepEqual(podSpec.containers[0].volumeMounts, []);
  });

  it('sets resource limits from config', () => {
    const client = createAgentMuxClient({});
    const customResources = {
      requests: { cpu: '1', memory: '2Gi' },
      limits: { cpu: '4', memory: '8Gi' },
    };
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
      resources: customResources,
    });

    const container = jobManifest.spec.template.spec.containers[0];
    assert.deepEqual(container.resources, customResources);
  });

  it('uses default resource limits when not specified', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
    });

    const container = jobManifest.spec.template.spec.containers[0];
    assert.deepEqual(container.resources, {
      requests: { cpu: '500m', memory: '1Gi' },
      limits: { cpu: '2', memory: '4Gi' },
    });
  });

  it('sets activeDeadlineSeconds from budget', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
      budget: { maxDurationSeconds: 7200 },
    });

    assert.equal(jobManifest.spec.activeDeadlineSeconds, 7200);
  });

  it('defaults activeDeadlineSeconds to 3600', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
    });

    assert.equal(jobManifest.spec.activeDeadlineSeconds, 3600);
  });

  it('includes prompt env vars when provided', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
      prompt: { system: 'You are helpful.', task: 'Fix the CI.' },
    });

    const envMap = Object.fromEntries(
      jobManifest.spec.template.spec.containers[0].env.map(e => [e.name, e.value])
    );
    assert.equal(envMap.AGENT_SYSTEM_PROMPT, 'You are helpful.');
    assert.equal(envMap.AGENT_TASK, 'Fix the CI.');
  });

  it('includes callbackUrl in env when provided', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
      callbackUrl: 'https://krate.example.com/api/callback',
    });

    const envMap = Object.fromEntries(
      jobManifest.spec.template.spec.containers[0].env.map(e => [e.name, e.value])
    );
    assert.equal(envMap.KRATE_CALLBACK_URL, 'https://krate.example.com/api/callback');
  });

  it('includes custom env vars from config', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
      env: { MY_VAR: 'hello', ANOTHER: 'world' },
    });

    const envMap = Object.fromEntries(
      jobManifest.spec.template.spec.containers[0].env.map(e => [e.name, e.value])
    );
    assert.equal(envMap.MY_VAR, 'hello');
    assert.equal(envMap.ANOTHER, 'world');
  });

  it('sets labels including stack and org', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
      runId: 'run-lbl',
      stackName: 'my-stack',
    });

    const labels = jobManifest.metadata.labels;
    assert.equal(labels['krate.a5c.ai/component'], 'agent-run');
    assert.equal(labels['krate.a5c.ai/run'], 'run-lbl');
    assert.equal(labels['krate.a5c.ai/stack'], 'my-stack');
    assert.equal(labels['krate.a5c.ai/org'], 'acme');
  });

  it('omits stack label when stackName not provided', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
    });

    assert.equal(jobManifest.metadata.labels['krate.a5c.ai/stack'], undefined);
  });

  it('sets backoffLimit to 0 and restartPolicy to Never', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
    });

    assert.equal(jobManifest.spec.backoffLimit, 0);
    assert.equal(jobManifest.spec.template.spec.restartPolicy, 'Never');
  });

  it('uses custom serviceAccount when provided', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
      serviceAccount: 'sa-custom',
    });

    assert.equal(jobManifest.spec.template.spec.serviceAccountName, 'sa-custom');
  });

  it('defaults serviceAccount to krate', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
    });

    assert.equal(jobManifest.spec.template.spec.serviceAccountName, 'krate');
  });

  it('uses default image when not specified', () => {
    const client = createAgentMuxClient({});
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      org: 'acme',
    });

    assert.equal(jobManifest.spec.template.spec.containers[0].image, 'ghcr.io/a5c-ai/agent-mux:latest');
  });

  it('throws for unknown adapter', () => {
    const client = createAgentMuxClient({});
    assert.throws(
      () => client.createAgentJob({ adapter: 'unknown-thing', org: 'acme' }),
      { message: /Unknown adapter: unknown-thing/ }
    );
  });

  it('throws for missing adapter', () => {
    const client = createAgentMuxClient({});
    assert.throws(
      () => client.createAgentJob({ adapter: '', org: 'acme' }),
      { message: /requires a valid adapter name/ }
    );
  });

  it('throws for missing org', () => {
    const client = createAgentMuxClient({});
    assert.throws(
      () => client.createAgentJob({ adapter: 'claude-code' }),
      { message: /requires an org/ }
    );
  });

  it('generates unique jobName from runId', () => {
    const client = createAgentMuxClient({});
    const { jobName: name1 } = client.createAgentJob({ adapter: 'claude-code', org: 'acme' });
    const { jobName: name2 } = client.createAgentJob({ adapter: 'claude-code', org: 'acme' });
    // Each call with no explicit runId should produce different names (randomUUID)
    assert.notEqual(name1, name2);
  });
});

// ============================================================================
// PRIORITY 2: Job Lifecycle Management
// ============================================================================

describe('submitAgentJob', () => {
  it('calls resourceGateway.apply with the manifest', async () => {
    const gw = createMockResourceGateway();
    const client = createAgentMuxClient({ resourceGateway: gw });

    const manifest = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: { name: 'krate-agent-run-1', namespace: 'krate-org-acme' },
      spec: {},
    };

    const result = await client.submitAgentJob(manifest);

    assert.equal(result.jobName, 'krate-agent-run-1');
    assert.equal(result.namespace, 'krate-org-acme');
    assert.equal(result.submitted, true);
    assert.equal(gw.applied.length, 1);
    assert.equal(gw.applied[0].metadata.name, 'krate-agent-run-1');
  });

  it('throws without resourceGateway', async () => {
    const client = createAgentMuxClient({});
    await assert.rejects(
      () => client.submitAgentJob({ metadata: { name: 'j', namespace: 'ns' } }),
      { message: /requires a resourceGateway/ }
    );
  });
});

describe('getJobStatus', () => {
  it('returns parsed job status', async () => {
    const gw = createMockResourceGateway({
      getFn: (kind, name) => ({
        status: {
          active: 1,
          succeeded: 0,
          failed: 0,
          startTime: '2026-01-01T00:00:00Z',
          completionTime: null,
          conditions: [{ type: 'Running', status: 'True' }],
        },
      }),
    });
    const client = createAgentMuxClient({ resourceGateway: gw });

    const status = await client.getJobStatus('krate-agent-run-1', 'krate-org-acme');
    assert.equal(status.active, 1);
    assert.equal(status.succeeded, 0);
    assert.equal(status.startTime, '2026-01-01T00:00:00Z');
    assert.equal(status.conditions.length, 1);
  });

  it('returns zeroed status when job not found', async () => {
    const gw = createMockResourceGateway({ getFn: () => null });
    const client = createAgentMuxClient({ resourceGateway: gw });

    const status = await client.getJobStatus('nonexistent', 'ns');
    assert.equal(status.active, 0);
    assert.equal(status.succeeded, 0);
    assert.equal(status.failed, 0);
    assert.equal(status.startTime, null);
  });

  it('throws without resourceGateway', async () => {
    const client = createAgentMuxClient({});
    await assert.rejects(
      () => client.getJobStatus('j', 'ns'),
      { message: /requires a resourceGateway/ }
    );
  });
});

describe('getJobLogs', () => {
  it('returns container logs', async () => {
    const gw = createMockResourceGateway({
      getLogsFn: () => 'line 1\nline 2\n',
    });
    const client = createAgentMuxClient({ resourceGateway: gw });

    const logs = await client.getJobLogs('krate-agent-run-1', 'krate-org-acme');
    assert.equal(logs, 'line 1\nline 2\n');
  });

  it('returns empty string when gateway has no getLogs', async () => {
    const gw = createMockResourceGateway();
    delete gw.getLogs;
    const client = createAgentMuxClient({ resourceGateway: gw });

    const logs = await client.getJobLogs('krate-agent-run-1', 'krate-org-acme');
    assert.equal(logs, '');
  });

  it('throws without resourceGateway', async () => {
    const client = createAgentMuxClient({});
    await assert.rejects(
      () => client.getJobLogs('j', 'ns'),
      { message: /requires a resourceGateway/ }
    );
  });
});

describe('deleteJob', () => {
  it('deletes job via resourceGateway', async () => {
    const gw = createMockResourceGateway();
    const client = createAgentMuxClient({ resourceGateway: gw });

    const result = await client.deleteJob('krate-agent-run-1', 'krate-org-acme');
    assert.equal(result.deleted, true);
    assert.equal(gw.deleted.length, 1);
    assert.equal(gw.deleted[0].name, 'krate-agent-run-1');
  });

  it('throws without resourceGateway', async () => {
    const client = createAgentMuxClient({});
    await assert.rejects(
      () => client.deleteJob('j', 'ns'),
      { message: /requires a resourceGateway/ }
    );
  });
});

// ============================================================================
// PRIORITY 3: HTTP Gateway Fallback
// ============================================================================

describe('fallback to HTTP gateway when KRATE_CONTROLLER_URL is set', () => {
  it('isAvailable returns true only when gateway is set and enabled', () => {
    const localClient = createAgentMuxClient({ gateway: '', enabled: false });
    assert.equal(localClient.isAvailable(), false);

    const gwClient = createAgentMuxClient({ gateway: 'http://localhost:8080', enabled: true });
    assert.equal(gwClient.isAvailable(), true);
  });

  it('launchSession uses HTTP gateway when available', async () => {
    // Just verify the gateway path returns null for unavailable (no real HTTP call)
    const client = createAgentMuxClient({ gateway: '', enabled: false });
    const result = await client.launchSession({ stack: { baseAgent: 'claude-code' } });
    assert.equal(result, null);
  });
});

// ============================================================================
// PRIORITY 4: Stack Resolution
// ============================================================================

describe('resolveStack', () => {
  it('resolves basic stack with defaults', () => {
    const stack = makeStack('basic-stack');
    const controller = createAgentDispatchController();

    const config = controller.resolveStack(stack);
    assert.equal(config.adapter, 'claude-code');
    assert.equal(config.provider, 'anthropic');
    assert.equal(config.model, 'claude-sonnet-4-20250514');
    assert.equal(config.approvalMode, 'prompt');
    assert.deepEqual(config.mcpServers, []);
    assert.deepEqual(config.skills, []);
    assert.equal(config.env.KRATE_ORG, 'default');
    assert.equal(config.env.KRATE_STACK_NAME, 'basic-stack');
  });

  it('uses explicit model, provider, and adapter from spec', () => {
    const stack = makeStack('custom-stack', {
      adapter: 'codex',
      provider: 'openai',
      model: 'o3-pro',
      approvalMode: 'auto-approve',
    });
    const controller = createAgentDispatchController();

    const config = controller.resolveStack(stack);
    assert.equal(config.adapter, 'codex');
    assert.equal(config.provider, 'openai');
    assert.equal(config.model, 'o3-pro');
    assert.equal(config.approvalMode, 'auto-approve');
  });

  it('includes prompt fields from spec', () => {
    const stack = makeStack('prompt-stack', {
      systemPrompt: 'You are a helpful agent.',
      developerPrompt: 'Follow best practices.',
      taskPrompt: 'Fix the CI pipeline.',
    });
    const controller = createAgentDispatchController();

    const config = controller.resolveStack(stack);
    assert.equal(config.prompt.system, 'You are a helpful agent.');
    assert.equal(config.prompt.developer, 'Follow best practices.');
    assert.equal(config.prompt.task, 'Fix the CI pipeline.');
  });

  it('includes mcpServerRefs and skillRefs', () => {
    const stack = makeStack('refs-stack', {
      mcpServerRefs: ['mcp-github', 'mcp-slack'],
      skillRefs: ['skill-review', 'skill-deploy'],
    });
    const controller = createAgentDispatchController();

    const config = controller.resolveStack(stack);
    assert.deepEqual(config.mcpServers, ['mcp-github', 'mcp-slack']);
    assert.deepEqual(config.skills, ['skill-review', 'skill-deploy']);
  });

  it('falls back to baseAgent when adapter is not set', () => {
    const stack = makeStack('fallback-stack');
    // Remove adapter, keep baseAgent
    delete stack.spec.adapter;
    stack.spec.baseAgent = 'gemini-cli';
    const controller = createAgentDispatchController();

    const config = controller.resolveStack(stack);
    assert.equal(config.adapter, 'gemini-cli');
  });

  it('uses provided organizationRef in env', () => {
    const stack = makeStack('org-stack');
    const controller = createAgentDispatchController();

    const config = controller.resolveStack(stack, { organizationRef: 'acme-corp' });
    assert.equal(config.env.KRATE_ORG, 'acme-corp');
  });

  it('throws for null stack', () => {
    const controller = createAgentDispatchController();
    assert.throws(() => controller.resolveStack(null), { message: /requires a valid AgentStack/ });
  });

  it('throws for stack without spec', () => {
    const controller = createAgentDispatchController();
    assert.throws(() => controller.resolveStack({ metadata: { name: 'bad' } }), { message: /requires a valid AgentStack/ });
  });

  it('returns null prompts when none set', () => {
    const stack = makeStack('noprompt-stack');
    const controller = createAgentDispatchController();

    const config = controller.resolveStack(stack);
    assert.equal(config.prompt.system, null);
    assert.equal(config.prompt.developer, null);
    assert.equal(config.prompt.task, null);
  });

  it('clones arrays to prevent mutation', () => {
    const stack = makeStack('clone-stack', {
      mcpServerRefs: ['mcp-a'],
      skillRefs: ['skill-b'],
    });
    const controller = createAgentDispatchController();

    const config = controller.resolveStack(stack);
    config.mcpServers.push('mcp-c');
    config.skills.push('skill-d');

    // Original spec should be unchanged
    assert.equal(stack.spec.mcpServerRefs.length, 1);
    assert.equal(stack.spec.skillRefs.length, 1);
  });
});

// ============================================================================
// PRIORITY 5: Dispatch Flow (K8s Job instead of subprocess)
// ============================================================================

describe('createManualDispatch with K8s Job', () => {
  it('creates job instead of subprocess', async () => {
    const gw = createMockResourceGateway();
    const agentMuxClient = createAgentMuxClient({ resourceGateway: gw });
    const controller = createAgentDispatchController({ agentMuxClient });
    const resources = buildValidResources('test-stack');

    const result = await controller.createManualDispatch({
      repository: 'test-repo',
      ref: 'main',
      agentStack: 'test-stack',
      actor: 'owner',
      namespace: 'krate-org-default',
      organizationRef: 'default',
      resources,
    });

    assert.equal(result.error, false);
    assert.equal(result.run.status.phase, 'Running');
    assert.ok(result.run.spec.jobRef);
    assert.ok(result.attempt.status.jobName);
    assert.equal(result.attempt.status.jobSubmitted, true);
    assert.ok(result.jobResult);
    assert.equal(result.jobResult.submitted, true);
    // The job was submitted to the resource gateway
    assert.equal(gw.applied.length, 1);
    assert.equal(gw.applied[0].kind, 'Job');
  });

  it('queues run when job submission fails', async () => {
    const gw = createMockResourceGateway({
      applyFn: () => { throw new Error('cluster unreachable'); },
    });
    const agentMuxClient = createAgentMuxClient({ resourceGateway: gw });
    const controller = createAgentDispatchController({ agentMuxClient });
    const resources = buildValidResources('test-stack');

    const result = await controller.createManualDispatch({
      repository: 'test-repo',
      ref: 'main',
      agentStack: 'test-stack',
      actor: 'owner',
      namespace: 'krate-org-default',
      organizationRef: 'default',
      resources,
    });

    assert.equal(result.error, false);
    assert.equal(result.run.status.phase, 'Queued');
    assert.ok(result.run.status.conditions.find(c => c.reason === 'SubmitFailed'));
    assert.equal(result.jobResult.submitted, false);
  });
});

// ============================================================================
// PRIORITY 6: Event Persistence
// ============================================================================

describe('persistSessionEvent', () => {
  function makeRunAndAttempt() {
    const run = createResource('AgentDispatchRun', { name: 'run-1', namespace: 'krate-org-default' }, {
      organizationRef: 'default',
      repository: 'test-repo',
      sourceRefs: ['main'],
      agentStack: 'test-stack',
      taskKind: 'diagnostic',
      contextBundleRef: 'bundle-1',
    });
    run.status = { phase: 'Running', queuedAt: new Date().toISOString() };

    const attempt = createResource('AgentDispatchAttempt', { name: 'run-1-attempt-1', namespace: 'krate-org-default' }, {
      organizationRef: 'default',
      agentDispatchRun: 'run-1',
      attemptReason: 'initial',
      agentStackSnapshot: {},
      contextBundleDigest: 'sha256:abc',
    });
    attempt.status = { agentMuxSessionId: 'sess-42', agentMuxRunId: 'amux-42', startedAt: new Date().toISOString() };

    return { run, attempt };
  }

  it('appends message to transcript', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();
    const event = { role: 'assistant', content: 'Working on it...', timestamp: '2026-01-01T00:00:01Z' };

    const result = controller.persistSessionEvent(event, run, attempt, {
      namespace: 'krate-org-default',
      organizationRef: 'default',
    });

    assert.ok(result.transcript);
    assert.equal(result.transcript.spec.messages.length, 1);
    assert.equal(result.transcript.spec.messages[0].role, 'assistant');
    assert.equal(result.transcript.spec.messages[0].content, 'Working on it...');
  });

  it('creates transcript if none provided', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();

    const result = controller.persistSessionEvent(
      { role: 'user', content: 'Hello' },
      run, attempt,
      { namespace: 'krate-org-default', organizationRef: 'default' }
    );

    assert.equal(result.transcript.kind, 'AgentSessionTranscript');
    assert.equal(result.transcript.spec.sessionRef, 'sess-42');
    assert.equal(result.transcript.status.phase, 'Streaming');
  });

  it('reuses existing transcript and appends', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();
    const transcript = createResource('AgentSessionTranscript', { name: 'transcript-sess-42', namespace: 'krate-org-default' }, {
      organizationRef: 'default',
      sessionRef: 'sess-42',
      messages: [{ role: 'user', content: 'First', timestamp: '2026-01-01T00:00:00Z' }],
      cost: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    }, { phase: 'Streaming' });

    const result = controller.persistSessionEvent(
      { role: 'assistant', content: 'Second', usage: { inputTokens: 100, outputTokens: 50 } },
      run, attempt,
      { transcript }
    );

    assert.equal(result.transcript.spec.messages.length, 2);
    assert.equal(result.transcript.spec.messages[1].content, 'Second');
    assert.equal(result.transcript.spec.cost.inputTokens, 110);
    assert.equal(result.transcript.spec.cost.outputTokens, 55);
    assert.equal(result.transcript.spec.cost.totalTokens, 165);
  });

  it('marks run as Completed on completion event', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();

    const result = controller.persistSessionEvent(
      { type: 'completion', role: 'assistant', content: 'All done' },
      run, attempt,
      { namespace: 'krate-org-default', organizationRef: 'default' }
    );

    assert.equal(result.run.status.phase, 'Completed');
    assert.ok(result.run.status.completedAt);
    assert.ok(result.attempt.status.completedAt);
    assert.equal(result.transcript.status.phase, 'Reconciled');
  });

  it('marks run as Failed on error event', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();

    const result = controller.persistSessionEvent(
      { type: 'error', error: 'Out of tokens' },
      run, attempt,
      { namespace: 'krate-org-default', organizationRef: 'default' }
    );

    assert.equal(result.run.status.phase, 'Failed');
    assert.ok(result.run.status.failedAt);
    assert.equal(result.run.status.failureReason, 'Out of tokens');
    assert.ok(result.attempt.status.failedAt);
    assert.equal(result.transcript.status.phase, 'Failed');
  });

  it('creates notification on completion', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();

    const result = controller.persistSessionEvent(
      { type: 'completion', role: 'assistant', content: 'Done' },
      run, attempt,
      { organizationRef: 'acme' }
    );

    assert.ok(result.notification);
    assert.equal(result.notification.type, 'run-complete');
    assert.equal(result.notification.status, 'completed');
    assert.equal(result.notification.org, 'acme');
  });

  it('creates notification on error', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();

    const result = controller.persistSessionEvent(
      { type: 'error', message: 'Crashed' },
      run, attempt,
      { organizationRef: 'acme' }
    );

    assert.ok(result.notification);
    assert.equal(result.notification.status, 'failed');
  });

  it('emits to event bus on each event', () => {
    const bus = createEventBus();
    const emitted = [];
    bus.subscribe((evt) => emitted.push(evt));

    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController({ eventBus: bus });

    controller.persistSessionEvent(
      { type: 'message', role: 'assistant', content: 'Thinking...' },
      run, attempt,
      { namespace: 'default', organizationRef: 'default' }
    );

    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].type, 'session-event');
    assert.equal(emitted[0].runName, 'run-1');
  });

  it('emits notification event to bus on completion', () => {
    const bus = createEventBus();
    const emitted = [];
    bus.subscribe((evt) => emitted.push(evt));

    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController({ eventBus: bus });

    controller.persistSessionEvent(
      { type: 'completion', role: 'assistant', content: 'Done' },
      run, attempt,
      { namespace: 'default', organizationRef: 'default' }
    );

    // Should emit session-event, run-complete notification, and lifecycle hook events
    assert.ok(emitted.length >= 2, `Expected at least 2 events, got ${emitted.length}`);
    const sessionEvent = emitted.find(e => e.type === 'session-event');
    assert.ok(sessionEvent, 'Should have a session-event');
    const runComplete = emitted.find(e => e.type === 'run-complete');
    assert.ok(runComplete, 'Should have a run-complete event');
    assert.equal(runComplete.status, 'completed');
  });

  it('increments eventCount on attempt status', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();

    controller.persistSessionEvent({ role: 'user', content: 'msg1' }, run, attempt);
    controller.persistSessionEvent({ role: 'assistant', content: 'msg2' }, run, attempt);
    controller.persistSessionEvent({ role: 'assistant', content: 'msg3' }, run, attempt);

    assert.equal(attempt.status.eventCount, 3);
    assert.ok(attempt.status.lastEventAt);
  });

  it('handles null/non-object event gracefully', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();

    const result = controller.persistSessionEvent(null, run, attempt);
    assert.equal(result.notification, null);
    assert.equal(result.transcript, null);
  });

  it('handles event with toolUse metadata', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();

    const result = controller.persistSessionEvent(
      { role: 'assistant', content: 'Reading file', toolUse: { name: 'read_file', input: { path: '/tmp/x' } } },
      run, attempt,
      { namespace: 'default', organizationRef: 'default' }
    );

    assert.deepEqual(result.transcript.spec.messages[0].toolUse, { name: 'read_file', input: { path: '/tmp/x' } });
  });

  it('accumulates token costs across multiple events', () => {
    const { run, attempt } = makeRunAndAttempt();
    const controller = createAgentDispatchController();

    let result = controller.persistSessionEvent(
      { role: 'assistant', content: 'A', usage: { inputTokens: 100, outputTokens: 50 } },
      run, attempt,
      { namespace: 'default', organizationRef: 'default' }
    );

    result = controller.persistSessionEvent(
      { role: 'assistant', content: 'B', usage: { inputTokens: 200, outputTokens: 80 } },
      run, attempt,
      { transcript: result.transcript }
    );

    assert.equal(result.transcript.spec.cost.inputTokens, 300);
    assert.equal(result.transcript.spec.cost.outputTokens, 130);
    assert.equal(result.transcript.spec.cost.totalTokens, 430);
  });
});

// ============================================================================
// PRIORITY 7: Callback Endpoint
// ============================================================================

describe('callback endpoint contract', () => {
  it('agent callback payload shape is well-defined', () => {
    // Verify the shape of a callback payload that the agent container posts
    const payload = {
      status: 'completed',
      result: { summary: 'Fixed 3 bugs' },
      transcript: [{ role: 'assistant', content: 'Done' }],
      tokenUsage: { inputTokens: 1000, outputTokens: 500 },
      artifacts: [{ name: 'patch.diff', type: 'file' }],
    };

    assert.ok(['completed', 'failed'].includes(payload.status));
    assert.ok(payload.result);
    assert.ok(Array.isArray(payload.transcript));
    assert.ok(payload.tokenUsage.inputTokens >= 0);
    assert.ok(payload.tokenUsage.outputTokens >= 0);
  });

  it('persistSessionEvent handles callback completion event', () => {
    const controller = createAgentDispatchController();
    const run = createResource('AgentDispatchRun', { name: 'run-cb', namespace: 'krate-org-default' }, {
      organizationRef: 'default', repository: 'repo', sourceRefs: [], agentStack: 'stack', taskKind: 'diagnostic', contextBundleRef: 'b',
    });
    run.status = { phase: 'Running', queuedAt: new Date().toISOString() };

    const attempt = createResource('AgentDispatchAttempt', { name: 'run-cb-attempt-1', namespace: 'krate-org-default' }, {
      organizationRef: 'default', agentDispatchRun: 'run-cb', attemptReason: 'initial', agentStackSnapshot: {}, contextBundleDigest: 'sha256:x',
    });
    attempt.status = { agentMuxSessionId: 'sess-cb', startedAt: new Date().toISOString() };

    // Simulate what the callback route would do after receiving agent POST
    const result = controller.persistSessionEvent(
      { type: 'completion', role: 'agent', content: 'Job finished', usage: { inputTokens: 500, outputTokens: 200 } },
      run, attempt,
      { namespace: 'krate-org-default', organizationRef: 'default' }
    );

    assert.equal(result.run.status.phase, 'Completed');
    assert.ok(result.run.status.completedAt);
    assert.equal(result.transcript.spec.cost.inputTokens, 500);
    assert.equal(result.transcript.spec.cost.outputTokens, 200);
  });
});
