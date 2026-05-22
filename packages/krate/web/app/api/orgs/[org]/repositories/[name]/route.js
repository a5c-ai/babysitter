import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { invalidateApiCache } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';


export async function GET(_request, { params }) {
  const { org, name } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    return Response.json(await controller.getResource('Repository', name), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
}

export const DELETE = withAuth(async (_request, { params }) => {
  const { org, name } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const result = await controller.deleteResource('Repository', name);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
});
