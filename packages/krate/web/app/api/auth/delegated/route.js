import { createKrateApiController, createAuthProviderConfig, createSessionCookie, profileFromDelegatedHeaders, registerLoginProfile } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';

const controller = createKrateApiController();

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
    const org = process.env.KRATE_ADMIN_ORG || process.env.KRATE_ORG || 'default';
    const response = new Response(null, { status: 302, headers: { Location: `/orgs/${org}/people`, 'Set-Cookie': createSessionCookie(config, profile) } });
    response.headers.set('X-Krate-User', userName);
    return response;
  } catch (error) {
    return Response.json({ error: 'delegated_login_failed', message: error.message }, { status: 400 });
  }
}
