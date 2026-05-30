import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {
  createJitsiWebhookDeliveryCache,
  createJitsiWebhookDeliveryStore,
  handleJitsiWebhookPayload,
  verifyJitsiWebhookSignature,
} from '../app/lib/jitsi-service.js';

function signature(body, secret = 'webhook-secret') {
  return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
}

test('Jitsi webhook signatures reject missing, malformed, invalid, and invalid JSON bodies', () => {
  const body = JSON.stringify({ eventType: 'room-created', roomId: 'daily-default' });
  assert.equal(verifyJitsiWebhookSignature(body, '', 'webhook-secret').valid, false);
  assert.equal(verifyJitsiWebhookSignature(body, 'not-a-signature', 'webhook-secret').valid, false);
  assert.equal(verifyJitsiWebhookSignature(body, 'sha256=00', 'webhook-secret').valid, false);
  assert.equal(verifyJitsiWebhookSignature(body, signature(body), 'webhook-secret').valid, true);

  assert.throws(() => handleJitsiWebhookPayload('default', '{bad-json', { deliveryId: 'bad' }), /invalid_json/);
});

test('Jitsi webhook delivery cache deduplicates delivery ids and rejects stale replays', () => {
  const cache = createJitsiWebhookDeliveryCache({ ttlMs: 1000, now: () => Date.parse('2026-05-30T12:10:00Z') });
  assert.equal(cache.checkAndRemember('delivery-1', '2026-05-30T12:09:00Z').duplicate, false);
  assert.equal(cache.checkAndRemember('delivery-1', '2026-05-30T12:09:01Z').duplicate, true);
  assert.equal(cache.checkAndRemember('delivery-2', '2026-05-30T11:00:00Z').replay, true);
});

test('Jitsi webhook delivery cache can use a resource-backed delivery store', async () => {
  const applied = [];
  const controller = {
    async getResourceForOrg(org, kind, name) {
      assert.equal(org, 'default');
      assert.equal(kind, 'ExternalWebhookDelivery');
      return applied.find((resource) => resource.metadata.name === name) || null;
    },
    async applyResourceForOrg(org, resource) {
      assert.equal(org, 'default');
      applied.push(resource);
      return { resource };
    },
  };
  const store = createJitsiWebhookDeliveryStore('default', { controller });
  const cache = createJitsiWebhookDeliveryCache({ now: () => Date.parse('2026-05-30T12:10:00Z') });

  assert.equal((await cache.checkAndRemember('delivery-1', '2026-05-30T12:09:00Z', { deliveryStore: store })).duplicate, false);
  assert.equal((await cache.checkAndRemember('delivery-1', '2026-05-30T12:09:01Z', { deliveryStore: store })).duplicate, true);
  assert.equal(applied[0].kind, 'ExternalWebhookDelivery');
});

test('Jitsi webhook payload handler maps room, participant, and recording events to resources and event types', () => {
  const events = [
    ['room-created', 'meeting-created'],
    ['room-destroyed', 'meeting-ended'],
    ['participant-joined', 'participant-joined'],
    ['participant-left', 'participant-left'],
    ['recording-started', 'recording-started'],
    ['recording-stopped', 'recording-stopped'],
  ];

  for (const [eventType, expectedEventType] of events) {
    const result = handleJitsiWebhookPayload('default', JSON.stringify({
      eventType,
      deliveryId: `delivery-${eventType}`,
      providerRef: 'jitsi-prod',
      roomId: 'daily-default',
      meetingRef: 'daily',
      recordingId: 'rec-1',
      participant: { id: 'alice', name: 'Alice', type: 'user' },
      timestamp: '2026-05-30T12:00:00Z',
    }), { deliveryId: `delivery-${eventType}` });
    assert.equal(result.eventType, expectedEventType);
    assert.ok(result.resource.kind === 'JitsiMeeting' || result.resource.kind === 'JitsiRecording');
  }
});

test('Jitsi webhook payload handler merges existing meeting state for participant and recording events', () => {
  const existingMeeting = {
    metadata: { name: 'daily', namespace: 'krate-org-default', labels: {} },
    spec: { organizationRef: 'default', providerRef: 'jitsi-prod', roomId: 'daily-default', displayName: 'Daily' },
    status: {
      phase: 'Active',
      roomUrl: 'https://meet.example/daily-default',
      participants: { current: [{ id: 'bob', name: 'Bob', type: 'user' }], total: 1, peak: 1 },
      recording: { active: false, recordingId: null },
    },
  };

  const participant = handleJitsiWebhookPayload('default', JSON.stringify({
    eventType: 'participant-joined',
    deliveryId: 'delivery-participant',
    providerRef: 'jitsi-prod',
    roomId: 'daily-default',
    meetingRef: 'daily',
    participant: { id: 'alice', name: 'Alice', type: 'user' },
    timestamp: '2026-05-30T12:00:00Z',
  }), { existingMeeting });
  assert.deepEqual(participant.resource.status.participants.current.map((item) => item.id).sort(), ['alice', 'bob']);

  const recording = handleJitsiWebhookPayload('default', JSON.stringify({
    eventType: 'recording-started',
    deliveryId: 'delivery-recording',
    providerRef: 'jitsi-prod',
    roomId: 'daily-default',
    meetingRef: 'daily',
    recordingId: 'rec-1',
    timestamp: '2026-05-30T12:01:00Z',
  }), { existingMeeting });
  assert.equal(recording.resource.kind, 'JitsiRecording');
  assert.equal(recording.relatedResources[0].kind, 'JitsiMeeting');
  assert.equal(recording.relatedResources[0].status.recording.active, true);
  assert.equal(recording.relatedResources[0].status.recording.recordingId, 'rec-1');
});
