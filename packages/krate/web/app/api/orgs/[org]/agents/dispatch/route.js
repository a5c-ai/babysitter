import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const body = await request.json();
    // Accept either stackRef (from run-actions) or agentStack (from dispatch-button)
    const agentStack = body.agentStack || body.stackRef;
    if (!agentStack) {
      return errorResponse('stackRef or agentStack is required', 400);
    }
    const result = await controller.dispatchAgent({
      agentStack,
      repository: body.repository || 'default',
      ref: body.ref || 'main',
      taskKind: body.taskKind || 'diagnostic',
      actor: body.actor || 'owner',
      namespace,
      organizationRef: org,
    });
    if (result.error) {
      return errorResponse(result.message || 'Dispatch failed', 400);
    }
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Dispatch failed', 500);
  }
});
