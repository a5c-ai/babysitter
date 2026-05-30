import assert from 'node:assert/strict';
import test from 'node:test';
import { collectKrateHealthProbes } from '../src/health-probes.js';

test('collectKrateHealthProbes runs deep dependency probes without leaking secrets', async () => {
  const requestedUrls = [];
  const result = await collectKrateHealthProbes({
    env: {
      KRATE_GITEA_HTTP_URL: 'https://token-user:sk-test-secret-value@gitea.internal/',
      AGENT_MUX_URL: 'https://mux.internal',
      KRATE_CONTROLLER_URL: 'https://controller.internal',
      ANTHROPIC_API_KEY: 'sk-ant-api03-redacted-test-key',
      KRATE_KUBECTL: 'kubectl-test',
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
      status: () => ({
        transport: 'nats-jetstream',
        status: 'ok',
        durable: true,
        subject: 'krate.events',
        stream: 'KRATE_EVENTS',
      }),
    },
    timeoutMs: 25,
  });

  assert.deepEqual(requestedUrls.sort(), [
    'https://controller.internal/healthz',
    'https://mux.internal/healthz',
    'https://token-user:sk-test-secret-value@gitea.internal/api/v1/version',
  ]);
  assert.equal(result.kubernetes.status, 'ok');
  assert.equal(result.gitea.status, 'ok');
  assert.equal(result.agentMux.status, 'ok');
  assert.equal(result.controller.status, 'ok');
  assert.equal(result.assistant.status, 'ok');
  assert.equal(result.assistant.reason, 'valid-format');
  assert.equal(result.eventTransport.status, 'ok');
  assert.equal(result.eventTransport.transport, 'nats-jetstream');
  assert.equal(result.eventTransport.durable, true);
  assert.doesNotMatch(JSON.stringify(result), /sk-ant-api03-redacted-test-key/);
  assert.doesNotMatch(JSON.stringify(result), /sk-test-secret-value/);
  assert.match(result.gitea.url, /%5Bredacted%5D/);
});

test('collectKrateHealthProbes returns partial structured failures for unconfigured dependencies', async () => {
  const result = await collectKrateHealthProbes({
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
  assert.equal(result.eventTransport.status, 'ok');
  assert.equal(result.eventTransport.transport, 'memory');
  assert.match(result.kubernetes.error, /kubectl missing/);
});

test('collectKrateHealthProbes reports event transport status failures', async () => {
  const result = await collectKrateHealthProbes({
    env: {},
    fetchImpl: async () => {
      throw new Error('should not fetch unconfigured dependencies');
    },
    execFileImpl: async () => ({ stdout: '', stderr: '' }),
    eventBus: {
      status: () => {
        throw new Error('broker status failed for sk-test-secret-value');
      },
    },
    timeoutMs: 25,
  });

  assert.equal(result.eventTransport.status, 'error');
  assert.equal(result.eventTransport.reason, 'status-failed');
  assert.doesNotMatch(JSON.stringify(result.eventTransport), /sk-test-secret-value/);
});
