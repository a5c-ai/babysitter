import crypto from 'node:crypto';

const DEFAULT_SIDECAR_IMAGE = 'ghcr.io/a5c-ai/jitsi-agent-sidecar:latest';
const SOCKET_PATH = '/tmp/jitsi-agent.sock';
const DEFAULT_TTL_MINUTES = 60;

function isoNow(now) {
  return (typeof now === 'function' ? now() : new Date()).toISOString();
}

export function createJitsiAgentBridge(options = {}) {
  const {
    meetingController,
    dispatchController,
    eventBus,
    sidecarImage = process.env.KRADLE_JITSI_AGENT_SIDECAR_IMAGE || DEFAULT_SIDECAR_IMAGE,
    now = () => new Date(),
  } = options;

  async function resolveMeeting(meetingRef, resources = {}) {
    const meeting = await meetingController?.getMeeting?.(meetingRef);
    if (meeting) return meeting;
    return (resources.JitsiMeeting || []).find((candidate) => (
      candidate.metadata?.name === meetingRef || candidate.spec?.roomId === meetingRef
    )) || null;
  }

  function generateParticipantJwt(roomId, participant, ttlMinutes) {
    if (meetingController?.generateParticipantJwt) {
      return meetingController.generateParticipantJwt(roomId, participant, ttlMinutes);
    }
    const exp = Math.floor(now().getTime() / 1000) + Math.max(1, Number(ttlMinutes) || DEFAULT_TTL_MINUTES) * 60;
    const claims = {
      aud: 'jitsi',
      iss: 'kradle',
      sub: participant.org || 'kradle',
      room: roomId,
      exp,
      context: {
        user: {
          id: participant.id,
          name: participant.name,
          type: 'agent',
          role: participant.role || 'observer',
          avatar: participant.avatar || '',
        },
      },
    };
    const encoded = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const secret = process.env.KRADLE_JITSI_JWT_SECRET || process.env.JITSI_JWT_SECRET || 'dev-jitsi-secret';
    const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
    return `kradle-jitsi.${encoded}.${signature}`;
  }

  return {
    role: 'jitsi-agent-bridge',

    hasMeetingCapability(stack) {
      return stack?.spec?.jitsiCapability === true;
    },

    async prepareMeetingContext(dispatchRun, meetingRef, stack = {}, { resources = {} } = {}) {
      if (!meetingRef) return null;
      if (!this.hasMeetingCapability(stack)) return null;
      const meeting = await resolveMeeting(meetingRef, resources);
      if (!meeting || meeting.status?.phase !== 'Active') {
        throw new Error(`Meeting ${meetingRef} is not active`);
      }
      const participantName = stack.spec?.jitsiConfig?.participantName || stack.metadata?.name || dispatchRun.metadata?.name;
      const participant = {
        id: dispatchRun.metadata?.name,
        name: participantName,
        type: 'agent',
        role: stack.spec?.jitsiConfig?.role || 'observer',
      };
      const jwt = generateParticipantJwt(
        meeting.spec.roomId,
        participant,
        meeting.spec.ttlMinutes || 120,
      );
      const context = {
        roomUrl: meeting.status.roomUrl,
        roomId: meeting.spec.roomId,
        jwt,
        participantName,
        role: participant.role,
        capabilities: stack.spec?.jitsiConfig?.capabilities || {},
      };
      dispatchRun.spec.meetingRef = meetingRef;
      dispatchRun.spec.meetingContext = {
        roomUrl: context.roomUrl,
        roomId: context.roomId,
        participantName: context.participantName,
        role: context.role,
        capabilities: context.capabilities,
        tokenRef: { runtimeOnly: true },
      };
      return context;
    },

    buildSidecarSpec(meetingUrl, jwt, agentName, context = {}) {
      const capabilities = context.capabilities || {};
      return {
        name: 'jitsi-agent-sidecar',
        image: context.sidecarImage || sidecarImage,
        env: [
          { name: 'JITSI_ROOM_URL', value: meetingUrl },
          { name: 'JITSI_JWT', value: jwt },
          { name: 'JITSI_ROOM_ID', value: context.roomId || '' },
          { name: 'JITSI_PARTICIPANT_NAME', value: agentName || 'Kradle Agent' },
          { name: 'JITSI_PARTICIPANT_ROLE', value: context.role || 'observer' },
          { name: 'JITSI_AUDIO_MODE', value: capabilities.audio || 'listen' },
          { name: 'JITSI_CHAT_MODE', value: capabilities.chat || 'read' },
          { name: 'AGENT_SOCKET_PATH', value: SOCKET_PATH },
        ],
        volumeMounts: [{ name: 'agent-socket', mountPath: '/tmp' }],
        resources: {
          requests: { cpu: '100m', memory: '256Mi' },
          limits: { cpu: '500m', memory: '512Mi' },
        },
      };
    },

    async onAgentJoined(dispatchRunRef, meetingRef) {
      const event = { type: 'agent-joined-meeting', dispatchRunRef, meetingRef, timestamp: isoNow(now) };
      eventBus?.emit?.(event);
      await dispatchController?.recordMeetingEvent?.(event);
      return event;
    },

    async onAgentLeft(dispatchRunRef, meetingRef, reason = 'completed') {
      const event = { type: 'agent-left-meeting', dispatchRunRef, meetingRef, reason, timestamp: isoNow(now) };
      eventBus?.emit?.(event);
      await dispatchController?.recordMeetingEvent?.(event);
      const participantEvent = { type: 'participant-left', dispatchRunRef, meetingRef, participant: { id: dispatchRunRef, type: 'agent' }, reason, timestamp: event.timestamp };
      eventBus?.emit?.(participantEvent);
      await dispatchController?.recordMeetingEvent?.(participantEvent);
      return event;
    },
  };
}
