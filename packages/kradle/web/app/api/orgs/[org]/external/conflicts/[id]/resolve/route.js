import { createKradleApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org, id } = await params;
  try {
    const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
    const body = await request.json();
    const result = await controller.resolveExternalConflict({
      conflictName: id,
      strategy: body.strategy,
      resolvedValue: body.resolvedValue || {},
      resources: body.resources || {}
    });
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
