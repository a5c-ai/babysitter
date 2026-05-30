const DEFAULT_SIDECAR_IMAGE = 'ghcr.io/a5c-ai/jitsi-agent-sidecar:latest';
const SOCKET_PATH = '/tmp/jitsi-agent.sock';

function isoNow(now) {
  return (typeof now === 'function' ? now() : new Date()).toISOString();
}

export function createJitsiAgentBridge(options = {}) {
  const {
    meetingController,
    dispatchController,
    eventBus,
    sidecarImage = process.env.KRATE_JITSI_AGENT_SIDECAR_IMAGE || DEFAULT_SIDECAR_IMAGE,
    now = () => new Date(),
  } = options;

  return {
    role: 'jitsi-agent-bridge',

    hasMeetingCapability(stack) {
      return stack?.spec?.jitsiCapability === true;
    },

    async prepareMeetingContext(dispatchRun, meetingRef, stack = {}) {
      if (!meetingRef) return null;
      if (!this.hasMeetingCapability(stack)) return null;
      const meeting = await meetingController?.getMeeting?.(meetingRef);
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
      const jwt = meetingController.generateParticipantJwt(
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
      dispatchRun.spec.meetingContext = context;
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
          { name: 'JITSI_PARTICIPANT_NAME', value: agentName || 'Krate Agent' },
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
      return event;
    },
  };
}
