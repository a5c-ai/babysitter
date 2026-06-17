import { createKradleApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (_request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  try {
    // Fetch the current run resource and patch its phase to Cancelled.
    const existing = await controller.getResource('AgentDispatchRun', name);
    const run = existing?.resource || existing;
    if (!run) {
      return errorResponse(`Run '${name}' not found`, 404);
    }
    // phase lives on the STATUS subresource — `kubectl apply` would silently drop
    // it, so cancel must patch the status subresource explicitly.
    const result = await controller.patchResourceStatusForOrg(org, 'AgentDispatchRun', name, {
      phase: 'Cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: 'owner',
    });
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json({ error: false, run: result }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Cancel failed', 500);
  }
});
