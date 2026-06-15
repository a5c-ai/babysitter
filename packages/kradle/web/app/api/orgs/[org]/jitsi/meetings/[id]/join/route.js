import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../../lib/api-errors.js';
import { createJoinPayload, getJitsiResource } from '../../../../../../../lib/jitsi-service.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }, session) => {
  const { org, id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const result = await getJitsiResource(org, 'JitsiMeeting', id);
    const meeting = result.resource || result;
    return Response.json(createJoinPayload(meeting, { participantName: body.participantName || session?.user || session?.subject }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});
