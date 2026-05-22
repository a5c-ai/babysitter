import { createKrateApiController, createControllerUiModel, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { org } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const model = createControllerUiModel(await controller.snapshot(), { organization: org });
    return Response.json({
      org,
      policyEngine: model.policyEngine,
      profiles: model.policyEngine.profiles,
      templates: model.policyEngine.templates,
      bindings: model.policyEngine.bindings,
      exceptionRequests: model.policyEngine.exceptionRequests
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
}

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const input = await request.json();
    const resource = input.kind ? input : {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'PolicyBinding',
      metadata: { name: input.name || `${input.templateRef || 'policy'}-${input.mode || 'audit'}`, namespace },
      spec: {
        organizationRef: org,
        templateRef: input.templateRef,
        profileRef: input.profileRef,
        mode: input.mode || 'audit',
        match: input.match || {},
        parameters: input.parameters || {},
        suspend: Boolean(input.suspend)
      }
    };
    const result = await controller.applyResource(resource);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
});
