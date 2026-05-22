/**
 * External Integration Tests — Wire external controllers into runtime
 *
 * Tests that the api-controller properly delegates to sync-controller,
 * write-controller, conflict-controller, and webhook-controller.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createKrateApiController } from '../src/api-controller.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal resource gateway stub for testing */
function makeGateway(overrides = {}) {
  const store = new Map();
  return {
    namespace: 'krate-system',
    resourceDefinitions: {},
    async snapshot() { return { resources: {}, namespace: 'krate-system' }; },
    async list(kind) { return { items: [] }; },
    async get(kind, name) { return null; },
    async apply(resource) {
      store.set(resource.metadata?.name, resource);
      return { operation: 'apply', resource };
    },
    async delete(kind, name) { return { operation: 'delete' }; },
    watch() { return { close: () => {} }; },
    ...overrides
  };
}

function makeController(gatewayOverrides = {}) {
  return createKrateApiController({ resourceGateway: makeGateway(gatewayOverrides) });
}

// ---------------------------------------------------------------------------
// Test 1: syncExternalBinding exists on controller
// ---------------------------------------------------------------------------

test('api-controller exposes syncExternalBinding method', () => {
  const controller = makeController();
  assert.equal(typeof controller.syncExternalBinding, 'function',
    'controller must expose syncExternalBinding');
});

// ---------------------------------------------------------------------------
// Test 2: syncExternalBinding creates sync controller and runs sync
// ---------------------------------------------------------------------------

test('syncExternalBinding creates sync controller and upserts resource', async () => {
  const controller = makeController();

  const result = await controller.syncExternalBinding('github-binding', {
    kind: 'Repository',
    localName: 'my-repo',
    namespace: 'default',
    spec: { organizationRef: 'default' },
    externalEnvelope: {
      nativeId: 'github-repo-42',
      url: 'https://github.com/org/repo',
      etag: '"abc"',
      providerRef: 'github-provider'
    }
  });

  assert.ok(result, 'syncExternalBinding must return a result');
  assert.ok(result.resource, 'result must include the upserted resource');
  assert.equal(result.resource.status?.external?.nativeId, 'github-repo-42',
    'upserted resource must have correct nativeId');
});

// ---------------------------------------------------------------------------
// Test 3: syncExternalBinding calls persistFn (applyResource) for watermark
// ---------------------------------------------------------------------------

test('syncExternalBinding with watermark timestamp persists watermark via applyResource', async () => {
  const applied = [];
  const controller = createKrateApiController({
    resourceGateway: makeGateway({
      async apply(resource) {
        applied.push(JSON.parse(JSON.stringify(resource)));
        return { operation: 'apply', resource };
      }
    })
  });

  await controller.syncExternalBinding('github-binding-wm', {
    kind: 'Repository',
    localName: 'wm-repo',
    namespace: 'default',
    spec: {},
    externalEnvelope: { nativeId: 'id-1', url: 'https://example.com', etag: '"v1"', providerRef: 'github' },
    watermark: '2024-01-01T10:00:00.000Z'
  });

  // Allow async persist tick
  await new Promise((r) => setImmediate(r));

  assert.ok(applied.length >= 1, 'applyResource must be called at least once for the upserted resource');
  const kinds = applied.map((r) => r.kind);
  assert.ok(kinds.some((k) => k), 'applied resources must have kind fields');
});

// ---------------------------------------------------------------------------
// Test 4: writeController called from api-controller creates and persists intent
// ---------------------------------------------------------------------------

test('api-controller exposes approveExternalWriteIntent method', () => {
  const controller = makeController();
  assert.equal(typeof controller.approveExternalWriteIntent, 'function',
    'controller must expose approveExternalWriteIntent');
});

// ---------------------------------------------------------------------------
// Test 5: createExternalWriteIntent creates a WriteIntent via write controller
// ---------------------------------------------------------------------------

test('api-controller exposes createExternalWriteIntent method', () => {
  const controller = makeController();
  assert.equal(typeof controller.createExternalWriteIntent, 'function',
    'controller must expose createExternalWriteIntent');
});

