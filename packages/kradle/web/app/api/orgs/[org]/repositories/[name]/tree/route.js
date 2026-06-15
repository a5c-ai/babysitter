export const dynamic = 'force-dynamic';

import { createGiteaService } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../lib/api-auth.js';

// Lazily created so the service is instantiated per-process rather than per-request
let _service;
function getGiteaService() {
  if (_service === undefined) {
    _service = createGiteaService(); // returns null when KRADLE_GITEA_HTTP_URL is not set
  }
  return _service;
}

export const GET = withAuth(async function GET(request, { params }) {
  const { org, name } = await params;
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch') || 'main';
  const currentPath = searchParams.get('path') || '';

  const service = getGiteaService();

  if (service) {
    try {
      const entries = await service.listTree(org, name, branch, currentPath);
      if (entries !== null) {
        return Response.json({
          tree: entries,
          repo: name,
          org,
          branch,
          path: currentPath,
          totalItems: entries.length,
          source: 'gitea',
        });
      }
      // listTree returned null — repo/path not found in Gitea, fall through
    } catch (err) {
      console.warn('[kradle] Gitea tree request failed:', err.message);
    }
  }

  // Gitea not configured or unavailable — return empty tree with explanation
  return Response.json({
    tree: [],
    repo: name,
    org,
    branch,
    path: currentPath,
    totalItems: 0,
    source: 'not-configured',
    message: 'Git backend not configured. Set KRADLE_GITEA_HTTP_URL.',
  });
});
