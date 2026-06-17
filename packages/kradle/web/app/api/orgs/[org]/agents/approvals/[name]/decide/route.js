import { createKradleApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    const body = await request.json();
    const decision = body.decision;
    if (decision !== 'approve' && decision !== 'deny') {
      return errorResponse('decision must be "approve" or "deny"', 400);
    }
    const newPhase = decision === 'approve' ? 'Approved' : 'Denied';
    const existingResult = await controller.getResourceForOrg(org, 'AgentApproval', name);
    const existing = existingResult?.resource || existingResult;
    if (!existing || !existing.metadata) {
      return errorResponse(`Approval '${name}' not found`, 404);
    }
    // The decision lives on the STATUS subresource. `kubectl apply` strips status,
    // so the decision must be written through the status subresource explicitly.
    const result = await controller.patchResourceStatusForOrg(org, 'AgentApproval', name, {
      phase: newPhase,
      decision,
      decidedBy: body.decidedBy || 'owner',
      decidedAt: new Date().toISOString(),
    });
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
});
