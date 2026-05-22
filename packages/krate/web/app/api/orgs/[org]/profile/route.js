import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { requireAuth, withAuth } from '../../../../lib/api-auth.js';
import { errorResponse } from '../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { org } = await params;
  const user = requireAuth(request);
  if (!user) {
    return errorResponse('Not signed in', 401);
  }

  try {
    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
    const grants = await controller.listResource('AgentSecretGrant');
    const username = user.user || user.subject || '';
    const apiKeys = (grants.items || grants || [])
      .filter(g => {
        const subjectName = g.spec?.subject?.name;
        return subjectName === username && (g.metadata?.name || '').startsWith('user-apikey-');
      })
      .map(g => ({
        name: g.metadata?.name,
        purpose: g.spec?.purpose || 'API key',
        createdAt: g.metadata?.creationTimestamp || null,
      }));

    return Response.json({
      user: {
        user: user.user || user.subject || '',
        email: user.email || user.mail || '',
        org: user.org || org,
        role: user.role || user.roles?.[0] || 'member',
        teams: user.teams || [],
        authProvider: user.authProvider || user.method || 'session cookie',
        lastLogin: user.iat ? new Date(user.iat * 1000).toISOString() : null,
        displayName: user.displayName || user.user || user.subject || '',
        emailNotifications: user.emailNotifications !== false,
      },
      apiKeys,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export const PATCH = withAuth(async (request, _context, session) => {
  try {
    const body = await request.json();
    // Profile updates are stored as user preferences; in a full implementation
    // this would write to a UserProfile CRD or configmap. For now we acknowledge.
    return Response.json({
      ok: true,
      user: {
        user: session.user || session.subject || '',
        displayName: body.displayName || session.displayName || session.user || '',
        emailNotifications: body.emailNotifications !== undefined ? body.emailNotifications : true,
      },
    });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
});
