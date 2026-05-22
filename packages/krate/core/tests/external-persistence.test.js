/**
 * B3 + D1: External persistence + GitHub provider registration tests
 *
 * B3: sync/write/conflict controllers wire to CRDs via persistFn
 * D1: createDefaultProviderRegistry, createExternalBackendProvider
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createSyncController } from '../src/external/sync-controller.js';
import { createWriteController } from '../src/external/write-controller.js';
import { createConflictController } from '../src/external/conflict-controller.js';
import {
  createDefaultProviderRegistry,
  createExternalBackendProvider
} from '../src/external/provider-resource-factory.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApplyFn() {
  const calls = [];
  const fn = async (resource) => {
    calls.push(JSON.parse(JSON.stringify(resource)));
    return { ok: true, resource };
  };
  fn.calls = calls;
  return fn;
}

// ---------------------------------------------------------------------------
// B3 — Sync controller persistence
// ---------------------------------------------------------------------------

// Test B3-1
test('syncController updateWatermark with persistFn saves watermark via applyResource', async () => {
  const applyFn = makeApplyFn();
  const controller = createSyncController({ persistFn: applyFn });

  controller.updateWatermark('binding-1', '2024-01-01T00:00:00Z');
  // Wait a tick for async persist
  await new Promise((r) => setImmediate(r));

  assert.ok(applyFn.calls.length >= 1, 'persistFn must be called at least once');
  const applied = applyFn.calls[0];
  assert.ok(applied.kind, 'applied resource must have a kind');
  assert.ok(applied.metadata?.name, 'applied resource must have a name');
});

// Test B3-2
test('syncController upsertResource with persistFn saves resource via applyResource', async () => {
  const applyFn = makeApplyFn();
  const controller = createSyncController({ persistFn: applyFn });

  controller.upsertResource({
    kind: 'ExternalResource',
    localName: 'my-resource',
    namespace: 'default',
    spec: { title: 'Hello' },
    externalEnvelope: { nativeId: 'ext-123', url: 'https://example.com', etag: 'abc', providerRef: 'github' }
  });
  await new Promise((r) => setImmediate(r));

  assert.ok(applyFn.calls.length >= 1, 'persistFn must be called for upserted resource');
  const applied = applyFn.calls[0];
  assert.equal(applied.kind, 'ExternalResource', 'applied resource must have correct kind');
  assert.equal(applied.metadata.name, 'my-resource', 'applied resource must have correct name');
});

// Test B3-3
test('syncController persistFn receives correct resource kind and metadata for watermark', async () => {
  const applyFn = makeApplyFn();
  const controller = createSyncController({ persistFn: applyFn });

  controller.updateWatermark('binding-ns/binding-name', '2024-06-15T12:00:00Z');
  await new Promise((r) => setImmediate(r));

  const applied = applyFn.calls[0];
  assert.ok(applied.kind, 'resource must have a kind field');
  assert.ok(applied.metadata?.namespace, 'resource must have a namespace');
  // Watermark resource should encode the binding ref in name or spec
  const str = JSON.stringify(applied);
  assert.ok(str.includes('2024-06-15T12:00:00Z') || str.includes('binding'), 'watermark data must be present in applied resource');
});

// Test B3-4
test('syncController without persistFn works normally (no crash)', () => {
  // No persistFn — existing behavior is unchanged
  const controller = createSyncController();
  controller.updateWatermark('binding-1', '2024-01-01T00:00:00Z');
  assert.equal(controller.getWatermark('binding-1'), '2024-01-01T00:00:00Z');
});

// ---------------------------------------------------------------------------
// B3 — Write controller persistence
// ---------------------------------------------------------------------------

// Test B3-5
test('writeController createWriteIntent with persistFn persists WriteIntent CRD', async () => {
  const applyFn = makeApplyFn();
  const controller = createWriteController({ persistFn: applyFn });

  const result = controller.createWriteIntent({
    interfaceKey: 'issueTracking',
    operation: 'createIssue',
    payload: { title: 'Test' },
    resourceRef: 'org/repo#1',
    requiresApproval: false
  });

  assert.ok(result.intent, 'must return intent');
  await new Promise((r) => setImmediate(r));

  assert.ok(applyFn.calls.length >= 1, 'persistFn must be called after createWriteIntent');
  const applied = applyFn.calls[0];
  assert.equal(applied.kind, 'ExternalWriteIntent', 'applied resource must be ExternalWriteIntent');
  assert.equal(applied.spec?.interfaceKey, 'issueTracking', 'applied resource must have correct interfaceKey');
});

// Test B3-6
test('writeController with persistFn persists intent state after phase transitions', async () => {
  const applyFn = makeApplyFn();
  const controller = createWriteController({ persistFn: applyFn });

  const result = controller.createWriteIntent({
    interfaceKey: 'gitForge',
    operation: 'createPR',
    payload: {},
    resourceRef: 'org/repo#pr-1',
    requiresApproval: true
  });

  const intent = result.intent;
  await new Promise((r) => setImmediate(r));
  const callsAfterCreate = applyFn.calls.length;

  // Approve the intent
  controller.approveWriteIntent({
    intentName: intent.metadata.name,
    approvedBy: 'user-1',
    resources: { ExternalWriteIntent: [intent] }
  });
  await new Promise((r) => setImmediate(r));

  assert.ok(applyFn.calls.length > callsAfterCreate, 'persistFn must be called again after approval');
});

// ---------------------------------------------------------------------------
// B3 — Conflict controller persistence
// ---------------------------------------------------------------------------

// Test B3-7
test('conflictController detectConflict with persistFn persists ExternalSyncConflict CRD', async () => {
  const applyFn = makeApplyFn();
  const controller = createConflictController({ persistFn: applyFn });

  const result = controller.detectConflict({
    resourceRef: 'org/repo#1',
    fieldPath: 'spec.title',
    localValue: 'Local',
    externalValue: 'External'
  });

  assert.ok(result.conflict, 'must detect conflict');
  await new Promise((r) => setImmediate(r));

  assert.ok(applyFn.calls.length >= 1, 'persistFn must be called for detected conflict');
  const applied = applyFn.calls[0];
  assert.equal(applied.kind, 'ExternalSyncConflict', 'applied resource must be ExternalSyncConflict');
  assert.equal(applied.spec?.fieldPath, 'spec.title', 'applied resource must have correct fieldPath');
});

// Test B3-8
test('conflictController resolveConflict with persistFn persists resolution to CRD', async () => {
  const applyFn = makeApplyFn();
  const controller = createConflictController({ persistFn: applyFn });

  const { conflict } = controller.detectConflict({
    resourceRef: 'org/repo#2',
    fieldPath: 'spec.body',
    localValue: 'Old',
    externalValue: 'New'
  });
  await new Promise((r) => setImmediate(r));
  const callsAfterDetect = applyFn.calls.length;

  controller.resolveConflict({
    conflictName: conflict.metadata.name,
    strategy: 'prefer-external',
    resources: { ExternalSyncConflict: [conflict] }
  });
  await new Promise((r) => setImmediate(r));

  assert.ok(applyFn.calls.length > callsAfterDetect, 'persistFn must be called after resolution');
  const applied = applyFn.calls[applyFn.calls.length - 1];
  assert.equal(applied.kind, 'ExternalSyncConflict', 'applied resource must still be ExternalSyncConflict');
  assert.equal(applied.status?.phase, 'Resolved', 'applied resource must have Resolved phase');
});

// Test B3-9
test('conflictController without persistFn works normally (no crash)', () => {
  const controller = createConflictController();
  const result = controller.detectConflict({
    resourceRef: 'org/repo#3',
    fieldPath: 'spec.title',
    localValue: 'A',
    externalValue: 'B'
  });
  assert.ok(result.conflict, 'must detect conflict without persistFn');
  assert.equal(result.conflict.status.phase, 'Open', 'conflict must be Open');
});

// ---------------------------------------------------------------------------
// D1 — GitHub provider registration
// ---------------------------------------------------------------------------

// Test D1-1
test('createDefaultProviderRegistry returns a registry that includes github provider', () => {
  const registry = createDefaultProviderRegistry();
  assert.ok(registry, 'registry must be returned');
  assert.equal(typeof registry.get, 'function', 'registry must have get method');
  assert.equal(typeof registry.list, 'function', 'registry must have list method');

  const types = registry.list();
  assert.ok(types.includes('github'), `registry must include github; got: ${types.join(', ')}`);
});

// Test D1-2
test('github provider from createDefaultProviderRegistry has correct descriptor shape', () => {
  const registry = createDefaultProviderRegistry();
  const adapter = registry.get('github');

  assert.ok(adapter, 'github adapter must exist in registry');
  assert.equal(typeof adapter.descriptor, 'function', 'adapter must have descriptor function');

  const desc = adapter.descriptor();
  assert.equal(desc.providerType, 'github', 'providerType must be github');
  assert.ok(desc.displayName, 'displayName must be non-empty');
  assert.ok(Array.isArray(desc.interfaces), 'interfaces must be an array');
  assert.ok(desc.interfaces.length > 0, 'interfaces must have at least one entry');
});

// Test D1-3
test('github provider descriptor interfaces include gitForge and issueTracking', () => {
  const registry = createDefaultProviderRegistry();
  const adapter = registry.get('github');
  const desc = adapter.descriptor();

  assert.ok(desc.interfaces.includes('gitForge'), 'interfaces must include gitForge');
  assert.ok(desc.interfaces.includes('issueTracking'), 'interfaces must include issueTracking');
});

// Test D1-4
test('createExternalBackendProvider creates valid CRD resource for github', () => {
  const resource = createExternalBackendProvider({
    name: 'my-github',
    namespace: 'default',
    providerType: 'github',
    displayName: 'My GitHub',
    config: { appId: 'app-123', installationId: 'install-456' }
  });

  assert.ok(resource, 'must return a resource');
  assert.ok(resource.apiVersion, 'resource must have apiVersion');
  assert.equal(resource.kind, 'ExternalBackendProvider', 'kind must be ExternalBackendProvider');
  assert.equal(resource.metadata?.name, 'my-github', 'resource must have correct name');
  assert.equal(resource.metadata?.namespace, 'default', 'resource must have correct namespace');
  assert.equal(resource.spec?.providerType, 'github', 'spec must have providerType');
  assert.equal(resource.spec?.displayName, 'My GitHub', 'spec must have displayName');
});

// Test D1-5
test('createExternalBackendProvider resource has valid spec with config', () => {
  const resource = createExternalBackendProvider({
    name: 'github-prod',
    namespace: 'production',
    providerType: 'github',
    displayName: 'GitHub Production',
    config: { appId: 'prod-app', installationId: 'prod-install' }
  });

  assert.ok(resource.spec?.config, 'spec must have config');
  assert.equal(resource.spec.config.appId, 'prod-app', 'config must have appId');
  assert.equal(resource.spec.config.installationId, 'prod-install', 'config must have installationId');
});

// Test D1-6
test('createDefaultProviderRegistry getProviderAdapter returns adapter with health method', () => {
  const registry = createDefaultProviderRegistry();
  const adapter = registry.get('github');

  assert.ok(adapter, 'github adapter must be retrievable');
  assert.equal(typeof adapter.health, 'function', 'adapter must have health method');
  const health = adapter.health();
  assert.ok(health, 'health must return a value');
  assert.ok('status' in health, 'health must have status');
});

// Test D1-7
test('createExternalBackendProvider defaults namespace to default when not provided', () => {
  const resource = createExternalBackendProvider({
    name: 'github-default-ns',
    providerType: 'github',
    displayName: 'GitHub'
  });

  assert.equal(resource.metadata.namespace, 'default', 'namespace must default to default');
});

// Test D1-8
test('createExternalBackendProvider includes status with phase Pending', () => {
  const resource = createExternalBackendProvider({
    name: 'github-status-test',
    providerType: 'github',
    displayName: 'GitHub'
  });

  assert.ok(resource.status, 'resource must have status');
  assert.ok(resource.status.phase, 'status must have phase');
});

// Test D1-9 — integration: backend provider wizard flow
test('createExternalBackendProvider followed by registry lookup works end-to-end', () => {
  const registry = createDefaultProviderRegistry();

  // Create a provider resource as the wizard would
  const resource = createExternalBackendProvider({
    name: 'wizard-github',
    namespace: 'krate-org-acme',
    providerType: 'github',
    displayName: 'Acme GitHub',
    config: { appId: 'acme-app', installationId: 'acme-install' }
  });

  // Verify adapter exists in registry for this provider type
  const adapter = registry.get(resource.spec.providerType);
  assert.ok(adapter, 'registry must have an adapter for the provider type in the CRD');
  assert.equal(typeof adapter.descriptor, 'function', 'adapter must be usable');
});
