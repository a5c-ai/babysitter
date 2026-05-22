import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { org } = await params;
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'grants';
  try {
    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });

    if (type === 'configmaps') {
      const result = await controller.listResource('ConfigMap');
      return Response.json(result);
    }

    if (type === 'k8s-secrets') {
      const result = await controller.listResource('Secret');
      return Response.json(result);
    }

    // Default: list AgentSecretGrant CRDs
    const result = await controller.listResource('AgentSecretGrant');
    return Response.json(result);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  try {
    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
    const body = await request.json();
    const ns = orgNamespaceName(org);

    // Core K8s resources (Secret or ConfigMap) — apply directly
    if (body.kind === 'Secret' || body.kind === 'ConfigMap') {
      const resource = {
        ...body,
        apiVersion: body.apiVersion || 'v1',
        metadata: { ...(body.metadata || {}), namespace: ns },
      };
      const result = await controller.applyResource(resource);
      clearSnapshotCache();
    invalidateApiCache();
      return Response.json(result, { status: 201 });
    }

    // Krate CRD (AgentSecretGrant, AgentConfigGrant, etc.)
    const result = await controller.applyResource({
      ...body,
      metadata: { ...(body.metadata || {}), namespace: ns },
      spec: { ...(body.spec || {}), organizationRef: org },
    });
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});
