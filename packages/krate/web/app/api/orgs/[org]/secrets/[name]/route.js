import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const DELETE = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'grant';
  try {
    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });

    if (type === 'secret') {
      const result = await controller.deleteResource('Secret', name);
      clearSnapshotCache();
    invalidateApiCache();
      return Response.json(result);
    }

    if (type === 'configmap') {
      const result = await controller.deleteResource('ConfigMap', name);
      clearSnapshotCache();
    invalidateApiCache();
      return Response.json(result);
    }

    // Default: delete AgentSecretGrant
    const result = await controller.deleteResource('AgentSecretGrant', name);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
