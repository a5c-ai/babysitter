import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { errorResponse } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { org, feed } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const allVersions = await controller.listResource('ArtifactVersion');
    const items = (allVersions?.items || []).filter(
      (v) => v.spec?.feedRef === feed || v.metadata?.labels?.['krate.a5c.ai/feed'] === feed
    );
    return Response.json({ items, count: items.length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
}
