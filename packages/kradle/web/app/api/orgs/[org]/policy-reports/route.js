import { createKradleApiController, createControllerUiModel, orgNamespaceName } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../lib/api-auth.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { params }) => {
  const { org } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    const model = createControllerUiModel(await controller.snapshot(), { organization: org });
    return Response.json({ org, reports: model.policyEngine.reports, violations: model.policyEngine.violations, degraded: model.policyEngine.degraded }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
});
