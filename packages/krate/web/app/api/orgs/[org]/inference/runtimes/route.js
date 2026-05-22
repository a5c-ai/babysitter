import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = async (_request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const result = await controller.listResource('KrateServingRuntime');
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to list serving runtimes', 500);
  }
};

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const body = await request.json();
    if (!body.name) {
      return errorResponse('name is required', 400);
    }
    const resource = {
      apiVersion: 'krate.ai/v1alpha1',
      kind: 'KrateServingRuntime',
      metadata: { name: body.name, namespace },
      spec: {
        containers: [{ name: 'runtime', image: body.image || '' }],
        supportedModelFormats: body.supportedModelFormats || [],
        ...(body.resources ? { resources: body.resources } : {}),
      },
    };
    const result = await controller.applyResource(resource);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to create serving runtime', 500);
  }
});
