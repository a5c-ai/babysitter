import { createKradleApiController, orgNamespaceName, createVirtualModelHookBridge, createVirtualModelController } from '@a5c-ai/kradle-sdk';
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

  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });

  try {
    // Create session if new
    let chatSession = runtime.getSession(sessionId);
    const isNewSession = !chatSession;
    if (!chatSession) {
      chatSession = runtime.createSession(sessionId || undefined, stackRef);
    }

    // Load virtual models and run hooks
    const bridge = createVirtualModelHookBridge({ controller: createVirtualModelController() });
    let virtualModels = [];
    let matchedVm = null;
    try {
      const vmResult = await controller.listResourceForOrg(org, 'KradleVirtualModel');
      virtualModels = vmResult?.items || vmResult || [];
      matchedVm = bridge.matchVirtualModel(stackRef || 'assistant', virtualModels);
    } catch (err) {
      console.warn('[assistant/chat] Failed to load virtual models:', err?.message || err);
    }

    const sessionState = { id: chatSession.id, turnCount: chatSession.messages?.length || 0 };

    // SessionStart hook (first message in session)
    if (isNewSession && matchedVm) {
      bridge.handleHook('VirtualModel.SessionStart', { session: sessionState }, matchedVm);
    }

    // UserPromptSubmit hook — can block or modify the prompt
    let userMessage = message.trim();
    if (matchedVm) {
      const promptResult = bridge.handleHook('VirtualModel.UserPromptSubmit', { prompt: userMessage, session: sessionState }, matchedVm);
      if (promptResult.decision === 'deny') {
        return errorResponse(promptResult.message || 'Message blocked by virtual model policy', 403);
      }
      if (promptResult.decision === 'modify' && promptResult.modifiedInput?.prompt) {
        userMessage = promptResult.modifiedInput.prompt;
      }
    }

    // PreCompletion hook — can modify the request or deny
    if (matchedVm) {
      const preResult = bridge.handleHook('VirtualModel.PreCompletion', { request: { message: userMessage, stackRef }, session: sessionState }, matchedVm);
      if (preResult.decision === 'deny') {
        return errorResponse(preResult.message || 'Request blocked by virtual model policy', 403);
      }
      if (preResult.decision === 'modify' && preResult.modifiedInput?.request?.message) {
        userMessage = preResult.modifiedInput.request.message;
      }
    }

    const response = await runtime.chat(chatSession.id, userMessage, { controller });

    // PostCompletion hook — can modify the response
    if (matchedVm && response?.message) {
      const postResult = bridge.handleHook('VirtualModel.PostCompletion', { response: response.message, session: sessionState }, matchedVm);
      if (postResult.decision === 'modify' && postResult.modifiedInput?.response) {
        response.message = { ...response.message, ...postResult.modifiedInput.response };
      }
    }

    // TurnEnd hook
    if (matchedVm) {
      bridge.handleHook('VirtualModel.TurnEnd', { turn: { message: userMessage, response: response?.message }, session: sessionState }, matchedVm);
    }

    return Response.json(
      { sessionId: chatSession.id, response },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    // OnError hook
    if (matchedVm) {
      const errResult = bridge.handleHook('VirtualModel.OnError', { error: { message: err.message }, session: { id: chatSession?.id } }, matchedVm);
      if (errResult.modifiedInput?.retry) {
        // Could retry with fallback — for now just report the error
      }
    }
    return errorResponse(err.message || 'Chat failed', 500);
  }
});
