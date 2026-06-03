import { createKradleApiController, orgNamespaceName, clearSnapshotCache, validateResource, ALL_KINDS, globalEventBus } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';


export const GET = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') || 'Repository';
  const limitParam = url.searchParams.get('limit');
  try {
    const result = await controller.listResourceForOrg(org, kind);
    const allItems = result?.items || (Array.isArray(result) ? result : []);

    // Backward compat: if no limit param, return the raw result as before
    if (limitParam == null) {
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    }

    const limit = Math.max(1, Math.min(200, parseInt(limitParam, 10) || 25));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset'), 10) || 0);
    const sliced = allItems.slice(offset, offset + limit);

    return Response.json({
      items: sliced,
      total: allItems.length,
      limit,
      offset,
      hasMore: offset + limit < allItems.length,
    }, { headers: { 'Cache-Control': 'private, max-age=5' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
});

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  try {
    const resource = await request.json();
    const scoped = {
      ...resource,
      metadata: { ...(resource.metadata || {}), namespace: namespace, labels: { ...(resource.metadata?.labels || {}), 'kradle.a5c.ai/org': org, 'kradle.a5c.ai/namespace': namespace } },
      spec: { ...(resource.spec || {}), organizationRef: org }
    };
    if (scoped.kind && ALL_KINDS.has(scoped.kind)) {
      try { validateResource(scoped); } catch (validationError) {
        return errorResponse(`Validation failed: ${validationError.message}`, 422);
      }
    }
    const result = await controller.applyResource(scoped);
    clearSnapshotCache();
    invalidateApiCache();
    globalEventBus.emit({ type: 'resource-applied', resource: result.resource || scoped, timestamp: new Date().toISOString() });
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});
