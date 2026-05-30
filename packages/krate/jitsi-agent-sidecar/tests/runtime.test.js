import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createJitsiSidecarRuntime } from '../src/runtime.js';

function adapter() {
  const calls = [];
  let lastConnect = null;
  return {
    calls,
    get lastConnect() { return lastConnect; },
    async connect(options = {}) {
      lastConnect = options;
      calls.push(['connect']);
      return { participants: [{ id: 'agent', name: 'Agent' }] };
    },
    async disconnect(reason) { calls.push(['disconnect', reason]); },
    async sendChat(text) { calls.push(['sendChat', text]); },
    async raiseHand() { calls.push(['raiseHand']); },
    async lowerHand() { calls.push(['lowerHand']); },
    async react(emoji) { calls.push(['react', emoji]); },
    async shareScreen(url) { calls.push(['shareScreen', url]); },
  };
}

describe('Jitsi sidecar runtime command/event contract', () => {
  it('connects to Jitsi and broadcasts the documented connected event', async () => {
    const sent = [];
    const jitsi = adapter();
    const runtime = createJitsiSidecarRuntime({
      config: { roomUrl: 'https://meet.example.test/standup', jwt: 'jwt', roomId: 'standup', participantName: 'Agent' },
      jitsi,
      broadcast: (event) => sent.push(event),
    });

    await runtime.start();

    assert.deepEqual(jitsi.calls[0], ['connect']);
    assert.equal(sent[0].type, 'connected');
    assert.equal(sent[0].roomId, 'standup');
    assert.deepEqual(sent[0].participants, ['Agent']);
  });

  it('relays chat, participant, hand, and recording events to IPC clients', async () => {
    const sent = [];
    const runtime = createJitsiSidecarRuntime({
      config: { roomUrl: 'https://meet.example.test/standup', jwt: 'jwt', roomId: 'standup' },
      jitsi: adapter(),
      broadcast: (event) => sent.push(event),
    });

    runtime.handleJitsiEvent({ type: 'chat', sender: 'bob', text: 'ready' });
    runtime.handleJitsiEvent({ type: 'participant_joined', id: 'alice', name: 'Alice' });
    runtime.handleJitsiEvent({ type: 'hand_raised', name: 'Alice' });
    runtime.handleJitsiEvent({ type: 'recording_started' });

    assert.deepEqual(sent.map((event) => event.type), ['chat', 'participant_joined', 'hand_raised', 'recording_started']);
  });

  it('dispatches agent commands to the Jitsi adapter', async () => {
    const jitsi = adapter();
    const runtime = createJitsiSidecarRuntime({
      config: { roomUrl: 'https://meet.example.test/standup', jwt: 'jwt', roomId: 'standup', capabilities: { chat: 'readwrite', screenshare: 'share' } },
      jitsi,
      broadcast: () => {},
    });

    await runtime.handleCommand({ action: 'send_chat', text: 'summary posted' });
    await runtime.handleCommand({ action: 'raise_hand' });
    await runtime.handleCommand({ action: 'lower_hand' });
    await runtime.handleCommand({ action: 'react', emoji: 'thumbsup' });
    await runtime.handleCommand({ action: 'share_screen', url: 'https://krate.example/run' });

    assert.deepEqual(jitsi.calls, [
      ['sendChat', 'summary posted'],
      ['raiseHand'],
      ['lowerHand'],
      ['react', 'thumbsup'],
      ['shareScreen', 'https://krate.example/run'],
    ]);
  });

  it('gates speak_tts behind explicit speak-capable audio configuration', async () => {
    const runtime = createJitsiSidecarRuntime({
      config: { roomUrl: 'https://meet.example.test/standup', jwt: 'jwt', roomId: 'standup', capabilities: { audio: 'listen' } },
      jitsi: adapter(),
      broadcast: () => {},
    });

    const result = await runtime.handleCommand({ action: 'speak_tts', text: 'hello' });

    assert.equal(result.ok, false);
    assert.match(result.error, /audio speak capability/i);
  });

  it('exposes capability-gated STT and VAD adapter boundaries without external providers', () => {
    const runtime = createJitsiSidecarRuntime({
      config: { roomUrl: 'https://meet.example.test/standup', jwt: 'jwt', roomId: 'standup', capabilities: { audio: 'listen' } },
      jitsi: adapter(),
      broadcast: () => {},
    });

    assert.equal(runtime.audio.canTranscribe(), false);
    assert.deepEqual(runtime.audio.transcribe(Buffer.from('audio')), {
      ok: false,
      error: 'STT requires listen-capable audio configuration and a configured STT provider',
    });
    assert.equal(runtime.audio.canDetectVoice(), true);
    assert.deepEqual(runtime.audio.detectVoice(Buffer.from('audio')), { ok: true, provider: 'local-vad', speechDetected: false });
  });

  it('reconnects when the Jitsi adapter reports a disconnect', async () => {
    const jitsi = adapter();
    const sent = [];
    const runtime = createJitsiSidecarRuntime({
      config: { roomUrl: 'https://meet.example.test/standup', jwt: 'jwt', roomId: 'standup', participantName: 'Agent' },
      jitsi,
      broadcast: (event) => sent.push(event),
    });

    await runtime.start();
    await jitsi.lastConnect.onDisconnect('network');

    assert.deepEqual(jitsi.calls, [['connect'], ['connect']]);
    assert.deepEqual(sent.map((event) => event.type), ['connected', 'disconnected', 'connected']);
    assert.equal(sent[1].reason, 'network');
  });

  it('disconnect command performs graceful Jitsi leave', async () => {
    const jitsi = adapter();
    const runtime = createJitsiSidecarRuntime({
      config: {
        roomUrl: 'https://meet.example.test/standup',
        jwt: 'jwt',
        roomId: 'standup',
        goodbyeMessage: 'Standup Bot leaving.',
      },
      jitsi,
      broadcast: () => {},
    });

    await runtime.handleCommand({ action: 'disconnect', reason: 'task_complete' });

    assert.deepEqual(jitsi.calls, [
      ['sendChat', 'Standup Bot leaving.'],
      ['disconnect', 'task_complete'],
    ]);
  });

  it('forced shutdown disconnects immediately without graceful goodbye chat', async () => {
    const jitsi = adapter();
    const runtime = createJitsiSidecarRuntime({
      config: {
        roomUrl: 'https://meet.example.test/standup',
        jwt: 'jwt',
        roomId: 'standup',
        goodbyeMessage: 'Standup Bot leaving.',
      },
      jitsi,
      broadcast: () => {},
    });

    await runtime.stop('sigterm', { graceful: false });

    assert.deepEqual(jitsi.calls, [['disconnect', 'sigterm']]);
  });
});
