import assert from 'node:assert/strict';
import test from 'node:test';
import { createJitsiMeetingController, createResource } from '../src/index.js';

function meeting(overrides = {}) {
  return createResource('JitsiMeeting', { name: 'daily', namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    providerRef: 'jitsi-prod',
    roomId: 'daily-default',
    displayName: 'Daily',
    ttlMinutes: 30,
    ...overrides.spec,
  }, {
    phase: 'Scheduled',
    participants: { current: [], total: 0, peak: 0 },
    recording: { active: false, recordingId: null },
    ...overrides.status,
  });
}

test('Jitsi meeting controller validates required meeting resources and JWT claims', () => {
  const controller = createJitsiMeetingController({
    jwtSecret: 'test-secret',
    jwtConfig: { issuer: 'krate-test', audience: 'jitsi-test', subject: 'meet.example' },
    now: () => new Date('2026-05-30T12:00:00Z'),
  });
  const valid = meeting();

  assert.equal(controller.validate(valid), valid);
  assert.throws(() => controller.validate(meeting({ spec: { roomId: '' } })), /JitsiMeeting spec.roomId is required/);

  const jwt = controller.generateParticipantJwt('daily-default', {
    id: 'agent-run-1',
    name: 'Standup Bot',
    type: 'agent',
    role: 'observer',
  }, 15);
  const [header, encoded, sig] = jwt.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url').toString('utf8')), { alg: 'HS256', typ: 'JWT' });
  assert.ok(sig, 'JWT signature segment is present');
  const claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  assert.equal(claims.aud, 'jitsi-test');
  assert.equal(claims.iss, 'krate-test');
  assert.equal(claims.sub, 'meet.example');
  assert.equal(claims.room, 'daily-default');
  assert.equal(claims.context.user.id, 'agent-run-1');
  assert.equal(claims.context.user.name, 'Standup Bot');
  assert.equal(claims.context.user.type, 'agent');
  assert.equal(claims.context.user.role, 'observer');
  assert.equal(claims.exp, Math.floor(new Date('2026-05-30T12:15:00Z').getTime() / 1000));
});

test('Jitsi meeting controller delegates room lifecycle, recording, stats, and emits events', async () => {
  const persisted = [];
  const emitted = [];
  const providerCalls = [];
  const resources = [meeting({ status: { phase: 'Active', roomUrl: 'https://meet.example/daily-default' } })];
  const providers = [createResource('JitsiMeetProvider', { name: 'jitsi-prod', namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    endpoint: 'https://meet.example',
    authMode: 'jwt',
    jwtConfig: { issuer: 'jitsi-app', audience: 'meet.example' },
    defaultRoomConfig: { lobby: true },
  })];
  const templates = [createResource('JitsiMeetingTemplate', { name: 'daily-template', namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    providerRef: 'jitsi-prod',
    displayName: 'Daily template',
    roomConfig: { startAudioMuted: true },
  })];
  const controller = createJitsiMeetingController({
    jwtSecret: 'test-secret',
    providerClient: {
      async createRoom(spec) { providerCalls.push(['createRoom', spec.roomId]); return { roomUrl: `https://meet.example/${spec.roomId}` }; },
      async endRoom(roomId) { providerCalls.push(['endRoom', roomId]); return { ended: true }; },
      async getRoom(roomId) { providerCalls.push(['getRoom', roomId]); return { phase: 'Active', participantCount: 2 }; },
      async getStats(roomId) { providerCalls.push(['getStats', roomId]); return { participantCount: 2, active: true }; },
      async startRecording(roomId) { providerCalls.push(['startRecording', roomId]); return { recordingId: 'rec-1' }; },
      async stopRecording(roomId) { providerCalls.push(['stopRecording', roomId]); return { recordingId: 'rec-1', duration: 120 }; },
    },
    resourceGateway: {
      async list(kind) { assert.equal(kind, 'JitsiMeeting'); return { items: resources }; },
      async apply(resource) { persisted.push(resource); return { resource }; },
      async get(kind, name) {
        if (kind === 'JitsiMeeting') return resources.find((resource) => resource.metadata.name === name);
        if (kind === 'JitsiMeetProvider') return providers.find((resource) => resource.metadata.name === name);
        if (kind === 'JitsiMeetingTemplate') return templates.find((resource) => resource.metadata.name === name);
        if (kind === 'JitsiRecording') return persisted.find((resource) => resource.kind === 'JitsiRecording' && resource.metadata.name === name);
        return null;
      },
    },
    eventBus: { emit(event) { emitted.push(event); } },
    now: () => new Date('2026-05-30T12:00:00Z'),
  });

  const created = await controller.createRoom({ organizationRef: 'default', providerRef: 'jitsi-prod', templateRef: 'daily-template', roomId: 'daily-default', displayName: 'Daily' });
  assert.equal(created.status.phase, 'Active');
  assert.equal(created.status.roomUrl, 'https://meet.example/daily-default');
  assert.deepEqual(created.spec.roomConfig, { lobby: true, startAudioMuted: true });
  assert.equal(emitted.at(-1).type, 'meeting-created');

  const active = await controller.listActiveMeetings('default');
  assert.equal(active.length, 1);

  const reconciled = await controller.reconcile(resources[0]);
  assert.equal(reconciled.status.participants.total, 2);

  assert.deepEqual(await controller.getMeetingStats('daily-default'), { participantCount: 2, active: true });
  assert.equal((await controller.startRecording('daily')).status.recording.recordingId, 'rec-1');
  assert.ok(persisted.some((resource) => resource.kind === 'JitsiRecording' && resource.metadata.name === 'rec-1' && resource.status.phase === 'Recording'));
  assert.equal(emitted.at(-1).type, 'recording-started');
  assert.equal((await controller.stopRecording('daily')).status.recording.active, false);
  assert.ok(persisted.some((resource) => resource.kind === 'JitsiRecording' && resource.metadata.name === 'rec-1' && resource.status.phase === 'Completed'));
  assert.equal((await controller.endRoom('daily-default')).status.phase, 'Ended');
  assert.deepEqual(providerCalls.map(([name]) => name), ['createRoom', 'getRoom', 'getStats', 'startRecording', 'stopRecording', 'endRoom']);
  assert.ok(persisted.length >= 4);
});
