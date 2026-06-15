// Webhook Ingest API Route — POST /api/orgs/[org]/webhooks/ingest
//
// Accepts inbound webhook payloads from GitHub and Gitea.
// Verifies HMAC-SHA256 signature, normalizes the event, and enqueues it
// via the webhook controller for downstream processing.
//
// Intentionally unauthenticated: HMAC signature on X-Hub-Signature-256 header
// is used instead of session auth. Webhook senders (GitHub, Gitea) do not
// carry Kradle session cookies. Do not add withAuth here.

import { createWebhookController } from '@a5c-ai/kradle-sdk';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orgs/[org]/webhooks/ingest
 *
 * Headers:
 *   X-Hub-Signature-256   — HMAC-SHA256 signature (sha256=<hex>)
 *   X-GitHub-Event        — event type (GitHub)
 *   X-Gitea-Event         — event type (Gitea)
 *   X-GitHub-Delivery     — delivery UUID (GitHub)
 *   X-Gitea-Delivery      — delivery UUID (Gitea)
 *
 * Returns:
 *   200 { ok: true, deliveryId, queued, duplicate }
 *   400 { error: 'missing_event_header' | 'invalid_signature' | 'invalid_json' }
 */
export async function POST(request, { params }) {
  const { org } = await params;

  // Read raw body first (needed for HMAC verification)
  const rawBody = await request.text();

  // Determine provider from event headers
  const githubEvent = request.headers.get('x-github-event');
  const giteaEvent = request.headers.get('x-gitea-event');

  let provider, eventType, deliveryId;

  if (githubEvent) {
    provider = 'github';
    eventType = githubEvent;
    deliveryId = request.headers.get('x-github-delivery') || `gh-${Date.now()}`;
  } else if (giteaEvent) {
    provider = 'gitea';
    eventType = giteaEvent;
    deliveryId = request.headers.get('x-gitea-delivery') || `gt-${Date.now()}`;
  } else {
    return Response.json(
      { error: 'missing_event_header', message: 'Missing X-GitHub-Event or X-Gitea-Event header' },
      { status: 400 }
    );
  }

  // HMAC signature verification
  const signature = request.headers.get('x-hub-signature-256');
  const secret = process.env.KRADLE_WEBHOOK_SECRET || 'dev-secret';
  const isProduction = process.env.NODE_ENV === 'production';

  const controller = createWebhookController({ secret });

  if (signature) {
    // Verify signature when present
    const verification = controller.verifyHmacSignature(rawBody, signature);
    if (!verification.valid) {
      return Response.json(
        { error: 'invalid_signature', message: verification.reason || 'Signature verification failed' },
        { status: 400 }
      );
    }
  } else if (isProduction) {
    // In production, signature is required
    return Response.json(
      { error: 'invalid_signature', message: 'X-Hub-Signature-256 header is required in production' },
      { status: 400 }
    );
  }
  // In non-production, missing signature is allowed (dev/test mode)

  // Parse JSON payload
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: 'invalid_json', message: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  // Normalize event shape
  const normalizedEvent = {
    eventType,
    deliveryId,
    provider,
    repository: payload.repository?.full_name || payload.repository?.name || null,
    ref: payload.ref || payload.pull_request?.head?.ref || null,
    action: payload.action || null,
    payload,
  };

  // Process the delivery (dedup check + enqueue)
  const result = controller.processDelivery({
    deliveryId,
    eventType,
    payload,
    rawBody,
  });

  return Response.json({
    ok: true,
    deliveryId: result.deliveryId,
    queued: result.queued,
    duplicate: result.duplicate,
    provider,
    eventType,
    repository: normalizedEvent.repository,
  });
}
