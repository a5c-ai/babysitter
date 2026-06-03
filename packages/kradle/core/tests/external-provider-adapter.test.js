import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createProviderRegistry,
  validateProviderAdapter,
  validateCapabilityManifest
} from '../src/external/provider-adapter.js';

// ---------------------------------------------------------------------------
// Acceptance criteria: Slice 3.2 — External Provider Adapter Interface
//
// Defines the ExternalProviderAdapter contract and ProviderRegistry that each
// provider (GitHub, GitLab, etc.) must implement.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers — build minimal valid adapters
// ---------------------------------------------------------------------------

function makeDescriptor(overrides = {}) {
  return {
    providerType: 'github',
    displayName: 'GitHub',
    hosting: ['cloud', 'self-hosted'],
    authModes: ['oauth2', 'pat'],
    apiCapabilities: ['issues', 'pullRequests', 'pipelines'],
    ...overrides
  };
}

function makeAdapter(overrides = {}) {
  return {
    descriptor() {
      return makeDescriptor();
    },
    health() {
      return { status: 'healthy', message: 'All systems operational' };
    },
    issueTracking: {
      listIssues: async () => [],
      createIssue: async () => ({ id: '1' })
    },
    normalizeWebhook(payload) {
      return [{ type: 'push', payload }];
    },
    verifyWebhook(request) {
      return { valid: true, reason: null };
    },
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// 1. createProviderRegistry — factory shape
// ---------------------------------------------------------------------------

test('createProviderRegistry returns registry with register, get, list methods', () => {
  const registry = createProviderRegistry();
  assert.ok(registry, 'registry must be truthy');
  assert.equal(typeof registry.register, 'function', 'registry must expose register');
  assert.equal(typeof registry.get, 'function', 'registry must expose get');
  assert.equal(typeof registry.list, 'function', 'registry must expose list');
});

// ---------------------------------------------------------------------------
// 2. register — adds adapter
// ---------------------------------------------------------------------------

test('register adds a provider adapter to the registry', () => {
  const registry = createProviderRegistry();
  const adapter = makeAdapter();
  registry.register('github', adapter);
  const retrieved = registry.get('github');
  assert.ok(retrieved, 'adapter must be retrievable after registration');
  assert.equal(retrieved, adapter, 'retrieved adapter must be the same object');
});

// ---------------------------------------------------------------------------
// 3. get — returns registered adapter
// ---------------------------------------------------------------------------

test('get returns registered adapter by type', () => {
  const registry = createProviderRegistry();
  const adapter = makeAdapter();
  registry.register('gitlab', adapter);
  const retrieved = registry.get('gitlab');
  assert.ok(retrieved, 'get must return the adapter for registered type');
  assert.equal(typeof retrieved.descriptor, 'function', 'adapter must have descriptor method');
});

// ---------------------------------------------------------------------------
// 4. get — returns null for unregistered type
// ---------------------------------------------------------------------------

test('get returns null for unregistered type', () => {
  const registry = createProviderRegistry();
  const retrieved = registry.get('bitbucket');
  assert.equal(retrieved, null, 'get must return null for unregistered type');
});

// ---------------------------------------------------------------------------
// 5. list — returns all registered adapter types
// ---------------------------------------------------------------------------

test('list returns all registered adapter types', () => {
  const registry = createProviderRegistry();
  registry.register('github', makeAdapter());
  registry.register('gitlab', makeAdapter());
  registry.register('gitea', makeAdapter());
  const types = registry.list();
  assert.ok(Array.isArray(types), 'list must return an array');
  assert.equal(types.length, 3, 'list must return exactly 3 types');
  assert.ok(types.includes('github'), 'list must include github');
  assert.ok(types.includes('gitlab'), 'list must include gitlab');
  assert.ok(types.includes('gitea'), 'list must include gitea');
});

// ---------------------------------------------------------------------------
// 6. validateProviderAdapter — accepts valid adapter
// ---------------------------------------------------------------------------

test('validateProviderAdapter accepts valid adapter (descriptor, health, at least one interface)', () => {
  const adapter = makeAdapter();
  const result = validateProviderAdapter(adapter);
  assert.equal(result.valid, true, 'valid adapter must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must have errors array');
  assert.equal(result.errors.length, 0, 'errors array must be empty for valid adapter');
});

// ---------------------------------------------------------------------------
// 7. validateProviderAdapter — rejects adapter with no interfaces
// ---------------------------------------------------------------------------

test('validateProviderAdapter rejects adapter with no interfaces', () => {
  const adapter = makeAdapter();
  delete adapter.issueTracking;
  // Remove all optional interfaces
  const noInterfaceAdapter = {
    descriptor: adapter.descriptor,
    health: adapter.health,
    normalizeWebhook: adapter.normalizeWebhook,
    verifyWebhook: adapter.verifyWebhook
  };
  const result = validateProviderAdapter(noInterfaceAdapter);
  assert.equal(result.valid, false, 'adapter with no interfaces must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /interface|issueTracking|cicd|gitForge/i.test(e)),
    'error must mention missing interfaces'
  );
});

// ---------------------------------------------------------------------------
// 8. validateProviderAdapter — rejects adapter with missing descriptor
// ---------------------------------------------------------------------------

test('validateProviderAdapter rejects adapter with missing descriptor', () => {
  const adapter = makeAdapter();
  delete adapter.descriptor;
  const result = validateProviderAdapter(adapter);
  assert.equal(result.valid, false, 'adapter without descriptor must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /descriptor/i.test(e)),
    'error must mention descriptor'
  );
});

// ---------------------------------------------------------------------------
// 9. validateProviderAdapter — rejects adapter with missing health method
// ---------------------------------------------------------------------------

test('validateProviderAdapter rejects adapter with missing health method', () => {
  const adapter = makeAdapter();
  delete adapter.health;
  const result = validateProviderAdapter(adapter);
  assert.equal(result.valid, false, 'adapter without health must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /health/i.test(e)),
    'error must mention health'
  );
});

// ---------------------------------------------------------------------------
// 10. descriptor() — shape contract
// ---------------------------------------------------------------------------

test('descriptor() returns provider type, display name, hosting modes, auth modes', () => {
  const adapter = makeAdapter();
  const desc = adapter.descriptor();
  assert.ok(desc, 'descriptor must return a value');
  assert.equal(typeof desc.providerType, 'string', 'providerType must be a string');
  assert.equal(typeof desc.displayName, 'string', 'displayName must be a string');
  assert.ok(Array.isArray(desc.hosting), 'hosting must be an array');
  assert.ok(Array.isArray(desc.authModes), 'authModes must be an array');
  assert.ok(desc.hosting.length > 0, 'hosting must have at least one mode');
  assert.ok(desc.authModes.length > 0, 'authModes must have at least one mode');
});

// ---------------------------------------------------------------------------
// 11. validateCapabilityManifest — accepts valid manifest
// ---------------------------------------------------------------------------

test('validateCapabilityManifest accepts valid manifest (providerType, interfaces)', () => {
  const manifest = {
    providerType: 'github',
    interfaces: ['issueTracking', 'gitForge']
  };
  const result = validateCapabilityManifest(manifest);
  assert.equal(result.valid, true, 'valid manifest must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must have errors array');
  assert.equal(result.errors.length, 0, 'errors must be empty for valid manifest');
});

// ---------------------------------------------------------------------------
// 12. validateCapabilityManifest — rejects missing providerType
// ---------------------------------------------------------------------------

test('validateCapabilityManifest rejects missing providerType', () => {
  const manifest = {
    interfaces: ['issueTracking']
  };
  const result = validateCapabilityManifest(manifest);
  assert.equal(result.valid, false, 'manifest without providerType must fail');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /providerType/i.test(e)),
    'error must mention providerType'
  );
});

