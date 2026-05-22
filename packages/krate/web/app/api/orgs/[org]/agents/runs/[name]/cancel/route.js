import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (_request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    // Fetch the current run resource and patch its phase to Cancelled
    const existing = await controller.getResource('AgentDispatchRun', name);
    const run = existing?.resource || existing;
    if (!run) {
      return errorResponse(`Run '${name}' not found`, 404);
    }
    const patched = {
      ...run,
      status: {
        ...(run.status || {}),
        phase: 'Cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'owner',
      },
    };
    const result = await controller.applyResource(patched);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json({ error: false, run: result }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Cancel failed', 500);
  }
});
