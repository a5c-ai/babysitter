import { applyJitsiResource, createJitsiWebhookDeliveryCache, handleJitsiWebhookPayload, verifyJitsiWebhookSignature } from '../../../../../../lib/jitsi-service.js';

export const dynamic = 'force-dynamic';

const deliveries = createJitsiWebhookDeliveryCache();

export const POST = async (request, { params }) => {
  const { org } = await params;
  const rawBody = await request.text();
  const signature = request.headers.get('x-jitsi-signature');
  const verification = verifyJitsiWebhookSignature(rawBody, signature);
  if (!verification.valid) {
    return Response.json({ error: verification.reason || 'invalid_signature' }, { status: 400 });
  }

  let normalized;
  try {
    normalized = handleJitsiWebhookPayload(org, rawBody, {
      deliveryId: request.headers.get('x-jitsi-delivery') || undefined,
    });
  } catch (err) {
    if (err.message === 'invalid_json') {
      return Response.json({ error: 'invalid_json' }, { status: 400 });
    }
    throw err;
  }

  const replay = deliveries.checkAndRemember(normalized.deliveryId, normalized.timestamp);
  if (replay.replay) {
    return Response.json({ error: 'stale_delivery' }, { status: 409 });
  }
  if (replay.duplicate) {
    return Response.json({ ok: true, duplicate: true, deliveryId: normalized.deliveryId }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (!normalized.resource) {
    return Response.json({ ok: true, ignored: true, eventType: normalized.eventType }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const result = await applyJitsiResource(org, normalized.resource, { eventType: normalized.eventType });
  return Response.json({ ok: true, eventType: normalized.eventType, result }, { headers: { 'Cache-Control': 'no-store' } });
};
