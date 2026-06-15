import { createKradleApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../lib/api-auth.js';
import { invalidateApiCache } from '../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { params }) => {
  const { org } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    return Response.json(await controller.listResource('Repository'), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
});

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    const input = await request.json();
    const result = await controller.createRepository({ ...input, organizationRef: org });
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
});