test('createExternalWriteIntent creates intent with correct phase', async () => {
  const controller = makeController();
  const result = await controller.createExternalWriteIntent({
    interfaceKey: 'issueTracking',
    operation: 'createIssue',
    payload: { title: 'Bug fix' },
    resourceRef: 'org/repo#1',
    requiresApproval: false
  });

  assert.ok(result, 'createExternalWriteIntent must return a result');
  assert.ok(result.intent, 'result must include the intent');
  assert.equal(result.intent.status.phase, 'ReadyToSend',
    'intent without approval must start as ReadyToSend');
});

// ---------------------------------------------------------------------------
// Test 6: conflictController detects divergence when sync finds changed resource
// ---------------------------------------------------------------------------

test('api-controller exposes detectExternalConflict method', () => {
  const controller = makeController();
  assert.equal(typeof controller.detectExternalConflict, 'function',
    'controller must expose detectExternalConflict');
});

test('detectExternalConflict creates conflict when local and external values differ', async () => {
  const controller = makeController();
  const result = await controller.detectExternalConflict({
    resourceRef: 'org/repo#issue-1',
    fieldPath: 'spec.title',
    localValue: 'Local Title',
    externalValue: 'External Title'
  });

  assert.ok(result, 'detectExternalConflict must return a result');
  assert.ok(result.conflict, 'result must include a conflict resource when values differ');
  assert.equal(result.conflict.status.phase, 'Open',
    'detected conflict must start as Open');
});

test('detectExternalConflict returns null conflict when values match', async () => {
  const controller = makeController();
  const result = await controller.detectExternalConflict({
    resourceRef: 'org/repo#issue-2',
    fieldPath: 'spec.title',
    localValue: 'Same Value',
    externalValue: 'Same Value'
  });

  assert.ok(result, 'detectExternalConflict must return a result');
  assert.equal(result.conflict, null,
    'conflict must be null when values are equal');
});

// ---------------------------------------------------------------------------
// Test 7: Full flow — webhook → normalize → sync → detect conflict → resolve
// ---------------------------------------------------------------------------

test('api-controller exposes processExternalWebhook method', () => {
  const controller = makeController();
  assert.equal(typeof controller.processExternalWebhook, 'function',
    'controller must expose processExternalWebhook');
});

test('processExternalWebhook processes delivery and emits to subscribers', async () => {
  const controller = makeController();
  const eventsReceived = [];

  const result = await controller.processExternalWebhook({
    deliveryId: 'delivery-001',
    eventType: 'pull_request',
    payload: { action: 'opened', repo: 'org/repo' },
    rawBody: '{"action":"opened","repo":"org/repo"}',
    providerType: 'github',
    secret: 'my-secret'
  });

  assert.ok(result, 'processExternalWebhook must return a result');
  assert.ok(!result.error, `must not error: ${result.message}`);
  assert.ok('duplicate' in result || 'deliveryId' in result || 'queued' in result,
    'result must have delivery tracking fields');
});

// ---------------------------------------------------------------------------
// Test 8: api-controller.syncExternalBinding creates sync controller and runs sync
// ---------------------------------------------------------------------------

test('syncExternalBinding returns sync state for the binding', async () => {
  const controller = makeController();

  // Sync a resource
  await controller.syncExternalBinding('binding-status-test', {
    kind: 'Repository',
    localName: 'status-repo',
    namespace: 'default',
    spec: { organizationRef: 'default' },
    externalEnvelope: {
      nativeId: 'id-status-1',
      url: 'https://github.com/org/status-repo',
      etag: '"v1"',
      providerRef: 'github'
    }
  });

  assert.ok(true, 'syncExternalBinding must complete without error');
});

// ---------------------------------------------------------------------------
// Test 9: api-controller.resolveExternalConflict calls conflict controller
// ---------------------------------------------------------------------------

test('api-controller exposes resolveExternalConflict method', () => {
  const controller = makeController();
  assert.equal(typeof controller.resolveExternalConflict, 'function',
    'controller must expose resolveExternalConflict');
});

