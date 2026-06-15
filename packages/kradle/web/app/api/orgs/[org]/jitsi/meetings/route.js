import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';
import { applyJitsiResource, createMeetingResource, listJitsiResources } from '../../../../../lib/jitsi-service.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, { params }) => {
  const { org } = await params;
  const status = new URL(request.url).searchParams.get('status') || 'all';
  try {
    return Response.json(await listJitsiResources(org, 'JitsiMeeting', { status }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  try {
    const resource = createMeetingResource(org, await request.json());
    return Response.json(await applyJitsiResource(org, resource, { eventType: 'meeting-created' }), { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});
