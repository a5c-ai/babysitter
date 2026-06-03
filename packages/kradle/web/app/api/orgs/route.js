import { createControllerUiModel, createKradleApiController } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../lib/api-auth.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => {
  const controller = createKradleApiController();
  try {
    const model = createControllerUiModel(await controller.snapshot());
    return Response.json({ organizations: model.orgs }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
});

export const POST = withAuth(async (request) => {
  const controller = createKradleApiController();
  try {
    const input = await request.json();
    return Response.json(await controller.createOrganization(input), { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
});