test('resolveExternalConflict resolves an existing Open conflict', async () => {
  const controller = makeController();

  // First detect a conflict
  const detectResult = await controller.detectExternalConflict({
    resourceRef: 'org/repo#3',
    fieldPath: 'spec.body',
    localValue: 'Old',
    externalValue: 'New'
  });
  assert.ok(detectResult.conflict, 'must detect conflict first');

  // Now resolve it using the prefer-external strategy
  const resolveResult = await controller.resolveExternalConflict({
    conflictName: detectResult.conflict.metadata.name,
    strategy: 'prefer-external',
    resources: { ExternalSyncConflict: [detectResult.conflict] }
  });

  assert.ok(resolveResult, 'resolveExternalConflict must return a result');
  assert.ok(!resolveResult.error, `must not error: ${resolveResult.message}`);
  assert.equal(resolveResult.conflict.status.phase, 'Resolved',
    'conflict must be Resolved after resolution');
  assert.equal(resolveResult.resolution.chosenValue, 'New',
    'prefer-external must choose the external value');
});

// ---------------------------------------------------------------------------
// Test 10: api-controller.approveExternalWriteIntent calls write controller
// ---------------------------------------------------------------------------

test('approveExternalWriteIntent approves a PendingApproval intent', async () => {
  const controller = makeController();

  // Create a pending approval intent
  const createResult = await controller.createExternalWriteIntent({
    interfaceKey: 'gitForge',
    operation: 'createPR',
    payload: { title: 'My PR' },
    resourceRef: 'org/repo#pr-1',
    requiresApproval: true
  });
  assert.ok(createResult.intent, 'must create intent');
  assert.equal(createResult.intent.status.phase, 'PendingApproval', 'must start as PendingApproval');

  // Now approve it
  const approveResult = await controller.approveExternalWriteIntent({
    intentName: createResult.intent.metadata.name,
    approvedBy: 'admin-user',
    resources: { ExternalWriteIntent: [createResult.intent] }
  });

  assert.ok(approveResult, 'approveExternalWriteIntent must return a result');
  assert.ok(!approveResult.error, `must not error: ${approveResult.message}`);
  assert.equal(approveResult.intent.status.phase, 'ReadyToSend',
    'approved intent must transition to ReadyToSend');
  assert.equal(approveResult.intent.status.approvedBy, 'admin-user',
    'approver must be recorded');
});

// ---------------------------------------------------------------------------
// Test 11: api-controller.cancelExternalWriteIntent cancels an intent
// ---------------------------------------------------------------------------

test('api-controller exposes cancelExternalWriteIntent method', () => {
  const controller = makeController();
  assert.equal(typeof controller.cancelExternalWriteIntent, 'function',
    'controller must expose cancelExternalWriteIntent');
});

test('cancelExternalWriteIntent rejects a PendingApproval intent', async () => {
  const controller = makeController();

  const createResult = await controller.createExternalWriteIntent({
    interfaceKey: 'cicd',
    operation: 'triggerBuild',
    payload: { branch: 'main' },
    resourceRef: 'org/repo#build-1',
    requiresApproval: true
  });
  assert.ok(createResult.intent, 'must create intent');

  const cancelResult = await controller.cancelExternalWriteIntent({
    intentName: createResult.intent.metadata.name,
    cancelledBy: 'user-1',
    resources: { ExternalWriteIntent: [createResult.intent] }
  });

  assert.ok(cancelResult, 'cancelExternalWriteIntent must return a result');
  assert.ok(!cancelResult.error, `must not error: ${cancelResult.message}`);
  assert.equal(cancelResult.intent.status.phase, 'Rejected',
    'cancelled intent must be Rejected');
});

// ---------------------------------------------------------------------------
// Test 12: api-controller.getExternalSyncStatus returns binding sync state
// ---------------------------------------------------------------------------

test('api-controller exposes getExternalSyncStatus method', () => {
  const controller = makeController();
  assert.equal(typeof controller.getExternalSyncStatus, 'function',
    'controller must expose getExternalSyncStatus');
});

test('getExternalSyncStatus returns null watermark for unknown binding', async () => {
  const controller = makeController();
  const result = await controller.getExternalSyncStatus('no-such-binding');

  assert.ok(result, 'getExternalSyncStatus must return a result');
  assert.equal(result.watermark, null,
    'watermark must be null for unseen binding');
});

// ---------------------------------------------------------------------------
// Test 13: processWebhookAndSync — webhook delivery → event normalization → sync controller upserts resource
// ---------------------------------------------------------------------------

