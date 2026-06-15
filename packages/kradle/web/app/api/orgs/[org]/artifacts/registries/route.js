import { createKradleApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { org } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    const result = await controller.listResource('ArtifactRegistry');
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
}

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  try {
    const input = await request.json();
    const resource = input.kind ? input : {
      apiVersion: 'kradle.a5c.ai/v1alpha1',
      kind: 'ArtifactRegistry',
      metadata: {
        name: input.name || `${input.registryType || 'generic'}-registry`,
        namespace,
      },
      spec: {
        organizationRef: org,
        registryType: input.registryType || 'generic',
        storageBackend: input.storageBackend || 'internal',
        externalProviderRef: input.externalProviderRef || undefined,
        endpoint: input.endpoint || undefined,
        description: input.description || '',
      },
    };
    const result = await controller.applyResource(resource);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
});
