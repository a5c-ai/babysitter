import { createRuntimeState } from './runtime-state.js';
import { createAudioPipeline } from './audio.js';

function timestamped(event) {
  return { timestamp: event.timestamp || new Date().toISOString(), ...event };
}

function participantNames(participants = []) {
  return participants.map((participant) => participant.name || participant.id).filter(Boolean);
}

const IMMEDIATE_DISCONNECT_REASONS = new Set(['sigterm', 'sigint', 'startup_failed']);

export function createJitsiSidecarRuntime({ config, jitsi, broadcast = () => {}, audio = null }) {
  if (!config?.roomUrl || !config?.roomId) {
    throw new Error('Jitsi sidecar runtime requires roomUrl and roomId');
  }
  if (!jitsi) {
    throw new Error('Jitsi sidecar runtime requires a Jitsi adapter');
  }

  const state = createRuntimeState();
  const audioPipeline = audio || createAudioPipeline(config);
  let stopped = false;

  const runtime = {
    state,
    audio: audioPipeline,

    async start() {
      stopped = false;
      const result = await jitsi.connect({
        roomUrl: config.roomUrl,
        jwt: config.jwt,
        roomId: config.roomId,
        participantName: config.participantName,
        role: config.role,
        onEvent: (event) => this.handleJitsiEvent(event),
        onDisconnect: (reason) => this.reconnect(reason),
        onError: (err) => this.reconnect(err?.message || String(err)),
      });
      for (const participant of result?.participants || []) state.setParticipant(participant);
      const event = timestamped({
        type: 'connected',
        roomId: config.roomId,
        participants: participantNames(state.getParticipants()),
      });
      broadcast(event);
      return event;
    },

    async reconnect(reason = 'disconnect') {
      if (stopped) return null;
      broadcast(timestamped({ type: 'disconnected', reason }));
      return this.start();
    },

    handleJitsiEvent(event = {}) {
      let outbound = timestamped(event);
      if (event.type === 'transcript') {
        outbound = { type: 'transcript', ...state.addTranscript(outbound) };
      } else if (event.type === 'participant_joined') {
        const participant = state.setParticipant(outbound);
        outbound = { ...outbound, ...participant };
      } else if (event.type === 'participant_left') {
        const participant = state.removeParticipant(outbound);
        outbound = { ...outbound, ...participant };
      }
      broadcast(outbound);
      return outbound;
    },

    async handleCommand(command = {}) {
      switch (command.action) {
        case 'send_chat':
          await jitsi.sendChat(command.text || '');
          return { ok: true };
        case 'raise_hand':
          await jitsi.raiseHand();
          return { ok: true };
        case 'lower_hand':
          await jitsi.lowerHand();
          return { ok: true };
        case 'react':
          await jitsi.react(command.emoji || '');
          return { ok: true };
        case 'share_screen':
          await jitsi.shareScreen(command.url || '');
          return { ok: true };
        case 'speak_tts':
          return audioPipeline.speak(command.text || '', { voice: command.voice });
        case 'get_transcript':
          return { ok: true, transcript: state.getTranscript() };
        case 'get_participants':
          return { ok: true, participants: state.getParticipants() };
        case 'disconnect':
          await this.stop(command.reason || 'agent_disconnect');
          return { ok: true };
        default:
          return { ok: false, error: `Unsupported action: ${command.action}` };
      }
    },

    async stop(reason = 'shutdown', options = {}) {
      stopped = true;
      const graceful = options.graceful ?? !IMMEDIATE_DISCONNECT_REASONS.has(reason);
      if (graceful && config.goodbyeMessage && typeof jitsi.sendChat === 'function') {
        await jitsi.sendChat(config.goodbyeMessage).catch(() => {});
      }
      if (typeof jitsi.disconnect === 'function') {
        await jitsi.disconnect(reason);
      }
    },
  };

  return runtime;
}
