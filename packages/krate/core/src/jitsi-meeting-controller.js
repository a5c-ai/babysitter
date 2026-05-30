import crypto from 'node:crypto';
import { createResource, validateResource, clone } from './resource-model.js';

const DEFAULT_TTL_MINUTES = 60;

function isoNow(now) {
  return (typeof now === 'function' ? now() : new Date()).toISOString();
}

function epochSeconds(now, ttlMinutes) {
  return Math.floor((typeof now === 'function' ? now() : new Date()).getTime() / 1000) + ttlMinutes * 60;
}

export function createJitsiMeetingController(options = {}) {
  const {
    providerClient = {},
    resourceGateway = null,
    eventBus = null,
    jwtSecret = process.env.KRATE_JITSI_JWT_SECRET || process.env.JITSI_JWT_SECRET || 'dev-jitsi-secret',
    now = () => new Date(),
  } = options;

  async function listMeetings() {
    const result = await resourceGateway?.list?.('JitsiMeeting');
    return result?.items || (Array.isArray(result) ? result : []);
  }

  async function getMeeting(nameOrRoomId) {
    const direct = await resourceGateway?.get?.('JitsiMeeting', nameOrRoomId);
    if (direct) return direct;
    return (await listMeetings()).find((meeting) => meeting.metadata?.name === nameOrRoomId || meeting.spec?.roomId === nameOrRoomId) || null;
  }

  async function persist(resource) {
    if (resourceGateway?.apply) {
      const result = await resourceGateway.apply(resource);
      return result?.resource || resource;
    }
    return resource;
  }

  function emit(type, resource, extra = {}) {
    eventBus?.emit?.({ type, resource, timestamp: isoNow(now), ...extra });
  }

  return {
    role: 'jitsi-meeting-controller',

    validate(resource) {
      if (resource?.kind !== 'JitsiMeeting') throw new Error('Jitsi meeting controller validates JitsiMeeting resources only');
      return validateResource(resource);
    },

    async createRoom(meetingSpec = {}) {
      const roomId = meetingSpec.roomId;
      if (!roomId) throw new Error('createRoom requires roomId');
      const providerResult = await providerClient.createRoom?.(meetingSpec) || {};
      const resource = createResource('JitsiMeeting', {
        name: meetingSpec.name || roomId,
        namespace: meetingSpec.namespace || `krate-org-${meetingSpec.organizationRef || 'default'}`,
      }, {
        organizationRef: meetingSpec.organizationRef || 'default',
        providerRef: meetingSpec.providerRef || 'default',
        templateRef: meetingSpec.templateRef,
        roomId,
        displayName: meetingSpec.displayName || roomId,
        dispatchRunRef: meetingSpec.dispatchRunRef,
        ttlMinutes: meetingSpec.ttlMinutes || DEFAULT_TTL_MINUTES,
        participants: clone(meetingSpec.participants || { invited: [] }),
        roomConfig: clone(meetingSpec.roomConfig || {}),
      }, {
        phase: 'Active',
        roomUrl: providerResult.roomUrl || meetingSpec.roomUrl || `${meetingSpec.endpoint || 'https://meet.krate.local'}/${roomId}`,
        startedAt: isoNow(now),
        endedAt: null,
        duration: null,
        participants: { current: [], total: 0, peak: 0 },
        recording: { active: false, recordingId: null },
      });
      this.validate(resource);
      const persisted = await persist(resource);
      emit('meeting-created', persisted, { roomId });
      return persisted;
    },

    async endRoom(roomId) {
      await providerClient.endRoom?.(roomId);
      const meeting = await getMeeting(roomId);
      if (!meeting) throw new Error(`JitsiMeeting for room ${roomId} not found`);
      const endedAt = isoNow(now);
      const updated = {
        ...meeting,
        status: {
          ...(meeting.status || {}),
          phase: 'Ended',
          endedAt,
        },
      };
      const persisted = await persist(updated);
      emit('meeting-ended', persisted, { roomId });
      return persisted;
    },

    generateParticipantJwt(roomId, participant = {}, ttlMinutes = DEFAULT_TTL_MINUTES) {
      const claims = {
        aud: 'jitsi',
        iss: 'krate',
        sub: participant.subject || participant.org || 'krate',
        room: roomId,
        exp: epochSeconds(now, Math.max(1, Number(ttlMinutes) || DEFAULT_TTL_MINUTES)),
        context: {
          user: {
            id: participant.id || participant.ref || participant.name || 'krate-user',
            name: participant.name || participant.displayName || participant.id || 'Krate user',
            type: participant.type || 'user',
            role: participant.role || 'participant',
            avatar: participant.avatar || '',
          },
          features: participant.features || {},
        },
      };
      const encoded = Buffer.from(JSON.stringify(claims)).toString('base64url');
      const signature = crypto.createHmac('sha256', jwtSecret).update(encoded).digest('base64url');
      return `krate-jitsi.${encoded}.${signature}`;
    },

    async reconcile(meeting) {
      this.validate(meeting);
      const state = await providerClient.getRoom?.(meeting.spec.roomId) || {};
      const currentTotal = Number(state.participantCount ?? meeting.status?.participants?.current?.length ?? 0);
      const updated = {
        ...meeting,
        status: {
          ...(meeting.status || {}),
          phase: state.phase || meeting.status?.phase || 'Active',
          participants: {
            ...(meeting.status?.participants || {}),
            total: currentTotal,
            peak: Math.max(Number(meeting.status?.participants?.peak || 0), currentTotal),
          },
          lastReconciledAt: isoNow(now),
        },
      };
      return persist(updated);
    },

    async listActiveMeetings(organizationRef) {
      return (await listMeetings()).filter((meeting) => (
        meeting.spec?.organizationRef === organizationRef && meeting.status?.phase === 'Active'
      ));
    },

    async getMeeting(nameOrRoomId) {
      return getMeeting(nameOrRoomId);
    },

    async getMeetingStats(roomId) {
      return providerClient.getStats?.(roomId) || { active: false, participantCount: 0 };
    },

    async startRecording(meetingRef) {
      const meeting = await getMeeting(meetingRef);
      if (!meeting) throw new Error(`JitsiMeeting ${meetingRef} not found`);
      const result = await providerClient.startRecording?.(meeting.spec.roomId) || {};
      const recordingId = result.recordingId || `rec-${meeting.metadata.name}`;
      const updated = {
        ...meeting,
        status: {
          ...(meeting.status || {}),
          recording: { active: true, recordingId },
        },
      };
      const persisted = await persist(updated);
      emit('recording-started', persisted, { recordingId });
      return persisted;
    },

    async stopRecording(meetingRef) {
      const meeting = await getMeeting(meetingRef);
      if (!meeting) throw new Error(`JitsiMeeting ${meetingRef} not found`);
      const result = await providerClient.stopRecording?.(meeting.spec.roomId) || {};
      const updated = {
        ...meeting,
        status: {
          ...(meeting.status || {}),
          recording: { active: false, recordingId: result.recordingId || meeting.status?.recording?.recordingId || null },
        },
      };
      return persist(updated);
    },
  };
}
