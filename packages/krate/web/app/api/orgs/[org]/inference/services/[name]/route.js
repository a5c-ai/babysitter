import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = async (_request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const result = await controller.getResource('KrateInferenceService', name);
    if (!result) {
      return errorResponse(`Inference service '${name}' not found`, 404);
    }
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to get inference service', 500);
  }
};

export const DELETE = withAuth(async (_request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    await controller.deleteResource('KrateInferenceService', name);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json({ deleted: true, name }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to delete inference service', 500);
  }
});
