import { createKradleApiController, orgNamespaceName } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { params }) => {
  const { org } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    // Fetch model routes (unified catalog from controller)
    const catalogModels = await controller.listModelCatalog(org);

    // Also fetch KradleInferenceService resources that may not have routes yet
    const isvcResult = await controller.listResourceForOrg(org, 'KradleInferenceService');
    const isvcItems = isvcResult?.items || (Array.isArray(isvcResult) ? isvcResult : []);

    // Build set of model names already covered by routes
    const routedNames = new Set(catalogModels.map(m => m.name));

    // Add inference services that are not already represented in routes
    const unroutedServices = isvcItems
      .filter(svc => !routedNames.has(svc.metadata?.name))
      .map(svc => ({
        name: svc.metadata?.name || 'unknown',
        provider: 'kserve',
        type: 'internal',
        status: svc.status?.ready === true || (svc.status?.conditions || []).some(c => c.type === 'Ready' && c.status === 'True') ? 'available' : 'unavailable',
        endpoint: svc.status?.url || svc.status?.address?.url || null,
        protocol: svc.spec?.predictor?.model?.protocolVersion || 'v2',
      }));

    const models = [...catalogModels, ...unroutedServices];
    return Response.json({ models }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to build model catalog', 500);
  }
});
