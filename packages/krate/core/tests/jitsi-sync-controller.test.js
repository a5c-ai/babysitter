import assert from 'node:assert/strict';
import test from 'node:test';
import { createJitsiSyncController } from '../src/index.js';

test('Jitsi sync controller normalizes room, participant, and recording events', async () => {
  const persisted = [];
  const emitted = [];
  const controller = createJitsiSyncController({
    persistFn: async (resource) => persisted.push(resource),
    eventBus: { emit: (event) => emitted.push(event) },
    now: () => new Date('2026-05-30T12:00:00Z'),
  });

  const normalized = controller.normalizeEvent({
    type: 'participant_joined',
    room: 'daily-default',
    participant: { id: 'alice', name: 'Alice', type: 'user' },
    providerRef: 'jitsi-prod',
    timestamp: '2026-05-30T12:01:00Z',
  });
  assert.equal(normalized.eventType, 'participant-joined');
  assert.equal(normalized.roomId, 'daily-default');
  assert.equal(normalized.participant.id, 'alice');

  const active = await controller.syncRoom('daily-default', {
    eventType: 'room-created',
    organizationRef: 'default',
    providerRef: 'jitsi-prod',
    roomUrl: 'https://meet.example/daily-default',
    displayName: 'Daily',
  });
  assert.equal(active.kind, 'JitsiMeeting');
  assert.equal(active.status.phase, 'Active');
  assert.equal(emitted.at(-1).type, 'meeting-created');

  await controller.syncParticipant('daily-default', {
    eventType: 'participant-joined',
    participant: { id: 'alice', name: 'Alice', type: 'user', audioMuted: false },
    organizationRef: 'default',
  });
  const joinedAgain = await controller.syncParticipant('daily-default', {
    eventType: 'participant-joined',
    participant: { id: 'alice', name: 'Alice Updated', type: 'user' },
    organizationRef: 'default',
  });
  assert.equal(joinedAgain.status.participants.current.length, 1, 'participant join must be idempotent by id');
  assert.equal(joinedAgain.status.participants.total, 1);
  assert.equal(joinedAgain.status.participants.peak, 1);
  assert.equal(emitted.at(-1).type, 'participant-joined');

  const left = await controller.syncParticipant('daily-default', {
    eventType: 'participant-left',
    participant: { id: 'alice', type: 'user' },
    organizationRef: 'default',
  });
  assert.equal(left.status.participants.current.length, 0);
  assert.equal(left.status.participants.total, 1);
  assert.equal(left.status.participants.peak, 1);
  assert.equal(emitted.at(-1).type, 'participant-left');

  const recording = await controller.syncRecording('daily-default', {
    eventType: 'recording-started',
    recordingId: 'rec-1',
    organizationRef: 'default',
    providerRef: 'jitsi-prod',
    meetingRef: 'daily-default',
  });
  assert.equal(recording.kind, 'JitsiRecording');
  assert.equal(recording.status.phase, 'Recording');
  assert.equal(emitted.at(-1).type, 'recording-started');

  const stopped = await controller.syncRecording('daily-default', {
    eventType: 'recording-stopped',
    recordingId: 'rec-1',
    duration: 120,
    organizationRef: 'default',
  });
  assert.equal(stopped.status.phase, 'Completed');
  assert.equal(stopped.status.duration, 120);

  const ended = await controller.syncRoom('daily-default', { eventType: 'room-destroyed', organizationRef: 'default' });
  assert.equal(ended.status.phase, 'Ended');
  assert.ok(persisted.some((resource) => resource.kind === 'JitsiMeeting'));
  assert.ok(persisted.some((resource) => resource.kind === 'JitsiRecording'));
});

test('Jitsi sync controller maintains monotonic provider watermarks', () => {
  const persisted = [];
  const controller = createJitsiSyncController({ persistFn: (resource) => persisted.push(resource) });

  controller.updateWatermark('jitsi-prod', '2026-05-30T12:00:00Z');
  controller.updateWatermark('jitsi-prod', '2026-05-30T11:00:00Z');
  controller.updateWatermark('jitsi-prod', '2026-05-30T12:05:00Z');

  assert.equal(controller.getWatermark('jitsi-prod'), '2026-05-30T12:05:00Z');
  assert.equal(persisted.filter((resource) => resource.kind === 'ExternalSyncState').length, 2);
});
