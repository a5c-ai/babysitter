import { createKradleApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, { params }) => {
  const { org } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  try {
    const result = await controller.listResourceForOrg(org, 'KradleVirtualModel');
    const allItems = result?.items || (Array.isArray(result) ? result : []);

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
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to list virtual models', 500);
  }
});

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  try {
    const body = await request.json();
    if (!body.modelName) {
      return errorResponse('modelName is required', 400);
    }
    if (!Array.isArray(body.routes) || body.routes.length === 0) {
      return errorResponse('routes is required and must be a non-empty array', 400);
    }
    const name = body.name || body.modelName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const resource = {
      apiVersion: 'kradle.a5c.ai/v1alpha1',
      kind: 'KradleVirtualModel',
      metadata: {
        name,
        namespace,
        labels: {
          'kradle.a5c.ai/org': org,
          'kradle.a5c.ai/namespace': namespace,
        },
      },
      spec: {
        organizationRef: org,
        modelName: body.modelName,
        routes: body.routes.map(r => ({
          modelRouteRef: r.modelRouteRef,
          ...(r.weight != null ? { weight: r.weight } : {}),
          ...(r.priority != null ? { priority: r.priority } : {}),
        })),
        ...(body.rules ? { rules: body.rules } : {}),
        ...(body.hooks ? { hooks: body.hooks } : {}),
        ...(body.fallbackChain ? { fallbackChain: body.fallbackChain } : {}),
        ...(body.sessionConfig ? { sessionConfig: body.sessionConfig } : {}),
        enabled: body.enabled !== false,
      },
    };
    const result = await controller.applyResource(resource);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to create virtual model', 500);
  }
});
