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
      } else if (event.type === 'chat') {
        outbound = {
          type: 'chat',
          sender: event.sender ?? event.id ?? event.from,
          text: event.text ?? event.message ?? '',
          ...(event.private != null ? { private: event.private } : {}),
          timestamp: outbound.timestamp,
        };
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
        // DEPRECATED: legacy window.open of a URL (composites nothing into video). Prefer
        // 'start_screenshare' (the real G7 noVNC/getDisplayMedia -> compositor screen layer).
        case 'share_screen':
          await jitsi.shareScreen(command.url || '');
          return { ok: true };
        case 'speak_tts': {
          const result = await audioPipeline.speak(command.text || '', { voice: command.voice });
          // Additive: on a successful synthesis, forward the audio descriptor to the page-side
          // Web Audio graph (G3) best-effort. Never alters the structured IPC result returned
          // to the client; absence of publishAudio (e.g. mock adapters / tests) is a no-op.
          if (result?.ok && result.audio && typeof jitsi.publishAudio === 'function') {
            await Promise.resolve(jitsi.publishAudio(result.audio)).catch(() => {});
          }
          return result;
        }
        case 'get_transcript':
          return { ok: true, transcript: state.getTranscript() };
        case 'get_participants':
          return { ok: true, participants: state.getParticipants() };
        case 'disconnect':
          await this.stop(command.reason || 'agent_disconnect');
          return { ok: true };
        case 'set_expression':
          await jitsi.setExpression(command.expression, { intensity: command.intensity });
          return { ok: true };
        case 'set_posture':
          await jitsi.setPosture(command.posture);
          return { ok: true };
        case 'play_gesture':
          await jitsi.playGesture(command.gesture, { loop: command.loop });
          return { ok: true };
        case 'look_at':
          await jitsi.lookAt(command.target);
          return { ok: true };
        case 'set_view':
          await jitsi.setView(command.view);
          return { ok: true };
        case 'draw_canvas':
          await jitsi.drawCanvas(command.ops || command.payload);
          return { ok: true };
        case 'start_screenshare':
          await jitsi.startScreenshare({ source: command.source, url: command.url });
          return { ok: true };
        case 'send_video_metadata':
          await jitsi.sendVideoMetadata(command.metadata);
          return { ok: true };
        default:
          return { ok: false, error: `Unsupported action: ${command.action}` };
      }
    },

    // G5: inbound audio frames (produced by the page-side remote-audio tap) are transcribed
    // through the STT provider and broadcast via the EXISTING `transcript` event path — no new
    // event type. When STT is not configured, this is a no-op (gating preserved). Returns the
    // broadcast transcript event, or null when nothing was emitted.
    onInboundAudio(chunk) {
      if (!audioPipeline.canTranscribe()) return null;
      const result = audioPipeline.transcribe(chunk);
      if (!result?.ok || !result.text) return null;
      return this.handleJitsiEvent({ type: 'transcript', text: result.text, speaker: result.speaker });
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
