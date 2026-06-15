import { withAuth } from '../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../lib/api-errors.js';
import { deleteJitsiResource, getJitsiResource } from '../../../../../../lib/jitsi-service.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { params }) => {
  const { org, id } = await params;
  try {
    return Response.json(await getJitsiResource(org, 'JitsiRecording', id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 404);
  }
});

export const DELETE = withAuth(async (_request, { params }) => {
  const { org, id } = await params;
  try {
    return Response.json(await deleteJitsiResource(org, 'JitsiRecording', id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
