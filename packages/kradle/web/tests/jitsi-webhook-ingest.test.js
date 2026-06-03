import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {
  createJoinPayload,
  createJitsiWebhookDeliveryCache,
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

test('Jitsi join payload uses standard HS256 JWT shape', () => {
  process.env.KRADLE_JITSI_JWT_SECRET = 'join-secret';
  const payload = createJoinPayload({
    metadata: { name: 'daily' },
    spec: { organizationRef: 'default', roomId: 'daily-default', ttlMinutes: 15 },
    status: { roomUrl: 'https://meet.example/daily-default' },
  }, {
    participantName: 'Alice',
    participantRef: 'alice',
  });
  const [header, claims, signature] = payload.jwt.split('.');
  assert.ok(header);
  assert.ok(signature);
  assert.equal(JSON.parse(Buffer.from(claims, 'base64url').toString('utf8')).room, 'daily-default');
});
