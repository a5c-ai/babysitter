import { createKrateApiController, createAuthProviderConfig, createSessionCookie, exchangeOAuthCodeForProfile, registerLoginProfile } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';

const controller = createKrateApiController();
const defaultHandler = createOAuthCallbackHandler({ controller });

export function createOAuthCallbackHandler({ controller, fetchImpl = globalThis.fetch } = {}) {
  if (!controller) throw new Error('OAuth callback handler requires a controller');
  return async function handleOAuthCallback(request, { params }) {
    const { provider } = await params;
    const config = createAuthProviderConfig();
    const selected = config.providers[provider];
    if (!selected?.enabled) return Response.json({ error: 'disabled', message: 'Sign-in provider is disabled' }, { status: 400 });
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (!code) return Response.json({ error: 'missing_code', message: 'Authorization code was not supplied' }, { status: 400 });
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const publicUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}${url.pathname}${url.search}` : (process.env.KRATE_PUBLIC_URL ? `${process.env.KRATE_PUBLIC_URL}${url.pathname}${url.search}` : request.url);
    try {
      const profile = await exchangeOAuthCodeForProfile({ provider: selected, code, requestUrl: publicUrl, fetchImpl });
      const registration = await registerLoginProfile({ controller, profile });
      const org = process.env.KRATE_ADMIN_ORG || process.env.KRATE_ORG || 'default';
      const response = new Response(null, { status: 302, headers: { Location: `/orgs/${org}/people`, 'Set-Cookie': createSessionCookie(config, profile) } });
      response.headers.set('X-Krate-User', registration.user.metadata.name);
      return response;
    } catch (error) {
      return Response.json({ error: 'login_failed', message: error.message }, { status: 400 });
    }
  };
}

export async function GET(request, context) {
  return defaultHandler(request, context);
}
