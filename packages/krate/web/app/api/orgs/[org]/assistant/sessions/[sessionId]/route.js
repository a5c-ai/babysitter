import { withAuth } from '../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../lib/api-errors.js';
import { getAssistantRuntime } from '../../../../../../lib/assistant-runtime.js';

export const dynamic = 'force-dynamic';

const runtime = getAssistantRuntime();

// GET: get session with messages
export const GET = withAuth(async (request, { params }) => {
  const { sessionId } = await params;
  try {
    const session = runtime.getSession(sessionId);
    if (!session) return errorResponse('Session not found', 404);
    return Response.json({ session }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to get session', 500);
  }
});
