import assert from 'node:assert/strict';
import test from 'node:test';
import { collectKradleHealthProbes } from '../src/health-probes.js';

test('collectKradleHealthProbes runs deep dependency probes without leaking secrets', async () => {
  const requestedUrls = [];
  const result = await collectKradleHealthProbes({
    env: {
      KRADLE_GITEA_HTTP_URL: 'https://gitea.internal/',
      AGENT_MUX_URL: 'https://adapter.internal',
      KRADLE_CONTROLLER_URL: 'https://controller.internal',
      ANTHROPIC_API_KEY: 'sk-ant-api03-redacted-test-key',
      KRADLE_KUBECTL: 'kubectl-test',
    },
    fetchImpl: async (url) => {
      requestedUrls.push(String(url));
      return { ok: true, status: 200 };
    },
    execFileImpl: async (command, args) => {
      assert.equal(command, 'kubectl-test');
      assert.deepEqual(args, ['cluster-info']);
      return { stdout: 'Kubernetes control plane is running', stderr: '' };
    },
    eventBus: {
      status: () => ({ transport: 'nats-jetstream', status: 'ok', durable: true, subject: 'kradle.events' }),
    },
    timeoutMs: 25,
  });

  assert.deepEqual(requestedUrls.sort(), [
    'https://adapter.internal/healthz',
    'https://controller.internal/healthz',
    'https://gitea.internal/api/v1/version',
  ]);
  assert.equal(result.kubernetes.status, 'ok');
  assert.equal(result.gitea.status, 'ok');
  assert.equal(result.agentMux.status, 'ok');
  assert.equal(result.controller.status, 'ok');
  assert.equal(result.assistant.status, 'ok');
  assert.equal(result.eventTransport.status, 'ok');
  assert.equal(result.eventTransport.transport, 'nats-jetstream');
  assert.equal(result.assistant.reason, 'valid-format');
  assert.doesNotMatch(JSON.stringify(result), /sk-ant-api03-redacted-test-key/);
});

test('collectKradleHealthProbes returns partial structured failures for unconfigured dependencies', async () => {
  const result = await collectKradleHealthProbes({
    env: {},
    fetchImpl: async () => {
      throw new Error('should not fetch unconfigured dependencies');
    },
    execFileImpl: async () => {
      throw new Error('kubectl missing');
    },
    eventBus: {
      status: () => ({ transport: 'memory', status: 'ok', durable: false }),
    },
    timeoutMs: 25,
  });

  assert.equal(result.gitea.status, 'not configured');
  assert.equal(result.agentMux.status, 'not configured');
  assert.equal(result.controller.status, 'not configured');
  assert.equal(result.assistant.status, 'not configured');
  assert.equal(result.kubernetes.status, 'error');
  assert.match(result.kubernetes.error, /kubectl missing/);
});

test('collectKradleHealthProbes strips org path from KRADLE_GITEA_HTTP_URL for health probe', async () => {
  const requestedUrls = [];
  await collectKradleHealthProbes({
    env: {
      KRADLE_GITEA_HTTP_URL: 'http://kradle-kradle-gitea-http.kradle-staging.svc.cluster.local:3000/kradle',
      KRADLE_KUBECTL: 'kubectl-test',
    },
    fetchImpl: async (url) => {
      requestedUrls.push(String(url));
      return { ok: true, status: 200 };
    },
    execFileImpl: async () => ({ stdout: 'ok', stderr: '' }),
    eventBus: { status: () => ({ transport: 'memory', status: 'ok', durable: false }) },
    timeoutMs: 25,
  });
  assert.ok(
    requestedUrls.includes('http://kradle-kradle-gitea-http.kradle-staging.svc.cluster.local:3000/api/v1/version'),
    `Expected Gitea health URL to strip /kradle path, got: ${requestedUrls.join(', ')}`
  );
});

test('collectKradleHealthProbes detects assistant with OpenAI provider and key', async () => {
  const result = await collectKradleHealthProbes({
    env: {
      KRADLE_ASSISTANT_PROVIDER: 'openai',
      OPENAI_API_KEY: 'AcuYB8hqWE1TtQerO0RN4SDk0BKI0tLZ',
      KRADLE_KUBECTL: 'kubectl-test',
    },
    fetchImpl: async () => ({ ok: true, status: 200 }),
    execFileImpl: async () => ({ stdout: 'ok', stderr: '' }),
    eventBus: { status: () => ({ transport: 'memory', status: 'ok', durable: false }) },
    timeoutMs: 25,
  });
  assert.equal(result.assistant.status, 'ok');
  assert.equal(result.assistant.provider, 'openai');
});

test('collectKradleHealthProbes redacts dependency URL credentials and event transport errors', async () => {
  const result = await collectKradleHealthProbes({
    env: {
      KRADLE_GITEA_HTTP_URL: 'https://user:pass@gitea.internal/?token=secret-token',
      KRADLE_KUBECTL: 'kubectl-test',
    },
    fetchImpl: async () => {
      throw new Error('failed https://user:pass@gitea.internal/?token=secret-token sk-ant-api03-secret');
    },
    execFileImpl: async () => ({ stdout: 'ok', stderr: '' }),
    eventBus: {
      status: () => ({ transport: 'nats-jetstream', status: 'error', reason: 'connect nats://user:pass@nats:4222?token=secret-token' }),
    },
    timeoutMs: 25,
  });

  const serialized = JSON.stringify(result);
  assert.equal(result.gitea.status, 'error');
  assert.equal(result.eventTransport.status, 'error');
  assert.doesNotMatch(serialized, /user:pass|secret-token|sk-ant-api03-secret/);
  assert.match(serialized, /\[redacted\]/);
});
