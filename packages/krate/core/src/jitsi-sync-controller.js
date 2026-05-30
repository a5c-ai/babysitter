import { createResource, clone } from './resource-model.js';

const EVENT_ALIASES = {
  room_created: 'room-created',
  room_destroyed: 'room-destroyed',
  participant_joined: 'participant-joined',
  participant_left: 'participant-left',
  recording_started: 'recording-started',
  recording_stopped: 'recording-stopped',
};

function canonicalType(value) {
  return EVENT_ALIASES[value] || String(value || '').replaceAll('_', '-');
}

function isoNow(now) {
  return (typeof now === 'function' ? now() : new Date()).toISOString();
}

export function createJitsiSyncController(options = {}) {
  const { persistFn, eventBus, now = () => new Date() } = options;
  const meetings = new Map();
  const recordings = new Map();
  const watermarks = new Map();

  async function persist(resource) {
    if (typeof persistFn === 'function') await persistFn(resource);
    return resource;
  }

  function emit(type, resource, extra = {}) {
    eventBus?.emit?.({ type, resource, timestamp: isoNow(now), ...extra });
  }

  function meetingName(roomId, state = {}) {
    return state.meetingRef || state.name || roomId;
  }

  return {
    role: 'jitsi-sync-controller',

    normalizeEvent(rawWebhookPayload = {}) {
      const eventType = canonicalType(rawWebhookPayload.eventType || rawWebhookPayload.type || rawWebhookPayload.event);
      return {
        deliveryId: rawWebhookPayload.deliveryId || rawWebhookPayload.id || null,
        eventType,
        providerRef: rawWebhookPayload.providerRef || rawWebhookPayload.provider || 'default',
        organizationRef: rawWebhookPayload.organizationRef || rawWebhookPayload.org || 'default',
        roomId: rawWebhookPayload.roomId || rawWebhookPayload.roomName || rawWebhookPayload.room,
        meetingRef: rawWebhookPayload.meetingRef,
        recordingId: rawWebhookPayload.recordingId,
        participant: rawWebhookPayload.participant || rawWebhookPayload.user || {},
        timestamp: rawWebhookPayload.timestamp || rawWebhookPayload.receivedAt || isoNow(now),
        data: rawWebhookPayload,
      };
    },

    async syncRoom(roomId, jitsiState = {}) {
      const eventType = canonicalType(jitsiState.eventType || jitsiState.type || 'room-created');
      const key = roomId;
      const existing = meetings.get(key);
      const phase = eventType === 'room-destroyed' ? 'Ended' : (jitsiState.phase || 'Active');
      const resource = {
        ...(existing || createResource('JitsiMeeting', {
          name: meetingName(roomId, jitsiState),
          namespace: jitsiState.namespace || `krate-org-${jitsiState.organizationRef || 'default'}`,
        }, {
          organizationRef: jitsiState.organizationRef || 'default',
          providerRef: jitsiState.providerRef || 'default',
          roomId,
          displayName: jitsiState.displayName || roomId,
          ttlMinutes: jitsiState.ttlMinutes || 120,
          participants: { invited: [] },
          roomConfig: {},
        }, {
          participants: { current: [], total: 0, peak: 0 },
          recording: { active: false, recordingId: null },
        })),
      };
      resource.status = {
        ...(resource.status || {}),
        phase,
        roomUrl: jitsiState.roomUrl || resource.status?.roomUrl || `https://meet.krate.local/${roomId}`,
        ...(phase === 'Active' && !resource.status?.startedAt ? { startedAt: jitsiState.timestamp || isoNow(now) } : {}),
        ...(phase === 'Ended' ? { endedAt: jitsiState.timestamp || isoNow(now) } : {}),
      };
      meetings.set(key, resource);
      await persist(resource);
      emit(phase === 'Ended' ? 'meeting-ended' : 'meeting-created', resource, { roomId });
      return resource;
    },

    async syncParticipant(roomId, participantEvent = {}) {
      const eventType = canonicalType(participantEvent.eventType || participantEvent.type || 'participant-joined');
      const meeting = meetings.get(roomId) || await this.syncRoom(roomId, participantEvent);
      const participant = {
        id: participantEvent.participant?.id || participantEvent.id || participantEvent.participant?.name,
        name: participantEvent.participant?.name || participantEvent.name || participantEvent.participant?.id,
        type: participantEvent.participant?.type || participantEvent.type || 'user',
        joinedAt: participantEvent.timestamp || isoNow(now),
        ...clone(participantEvent.participant || {}),
      };
      const existing = meeting.status?.participants?.current || [];
      const current = eventType === 'participant-left'
        ? existing.filter((item) => item.id !== participant.id)
        : [...existing.filter((item) => item.id !== participant.id), participant];
      const previousTotal = Number(meeting.status?.participants?.total || 0);
      const total = eventType === 'participant-joined' && !existing.some((item) => item.id === participant.id)
        ? previousTotal + 1
        : previousTotal;
      meeting.status = {
        ...(meeting.status || {}),
        participants: {
          current,
          total,
          peak: Math.max(Number(meeting.status?.participants?.peak || 0), current.length, total),
        },
      };
      meetings.set(roomId, meeting);
      await persist(meeting);
      emit(eventType, meeting, { roomId, participant });
      return meeting;
    },

    async syncRecording(roomId, recordingEvent = {}) {
      const eventType = canonicalType(recordingEvent.eventType || recordingEvent.type || 'recording-started');
      const recordingId = recordingEvent.recordingId || `rec-${roomId}`;
      const existing = recordings.get(recordingId);
      const phase = eventType === 'recording-stopped' ? 'Completed' : 'Recording';
      const resource = {
        ...(existing || createResource('JitsiRecording', {
          name: recordingId,
          namespace: recordingEvent.namespace || `krate-org-${recordingEvent.organizationRef || 'default'}`,
        }, {
          organizationRef: recordingEvent.organizationRef || 'default',
          meetingRef: recordingEvent.meetingRef || roomId,
          providerRef: recordingEvent.providerRef || 'default',
          format: recordingEvent.format || 'mp4',
          storageRef: recordingEvent.storageRef,
        }, {
          transcript: { available: false },
        })),
      };
      resource.status = {
        ...(resource.status || {}),
        phase,
        ...(phase === 'Recording' ? { startedAt: recordingEvent.timestamp || isoNow(now) } : {}),
        ...(phase === 'Completed' ? { endedAt: recordingEvent.timestamp || isoNow(now), duration: recordingEvent.duration } : {}),
      };
      recordings.set(recordingId, resource);
      const meeting = meetings.get(roomId);
      if (meeting) {
        meeting.status = {
          ...(meeting.status || {}),
          recording: { active: phase === 'Recording', recordingId: phase === 'Recording' ? recordingId : null },
        };
        await persist(meeting);
      }
      await persist(resource);
      emit(eventType, resource, { roomId, recordingId });
      return resource;
    },

    updateWatermark(providerRef, timestamp) {
      const current = watermarks.get(providerRef);
      if (!current || timestamp > current) {
        watermarks.set(providerRef, timestamp);
        persist({
          apiVersion: 'krate.a5c.ai/v1alpha1',
          kind: 'ExternalSyncState',
          metadata: { name: `jitsi-watermark-${providerRef}`, namespace: 'default', labels: {}, annotations: {} },
          spec: { organizationRef: 'default', providerRef, resourceRef: 'jitsi', phase: 'Synced', watermark: timestamp },
          status: { phase: 'Synced', lastSuccessfulSyncAt: isoNow(now) },
        });
      }
    },

    getWatermark(providerRef) {
      return watermarks.get(providerRef) || null;
    },
  };
}
