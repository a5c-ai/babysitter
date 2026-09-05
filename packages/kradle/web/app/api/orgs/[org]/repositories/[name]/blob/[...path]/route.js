export const dynamic = 'force-dynamic';

import { createGiteaService } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';

// Lazily created so the service is instantiated per-process rather than per-request
let _service;
function getGiteaService() {
  if (_service === undefined) {
    _service = createGiteaService(); // returns null when KRADLE_GITEA_HTTP_URL is not set
  }
  return _service;
}

export const GET = withAuth(async function GET(request, { params }) {
  const { org, name, path: pathParts } = await params;
  const filePath = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || '');
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch') || 'main';
  const raw = searchParams.get('raw') === '1';

  const service = getGiteaService();

  // Resolve the outcome to a { source, message } pair so raw + JSON stay consistent.
  let source = 'not-configured';
  let message = 'Git backend not configured. Set KRADLE_GITEA_HTTP_URL.';

  if (service) {
    try {
      // Use getBlob for raw text; getFileContent for metadata + decoded content
      if (raw) {
        const content = await service.getBlob(org, name, branch, filePath);
        if (content !== null) {
          return new Response(content, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
              'Content-Length': String(Buffer.byteLength(content, 'utf8')),
            },
          });
        }
      } else {
        const file = await service.getFileContent(org, name, branch, filePath);
        if (file !== null) {
          return Response.json({
            path: file.path,
            content: file.content,
            size: file.size,
            encoding: file.encoding,
            lastCommit: file.lastCommit || null,
            lastCommitMessage: null,
            lastCommitDate: null,
            repo: name,
            org,
            branch,
            source: 'gitea',
          });
        }
      }
      // Configured + reachable, but the file/ref does not exist in Gitea.
      source = 'not-found';
      message = `File "${filePath}" not found in ${org}/${name} at ${branch}.`;
    } catch (err) {
      source = 'unavailable';
      message = `Git backend unavailable: ${err.message}`;
    }
  }

  if (raw) {
    return new Response(message, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  return Response.json({
    path: filePath,
    content: '',
    size: 0,
    encoding: 'utf-8',
    lastCommit: null,
    lastCommitMessage: null,
    lastCommitDate: null,
    repo: name,
    org,
    branch,
    source,
    message,
  });
});
