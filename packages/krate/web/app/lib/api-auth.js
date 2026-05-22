import { createAuthProviderConfig, parseSessionCookie } from '@a5c-ai/krate-sdk';

export function requireAuth(request) {
  const config = createAuthProviderConfig();
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieName = config.session.cookieName;
  const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
  if (!match) return null;
  const session = parseSessionCookie(config, match[1]);
  return session; // null if invalid
}

export function withAuth(handler) {
  return async (request, context) => {
    const session = requireAuth(request);
    if (!session) {
      return Response.json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
    }
    return handler(request, context, session);
  };
}
