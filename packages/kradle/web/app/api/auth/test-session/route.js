import { createKradleApiController, createAuthProviderConfig, createSessionCookie, registerLoginProfile } from '@a5c-ai/kradle-sdk';

export const dynamic = 'force-dynamic';

const controller = createKradleApiController();

export async function POST(request) {
  const testSecret = process.env.KRADLE_TEST_AUTH_SECRET;
  if (!testSecret) return Response.json({ error: 'disabled', message: 'Test auth is not enabled on this deployment' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  if (body.secret !== testSecret) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const config = createAuthProviderConfig();
  const username = body.username || process.env.KRADLE_ADMIN_USERNAME || 'test-user';
  const email = body.email || `${username}@test.kradle.local`;
  const org = process.env.KRADLE_ADMIN_ORG || process.env.KRADLE_ORG || 'default';

  const profile = {
    provider: 'test',
    subject: `test:${username}`,
    username,
    email,
    displayName: body.displayName || username,
    admin: true
  };

  try {
    await registerLoginProfile({ controller, namespace: `kradle-org-${org}`, profile });
  } catch {
    // registration may fail in test environments without K8s — proceed anyway
  }

  const cookie = createSessionCookie(config, profile);
  return Response.json(
    { ok: true, user: username, org },
    { status: 200, headers: { 'Set-Cookie': cookie } }
  );
}
