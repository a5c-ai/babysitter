/**
 * SDK Integration Tests — Verify SDK exports work together
 *
 * Tests that the krate-sdk exports function correctly as an integrated unit:
 * controller creation, auth roundtrip, resource model, and atlas graph client.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createKrateApiController,
  createControllerUiModel,
  createAuthProviderConfig,
  createSessionCookie,
  parseSessionCookie,
  createResource,
  clone,
  resourceToYaml,
  STACK_LAYERS,
  COMPOSITION_FACETS,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Mock gateway helper (same pattern as core integration tests)
// ---------------------------------------------------------------------------

function createMockGateway() {
  const store = new Map();
  return {
    namespace: 'krate-org-sdk-test',
    async apply(resource) {
      store.set(`${resource.kind}/${resource.metadata.name}`, resource);
      return { operation: 'apply', resource };
    },
    async list(kind) {
      return { items: [...store.values()].filter((r) => r.kind === kind) };
    },
    async get(kind, name) {
      return { resource: store.get(`${kind}/${name}`) || null };
    },
    async delete(kind, name) {
      store.delete(`${kind}/${name}`);
      return { operation: 'delete' };
    },
    async snapshot() {
      const byKind = {};
      for (const resource of store.values()) {
        if (!byKind[resource.kind]) byKind[resource.kind] = [];
        byKind[resource.kind].push(resource);
      }
      return { namespace: 'krate-org-sdk-test', resources: byKind };
    },
    watch() { return { close: () => {} }; },
    resourceDefinitions: [],
  };
}

// ---------------------------------------------------------------------------
// Test 1: Controller via SDK — apply resource → list includes it
// ---------------------------------------------------------------------------

test('SDK integration: create controller → apply resource → list includes it', async () => {
  const gw = createMockGateway();
  const controller = createKrateApiController({ resourceGateway: gw });

  assert.equal(typeof controller.applyResource, 'function', 'controller must have applyResource');
  assert.equal(typeof controller.listResource, 'function', 'controller must have listResource');

  // Apply a Repository resource
  const repo = createResource(
    'Repository',
    { name: 'sdk-test-repo', namespace: 'krate-org-sdk-test' },
    { organizationRef: 'sdk-test', visibility: 'internal' }
  );
  const applyResult = await controller.applyResource(repo);
  assert.equal(applyResult.operation, 'apply', 'apply must return operation: apply');

  // List repositories — should include the one we applied
  const listResult = await controller.listResource('Repository');
  assert.ok(Array.isArray(listResult.items), 'listResource must return items array');
  const found = listResult.items.find((r) => r.metadata?.name === 'sdk-test-repo');
  assert.ok(found, 'sdk-test-repo should appear in list');
  assert.equal(found.spec?.visibility, 'internal');
});

// ---------------------------------------------------------------------------
// Test 2: createControllerUiModel with snapshot returns valid model
// ---------------------------------------------------------------------------

test('SDK integration: createControllerUiModel with snapshot returns valid model', () => {
  const snapshot = {
    namespace: 'krate-system',
    resources: {
      Repository: [
        { kind: 'Repository', metadata: { name: 'test-repo', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', visibility: 'internal' } },
      ],
      AgentStack: [
        { kind: 'AgentStack', metadata: { name: 'review-bot', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', baseAgent: 'claude-code', adapter: 'default', runtimeIdentity: 'workspace' } },
      ],
    },
  };

  const model = createControllerUiModel(snapshot);

  assert.ok(model, 'model must be returned');
  assert.equal(typeof model.status, 'string', 'model must have status string');
  assert.ok(Array.isArray(model.resources), 'model.resources must be an array');
  assert.ok(model.namespace || model.org || model.status, 'model must have basic structure');
});

// ---------------------------------------------------------------------------
// Test 3: Auth roundtrip — createSessionCookie → parseSessionCookie
// ---------------------------------------------------------------------------

test('SDK integration: createSessionCookie → parseSessionCookie roundtrip', () => {
  const config = createAuthProviderConfig({ KRATE_AUTH_COOKIE_NAME: 'krate_sdk_test' });

  const cookie = createSessionCookie(config, { provider: 'sso', subject: 'sdk-user-1', username: 'sdkuser' });
  assert.ok(cookie, 'cookie must be created');
  assert.ok(cookie.includes('krate_sdk_test='), 'cookie must have the configured cookie name');

  // Extract just the cookie value
  const cookieValue = cookie.match(/krate_sdk_test=([^;]+)/)?.[1];
  assert.ok(cookieValue, 'must extract cookie value');

  // Parse it back
  const parsed = parseSessionCookie(config, cookieValue);
  assert.ok(parsed, 'must parse cookie');
  assert.equal(parsed.subject, 'sdk-user-1', 'subject must be preserved');
  assert.equal(parsed.user, 'sdkuser', 'username must be preserved');
  assert.equal(parsed.provider, 'sso', 'provider must be preserved');
  assert.equal(parsed.cookieName, 'krate_sdk_test');
});

// ---------------------------------------------------------------------------
// Test 4: Resource model — createResource → clone → resourceToYaml
// ---------------------------------------------------------------------------

test('SDK integration: createResource → clone → resourceToYaml produces valid YAML', () => {
  const repo = createResource(
    'Repository',
    { name: 'yaml-test-repo', namespace: 'krate-org-yaml' },
    { organizationRef: 'yaml-org', visibility: 'private' }
  );

  assert.equal(repo.kind, 'Repository');
  assert.equal(repo.metadata.name, 'yaml-test-repo');

  // Clone it
  const cloned = clone(repo);
  assert.ok(cloned, 'clone must succeed');
  assert.equal(cloned.kind, repo.kind);
  assert.equal(cloned.metadata.name, repo.metadata.name);
  assert.notEqual(cloned, repo, 'clone must be a different object reference');

  // Convert to YAML
  const yaml = resourceToYaml(repo);
  assert.ok(typeof yaml === 'string', 'resourceToYaml must return a string');
  assert.ok(yaml.includes('kind: Repository'), 'YAML must contain kind: Repository');
  assert.ok(yaml.includes('name: yaml-test-repo'), 'YAML must contain the resource name');
  assert.ok(yaml.includes('spec:'), 'YAML must contain spec:');
  assert.ok(yaml.includes('visibility: private'), 'YAML must contain visibility field');
});

// ---------------------------------------------------------------------------
// Test 5: Atlas graph client — STACK_LAYERS and COMPOSITION_FACETS
// ---------------------------------------------------------------------------

test('SDK integration: STACK_LAYERS and COMPOSITION_FACETS are well-formed', () => {
  // STACK_LAYERS
  assert.ok(Array.isArray(STACK_LAYERS), 'STACK_LAYERS must be an array');
  assert.ok(STACK_LAYERS.length >= 3, `STACK_LAYERS must have at least 3 items, got ${STACK_LAYERS.length}`);

  for (const layer of STACK_LAYERS) {
    assert.ok(layer.key, `each layer must have a key, missing in: ${JSON.stringify(layer)}`);
    assert.ok(layer.label, `each layer must have a label, missing in: ${JSON.stringify(layer)}`);
    assert.ok(Array.isArray(layer.atlasKinds), `each layer must have atlasKinds array, missing in: ${JSON.stringify(layer)}`);
  }

  // First layer should be the model layer
  assert.ok(STACK_LAYERS[0].label.toLowerCase().includes('model'), 'first layer should be Model');

  // COMPOSITION_FACETS
  assert.ok(Array.isArray(COMPOSITION_FACETS), 'COMPOSITION_FACETS must be an array');
  assert.ok(COMPOSITION_FACETS.length >= 2, `COMPOSITION_FACETS must have at least 2 items, got ${COMPOSITION_FACETS.length}`);

  for (const facet of COMPOSITION_FACETS) {
    assert.ok(facet.key, `each facet must have a key`);
    assert.ok(facet.label, `each facet must have a label`);
    assert.ok(Array.isArray(facet.atlasKinds), `each facet must have atlasKinds array`);
  }
});
