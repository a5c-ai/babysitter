import crypto from 'node:crypto';
import { invalidateApiCache } from './api-errors.js';

const {
  clearSnapshotCache,
  createKrateApiController,
  globalEventBus,
  orgNamespaceName,
} = await import('@a5c-ai/krate-sdk').catch(() => import('../../../sdk/src/index.js'));

export const JITSI_KINDS = {
  providers: 'JitsiMeetProvider',
  meetings: 'JitsiMeeting',
  templates: 'JitsiMeetingTemplate',
  recordings: 'JitsiRecording',
};

export function jitsiController(org) {
  return createKrateApiController({ namespace: orgNamespaceName(org) });
}

export function jitsiName(value, fallback = 'meeting') {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63) || fallback;
}

export function orgResource(org, kind, name, spec = {}, status = {}) {
  const namespace = orgNamespaceName(org);
  return {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind,
    metadata: {
      name,
      namespace,
      labels: {
        'krate.a5c.ai/org': org,
        'krate.a5c.ai/namespace': namespace,
      },
    },
    spec: { organizationRef: org, ...spec },
    status,
  };
}

export async function listJitsiResources(org, kind, { controller = jitsiController(org), status } = {}) {
  const result = await controller.listResourceForOrg?.(org, kind) || await controller.listResource(kind);
  const items = result?.items || (Array.isArray(result) ? result : []);
  if (!status || status === 'all') return { ...result, items };
  const phase = status === 'active' ? 'Active' : status === 'ended' ? 'Ended' : status;
  return { ...result, items: items.filter((item) => item.status?.phase === phase) };
}

export async function getJitsiResource(org, kind, name, { controller = jitsiController(org) } = {}) {
  return controller.getResourceForOrg?.(org, kind, name) || controller.getResource(kind, name);
}

export async function applyJitsiResource(org, resource, { controller = jitsiController(org), eventType = 'resource-applied' } = {}) {
  const result = await (controller.applyResourceForOrg?.(org, resource) || controller.applyResource(resource));
  clearSnapshotCache();
  invalidateApiCache();
  globalEventBus.emit({ type: eventType, resource: result.resource || resource, timestamp: new Date().toISOString() });
  return result;
}

export async function deleteJitsiResource(org, kind, name, { controller = jitsiController(org) } = {}) {
  const result = await (controller.deleteResourceForOrg?.(org, kind, name) || controller.deleteResource(kind, name));
  clearSnapshotCache();
  invalidateApiCache();
  globalEventBus.emit({ type: 'resource-deleted', kind, name, timestamp: new Date().toISOString() });
  return result;
}

export function createMeetingResource(org, body = {}) {
  const displayName = String(body.displayName || body.name || 'Jitsi meeting');
  const name = jitsiName(body.name || displayName, `meeting-${Date.now()}`);
  const ttlMinutes = Number(body.ttlMinutes || body.defaultRoomTTL || 120);
  const roomId = body.roomId || `${name}-${org}`;
  return orgResource(org, 'JitsiMeeting', name, {
    providerRef: body.providerRef || body.jitsiProvider || 'default',
    templateRef: body.templateRef || undefined,
    roomId,
    displayName,
    ttlMinutes,
    participants: {
      invited: [
        ...(body.participants?.invited || []),
        ...(body.inviteAgentStacks || []).map((ref) => ({ type: 'agentStack', ref, role: 'observer' })),
      ],
    },
    roomConfig: body.roomConfig || {},
  }, {
    phase: body.phase || 'Active',
    roomUrl: body.roomUrl || `https://meet.krate.local/${roomId}`,
    participants: { current: [], total: 0, peak: 0 },
    recording: { active: false, recordingId: null },
  });
}

export function createProviderResource(org, body = {}) {
  return orgResource(org, 'JitsiMeetProvider', jitsiName(body.name || body.endpoint || 'jitsi-provider'), {
    endpoint: body.endpoint,
    internalEndpoint: body.internalEndpoint,
    authMode: body.authMode || 'jwt',
    jwtConfig: body.jwtConfig,
    webhookEndpoint: `/api/orgs/${org}/jitsi/webhooks/ingest`,
    deploymentMode: body.deploymentMode || 'external',
    features: body.features || {},
    defaultRoomConfig: body.defaultRoomConfig || {},
  }, { phase: body.phase || 'Pending' });
}

