import { createKradleApiController, orgNamespaceName } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async function GET(_request, { params }) {
  const { org, feed } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    const allVersions = await controller.listResource('ArtifactVersion');
    const items = (allVersions?.items || []).filter(
      (v) => v.spec?.feedRef === feed || v.metadata?.labels?.['kradle.a5c.ai/feed'] === feed
    );
    return Response.json({ items, count: items.length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
});
