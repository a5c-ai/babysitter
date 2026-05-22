import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../lib/api-auth.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { params }) => {
  const { org } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    return Response.json(await controller.listResource('Repository'), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
});

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const input = await request.json();
    return Response.json(await controller.createRepository({ ...input, organizationRef: org }), { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
});
