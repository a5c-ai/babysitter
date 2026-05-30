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
  const controller = createJitsiMeetingController({ jwtSecret: 'test-secret', now: () => new Date('2026-05-30T12:00:00Z') });
  const valid = meeting();

  assert.equal(controller.validate(valid), valid);
  assert.throws(() => controller.validate(meeting({ spec: { roomId: '' } })), /JitsiMeeting spec.roomId is required/);

  const jwt = controller.generateParticipantJwt('daily-default', {
    id: 'agent-run-1',
    name: 'Standup Bot',
    type: 'agent',
    role: 'observer',
  }, 15);
  const [header, encoded, signature] = jwt.split('.');
  assert.ok(header);
  assert.ok(signature);
  const claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  assert.equal(claims.aud, 'jitsi');
  assert.equal(claims.iss, 'krate');
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
  const providers = [
    createResource('JitsiMeetProvider', { name: 'jitsi-prod', namespace: 'krate-org-default' }, {
      organizationRef: 'default',
      endpoint: 'https://meet.example',
      authMode: 'jwt',
      defaultRoomTTL: 90,
      defaultRoomConfig: { lobby: true },
    }),
  ];
  const templates = [
    createResource('JitsiMeetingTemplate', { name: 'standup', namespace: 'krate-org-default' }, {
      organizationRef: 'default',
      providerRef: 'jitsi-prod',
      displayName: 'Standup',
      ttlMinutes: 45,
      roomConfig: { startWithAudioMuted: true },
    }),
  ];
  const recordings = [];
  const controller = createJitsiMeetingController({
    jwtSecret: 'test-secret',
    providerClient: {
      async createRoom(spec) {
        providerCalls.push(['createRoom', spec.roomId, spec.ttlMinutes, spec.roomConfig]);
        return { roomUrl: `https://meet.example/${spec.roomId}` };
      },
      async endRoom(roomId) { providerCalls.push(['endRoom', roomId]); return { ended: true }; },
      async getRoom(roomId) { providerCalls.push(['getRoom', roomId]); return { phase: 'Active', participantCount: 2 }; },
      async getStats(roomId) { providerCalls.push(['getStats', roomId]); return { participantCount: 2, active: true }; },
      async startRecording(roomId) { providerCalls.push(['startRecording', roomId]); return { recordingId: 'rec-1' }; },
      async stopRecording(roomId) { providerCalls.push(['stopRecording', roomId]); return { recordingId: 'rec-1', duration: 120 }; },
    },
    resourceGateway: {
      async list(kind) { assert.equal(kind, 'JitsiMeeting'); return { items: resources }; },
      async apply(resource) {
        persisted.push(resource);
        if (resource.kind === 'JitsiRecording') recordings.push(resource);
        return { resource };
      },
      async get(kind, name) {
        if (kind === 'JitsiMeetProvider') return providers.find((resource) => resource.metadata.name === name);
        if (kind === 'JitsiMeetingTemplate') return templates.find((resource) => resource.metadata.name === name);
        if (kind === 'JitsiRecording') return recordings.find((resource) => resource.metadata.name === name);
        assert.equal(kind, 'JitsiMeeting');
        return resources.find((resource) => resource.metadata.name === name);
      },
    },
    eventBus: { emit(event) { emitted.push(event); } },
    now: () => new Date('2026-05-30T12:00:00Z'),
  });

  const created = await controller.createRoom({ organizationRef: 'default', providerRef: 'jitsi-prod', templateRef: 'standup', roomId: 'daily-default', displayName: 'Daily', roomConfig: { startWithVideoMuted: true } });
  assert.equal(created.status.phase, 'Active');
  assert.equal(created.status.roomUrl, 'https://meet.example/daily-default');
  assert.equal(created.spec.ttlMinutes, 45);
  assert.deepEqual(created.spec.roomConfig, { lobby: true, startWithAudioMuted: true, startWithVideoMuted: true });
  assert.equal(emitted.at(-1).type, 'meeting-created');

  const active = await controller.listActiveMeetings('default');
  assert.equal(active.length, 1);

  const reconciled = await controller.reconcile(resources[0]);
  assert.equal(reconciled.status.participants.total, 2);

  assert.deepEqual(await controller.getMeetingStats('daily-default'), { participantCount: 2, active: true });
  assert.equal((await controller.startRecording('daily')).status.recording.recordingId, 'rec-1');
  assert.equal(recordings.at(-1).status.phase, 'Recording');
  assert.equal(emitted.at(-1).type, 'recording-started');
  assert.equal((await controller.stopRecording('daily')).status.recording.active, false);
  assert.equal(recordings.at(-1).status.phase, 'Completed');
  assert.equal(recordings.at(-1).status.duration, 120);
  assert.equal((await controller.endRoom('daily-default')).status.phase, 'Ended');
  assert.deepEqual(providerCalls.map(([name]) => name), ['createRoom', 'getRoom', 'getStats', 'startRecording', 'stopRecording', 'endRoom']);
  assert.ok(persisted.length >= 4);
});

test('Jitsi meeting controller auto-dispatches template agents when autoJoin is enabled', async () => {
  const calls = [];
  const activeMeeting = meeting({
    spec: {
      templateRef: 'standup-template',
    },
    status: { phase: 'Active', roomUrl: 'https://meet.example/daily-default' },
  });
  const controller = createJitsiMeetingController({
    resourceGateway: {
      async list() { return { items: [activeMeeting] }; },
      async get() { return activeMeeting; },
    },
    dispatchController: {
      async createManualDispatch(input) {
        calls.push(input);
        return { error: false, run: { metadata: { name: `run-${calls.length}` } } };
      },
    },
  });

  const results = await controller.dispatchAutoJoinAgents('daily', {
    resources: {
      JitsiMeetingTemplate: [
        createResource('JitsiMeetingTemplate', { name: 'standup-template', namespace: 'krate-org-default' }, {
          organizationRef: 'default',
          providerRef: 'jitsi-prod',
          displayName: 'Standup',
          agentConfig: { autoJoin: true },
          participants: { autoInvite: [{ type: 'agentStack', ref: 'standup-bot' }] },
        }),
      ],
    },
    repository: 'repo',
    ref: 'main',
  });

  assert.equal(results.length, 1);
  assert.equal(calls[0].agentStack, 'standup-bot');
  assert.equal(calls[0].meetingRef, 'daily');
  assert.equal(calls[0].taskKind, 'meeting');
});
