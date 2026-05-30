import crypto from 'node:crypto';
import { createResource, validateResource, clone } from './resource-model.js';

const DEFAULT_TTL_MINUTES = 60;

function isoNow(now) {
  return (typeof now === 'function' ? now() : new Date()).toISOString();
}

function epochSeconds(now, ttlMinutes) {
  return Math.floor((typeof now === 'function' ? now() : new Date()).getTime() / 1000) + ttlMinutes * 60;
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signJwt(claims, secret) {
  const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeJson(claims);
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function createJitsiMeetingController(options = {}) {
  const {
    providerClient = {},
    resourceGateway = null,
    eventBus = null,
    jwtConfig = {},
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

  async function getResource(kind, name) {
    if (!name) return null;
    return resourceGateway?.get?.(kind, name) || null;
  }

  async function getRecording(name) {
    return getResource('JitsiRecording', name);
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
      const provider = await getResource('JitsiMeetProvider', meetingSpec.providerRef);
      const template = await getResource('JitsiMeetingTemplate', meetingSpec.templateRef);
      const mergedSpec = {
        ...meetingSpec,
        endpoint: meetingSpec.endpoint || provider?.spec?.endpoint,
        ttlMinutes: meetingSpec.ttlMinutes || template?.spec?.ttlMinutes || provider?.spec?.defaultRoomTTL || DEFAULT_TTL_MINUTES,
        roomConfig: {
          ...(provider?.spec?.defaultRoomConfig || {}),
          ...(template?.spec?.roomConfig || {}),
          ...(meetingSpec.roomConfig || {}),
        },
      };
      const providerResult = await providerClient.createRoom?.(mergedSpec) || {};
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
        ttlMinutes: mergedSpec.ttlMinutes,
        participants: clone(meetingSpec.participants || { invited: [] }),
        roomConfig: clone(mergedSpec.roomConfig || {}),
      }, {
        phase: 'Active',
        roomUrl: providerResult.roomUrl || meetingSpec.roomUrl || `${mergedSpec.endpoint || 'https://meet.krate.local'}/${roomId}`,
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

    generateParticipantJwt(roomId, participant = {}, ttlMinutes = DEFAULT_TTL_MINUTES, providerJwtConfig = {}) {
      const config = { ...jwtConfig, ...providerJwtConfig, ...(participant.jwtConfig || {}) };
      const claims = {
        aud: config.audience || 'jitsi',
        iss: config.issuer || 'krate',
        sub: config.subject || participant.subject || participant.org || 'krate',
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
      return signJwt(claims, config.secret || jwtSecret);
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
      const recording = createResource('JitsiRecording', {
        name: recordingId,
        namespace: meeting.metadata?.namespace,
      }, {
        organizationRef: meeting.spec.organizationRef,
        meetingRef: meeting.metadata.name,
        providerRef: meeting.spec.providerRef,
        format: result.format || 'mp4',
        storageRef: result.storageRef,
      }, {
        phase: 'Recording',
        startedAt: isoNow(now),
        transcript: { available: false },
      });
      const updated = {
        ...meeting,
        status: {
          ...(meeting.status || {}),
          recording: { active: true, recordingId },
        },
      };
      await persist(recording);
      const persisted = await persist(updated);
      emit('recording-started', persisted, { recordingId });
      return persisted;
    },

    async stopRecording(meetingRef) {
      const meeting = await getMeeting(meetingRef);
      if (!meeting) throw new Error(`JitsiMeeting ${meetingRef} not found`);
      const result = await providerClient.stopRecording?.(meeting.spec.roomId) || {};
      const recordingId = result.recordingId || meeting.status?.recording?.recordingId || null;
      if (recordingId) {
        const existingRecording = await getRecording(recordingId);
        const recording = existingRecording || createResource('JitsiRecording', {
          name: recordingId,
          namespace: meeting.metadata?.namespace,
        }, {
          organizationRef: meeting.spec.organizationRef,
          meetingRef: meeting.metadata.name,
          providerRef: meeting.spec.providerRef,
          format: result.format || 'mp4',
          storageRef: result.storageRef,
        }, {});
        await persist({
          ...recording,
          status: {
            ...(recording.status || {}),
            phase: 'Completed',
            endedAt: isoNow(now),
            duration: result.duration,
            transcript: recording.status?.transcript || { available: false },
          },
        });
      }
      const updated = {
        ...meeting,
        status: {
          ...(meeting.status || {}),
          recording: { active: false, recordingId },
        },
      };
      return persist(updated);
    },
  };
}