// ---------------------------------------------------------------------------
// 13. validateCapabilityManifest — rejects manifest with no supported interfaces
// ---------------------------------------------------------------------------

test('validateCapabilityManifest rejects manifest with no supported interfaces', () => {
  const manifest = {
    providerType: 'github',
    interfaces: []
  };
  const result = validateCapabilityManifest(manifest);
  assert.equal(result.valid, false, 'manifest with empty interfaces must fail');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /interface/i.test(e)),
    'error must mention interfaces'
  );
});

// ---------------------------------------------------------------------------
// 14. normalizeWebhook — adapter must have normalizeWebhook method
// ---------------------------------------------------------------------------

test('normalizeWebhook contract — adapter must have normalizeWebhook method', () => {
  const adapter = makeAdapter();
  assert.equal(typeof adapter.normalizeWebhook, 'function', 'adapter must have normalizeWebhook');
  const payload = { event: 'push', ref: 'refs/heads/main', repository: { full_name: 'org/repo' } };
  const events = adapter.normalizeWebhook(payload);
  assert.ok(Array.isArray(events), 'normalizeWebhook must return an array');
  assert.ok(events.length > 0, 'normalizeWebhook must return at least one event');
  assert.ok('type' in events[0], 'each normalized event must have a type field');
});

// ---------------------------------------------------------------------------
// 15. verifyWebhook — adapter must have verifyWebhook method
// ---------------------------------------------------------------------------

