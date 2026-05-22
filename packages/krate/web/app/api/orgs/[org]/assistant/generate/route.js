import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
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

  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });

  try {
    const result = await runtime.generate(task.trim(), {
      controller,
      context,
      responseFormat,
      stackRef: stackRef || 'assistant',
      outputType: resolvedOutputType,
    });

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
