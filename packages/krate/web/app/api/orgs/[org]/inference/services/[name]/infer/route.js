import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const body = await request.json();

    // Get the service to find its endpoint
    const service = await controller.getResource('KrateInferenceService', name);
    if (!service) {
      return errorResponse(`Inference service '${name}' not found`, 404);
    }

    const endpoint = service?.status?.url || service?.status?.address?.url;
    if (!endpoint) {
      return errorResponse('Service not ready: no endpoint available', 503);
    }

    const modelName = service?.metadata?.name || name;
    const protocol = service?.spec?.predictor?.model?.protocolVersion || 'v2';
    const inferUrl = protocol === 'v2'
      ? `${endpoint}/v2/models/${modelName}/infer`
      : `${endpoint}/v1/models/${modelName}:predict`;

    const inferRes = await fetch(inferUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const inferData = await inferRes.json().catch(() => inferRes.text());
    return Response.json(
      { endpoint: inferUrl, response: inferData, status: inferRes.status },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return errorResponse(err.message || 'Inference request failed', 500);
  }
});
