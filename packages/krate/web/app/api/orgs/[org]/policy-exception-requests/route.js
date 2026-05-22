import { createKrateApiController, createControllerUiModel, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../lib/api-auth.js';
import { invalidateApiCache } from '../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { org } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const model = createControllerUiModel(await controller.snapshot(), { organization: org });
    return Response.json({ org, items: model.policyEngine.exceptionRequests }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
}

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const input = await request.json();
    const name = input.name || `exception-${Date.now()}`;
    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'PolicyExceptionRequest',
      metadata: { name, namespace, labels: { 'krate.a5c.ai/org': org, 'krate.a5c.ai/surface': input.surface || 'policy' } },
      spec: {
        organizationRef: org,
        policyRef: input.policyRef || {},
        ruleNames: input.ruleNames || [],
        resourceRef: input.resourceRef || {},
        repository: input.repository,
        pullRequest: input.pullRequest,
        pipeline: input.pipeline,
        job: input.job,
        requestedBy: input.requestedBy || 'current-user',
        justification: input.justification,
        expiresAt: input.expiresAt,
        riskAcceptance: input.riskAcceptance || ''
      },
      status: { phase: 'Requested' }
    };
    const result = await controller.applyResource(resource);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
});
