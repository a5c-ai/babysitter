import { withAuth } from '../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../lib/api-errors.js';
import { applyJitsiResource, getJitsiResource } from '../../../../../../lib/jitsi-service.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { params }) => {
  const { org, id } = await params;
  try {
    return Response.json(await getJitsiResource(org, 'JitsiMeeting', id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 404);
  }
});

export const PATCH = withAuth(async (request, { params }) => {
  const { org, id } = await params;
  try {
    const existingResult = await getJitsiResource(org, 'JitsiMeeting', id);
    const existing = existingResult.resource || existingResult;
    const patch = await request.json();
    const resource = { ...existing, spec: { ...(existing.spec || {}), ...(patch.spec || patch) }, status: { ...(existing.status || {}), ...(patch.status || {}) } };
    return Response.json(await applyJitsiResource(org, resource), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});

export const DELETE = withAuth(async (_request, { params }) => {
  const { org, id } = await params;
  try {
    const existingResult = await getJitsiResource(org, 'JitsiMeeting', id);
    const existing = existingResult.resource || existingResult;
    const resource = {
      ...existing,
      status: {
        ...(existing.status || {}),
        phase: 'Ended',
        endedAt: new Date().toISOString(),
        recording: { ...(existing.status?.recording || {}), active: false },
      },
    };
    return Response.json(await applyJitsiResource(org, resource, { eventType: 'meeting-ended' }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
