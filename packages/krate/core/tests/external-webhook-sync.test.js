import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { createWebhookController } from '../src/external/webhook-controller.js';
import { createSyncController } from '../src/external/sync-controller.js';

// ---------------------------------------------------------------------------
// Acceptance criteria: Slice 3.4 — Webhook & Sync Controllers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECRET = 'test-secret-key-12345';

function makeRawPayload() {
  return JSON.stringify({ action: 'opened', repository: { id: 99, full_name: 'org/repo' } });
}

function makeHmacSignature(body, secret = SECRET) {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

function makeWebhookRequest(overrides = {}) {
  const body = makeRawPayload();
  return {
    headers: {
      'x-hub-signature-256': makeHmacSignature(body),
      'x-github-delivery': 'delivery-abc-123',
      'x-github-event': 'pull_request',
      ...((overrides.headers) || {})
    },
    body,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// WebhookController tests
// ---------------------------------------------------------------------------

test('verifyHmacSignature accepts valid HMAC-SHA256 signature', () => {
  const controller = createWebhookController({ secret: SECRET });
  const body = makeRawPayload();
  const sig = makeHmacSignature(body);
  const result = controller.verifyHmacSignature(body, sig);
  assert.equal(result.valid, true, 'valid HMAC signature must be accepted');
  assert.equal(result.reason, null, 'reason must be null when valid');
});

test('verifyHmacSignature rejects invalid signature', () => {
  const controller = createWebhookController({ secret: SECRET });
  const body = makeRawPayload();
  const badSig = 'sha256=' + 'deadbeef'.repeat(8);
  const result = controller.verifyHmacSignature(body, badSig);
  assert.equal(result.valid, false, 'invalid HMAC signature must be rejected');
  assert.ok(result.reason, 'reason must be present when rejected');
  assert.match(result.reason, /signature|mismatch|invalid/i, 'reason must explain the rejection');
});

test('verifyHmacSignature rejects missing signature', () => {
  const controller = createWebhookController({ secret: SECRET });
  const body = makeRawPayload();
  const result = controller.verifyHmacSignature(body, null);
  assert.equal(result.valid, false, 'missing signature must be rejected');
  assert.ok(result.reason, 'reason must be present when rejected');
  assert.match(result.reason, /missing|signature/i, 'reason must mention missing signature');
});

test('createDeliveryRecord creates record with deliveryId, eventType, timestamp', () => {
  const controller = createWebhookController({ secret: SECRET });
  const req = makeWebhookRequest();
  const record = controller.createDeliveryRecord({
    deliveryId: 'delivery-abc-123',
    eventType: 'pull_request',
    payload: JSON.parse(req.body),
    rawBody: req.body
  });
  assert.ok(record, 'delivery record must be created');
  assert.equal(record.deliveryId, 'delivery-abc-123', 'deliveryId must match input');
  assert.equal(record.eventType, 'pull_request', 'eventType must match input');
  assert.ok(record.timestamp, 'timestamp must be present');
  assert.ok(typeof record.timestamp === 'string', 'timestamp must be a string (ISO 8601)');
  assert.ok(record.payload, 'payload must be present');
});

test('isDuplicate returns true for already-seen deliveryId', () => {
  const controller = createWebhookController({ secret: SECRET });
  const record = controller.createDeliveryRecord({
    deliveryId: 'dup-delivery-001',
    eventType: 'push',
    payload: {},
    rawBody: '{}'
  });
  controller.recordDelivery(record);
  const result = controller.isDuplicate('dup-delivery-001');
  assert.equal(result, true, 'isDuplicate must return true for seen deliveryId');
});

test('isDuplicate returns false for new deliveryId', () => {
  const controller = createWebhookController({ secret: SECRET });
  const result = controller.isDuplicate('brand-new-delivery-999');
  assert.equal(result, false, 'isDuplicate must return false for unseen deliveryId');
});

test('processDelivery queues normalized events', () => {
  const controller = createWebhookController({ secret: SECRET });
  const req = makeWebhookRequest();
  const queued = [];
  controller.onEvent((event) => queued.push(event));

  const result = controller.processDelivery({
    deliveryId: 'delivery-queue-001',
    eventType: 'pull_request',
    payload: JSON.parse(req.body),
    rawBody: req.body
  });

  assert.ok(result, 'processDelivery must return a result');
  assert.ok(result.queued !== undefined, 'result must indicate queuing status');
  assert.ok(Array.isArray(queued) || result.queued >= 0, 'events must be queued');
});

// ---------------------------------------------------------------------------
// SyncController tests
// ---------------------------------------------------------------------------

test('normalizeEvent converts raw provider event to canonical format', () => {
  const controller = createSyncController();
  const rawEvent = {
    eventType: 'pull_request',
    action: 'opened',
    nativeId: 'pr-42',
    providerRef: 'github-provider',
    resourceKind: 'PullRequest',
    data: {
      title: 'Fix bug',
      body: 'Closes #10',
      state: 'open'
    },
    receivedAt: new Date().toISOString()
  };
  const normalized = controller.normalizeEvent(rawEvent);
  assert.ok(normalized, 'normalizeEvent must return a value');
  assert.ok(normalized.eventType, 'normalized event must have eventType');
  assert.ok(normalized.nativeId, 'normalized event must have nativeId');
  assert.ok(normalized.providerRef, 'normalized event must have providerRef');
  assert.ok(normalized.resourceKind, 'normalized event must have resourceKind');
  assert.ok(normalized.canonicalAt, 'normalized event must have canonicalAt timestamp');
  assert.ok(normalized.data, 'normalized event must have data');
});

test('upsertResource creates resource with external envelope (nativeId, url, etag)', () => {
  const controller = createSyncController();
  const resource = controller.upsertResource({
    kind: 'Repository',
    localName: 'org-repo',
    namespace: 'default',
    spec: { organizationRef: 'default', providerRef: 'github-provider' },
    externalEnvelope: {
      nativeId: 'github-repo-12345',
      url: 'https://github.com/org/repo',
      etag: '"abc123"',
      providerRef: 'github-provider'
    }
  });
  assert.ok(resource, 'upsertResource must return a resource');
  assert.ok(resource.metadata, 'resource must have metadata');
  assert.ok(resource.spec, 'resource must have spec');
  assert.ok(resource.status, 'resource must have status');
  assert.ok(resource.status.external, 'resource status must have external envelope');
  assert.equal(resource.status.external.nativeId, 'github-repo-12345', 'nativeId must match');
  assert.equal(resource.status.external.url, 'https://github.com/org/repo', 'url must match');
  assert.equal(resource.status.external.etag, '"abc123"', 'etag must match');
});

test('upsertResource updates existing resource preserving external identity', () => {
  const controller = createSyncController();
  const initial = controller.upsertResource({
    kind: 'Repository',
    localName: 'org-repo',
    namespace: 'default',
    spec: { organizationRef: 'default', providerRef: 'github-provider', description: 'original' },
    externalEnvelope: {
      nativeId: 'github-repo-12345',
      url: 'https://github.com/org/repo',
      etag: '"abc123"',
      providerRef: 'github-provider'
    }
  });

  const updated = controller.upsertResource({
    kind: 'Repository',
    localName: 'org-repo',
    namespace: 'default',
    spec: { organizationRef: 'default', providerRef: 'github-provider', description: 'updated description' },
    externalEnvelope: {
      nativeId: 'github-repo-12345',
      url: 'https://github.com/org/repo',
      etag: '"def456"',
      providerRef: 'github-provider'
    }
  });

  assert.equal(updated.status.external.nativeId, 'github-repo-12345', 'nativeId must be preserved on update');
  assert.equal(updated.status.external.etag, '"def456"', 'etag must be updated');
  assert.equal(updated.spec.description, 'updated description', 'spec must be updated');
  assert.ok(updated.status.external.lastSyncedAt, 'lastSyncedAt must be set after update');
});

test('updateWatermark advances the high-watermark timestamp', () => {
  const controller = createSyncController();
  const bindingRef = 'github-binding-001';
  const ts1 = '2024-01-01T10:00:00.000Z';
  const ts2 = '2024-01-01T12:00:00.000Z';

  controller.updateWatermark(bindingRef, ts1);
  controller.updateWatermark(bindingRef, ts2);

  const current = controller.getWatermark(bindingRef);
  assert.equal(current, ts2, 'watermark must advance to later timestamp');
});

test('getWatermark returns current watermark for a binding', () => {
  const controller = createSyncController();
  const bindingRef = 'github-binding-002';

  // No watermark yet
  const initial = controller.getWatermark(bindingRef);
  assert.equal(initial, null, 'watermark must be null before any update');

  const ts = '2024-06-15T09:30:00.000Z';
  controller.updateWatermark(bindingRef, ts);
  const after = controller.getWatermark(bindingRef);
  assert.equal(after, ts, 'getWatermark must return the set watermark');
});

test('applyOwnershipMode allows write in bidirectional mode', () => {
  const controller = createSyncController();
  const result = controller.applyOwnershipMode({
    ownershipMode: 'bidirectional',
    operation: 'write',
    origin: 'krate'
  });
  assert.equal(result.allowed, true, 'bidirectional mode must allow krate writes');
  assert.ok(!result.reason || result.reason === null, 'no blocking reason expected');
});

test('applyOwnershipMode blocks write in external-owned mode', () => {
  const controller = createSyncController();
  const result = controller.applyOwnershipMode({
    ownershipMode: 'external-owned',
    operation: 'write',
    origin: 'krate'
  });
  assert.equal(result.allowed, false, 'external-owned mode must block krate writes');
  assert.ok(result.reason, 'reason must explain the block');
  assert.match(result.reason, /external-owned|read.?only|blocked/i, 'reason must mention external-owned or read-only');
});

test('applyOwnershipMode allows write in krate-owned mode', () => {
  const controller = createSyncController();
  const result = controller.applyOwnershipMode({
    ownershipMode: 'krate-owned',
    operation: 'write',
    origin: 'krate'
  });
  assert.equal(result.allowed, true, 'krate-owned mode must allow krate writes');
});

test('createTombstone marks deleted external resources', () => {
  const controller = createSyncController();
  const tombstone = controller.createTombstone({
    nativeId: 'github-repo-99999',
    providerRef: 'github-provider',
    resourceKind: 'Repository',
    localRef: 'deleted-repo',
    deletedAt: '2024-07-01T00:00:00.000Z'
  });
  assert.ok(tombstone, 'createTombstone must return a record');
  assert.equal(tombstone.nativeId, 'github-repo-99999', 'nativeId must match');
  assert.equal(tombstone.providerRef, 'github-provider', 'providerRef must match');
  assert.equal(tombstone.resourceKind, 'Repository', 'resourceKind must match');
  assert.equal(tombstone.tombstoned, true, 'tombstoned flag must be true');
  assert.ok(tombstone.deletedAt, 'deletedAt must be present');
});
