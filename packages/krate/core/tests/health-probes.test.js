import assert from 'node:assert/strict';
import test from 'node:test';
import { collectKrateHealthProbes } from '../src/health-probes.js';

test('collectKrateHealthProbes runs deep dependency probes without leaking secrets', async () => {
  const requestedUrls = [];
  const result = await collectKrateHealthProbes({
    env: {
      KRATE_GITEA_HTTP_URL: 'https://gitea.internal/',
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
    timeoutMs: 25,
  });

  assert.deepEqual(requestedUrls.sort(), [
    'https://controller.internal/healthz',
    'https://gitea.internal/api/v1/version',
    'https://mux.internal/healthz',
  ]);
  assert.equal(result.kubernetes.status, 'ok');
  assert.equal(result.gitea.status, 'ok');
  assert.equal(result.agentMux.status, 'ok');
  assert.equal(result.controller.status, 'ok');
  assert.equal(result.assistant.status, 'ok');
  assert.equal(result.assistant.reason, 'valid-format');
  assert.doesNotMatch(JSON.stringify(result), /sk-ant-api03-redacted-test-key/);
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
    timeoutMs: 25,
  });

  assert.equal(result.gitea.status, 'not configured');
  assert.equal(result.agentMux.status, 'not configured');
  assert.equal(result.controller.status, 'not configured');
  assert.equal(result.assistant.status, 'not configured');
  assert.equal(result.kubernetes.status, 'error');
  assert.match(result.kubernetes.error, /kubectl missing/);
});
