import { createKradleApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  try {
    const result = await controller.listResource('KradleInferenceService');
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
    return errorResponse(err.message || 'Failed to list inference services', 500);
  }
});

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  try {
    const body = await request.json();
    if (!body.name) {
      return errorResponse('name is required', 400);
    }
    const resource = {
      apiVersion: 'kradle.ai/v1alpha1',
      kind: 'KradleInferenceService',
      metadata: { name: body.name, namespace },
      spec: {
        predictor: {
          model: {
            modelFormat: { name: body.modelFormat || 'sklearn' },
            storageUri: body.storageUri,
            ...(body.runtime ? { runtime: body.runtime } : {}),
            protocolVersion: body.protocolVersion || 'v2',
          },
          ...(body.resources ? { resources: body.resources } : {}),
        },
        features: body.features || {},
      },
    };
    const result = await controller.applyResource(resource);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to create inference service', 500);
  }
});
