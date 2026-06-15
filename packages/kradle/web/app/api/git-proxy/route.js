import { withAuth } from '../../lib/api-auth.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return proxyGitRequest(request);
}

export const POST = withAuth(async (request, context, session) => {
  return proxyGitRequest(request);
});

async function proxyGitRequest(request) {
  const upstream = process.env.KRADLE_GITEA_HTTP_URL;
  if (!upstream) {
    return Response.json({
      status: 'degraded',
      route: '/api/git-proxy',
      method: request.method,
      reason: 'Kradle repository access is not configured',
      next: 'Connect Kradle repository access before streaming repository requests.'
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const upstreamUrl = new URL(request.url);
  const target = new URL(upstream);
  target.pathname = joinPath(target.pathname, upstreamUrl.pathname.replace(/^\/api\/git-proxy/, ''));
  target.search = upstreamUrl.search;
  try {
    const response = await fetch(target, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      duplex: 'half'
    });
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: response.headers });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
}

function joinPath(base, next) {
  return `${base.replace(/\/$/, '')}/${next.replace(/^\//, '')}`;
}
