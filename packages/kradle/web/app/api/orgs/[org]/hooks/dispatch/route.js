import { createKradleApiController, orgNamespaceName, createVirtualModelHookBridge, createVirtualModelController } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

// ── In-memory rate limiter: 60 requests per minute per org ──────────────
const rateLimitWindow = 60_000;
const rateLimitMax = 60;
const orgRequestCounts = new Map();

function checkRateLimit(org) {
  const now = Date.now();
  let entry = orgRequestCounts.get(org);
  if (!entry || now - entry.windowStart >= rateLimitWindow) {
    entry = { windowStart: now, count: 0 };
    orgRequestCounts.set(org, entry);
  }
  entry.count += 1;
  return entry.count <= rateLimitMax;
}

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;

  if (!checkRateLimit(org)) {
    return errorResponse('Rate limit exceeded — max 60 requests per minute per org', 429);
  }

  try {
    const body = await request.json();
    const { hookType, modelName, payload } = body;

    if (!hookType || !modelName) {
      return errorResponse('hookType and modelName are required', 400);
    }

    const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
    const bridge = createVirtualModelHookBridge({ controller: createVirtualModelController() });

    let virtualModels = [];
    try {
      const vmResult = await controller.listResourceForOrg(org, 'KradleVirtualModel');
      virtualModels = vmResult?.items || vmResult || [];
    } catch (err) {
      console.warn('[hooks/dispatch] Failed to list KradleVirtualModel resources:', err?.message || err);
    }

    const matchedVm = bridge.matchVirtualModel(modelName, virtualModels);
    if (!matchedVm) {
      return Response.json({ decision: 'allow' }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const result = bridge.handleHook(hookType, payload || {}, matchedVm);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
