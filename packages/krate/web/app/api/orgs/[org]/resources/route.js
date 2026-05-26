import { createKrateApiController, orgNamespaceName, clearSnapshotCache, validateResource, ALL_KINDS } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';


export async function GET(request, { params }) {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  const kind = new URL(request.url).searchParams.get('kind') || 'Repository';
  try {
    return Response.json(await controller.listResourceForOrg(org, kind), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
}

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const resource = await request.json();
    const scoped = {
      ...resource,
      metadata: { ...(resource.metadata || {}), namespace: namespace, labels: { ...(resource.metadata?.labels || {}), 'krate.a5c.ai/org': org, 'krate.a5c.ai/namespace': namespace } },
      spec: { ...(resource.spec || {}), organizationRef: org }
    };
    if (scoped.kind && ALL_KINDS.has(scoped.kind)) {
      try { validateResource(scoped); } catch (validationError) {
        return errorResponse(`Validation failed: ${validationError.message}`, 422);
      }
    }
    const result = await controller.applyResource(scoped);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});
