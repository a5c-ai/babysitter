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
    const updated = {
      ...existing,
      apiVersion: existing?.apiVersion || 'kradle.a5c.ai/v1alpha1',
      kind: existing?.kind || 'AgentApproval',
      metadata: { ...(existing?.metadata || {}), name },
      status: {
        ...(existing?.status || {}),
        phase: newPhase,
        decidedBy: body.decidedBy || 'owner',
        decidedAt: new Date().toISOString(),
      },
    };
    const result = await controller.applyResourceForOrg(org, updated);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
});
