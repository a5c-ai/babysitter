import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentMuxClient, createJitsiAgentBridge, createResource } from '../src/index.js';

function stack(spec = {}) {
  return createResource('AgentStack', { name: 'standup-bot', namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    baseAgent: 'claude-code',
    adapter: 'claude-code',
    runtimeIdentity: { serviceAccountRef: 'krate' },
    ...spec,
  });
}

test('Jitsi agent bridge gates capability and prepares meeting context', async () => {
  const emitted = [];
  const bridge = createJitsiAgentBridge({
    meetingController: {
      async getMeeting(ref) {
        assert.equal(ref, 'daily');
        return {
          metadata: { name: 'daily' },
          spec: { roomId: 'daily-default', ttlMinutes: 30 },
          status: { phase: 'Active', roomUrl: 'https://meet.example/daily-default' },
        };
      },
      generateParticipantJwt(roomId, participant, ttlMinutes) {
        assert.equal(roomId, 'daily-default');
        assert.equal(participant.id, 'dispatch-1');
        assert.equal(ttlMinutes, 30);
        return 'krate-jitsi.jwt.sig';
      },
    },
    eventBus: { emit: (event) => emitted.push(event) },
    now: () => new Date('2026-05-30T12:00:00Z'),
  });

  assert.equal(bridge.hasMeetingCapability(stack()), false);
  assert.equal(bridge.hasMeetingCapability(stack({ jitsiCapability: true })), true);

  const run = { metadata: { name: 'dispatch-1' }, spec: {}, status: {} };
  const context = await bridge.prepareMeetingContext(run, 'daily', stack({
    jitsiCapability: true,
    jitsiConfig: { participantName: 'Standup Bot', role: 'observer', capabilities: { chat: 'readwrite', audio: 'listen' } },
  }));
  assert.equal(context.roomUrl, 'https://meet.example/daily-default');
  assert.equal(context.jwt, 'krate-jitsi.jwt.sig');
  assert.equal(context.role, 'observer');
  assert.equal(run.spec.meetingRef, 'daily');
  assert.equal(run.spec.meetingContext.roomId, 'daily-default');

  await bridge.onAgentJoined('dispatch-1', 'daily');
  await bridge.onAgentLeft('dispatch-1', 'daily', 'completed');
  assert.deepEqual(emitted.map((event) => event.type), ['agent-joined-meeting', 'agent-left-meeting']);
});

test('Jitsi agent bridge builds sidecar specs and Agent Mux injects them only for meeting runs', () => {
  const bridge = createJitsiAgentBridge({
    sidecarImage: 'ghcr.io/a5c-ai/jitsi-agent-sidecar:test',
  });
  const sidecar = bridge.buildSidecarSpec('https://meet.example/daily-default', 'krate-jitsi.jwt.sig', 'Standup Bot', {
    roomId: 'daily-default',
    role: 'observer',
    capabilities: { audio: 'listen', chat: 'readwrite' },
  });
  assert.equal(sidecar.name, 'jitsi-agent-sidecar');
  assert.equal(sidecar.image, 'ghcr.io/a5c-ai/jitsi-agent-sidecar:test');
  assert.equal(sidecar.env.find((entry) => entry.name === 'JITSI_ROOM_URL').value, 'https://meet.example/daily-default');
  assert.equal(sidecar.env.find((entry) => entry.name === 'JITSI_CHAT_MODE').value, 'readwrite');

  const client = createAgentMuxClient();
  const plainJob = client.createAgentJob({ adapter: 'claude-code', org: 'default' }).jobManifest;
  assert.equal(plainJob.spec.template.spec.containers.length, 1);

  const meetingJob = client.createAgentJob({
    adapter: 'claude-code',
    org: 'default',
    meetingContext: {
      roomUrl: 'https://meet.example/daily-default',
      jwt: 'krate-jitsi.jwt.sig',
      roomId: 'daily-default',
      participantName: 'Standup Bot',
      role: 'observer',
      capabilities: { audio: 'listen', chat: 'readwrite' },
    },
  }).jobManifest;
  assert.equal(meetingJob.spec.template.spec.containers.length, 2);
  assert.ok(meetingJob.spec.template.spec.containers[0].env.some((entry) => entry.name === 'JITSI_MEETING_ACTIVE' && entry.value === 'true'));
  assert.ok(meetingJob.spec.template.spec.volumes.some((volume) => volume.name === 'agent-socket'));
});
