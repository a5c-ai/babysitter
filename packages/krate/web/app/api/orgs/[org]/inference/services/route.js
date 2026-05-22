import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = async (_request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const result = await controller.listResource('KrateInferenceService');
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to list inference services', 500);
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
      kind: 'KrateInferenceService',
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
