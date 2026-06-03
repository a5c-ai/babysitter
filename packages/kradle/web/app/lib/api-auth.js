import { createAuthProviderConfig, parseSessionCookie, orgNamespaceName } from '@a5c-ai/kradle-sdk';

export function requireAuth(request) {
  const config = createAuthProviderConfig();
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieName = config.session.cookieName;
  const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
  if (!match) return null;
  const session = parseSessionCookie(config, match[1]);
  return session; // null if invalid or expired
}

export function withAuth(handler) {
  return async (request, context) => {
    const session = requireAuth(request);
    if (!session) {
      return Response.json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
    }

    // CSRF double-submit check — mutating methods must include a session cookie
    // AND either an X-Kradle-Request header or a same-origin Content-Type header.
    // Read-only methods (GET, HEAD, OPTIONS) skip this check entirely.
    const method = request.method?.toUpperCase();
    const isMutating = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    if (isMutating) {
      const hasCSRFHeader = request.headers.has('x-kradle-request');
      const contentType = request.headers.get('content-type') || '';
      const hasJsonContentType = contentType.includes('application/json');
      if (!hasCSRFHeader && !hasJsonContentType) {
        return Response.json({ error: 'forbidden', message: 'Missing CSRF protection: include X-Kradle-Request header or Content-Type: application/json' }, { status: 403 });
      }
    }

    // Org ownership check — verify the user's org access
    const params = context?.params ? await context.params : {};
    const org = params?.org;
    if (org) {
      const adminOrg = process.env.KRADLE_ADMIN_ORG;
      const isAdmin = adminOrg && session.user === adminOrg;
      if (!isAdmin) {
        const userOrgs = session.orgs || [];
        const hasOrgClaim = userOrgs.length > 0;
        if (hasOrgClaim && !userOrgs.includes(org)) {
          return Response.json({ error: 'forbidden', message: `Access denied for organization: ${org}` }, { status: 403 });
        }
      }
    }

    return handler(request, context, session);
  };
}
