import {
  createKradleApiController,
  orgNamespaceName,
  createVirtualModelHookBridge,
  createVirtualModelController,
} from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  try {
    let body = await request.json();

    // Get the service to find its endpoint
    const service = await controller.getResource('KradleInferenceService', name);
    if (!service) {
      return errorResponse(`Inference service '${name}' not found`, 404);
    }

    const endpoint = service?.status?.url || service?.status?.address?.url;
    if (!endpoint) {
      return errorResponse('Service not ready: no endpoint available', 503);
    }

    const modelName = service?.metadata?.name || name;

    // ── Virtual Model Hook Bridge ──────────────────────────────────────
    const vmController = createVirtualModelController();
    const bridge = createVirtualModelHookBridge({ controller: vmController });

    // Load virtual models and match by service name
    let virtualModels = [];
    try {
      const vmResult = await controller.listResourceForOrg(org, 'KradleVirtualModel');
      virtualModels = vmResult?.items || vmResult || [];
    } catch (err) {
      // No virtual models available — proceed without hooks
      console.warn('[inference/infer] Failed to list virtual models:', err?.message || err);
    }
    const matchedVm = bridge.matchVirtualModel(modelName, virtualModels);

    // PreCompletion hook — may modify request or deny
    if (matchedVm) {
      const preResult = bridge.handleHook('VirtualModel.PreCompletion', {
        data: { request: body, context: { modelName, org, namespace } },
      }, matchedVm);

      if (preResult.decision === 'deny') {
        return errorResponse(preResult.message || 'Request denied by virtual model hook', 403);
      }
      if (preResult.decision === 'modify' && preResult.modifiedInput?.request) {
        body = preResult.modifiedInput.request;
      }
    }

    // ── Forward to KServe ──────────────────────────────────────────────
    const protocol = service?.spec?.predictor?.model?.protocolVersion || 'v2';
    const inferUrl = protocol === 'v2'
      ? `${endpoint}/v2/models/${modelName}/infer`
      : `${endpoint}/v1/models/${modelName}:predict`;

    const inferRes = await fetch(inferUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let inferData = await inferRes.json().catch(() => inferRes.text());

    // PostCompletion hook — may modify response
    if (matchedVm) {
      const postResult = bridge.handleHook('VirtualModel.PostCompletion', {
        data: { response: inferData, context: { modelName, org, namespace } },
      }, matchedVm);

      if (postResult.decision === 'modify' && postResult.modifiedInput?.response) {
        inferData = postResult.modifiedInput.response;
      }
    }

    return Response.json(
      { endpoint: inferUrl, response: inferData, status: inferRes.status },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return errorResponse(err.message || 'Inference request failed', 500);
  }
});