export function createTemplateResource(org, body = {}) {
  return orgResource(org, 'JitsiMeetingTemplate', jitsiName(body.name || body.displayName || 'meeting-template'), {
    providerRef: body.providerRef || 'default',
    displayName: body.displayName || body.name || 'Meeting template',
    roomNameTemplate: body.roomNameTemplate,
    ttlMinutes: Number(body.ttlMinutes || 60),
    schedule: body.schedule,
    participants: body.participants || { autoInvite: [] },
    roomConfig: body.roomConfig || {},
    agentConfig: body.agentConfig || {},
    recording: body.recording || {},
  }, { phase: body.phase || 'Active' });
}

export function createRecordingResource(org, body = {}) {
  return orgResource(org, 'JitsiRecording', jitsiName(body.name || body.recordingId || 'recording'), {
    meetingRef: body.meetingRef,
    providerRef: body.providerRef || 'default',
    format: body.format || 'mp4',
    storageRef: body.storageRef,
  }, {
    phase: body.phase || 'Recording',
    startedAt: body.startedAt || new Date().toISOString(),
    endedAt: body.endedAt,
    duration: body.duration,
    transcript: body.transcript || { available: false },
  });
}

export function createJoinPayload(meeting, args = {}) {
  const ttlMinutes = Math.max(1, Math.min(Number(args.ttlMinutes || meeting.spec?.ttlMinutes || 60), 60));
  const exp = Math.floor(Date.now() / 1000) + ttlMinutes * 60;
  const claims = {
    aud: 'jitsi',
    iss: 'krate',
    room: meeting.spec?.roomId,
    org: meeting.spec?.organizationRef,
    exp,
    context: {
      user: {
        name: args.participantName || args.displayName || 'Krate user',
        id: args.participantRef || 'krate-user',
      },
    },
  };
  const encoded = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.createHmac('sha256', jitsiJwtSecret()).update(encoded).digest('base64url');
  return {
    meetingRef: meeting.metadata?.name,
    org: meeting.spec?.organizationRef,
    roomUrl: meeting.status?.roomUrl || `https://meet.krate.local/${meeting.spec?.roomId}`,
    roomId: meeting.spec?.roomId,
    jwt: `krate-jitsi.${encoded}.${signature}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    expiresInSeconds: ttlMinutes * 60,
  };
}

export function withParticipantInvite(meeting, invite = {}) {
  const invited = meeting.spec?.participants?.invited || [];
  return {
    ...meeting,
    spec: {
      ...(meeting.spec || {}),
      participants: {
        ...(meeting.spec?.participants || {}),
        invited: [
          ...invited,
          {
            type: invite.participantType,
            ref: invite.participantRef,
            role: invite.role || (invite.participantType === 'agentStack' ? 'observer' : 'participant'),
          },
        ],
      },
    },
  };
}

function jitsiJwtSecret() {
  const secret = process.env.KRATE_JITSI_JWT_SECRET || process.env.JITSI_JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('KRATE_JITSI_JWT_SECRET is required');
  return 'dev-jitsi-secret';
}

export function verifyJitsiWebhookSignature(rawBody, signatureHeader, secret = process.env.KRATE_JITSI_WEBHOOK_SECRET || process.env.JITSI_WEBHOOK_SECRET) {
  if (!signatureHeader) return { valid: false, reason: 'missing_signature' };
  const resolvedSecret = secret || (process.env.NODE_ENV === 'production' ? null : 'dev-jitsi-webhook-secret');
  if (!resolvedSecret) return { valid: false, reason: 'missing_webhook_secret' };
  const signature = signatureHeader.replace(/^sha256=/, '');
  const expected = crypto.createHmac('sha256', resolvedSecret).update(rawBody).digest('hex');
  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (actualBuffer.length !== expectedBuffer.length) return { valid: false, reason: 'invalid_signature' };
  return { valid: crypto.timingSafeEqual(actualBuffer, expectedBuffer), reason: 'invalid_signature' };
}

export function createJitsiWebhookDeliveryCache({ ttlMs = 5 * 60 * 1000, replayWindowMs = 5 * 60 * 1000, now = () => Date.now() } = {}) {
  const deliveries = new Map();
  return {
    checkAndRemember(deliveryId, timestamp = new Date(now()).toISOString()) {
      const currentTime = now();
      for (const [id, record] of deliveries) {
        if (currentTime - record.seenAt > ttlMs) deliveries.delete(id);
      }
      const eventTime = new Date(timestamp).getTime();
      if (Number.isFinite(eventTime) && currentTime - eventTime > replayWindowMs) {
        return { duplicate: false, replay: true, deliveryId };
      }
      if (deliveryId && deliveries.has(deliveryId)) {
        return { duplicate: true, replay: false, deliveryId };
      }
      if (deliveryId) deliveries.set(deliveryId, { seenAt: currentTime, timestamp });
      return { duplicate: false, replay: false, deliveryId };
    },
  };
}

function participantList(meeting, payload, joined) {
  const existing = meeting.status?.participants?.current || [];
  const participant = {
    id: payload.participant?.id || payload.participantId || payload.userId || payload.participant?.name,
    name: payload.participant?.name || payload.participantName,
    type: payload.participant?.type || payload.participantType || 'user',
    joinedAt: payload.timestamp || new Date().toISOString(),
    ...(payload.participant || {}),
  };
  const current = joined
    ? [...existing.filter((item) => item.id !== participant.id), participant]
    : existing.filter((item) => item.id !== participant.id);
  const previousTotal = Number(meeting.status?.participants?.total || 0);
  const total = joined && !existing.some((item) => item.id === participant.id) ? previousTotal + 1 : previousTotal;
  return {
    current,
    total,
    peak: Math.max(Number(meeting.status?.participants?.peak || 0), current.length, total),
  };
}

export function handleJitsiWebhookPayload(org, rawBody, { deliveryId } = {}) {
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new Error('invalid_json');
  }

  const rawEventType = payload.eventType || payload.type || payload.event;
  const eventType = String(rawEventType || '').replaceAll('_', '-');
  const roomId = payload.roomId || payload.roomName || payload.room;
  const meetingRef = payload.meetingRef || roomId;
  const providerRef = payload.providerRef || 'default';
  const timestamp = payload.timestamp || new Date().toISOString();
  const effectiveDeliveryId = deliveryId || payload.deliveryId || payload.id || `${eventType}:${roomId || payload.recordingId}:${timestamp}`;

  if (eventType === 'room-created') {
    return {
      deliveryId: effectiveDeliveryId,
      eventType: 'meeting-created',
      resource: createMeetingResource(org, {
        name: meetingRef,
        displayName: payload.displayName || payload.roomName || roomId,
        providerRef,
        roomId,
        roomUrl: payload.roomUrl,
        phase: 'Active',
      }),
    };
  }

  if (eventType === 'room-destroyed') {
    const resource = createMeetingResource(org, {
      name: meetingRef,
      displayName: payload.displayName || payload.roomName || roomId,
      providerRef,
      roomId,
      roomUrl: payload.roomUrl,
      phase: 'Ended',
    });
    resource.status.endedAt = timestamp;
    return { deliveryId: effectiveDeliveryId, eventType: 'meeting-ended', resource };
  }

  if (eventType === 'participant-joined' || eventType === 'participant-left') {
    const resource = createMeetingResource(org, {
      name: meetingRef,
      displayName: payload.displayName || payload.roomName || roomId,
      providerRef,
      roomId,
      roomUrl: payload.roomUrl,
      phase: 'Active',
    });
    resource.status.participants = participantList(resource, payload, eventType === 'participant-joined');
    return { deliveryId: effectiveDeliveryId, eventType, resource };
  }

  if (eventType === 'recording-started') {
    return {
      deliveryId: effectiveDeliveryId,
      eventType: 'recording-started',
      resource: createRecordingResource(org, {
        name: payload.recordingId,
        recordingId: payload.recordingId,
        meetingRef,
        providerRef,
        phase: 'Recording',
        startedAt: timestamp,
      }),
    };
  }

  if (eventType === 'recording-stopped') {
    return {
      deliveryId: effectiveDeliveryId,
      eventType: 'recording-stopped',
      resource: createRecordingResource(org, {
        name: payload.recordingId,
        recordingId: payload.recordingId,
        meetingRef,
        providerRef,
        phase: 'Completed',
        endedAt: timestamp,
        duration: payload.duration,
      }),
    };
  }

  return { deliveryId: effectiveDeliveryId, eventType, resource: null, ignored: true };
}
