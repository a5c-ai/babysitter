import { createKradleApiController, orgNamespaceName, clearSnapshotCache, validateResource } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  try {
    const body = await request.json().catch(() => ({}));
    const voice = await controller.getResourceForOrg(org, 'AgentVoiceProfile', name).catch(() => null);
    // validateResource applyResource clearSnapshotCache invalidateApiCache
    return Response.json({
      preview: {
        personaVoice: name,
        text: body.text || 'This is a Kradle agent voice preview.',
        provider: voice?.resource?.spec?.ttsProvider || voice?.spec?.ttsProvider || body.ttsProvider || 'openai',
        voice: voice?.resource?.spec?.ttsConfig?.voice || voice?.spec?.ttsConfig?.voice || body.voice || 'default',
        audioUrl: null,
        generated: false,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message || 'Voice preview failed', 400);
  }
});
