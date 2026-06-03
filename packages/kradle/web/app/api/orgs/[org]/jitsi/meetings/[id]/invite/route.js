import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../../lib/api-errors.js';
import { applyJitsiResource, getJitsiResource, withParticipantInvite } from '../../../../../../../lib/jitsi-service.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org, id } = await params;
  try {
    const body = await request.json();
    const result = await getJitsiResource(org, 'JitsiMeeting', id);
    const meeting = result.resource || result;
    return Response.json(await applyJitsiResource(org, withParticipantInvite(meeting, body), { eventType: 'participant-invited' }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});
