import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';
import { getAssistantRuntime } from '../../../../../lib/assistant-runtime.js';

export const dynamic = 'force-dynamic';

const runtime = getAssistantRuntime();

// GET: list all sessions
export const GET = withAuth(async () => {
  try {
    const sessions = runtime.listSessions();
    return Response.json({ sessions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to list sessions', 500);
  }
});

// POST: create a new session
export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { stackRef } = body;
    const session = runtime.createSession(undefined, stackRef || 'assistant');
    return Response.json({ session }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to create session', 500);
  }
});

// DELETE: delete a session by id passed in body
export const DELETE = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { sessionId } = body;
    if (!sessionId) return errorResponse('sessionId is required', 400);
    const deleted = runtime.deleteSession(sessionId);
    return Response.json({ deleted }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to delete session', 500);
  }
});