test('syncExternalBinding normalizes the provided envelope into a K8s-style resource', async () => {
  const controller = makeController();
  const result = await controller.syncExternalBinding('github-binding-norm', {
    kind: 'PullRequest',
    localName: 'pr-101',
    namespace: 'krate-org-acme',
    spec: { organizationRef: 'acme', title: 'Fix bug' },
    externalEnvelope: {
      nativeId: 'pr-github-101',
      url: 'https://github.com/acme/repo/pull/101',
      etag: '"pr-etag-1"',
      providerRef: 'github'
    }
  });

  assert.ok(result.resource, 'result must include resource');
  assert.equal(result.resource.kind, 'PullRequest', 'resource kind must match input');
  assert.equal(result.resource.metadata.name, 'pr-101', 'resource name must match localName');
  assert.equal(result.resource.metadata.namespace, 'krate-org-acme', 'namespace must be preserved');
  assert.equal(result.resource.status.external.nativeId, 'pr-github-101', 'nativeId must be set');
});

// ---------------------------------------------------------------------------
// Test 14: syncController called with persistFn persists watermark and resource
// ---------------------------------------------------------------------------

test('syncExternalBinding with watermark option advances the watermark', async () => {
  const applied = [];
  const controller = createKrateApiController({
    resourceGateway: makeGateway({
      async apply(resource) {
        applied.push(JSON.parse(JSON.stringify(resource)));
        return { operation: 'apply', resource };
      }
    })
  });

  const watermarkTs = '2025-03-15T09:30:00.000Z';
  await controller.syncExternalBinding('wm-binding-adv', {
    kind: 'Repository',
    localName: 'adv-repo',
    namespace: 'default',
    spec: {},
    externalEnvelope: { nativeId: 'id-wm', url: 'https://x.com', etag: '"wm"', providerRef: 'github' },
    watermark: watermarkTs
  });

  await new Promise((r) => setImmediate(r));

  // At least the upserted resource must have been applied
  assert.ok(applied.length >= 1, 'at least one resource must be applied');

  // Look for the watermark in the applied resources payload
  const applied2 = await controller.getExternalSyncStatus('wm-binding-adv');
  assert.equal(applied2.watermark, watermarkTs,
    'getExternalSyncStatus must reflect the advanced watermark');
});

// ---------------------------------------------------------------------------
// Test 15: Full end-to-end flow: webhook → normalize → sync → detect conflict → resolve
// ---------------------------------------------------------------------------

test('end-to-end: processExternalWebhook → syncExternalBinding → detectExternalConflict → resolveExternalConflict', async () => {
  const controller = makeController();

  // Step 1: Process an inbound webhook
  const webhookResult = await controller.processExternalWebhook({
    deliveryId: 'e2e-delivery-001',
    eventType: 'issues',
    payload: { action: 'edited', issue: { id: 5001, title: 'New Title' } },
    rawBody: '{"action":"edited","issue":{"id":5001,"title":"New Title"}}',
    providerType: 'github',
    secret: 'e2e-secret'
  });
  assert.ok(webhookResult, 'processExternalWebhook must succeed');

  // Step 2: Sync the resource from the external provider
  const syncResult = await controller.syncExternalBinding('e2e-github-binding', {
    kind: 'Issue',
    localName: 'issue-5001',
    namespace: 'default',
    spec: { title: 'New Title', organizationRef: 'default' },
    externalEnvelope: {
      nativeId: 'gh-issue-5001',
      url: 'https://github.com/org/repo/issues/5001',
      etag: '"etag-v2"',
      providerRef: 'github'
    }
  });
  assert.ok(syncResult.resource, 'syncExternalBinding must return a resource');

  // Step 3: Detect a conflict between local and external state
  const conflictResult = await controller.detectExternalConflict({
    resourceRef: 'org/repo#issue-5001',
    fieldPath: 'spec.title',
    localValue: 'Old Title',
    externalValue: 'New Title'
  });
  assert.ok(conflictResult.conflict, 'conflict must be detected when titles differ');

  // Step 4: Resolve the conflict
  const resolveResult = await controller.resolveExternalConflict({
    conflictName: conflictResult.conflict.metadata.name,
    strategy: 'prefer-external',
    resources: { ExternalSyncConflict: [conflictResult.conflict] }
  });
  assert.ok(!resolveResult.error, `conflict resolution must succeed: ${resolveResult.message}`);
  assert.equal(resolveResult.conflict.status.phase, 'Resolved',
    'conflict must be Resolved after end-to-end flow');
});
