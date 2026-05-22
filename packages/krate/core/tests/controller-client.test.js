import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchControllerUiModel, createControllerUiModel, createResource } from '../src/index.js';

function degradedRemoteModel() {
  return createControllerUiModel({
    source: 'controller-api',
    namespace: 'krate-staging',
    kubectl: { available: false, context: null, errors: ['fetch failed'] },
    resources: {},
    crds: [],
    events: [],
    permissions: [],
    storage: {},
    commands: []
  }, { organization: 'default' });
}

function liveSnapshot() {
  return {
    source: 'kubernetes',
    namespace: 'krate-staging',
    kubectl: { available: true, context: 'aks-krate-staging', errors: [] },
    apiService: { metadata: { name: 'v1alpha1.krate.a5c.ai' } },
    crds: [{ metadata: { name: 'repositories.krate.a5c.ai' } }],
    resources: {
      Organization: [createResource('Organization', { name: 'default', namespace: 'krate-system' }, { slug: 'default', namespaceName: 'krate-org-default', displayName: 'Default org' })],
      Repository: [createResource('Repository', { name: 'test2', namespace: 'krate-org-default' }, { organizationRef: 'default', visibility: 'internal', defaultBranch: 'main' })]
    },
    events: [],
    permissions: [],
    storage: {},
    commands: []
  };
}

test('fetchControllerUiModel falls back to local snapshot when remote controller returns degraded empty data', async () => {
  const calls = [];
  const model = await fetchControllerUiModel({
    controllerUrl: 'http://krate-api.krate-staging.svc.cluster.local',
    organization: 'default',
    useCache: false,
    fetchImpl: async () => ({ ok: true, json: async () => degradedRemoteModel() }),
    controller: { async snapshot() { calls.push('snapshot'); return liveSnapshot(); } }
  });

  assert.deepEqual(calls, ['snapshot']);
  assert.equal(model.status, 'ready');
  assert.equal(model.metrics.repositories, 1);
  assert.equal(model.views.dashboard.repositories[0].metadata.name, 'test2');
  assert.ok(model.controller.connection.errors.length > 0);
});

test('fetchControllerUiModel falls back to local snapshot when remote controller fetch throws', async () => {
  const model = await fetchControllerUiModel({
    controllerUrl: 'http://krate-api.krate-staging.svc.cluster.local',
    organization: 'default',
    useCache: false,
    fetchImpl: async () => { throw new Error('connect ECONNREFUSED'); },
    controller: { async snapshot() { return liveSnapshot(); } }
  });

  assert.equal(model.status, 'ready');
  assert.equal(model.metrics.repositories, 1);
  assert.match(model.controller.connection.errors[0], /ECONNREFUSED/);
});
test('fetchControllerUiModel uses bounded async fallback when remote controller hangs', async () => {
  const calls = [];
  const model = await fetchControllerUiModel({
    controllerUrl: 'http://krate-api.krate-staging.svc.cluster.local',
    organization: 'default',
    requestTimeoutMs: 10,
    useCache: false,
    fetchImpl: async (_target, options = {}) => new Promise((_resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('remote controller hung')), 25);
      options.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('remote controller hung'));
      }, { once: true });
    }),
    fallbackSnapshot: async () => { calls.push('fallbackSnapshot'); return liveSnapshot(); }
  });

  assert.deepEqual(calls, ['fallbackSnapshot']);
  assert.equal(model.status, 'ready');
  assert.equal(model.metrics.repositories, 1);
  assert.match(model.controller.connection.errors.join('; '), /remote controller hung/);
});

test('fetchControllerUiModel uses async fallback for degraded empty remote data without constructing sync controller', async () => {
  const calls = [];
  const model = await fetchControllerUiModel({
    controllerUrl: 'http://krate-api.krate-staging.svc.cluster.local',
    organization: 'default',
    useCache: false,
    fetchImpl: async () => ({ ok: true, json: async () => degradedRemoteModel() }),
    fallbackSnapshot: async () => { calls.push('fallbackSnapshot'); return liveSnapshot(); }
  });

  assert.deepEqual(calls, ['fallbackSnapshot']);
  assert.equal(model.status, 'ready');
  assert.equal(model.views.dashboard.repositories[0].metadata.name, 'test2');
  assert.ok(model.controller.connection.errors.length > 0);
});


test('fetchControllerUiModel probes local snapshot when remote controller is ready but missing CRD-backed resources', async () => {
  const calls = [];
  const emptyRemote = createControllerUiModel({
    source: 'kubernetes',
    namespace: 'krate-staging',
    kubectl: { available: true, context: 'aks-krate-staging', errors: [] },
    apiService: { metadata: { name: 'v1alpha1.krate.a5c.ai' } },
    resources: {},
    crds: [],
    events: [],
    permissions: [],
    storage: {},
    commands: []
  }, { organization: 'default' });

  const model = await fetchControllerUiModel({
    controllerUrl: 'http://krate-api.krate-staging.svc.cluster.local',
    organization: 'default',
    useCache: false,
    fetchImpl: async () => ({ ok: true, json: async () => emptyRemote }),
    fallbackSnapshot: async () => { calls.push('fallbackSnapshot'); return liveSnapshot(); }
  });

  assert.deepEqual(calls, ['fallbackSnapshot']);
  assert.equal(model.metrics.repositories, 1);
  assert.equal(model.views.dashboard.repositories[0].metadata.name, 'test2');
});
