import { createKradleApiController, orgNamespaceName, createVirtualModelHookBridge, createVirtualModelController } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';
import { getAssistantRuntime, storeArtifact } from '../../../../../lib/assistant-runtime.js';

export const dynamic = 'force-dynamic';

const runtime = getAssistantRuntime();

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const body = await request.json();
  const { task, context, responseFormat, stackRef, outputType } = body;

  if (!task || typeof task !== 'string' || !task.trim()) {
    return errorResponse('task is required', 400);
  }

  const validOutputTypes = ['json', 'html', 'jsx', 'markdown'];
  const resolvedOutputType = validOutputTypes.includes(outputType) ? outputType : 'markdown';

  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });

  // Virtual model hooks
  const bridge = createVirtualModelHookBridge({ controller: createVirtualModelController() });
  let matchedVm = null;
  try {
    const vmResult = await controller.listResourceForOrg(org, 'KradleVirtualModel');
    matchedVm = bridge.matchVirtualModel(stackRef || 'assistant', vmResult?.items || vmResult || []);
  } catch (err) {
    console.warn('[assistant/generate] Failed to load virtual models:', err?.message || err);
  }

  let resolvedTask = task.trim();
  if (matchedVm) {
    const preResult = bridge.handleHook('VirtualModel.PreCompletion', { request: { task: resolvedTask, context } }, matchedVm);
    if (preResult.decision === 'deny') return errorResponse(preResult.message || 'Blocked by virtual model policy', 403);
    if (preResult.decision === 'modify' && preResult.modifiedInput?.request?.task) resolvedTask = preResult.modifiedInput.request.task;
  }

  try {
    const result = await runtime.generate(resolvedTask, {
      controller,
      context,
      responseFormat,
      stackRef: stackRef || 'assistant',
      outputType: resolvedOutputType,
    });

    if (matchedVm) {
      const postResult = bridge.handleHook('VirtualModel.PostCompletion', { response: result }, matchedVm);
      if (postResult.decision === 'modify' && postResult.modifiedInput?.response) {
        Object.assign(result, postResult.modifiedInput.response);
      }
    }

    // For HTML and JSX output, store as an artifact that can be served via GET
    let artifactId = null;
    if (resolvedOutputType === 'html' || resolvedOutputType === 'jsx') {
      artifactId = storeArtifact(result.content, result.contentType);
    }

    return Response.json(
      {
        content: result.content,
        contentType: result.contentType,
        usage: result.usage,
        artifactId,
        artifactUrl: artifactId ? `/api/orgs/${org}/assistant/artifacts/${artifactId}` : null,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return errorResponse(err.message || 'Generation failed', 500);
  }
});
