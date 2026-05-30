import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';
import { applyJitsiResource, createTemplateResource, listJitsiResources } from '../../../../../lib/jitsi-service.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { params }) => {
  const { org } = await params;
  try {
    return Response.json(await listJitsiResources(org, 'JitsiMeetingTemplate'), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  try {
    return Response.json(await applyJitsiResource(org, createTemplateResource(org, await request.json())), { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});
