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

  // Env is genuinely unset — the only case that KRADLE_GITEA_HTTP_URL fixes.
  if (!service) {
    return Response.json({
      tree: [], repo: name, org, branch, path: currentPath, totalItems: 0,
      source: 'not-configured',
      message: 'Git backend not configured. Set KRADLE_GITEA_HTTP_URL.',
    });
  }

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
    // Gitea is configured and reachable, but the repo/path/ref does not exist.
    return Response.json({
      tree: [], repo: name, org, branch, path: currentPath, totalItems: 0,
      source: 'not-found',
      message: `Repository "${org}/${name}" has no Git backing at ${branch}${currentPath ? '/' + currentPath : ''}.`,
    });
  } catch (err) {
    // Gitea is configured but unreachable/errored.
    console.warn('[kradle] Gitea tree request failed:', err.message);
    return Response.json({
      tree: [], repo: name, org, branch, path: currentPath, totalItems: 0,
      source: 'unavailable',
      message: `Git backend unavailable: ${err.message}`,
    });
  }
});
