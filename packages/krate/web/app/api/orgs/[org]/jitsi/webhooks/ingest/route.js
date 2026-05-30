import { applyJitsiResource, createMeetingResource, createRecordingResource, verifyJitsiWebhookSignature } from '../../../../../../lib/jitsi-service.js';

export const dynamic = 'force-dynamic';

export const POST = async (request, { params }) => {
  const { org } = await params;
  const rawBody = await request.text();
  const signature = request.headers.get('x-jitsi-signature');
  const verification = verifyJitsiWebhookSignature(rawBody, signature);
  if (!verification.valid) {
    return Response.json({ error: verification.reason || 'invalid_signature' }, { status: 400 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const eventType = payload.eventType || payload.type;
  let result = { accepted: true, eventType };
  if (eventType === 'room-created') {
    result = await applyJitsiResource(org, createMeetingResource(org, {
      name: payload.roomId || payload.roomName,
      displayName: payload.displayName || payload.roomName || payload.roomId,
      providerRef: payload.providerRef,
      roomId: payload.roomId || payload.roomName,
      roomUrl: payload.roomUrl,
      phase: 'Active',
    }), { eventType: 'meeting-created' });
  } else if (eventType === 'recording-started') {
    result = await applyJitsiResource(org, createRecordingResource(org, {
      name: payload.recordingId,
      meetingRef: payload.meetingRef || payload.roomId,
      providerRef: payload.providerRef,
      phase: 'Recording',
    }), { eventType: 'recording-started' });
  }

  return Response.json({ ok: true, eventType, result }, { headers: { 'Cache-Control': 'no-store' } });
};
