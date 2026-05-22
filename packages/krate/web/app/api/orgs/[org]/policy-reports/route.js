import { createKrateApiController, createControllerUiModel, orgNamespaceName } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { org } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const model = createControllerUiModel(await controller.snapshot(), { organization: org });
    return Response.json({ org, reports: model.policyEngine.reports, violations: model.policyEngine.violations, degraded: model.policyEngine.degraded }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
}
