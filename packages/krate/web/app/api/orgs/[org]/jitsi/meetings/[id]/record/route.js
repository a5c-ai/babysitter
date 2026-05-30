import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../../lib/api-errors.js';
import { applyJitsiResource, getJitsiResource } from '../../../../../../../lib/jitsi-service.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org, id } = await params;
  try {
    const body = await request.json();
    const result = await getJitsiResource(org, 'JitsiMeeting', id);
    const meeting = result.resource || result;
    const active = body.action !== 'stop';
    const resource = {
      ...meeting,
      status: {
        ...(meeting.status || {}),
        recording: { active, recordingId: active ? body.recordingId || `${id}-recording` : null },
      },
    };
    return Response.json(await applyJitsiResource(org, resource, { eventType: active ? 'recording-started' : 'recording-stopped' }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});
