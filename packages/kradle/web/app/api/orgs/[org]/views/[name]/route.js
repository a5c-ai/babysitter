import { createKradleApiController, orgNamespaceName } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

// Serves a saved KradleGeneratedView's HTML so it can be embedded (same-origin
// iframe) and reused. Read-only render of stored content; intentionally renders
// the stored HTML, so it is served with a restrictive CSP + sandbox-friendly
// headers and only ever returns content this org saved. Auth-gated like every
// other org-data GET — the same-origin preview iframe carries the session cookie.
export const GET = withAuth(async (_request, { params }) => {
  const { org, name } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    const result = await controller.getResource('KradleGeneratedView', name);
    const view = result?.resource || result;
    const spec = view?.spec;
    if (!spec?.content) return errorResponse(`View '${name}' not found`, 404);
    const contentType = spec.contentType || 'text/html';
    return new Response(spec.content, {
      status: 200,
      headers: {
        'Content-Type': `${contentType}; charset=utf-8`,
        'Cache-Control': 'no-store',
        // Allow same-origin framing (the assistant preview / views gallery) but
        // block scripts from reaching the parent — defense for stored HTML.
        'Content-Security-Policy': "frame-ancestors 'self'",
      },
    });
  } catch (err) {
    return errorResponse(err.message || 'Failed to load view', 500);
  }
});
