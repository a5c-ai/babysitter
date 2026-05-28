import { createKrateApiController, orgNamespaceName, createVirtualModelHookBridge, createVirtualModelController } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  try {
    const body = await request.json();
    const { hookType, modelName, payload } = body;

    if (!hookType || !modelName) {
      return errorResponse('hookType and modelName are required', 400);
    }

    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
    const bridge = createVirtualModelHookBridge({ controller: createVirtualModelController() });

    let virtualModels = [];
    try {
      const vmResult = await controller.listResourceForOrg(org, 'KrateVirtualModel');
      virtualModels = vmResult?.items || vmResult || [];
    } catch {}

    const matchedVm = bridge.matchVirtualModel(modelName, virtualModels);
    if (!matchedVm) {
      return Response.json({ decision: 'allow' }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const result = bridge.handleHook(hookType, payload || {}, matchedVm);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
