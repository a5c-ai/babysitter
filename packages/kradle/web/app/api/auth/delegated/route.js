import { createKradleApiController, createAuthProviderConfig, createSessionCookie, profileFromDelegatedHeaders, registerLoginProfile } from '@a5c-ai/kradle-sdk';

export const dynamic = 'force-dynamic';

const controller = createKradleApiController();

export async function GET(request) {
  const config = createAuthProviderConfig();
  try {
    const profile = profileFromDelegatedHeaders(request.headers, config, { requestUrl: request.url });
    let userName = profile.username;
    try {
      const registration = await registerLoginProfile({ controller, profile });
      userName = registration.user.metadata.name;
    } catch (registrationError) {
      if (profile.delegatedIdentitySource !== 'local-development') throw registrationError;
    }
    const org = process.env.KRADLE_ADMIN_ORG || process.env.KRADLE_ORG || 'default';
    const response = new Response(null, { status: 302, headers: { Location: `/orgs/${org}/people`, 'Set-Cookie': createSessionCookie(config, profile) } });
    response.headers.set('X-Kradle-User', userName);
    return response;
  } catch (error) {
    return Response.json({ error: 'delegated_login_failed', message: error.message }, { status: 400 });
  }
}
