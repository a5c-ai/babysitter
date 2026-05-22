import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';
import { getAssistantRuntime } from '../../../../../lib/assistant-runtime.js';

export const dynamic = 'force-dynamic';

const runtime = getAssistantRuntime();

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const body = await request.json();
  const { sessionId, message, stackRef } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return errorResponse('message is required', 400);
  }

  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });

  try {
    // Create session if new
    let chatSession = runtime.getSession(sessionId);
    if (!chatSession) {
      chatSession = runtime.createSession(sessionId || undefined, stackRef);
    }

    const response = await runtime.chat(chatSession.id, message.trim(), { controller });
    return Response.json(
      { sessionId: chatSession.id, response },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return errorResponse(err.message || 'Chat failed', 500);
  }
});