test('verifyWebhook contract — adapter must have verifyWebhook method', () => {
  const adapter = makeAdapter();
  assert.equal(typeof adapter.verifyWebhook, 'function', 'adapter must have verifyWebhook');
  const request = { headers: { 'x-hub-signature-256': 'sha256=abc123' }, body: '{}' };
  const result = adapter.verifyWebhook(request);
  assert.ok(result, 'verifyWebhook must return a result');
  assert.ok('valid' in result, 'result must have a valid property');
  assert.equal(typeof result.valid, 'boolean', 'valid must be a boolean');
});

// ---------------------------------------------------------------------------
// 16. validateProviderAdapter — accepts adapter with cicd interface
// ---------------------------------------------------------------------------

test('validateProviderAdapter accepts adapter with cicd interface instead of issueTracking', () => {
  const adapter = {
    descriptor() { return makeDescriptor(); },
    health() { return { status: 'healthy', message: 'ok' }; },
    cicd: {
      listPipelines: async () => [],
      triggerPipeline: async () => ({ id: 'run-1' })
    },
    normalizeWebhook(payload) { return [{ type: 'pipeline', payload }]; },
    verifyWebhook(request) { return { valid: true, reason: null }; }
  };
  const result = validateProviderAdapter(adapter);
  assert.equal(result.valid, true, 'adapter with cicd interface must pass validation');
  assert.equal(result.errors.length, 0, 'no errors for valid cicd adapter');
});

// ---------------------------------------------------------------------------
// 17. validateProviderAdapter — accepts adapter with gitForge interface
// ---------------------------------------------------------------------------

test('validateProviderAdapter accepts adapter with gitForge interface instead of issueTracking', () => {
  const adapter = {
    descriptor() { return makeDescriptor(); },
    health() { return { status: 'healthy', message: 'ok' }; },
    gitForge: {
      listRepositories: async () => [],
      createRepository: async () => ({ id: 'repo-1' })
    },
    normalizeWebhook(payload) { return [{ type: 'push', payload }]; },
    verifyWebhook(request) { return { valid: true, reason: null }; }
  };
  const result = validateProviderAdapter(adapter);
  assert.equal(result.valid, true, 'adapter with gitForge interface must pass validation');
  assert.equal(result.errors.length, 0, 'no errors for valid gitForge adapter');
});

// ---------------------------------------------------------------------------
// 18. health() — shape contract
// ---------------------------------------------------------------------------

test('health() returns status and message with valid status value', () => {
  const adapter = makeAdapter();
  const result = adapter.health();
  assert.ok(result, 'health must return a value');
  assert.ok('status' in result, 'health result must have status');
  assert.ok('message' in result, 'health result must have message');
  const VALID_STATUSES = ['healthy', 'degraded', 'unavailable'];
  assert.ok(VALID_STATUSES.includes(result.status), `status must be one of ${VALID_STATUSES.join(', ')}`);
});

// ---------------------------------------------------------------------------
// 19. validateCapabilityManifest — rejects invalid interface names
// ---------------------------------------------------------------------------

test('validateCapabilityManifest rejects unknown interface names', () => {
  const manifest = {
    providerType: 'github',
    interfaces: ['unknownInterface']
  };
  const result = validateCapabilityManifest(manifest);
  assert.equal(result.valid, false, 'manifest with unknown interface must fail');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /interface|unknown|invalid/i.test(e)),
    'error must mention invalid interface'
  );
});

// ---------------------------------------------------------------------------
// 20. registry — overwriting same type updates the registration
// ---------------------------------------------------------------------------

test('registry allows re-registering a provider type with a new adapter', () => {
  const registry = createProviderRegistry();
  const adapterV1 = makeAdapter();
  const adapterV2 = makeAdapter({ normalizeWebhook: (p) => [{ type: 'v2', payload: p }] });
  registry.register('github', adapterV1);
  registry.register('github', adapterV2);
  const retrieved = registry.get('github');
  assert.equal(retrieved, adapterV2, 'second registration should overwrite the first');
  const types = registry.list();
  assert.equal(types.filter((t) => t === 'github').length, 1, 'github should appear only once in list');
});
